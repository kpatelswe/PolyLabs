package main

import (
	"encoding/json"
	"net/http"
	"time"
)

// HealthHandler returns the server health status
func HealthHandler(w http.ResponseWriter, r *http.Request) {
	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

// TasksStatusHandler returns available background tasks
func TasksStatusHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"tasks": []map[string]string{
			{"name": "update_prices", "endpoint": "POST /api/positions/update-prices", "description": "Update all position prices"},
			{"name": "update_rankings", "endpoint": "POST /api/leagues/update-all-rankings", "description": "Update all league rankings"},
			{"name": "check_achievements", "endpoint": "POST /api/achievements/check/{user_id}", "description": "Check and award achievements"},
			{"name": "settle_positions", "endpoint": "POST /api/positions/settle", "description": "Settle positions for resolved markets"},
		},
		"note": "These endpoints can be called by a scheduler (e.g., cron job) for periodic updates",
	})
}

// CreateLeagueHandler handles league creation
func CreateLeagueHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req CreateLeagueRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var inviteCode *string
	if !req.IsPublic {
		code := GenerateInviteCode()
		inviteCode = &code
	}

	leagueData := map[string]interface{}{
		"name":              req.Name,
		"description":       req.Description,
		"commissioner_id":   req.CommissionerID,
		"is_public":         req.IsPublic,
		"invite_code":       inviteCode,
		"starting_capital":  req.StartingCapital,
		"max_position_size": req.MaxPositionSize,
		"scoring_type":      req.ScoringType,
		"status":            "active",
	}

	leagues, err := SupabaseInsert("leagues", leagueData)
	if err != nil || len(leagues) == 0 {
		WriteError(w, http.StatusInternalServerError, "Failed to create league")
		return
	}

	league := leagues[0]
	leagueID := league["id"].(string)

	memberData := map[string]interface{}{
		"league_id":       leagueID,
		"user_id":         req.CommissionerID,
		"current_balance": req.StartingCapital,
		"total_pnl":       0,
		"total_trades":    0,
		"win_rate":        0,
		"rank":            1,
	}

	members, err := SupabaseInsert("league_members", memberData)
	if err != nil || len(members) == 0 {
		SupabaseDelete("leagues", map[string]string{"id": "eq." + leagueID})
		WriteError(w, http.StatusInternalServerError, "Failed to add commissioner as member")
		return
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"status": "success",
		"league": league,
		"member": members[0],
	})
}
