package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func GetMarketsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	query := r.URL.Query()
	limit, _ := strconv.Atoi(query.Get("limit"))
	if limit == 0 {
		limit = 50
	}
	offset, _ := strconv.Atoi(query.Get("offset"))
	category := query.Get("category")
	q := query.Get("q")

	client := &http.Client{Timeout: 30 * time.Second}
	var markets []map[string]interface{}

	if q != "" {
		isIDSearch := len(q) > 10 && IsHexString(q)

		var slugSearch string
		if strings.Contains(q, "polymarket.com/event/") {
			parts := strings.Split(q, "polymarket.com/event/")
			if len(parts) > 1 {
				slugParts := strings.Split(parts[1], "?")
				slugSearch = strings.Split(slugParts[0], "/")[0]
			}
		} else if strings.Contains(q, "-") && !strings.Contains(q, " ") && !isIDSearch {
			slugSearch = q
		}

		if slugSearch != "" {
			resp, err := client.Get(fmt.Sprintf("%s/events?slug=%s", GAMMA_API, slugSearch))
			if err == nil && resp.StatusCode == 200 {
				defer resp.Body.Close()
				var events []map[string]interface{}
				json.NewDecoder(resp.Body).Decode(&events)
				for _, event := range events {
					if eventMarkets, ok := event["markets"].([]interface{}); ok {
						for _, m := range eventMarkets {
							if market, ok := m.(map[string]interface{}); ok {
								markets = append(markets, market)
							}
						}
					}
				}
			}
		}

		if len(markets) == 0 && isIDSearch {
			resp, err := client.Get(fmt.Sprintf("%s/markets/%s", GAMMA_API, q))
			if err == nil && resp.StatusCode == 200 {
				defer resp.Body.Close()
				var market map[string]interface{}
				json.NewDecoder(resp.Body).Decode(&market)
				if market != nil {
					markets = append(markets, market)
				}
			}
		}

		if len(markets) == 0 {
			resp, err := client.Get(fmt.Sprintf("%s/markets?limit=1000&active=true&closed=false", GAMMA_API))
			if err == nil && resp.StatusCode == 200 {
				defer resp.Body.Close()
				var allMarkets []map[string]interface{}
				json.NewDecoder(resp.Body).Decode(&allMarkets)
				queryLower := strings.ToLower(q)
				for _, m := range allMarkets {
					question := strings.ToLower(fmt.Sprintf("%v", m["question"]))
					description := strings.ToLower(fmt.Sprintf("%v", m["description"]))
					if strings.Contains(question, queryLower) || strings.Contains(description, queryLower) {
						markets = append(markets, m)
					}
				}
			}
		}
	} else {
		fetchLimit := 500
		if category != "" {
			fetchLimit = 1000
		}
		if limit+offset+100 > fetchLimit {
			fetchLimit = limit + offset + 100
		}

		resp, err := client.Get(fmt.Sprintf("%s/markets?limit=%d&active=true&closed=false", GAMMA_API, fetchLimit))
		if err == nil && resp.StatusCode == 200 {
			defer resp.Body.Close()
			json.NewDecoder(resp.Body).Decode(&markets)
		}
	}

	if category != "" && category != "all" {
		var filtered []map[string]interface{}
		for _, m := range markets {
			if MatchesCategory(m, category) {
				filtered = append(filtered, m)
			}
		}
		markets = filtered
	}

	totalCount := len(markets)
	end := offset + limit
	if end > len(markets) {
		end = len(markets)
	}
	if offset > len(markets) {
		markets = []map[string]interface{}{}
	} else {
		markets = markets[offset:end]
	}

	WriteJSON(w, http.StatusOK, MarketsResponse{
		Markets: markets,
		Count:   totalCount,
	})
}

// GetMarketHandler fetches a single market by ID
func GetMarketHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	marketID := strings.TrimPrefix(r.URL.Path, "/api/markets/")
	marketID = strings.Split(marketID, "/")[0]

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Get(fmt.Sprintf("%s/markets/%s", GAMMA_API, marketID))
	if err != nil || resp.StatusCode != 200 {
		WriteError(w, http.StatusNotFound, "Market not found")
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(body)
}

// GetMarketPriceHandler fetches the current price for a market
func GetMarketPriceHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/markets/")
	marketID := strings.TrimSuffix(path, "/price")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Get(fmt.Sprintf("%s/markets/%s", GAMMA_API, marketID))
	if err != nil || resp.StatusCode != 200 {
		WriteError(w, http.StatusNotFound, "Market not found")
		return
	}
	defer resp.Body.Close()

	var data map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&data)

	// Parse prices
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

	volume, _ := strconv.ParseFloat(fmt.Sprintf("%v", data["volume"]), 64)
	liquidity, _ := strconv.ParseFloat(fmt.Sprintf("%v", data["liquidity"]), 64)

	WriteJSON(w, http.StatusOK, MarketPriceResponse{
		MarketID:  marketID,
		YesPrice:  yesPrice,
		NoPrice:   noPrice,
		Volume:    volume,
		Liquidity: liquidity,
	})
}
