package main

import (
	"net/http"
	"strings"
)

// CheckAchievementsHandler checks and awards achievements for a user
func CheckAchievementsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/achievements/check/")
	userID := path
	leagueID := r.URL.Query().Get("league_id")

	query := map[string]string{"user_id": "eq." + userID}
	if leagueID != "" {
		query["league_id"] = "eq." + leagueID
	}
	memberships, _ := SupabaseSelect("league_members", query)

	achievementsAwarded := []string{}

	for _, membership := range memberships {
		memberLeagueID := membership["league_id"].(string)
		totalTrades := int(GetFloat64Value(membership, "total_trades"))
		rank := int(GetFloat64Value(membership, "rank"))
		totalPnl := GetFloat64Value(membership, "total_pnl")
		winRate := GetFloat64Value(membership, "win_rate")

		if totalTrades >= 1 {
			if !hasAchievement(userID, memberLeagueID, "first_trade") {
				awardAchievement(userID, memberLeagueID, "first_trade", "First Steps", "Made your first trade")
				achievementsAwarded = append(achievementsAwarded, "first_trade")
			}
		}

		if rank == 1 && totalPnl > 0 {
			if !hasAchievement(userID, memberLeagueID, "best_roi") {
				awardAchievement(userID, memberLeagueID, "best_roi", "Top Performer", "Ranked #1 in the league")
				achievementsAwarded = append(achievementsAwarded, "best_roi")
			}
		}

		if totalTrades >= 10 {
			if !hasAchievement(userID, memberLeagueID, "consistent_trader") {
				awardAchievement(userID, memberLeagueID, "consistent_trader", "Consistent Trader", "Completed 10 trades")
				achievementsAwarded = append(achievementsAwarded, "consistent_trader")
			}
		}

		if winRate >= 70 && totalTrades >= 10 {
			if !hasAchievement(userID, memberLeagueID, "sharpest_prediction") {
				awardAchievement(userID, memberLeagueID, "sharpest_prediction", "Sharp Shooter", "Achieved 70%+ win rate")
				achievementsAwarded = append(achievementsAwarded, "sharpest_prediction")
			}
		}
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"achievements_awarded": achievementsAwarded,
	})
}

// hasAchievement checks if a user already has an achievement
func hasAchievement(userID, leagueID, achievementType string) bool {
	existing, _ := SupabaseSelect("achievements", map[string]string{
		"user_id":          "eq." + userID,
		"league_id":        "eq." + leagueID,
		"achievement_type": "eq." + achievementType,
	})
	return len(existing) > 0
}

// awardAchievement grants an achievement to a user
func awardAchievement(userID, leagueID, achievementType, title, description string) {
	SupabaseInsert("achievements", map[string]interface{}{
		"user_id":          userID,
		"league_id":        leagueID,
		"achievement_type": achievementType,
		"title":            title,
		"description":      description,
	})
}
