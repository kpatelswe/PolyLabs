package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// UpdatePositionPricesHandler triggers position price updates
func UpdatePositionPricesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	go updateAllPositions()

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "started",
		"message": "Position price update started",
	})
}

// SettlePositionsHandler triggers position settlement
func SettlePositionsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	go settleResolvedMarkets()

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "started",
		"message": "Settlement process started",
	})
}

// updateAllPositions updates prices for all open positions
func updateAllPositions() {
	positions, _ := SupabaseSelect("positions", nil)

	if len(positions) == 0 {
		return
	}

	marketIDs := make(map[string]bool)
	for _, p := range positions {
		if id, ok := p["market_id"].(string); ok {
			marketIDs[id] = true
		}
	}

	client := &http.Client{Timeout: 30 * time.Second}

	for marketID := range marketIDs {
		resp, err := client.Get(fmt.Sprintf("%s/markets/%s", GAMMA_API, marketID))
		if err != nil || resp.StatusCode != 200 {
			continue
		}

		var data map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&data)
		resp.Body.Close()

		yesPrice, noPrice := parseOutcomePrices(data)

		for _, position := range positions {
			if position["market_id"].(string) == marketID {
				outcome := position["outcome"].(string)
				currentPrice := yesPrice
				if outcome == "no" {
					currentPrice = noPrice
				}
				entryPrice := GetFloat64Value(position, "entry_price")
				shares := GetFloat64Value(position, "shares")
				unrealizedPnl := (currentPrice - entryPrice) * shares

				positionID := position["id"].(string)
				updateData := map[string]interface{}{
					"current_price":  currentPrice,
					"unrealized_pnl": unrealizedPnl,
					"updated_at":     time.Now().UTC().Format(time.RFC3339),
				}
				SupabaseUpdate("positions", map[string]string{"id": "eq." + positionID}, updateData)
			}
		}
	}
}

// settleResolvedMarkets settles positions for resolved markets
func settleResolvedMarkets() {
	positions, _ := SupabaseSelect("positions", nil)

	if len(positions) == 0 {
		return
	}

	marketIDs := make(map[string]bool)
	for _, p := range positions {
		if id, ok := p["market_id"].(string); ok {
			marketIDs[id] = true
		}
	}

	client := &http.Client{Timeout: 30 * time.Second}

	for marketID := range marketIDs {
		resp, err := client.Get(fmt.Sprintf("%s/markets/%s", GAMMA_API, marketID))
		if err != nil || resp.StatusCode != 200 {
			continue
		}

		var marketData map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&marketData)
		resp.Body.Close()

		closed, _ := marketData["closed"].(bool)
		if !closed {
			continue
		}

		winningOutcome := findWinningOutcome(marketData)
		if winningOutcome == "" {
			continue
		}

		for _, position := range positions {
			if position["market_id"].(string) != marketID {
				continue
			}

			settlePosition(position, marketID, winningOutcome)
		}
	}
}

// findWinningOutcome extracts the winning outcome from market data
func findWinningOutcome(marketData map[string]interface{}) string {
	if tokens, ok := marketData["tokens"].([]interface{}); ok {
		for _, t := range tokens {
			if token, ok := t.(map[string]interface{}); ok {
				if winner, ok := token["winner"].(bool); ok && winner {
					return strings.ToLower(fmt.Sprintf("%v", token["outcome"]))
				}
			}
		}
	}
	return ""
}

// settlePosition settles a single position
func settlePosition(position map[string]interface{}, marketID, winningOutcome string) {
	userID := position["league_member_id"].(string)
	heldOutcome := strings.ToLower(position["outcome"].(string))
	shares := GetFloat64Value(position, "shares")
	entryPrice := GetFloat64Value(position, "entry_price")

	payoutPerShare := 0.0
	if heldOutcome == winningOutcome {
		payoutPerShare = 1.0
	}
	totalPayout := shares * payoutPerShare
	finalPnl := totalPayout - (entryPrice * shares)

	members, _ := SupabaseSelect("league_members", map[string]string{"id": "eq." + userID})
	if len(members) == 0 {
		return
	}
	member := members[0]

	newBalance := GetFloat64Value(member, "current_balance") + totalPayout
	newTotalPnl := GetFloat64Value(member, "total_pnl") + finalPnl

	SupabaseInsert("trades", map[string]interface{}{
		"league_member_id": userID,
		"market_id":        marketID,
		"market_slug":      position["market_slug"],
		"market_question":  position["market_question"],
		"trade_type":       "settle",
		"outcome":          heldOutcome,
		"shares":           shares,
		"price":            payoutPerShare,
		"total_value":      totalPayout,
		"pnl":              finalPnl,
	})

	SupabaseUpdate("league_members", map[string]string{"id": "eq." + userID}, map[string]interface{}{
		"current_balance": newBalance,
		"total_pnl":       newTotalPnl,
		"total_trades":    int(GetFloat64Value(member, "total_trades")) + 1,
	})

	positionID := position["id"].(string)
	SupabaseDelete("positions", map[string]string{"id": "eq." + positionID})

	log.Printf("Settled: User %s on %s. Held %s, Winner %s. PnL: %.2f", userID, marketID, heldOutcome, winningOutcome, finalPnl)
}

// parseOutcomePrices extracts yes/no prices from market data
func parseOutcomePrices(data map[string]interface{}) (float64, float64) {
	yesPrice := 0.5
	noPrice := 0.5

	if outcomePrices, ok := data["outcomePrices"]; ok {
		var prices []string
		switch v := outcomePrices.(type) {
		case string:
			json.Unmarshal([]byte(v), &prices)
		case []interface{}:
			for _, p := range v {
				prices = append(prices, fmt.Sprintf("%v", p))
			}
		}
		if len(prices) > 0 {
			yesPrice, _ = strconv.ParseFloat(prices[0], 64)
		}
		if len(prices) > 1 {
			noPrice, _ = strconv.ParseFloat(prices[1], 64)
		}
	}

	return yesPrice, noPrice
}
