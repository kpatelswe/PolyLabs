package main

import (
	"net/http"
	"strings"
)

// UpdateLeagueRankingsHandler updates rankings for a specific league
func UpdateLeagueRankingsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/leagues/")
	leagueID := strings.TrimSuffix(path, "/update-rankings")

	members, err := SupabaseSelect("league_members", map[string]string{
		"league_id": "eq." + leagueID,
		"order":     "total_pnl.desc",
	})
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to fetch members")
		return
	}

	for i, member := range members {
		memberID := member["id"].(string)
		SupabaseUpdate("league_members", map[string]string{"id": "eq." + memberID}, map[string]interface{}{"rank": i + 1})
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"status":          "success",
		"members_updated": len(members),
	})
}

// UpdateAllRankingsHandler updates rankings for all active leagues
func UpdateAllRankingsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	go updateAllLeagueRankings()

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "started",
		"message": "Ranking updates started",
	})
}

// updateAllLeagueRankings updates rankings for all active leagues
func updateAllLeagueRankings() {
	leagues, _ := SupabaseSelect("leagues", map[string]string{"status": "eq.active"})

	for _, league := range leagues {
		leagueID := league["id"].(string)
		members, _ := SupabaseSelect("league_members", map[string]string{
			"league_id": "eq." + leagueID,
			"order":     "total_pnl.desc",
		})

		for i, member := range members {
			memberID := member["id"].(string)
			SupabaseUpdate("league_members", map[string]string{"id": "eq." + memberID}, map[string]interface{}{"rank": i + 1})
		}
	}
}
