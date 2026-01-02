package main

import (
	"crypto/rand"
	"encoding/hex"
	"regexp"
	"strings"
)

// GAMMA_API is the Polymarket API endpoint
const GAMMA_API = "https://gamma-api.polymarket.com"

// Category definitions for market filtering
var Categories = map[string]struct {
	Matches []string
	Terms   []string
}{
	"politics": {
		Matches: []string{"us-current-affairs", "current-affairs", "politics"},
		Terms:   []string{"election", "president", "congress", "vote", "trump", "biden", "senate", "governor", "democrat", "republican"},
	},
	"sports": {
		Matches: []string{"sports"},
		Terms:   []string{"nfl", "nba", "football", "basketball", "soccer", "championship", "super bowl", "world cup", "playoffs", "mvp"},
	},
	"crypto": {
		Matches: []string{"crypto"},
		Terms:   []string{"bitcoin", "ethereum", "btc", "eth", "blockchain", "token", "solana", "crypto", "coin", "defi"},
	},
	"pop-culture": {
		Matches: []string{"pop-culture"},
		Terms:   []string{"movie", "oscar", "grammy", "celebrity", "music", "entertainment", "award", "album", "actor", "singer"},
	},
	"tech": {
		Matches: []string{"tech"},
		Terms:   []string{"apple", "google", "microsoft", "ai", "openai", "chatgpt", "twitter", "meta", "tesla", "elon"},
	},
}

// GenerateInviteCode creates a random 8-character invite code
func GenerateInviteCode() string {
	b := make([]byte, 4)
	rand.Read(b)
	return strings.ToUpper(hex.EncodeToString(b))
}

// MatchesCategory checks if a market matches the specified category
func MatchesCategory(market map[string]interface{}, categoryValue string) bool {
	if categoryValue == "all" || categoryValue == "" {
		return true
	}

	config, exists := Categories[categoryValue]
	if !exists {
		return false
	}

	question := strings.ToLower(getStringValue(market, "question"))
	marketCategory := strings.ToLower(getStringValue(market, "category"))

	// Check category match
	for _, match := range config.Matches {
		if strings.Contains(marketCategory, match) || strings.ReplaceAll(marketCategory, "-", " ") == strings.ReplaceAll(match, "-", " ") {
			return true
		}
	}

	// Check terms using word boundary matching
	for _, term := range config.Terms {
		pattern := `\b` + regexp.QuoteMeta(term) + `\b`
		matched, _ := regexp.MatchString(pattern, question)
		if matched {
			return true
		}
	}

	return false
}

// IsHexString checks if a string contains only hex characters
func IsHexString(s string) bool {
	s = strings.TrimPrefix(s, "0x")
	for _, c := range s {
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
			return false
		}
	}
	return len(s) > 0
}

// getStringValue safely extracts a string from a map
func getStringValue(m map[string]interface{}, key string) string {
	if v, ok := m[key]; ok && v != nil {
		return v.(string)
	}
	return ""
}

// getFloat64Value safely extracts a float64 from a map
func GetFloat64Value(m map[string]interface{}, key string) float64 {
	if v, ok := m[key]; ok && v != nil {
		switch val := v.(type) {
		case float64:
			return val
		case int:
			return float64(val)
		}
	}
	return 0
}
