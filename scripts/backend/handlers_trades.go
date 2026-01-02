package main

import (
	"encoding/json"
	"net/http"
)

// ProcessTradeHandler handles trade processing
func ProcessTradeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req TradeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	totalValue := req.Shares * req.Price

	members, err := SupabaseSelect("league_members", map[string]string{"id": "eq." + req.LeagueMemberID})
	if err != nil || len(members) == 0 {
		WriteError(w, http.StatusNotFound, "League member not found")
		return
	}

	member := members[0]
	currentBalance := GetFloat64Value(member, "current_balance")

	if req.TradeType == "buy" && totalValue > currentBalance {
		WriteError(w, http.StatusBadRequest, "Insufficient balance")
		return
	}

	var pnl *float64
	newBalance := currentBalance

	if req.TradeType == "buy" {
		positionData := map[string]interface{}{
			"league_member_id": req.LeagueMemberID,
			"market_id":        req.MarketID,
			"market_slug":      req.MarketSlug,
			"market_question":  req.MarketQuestion,
			"outcome":          req.Outcome,
			"shares":           req.Shares,
			"entry_price":      req.Price,
			"current_price":    req.Price,
			"unrealized_pnl":   0,
		}
		SupabaseInsert("positions", positionData)
		newBalance -= totalValue

	} else if req.TradeType == "sell" {
		positions, _ := SupabaseSelect("positions", map[string]string{
			"league_member_id": "eq." + req.LeagueMemberID,
			"market_id":        "eq." + req.MarketID,
			"outcome":          "eq." + req.Outcome,
			"limit":            "1",
		})

		if len(positions) > 0 {
			position := positions[0]
			entryPrice := GetFloat64Value(position, "entry_price")
			positionShares := GetFloat64Value(position, "shares")
			positionID := position["id"].(string)

			calculatedPnl := (req.Price - entryPrice) * req.Shares
			pnl = &calculatedPnl
			newBalance += totalValue

			if req.Shares >= positionShares {
				SupabaseDelete("positions", map[string]string{"id": "eq." + positionID})
			} else {
				remainingShares := positionShares - req.Shares
				currentPrice := GetFloat64Value(position, "current_price")
				updateData := map[string]interface{}{
					"shares":         remainingShares,
					"unrealized_pnl": (currentPrice - entryPrice) * remainingShares,
				}
				SupabaseUpdate("positions", map[string]string{"id": "eq." + positionID}, updateData)
			}
		}
	}

	tradeData := map[string]interface{}{
		"league_member_id": req.LeagueMemberID,
		"market_id":        req.MarketID,
		"market_slug":      req.MarketSlug,
		"market_question":  req.MarketQuestion,
		"trade_type":       req.TradeType,
		"outcome":          req.Outcome,
		"shares":           req.Shares,
		"price":            req.Price,
		"total_value":      totalValue,
		"pnl":              pnl,
	}
	SupabaseInsert("trades", tradeData)

	totalPnl := GetFloat64Value(member, "total_pnl")
	if pnl != nil {
		totalPnl += *pnl
	}
	totalTrades := int(GetFloat64Value(member, "total_trades")) + 1

	sellTrades, _ := SupabaseSelect("trades", map[string]string{
		"league_member_id": "eq." + req.LeagueMemberID,
		"trade_type":       "eq.sell",
	})

	winRate := 0.0
	if len(sellTrades) > 0 {
		profitable := 0
		for _, t := range sellTrades {
			if GetFloat64Value(t, "pnl") > 0 {
				profitable++
			}
		}
		winRate = float64(profitable) / float64(len(sellTrades)) * 100
	}

	updateData := map[string]interface{}{
		"current_balance": newBalance,
		"total_pnl":       totalPnl,
		"total_trades":    totalTrades,
		"win_rate":        winRate,
	}
	SupabaseUpdate("league_members", map[string]string{"id": "eq." + req.LeagueMemberID}, updateData)

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"status":      "success",
		"trade_id":    req.LeagueMemberID,
		"new_balance": newBalance,
		"pnl":         pnl,
	})
}
