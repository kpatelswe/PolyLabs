package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/joho/godotenv"
)

func main() {
	execPath, _ := os.Executable()
	rootDir := filepath.Join(filepath.Dir(execPath), "..", "..")

	godotenv.Load(filepath.Join(rootDir, ".env.local"))
	godotenv.Load(filepath.Join(rootDir, ".env"))
	godotenv.Load("../../.env.local")
	godotenv.Load("../../.env")

	if err := InitSupabase(); err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()

	mux.HandleFunc("/health", HealthHandler)

	mux.HandleFunc("/api/leagues", CreateLeagueHandler)
	mux.HandleFunc("/api/leagues/update-all-rankings", UpdateAllRankingsHandler)
	mux.HandleFunc("/api/leagues/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/update-rankings") {
			UpdateLeagueRankingsHandler(w, r)
		}
	})

	mux.HandleFunc("/api/markets", GetMarketsHandler)
	mux.HandleFunc("/api/markets/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/price") {
			GetMarketPriceHandler(w, r)
		} else {
			GetMarketHandler(w, r)
		}
	})

	mux.HandleFunc("/api/trades", ProcessTradeHandler)

	mux.HandleFunc("/api/positions/update-prices", UpdatePositionPricesHandler)
	mux.HandleFunc("/api/positions/settle", SettlePositionsHandler)

	mux.HandleFunc("/api/achievements/check/", CheckAchievementsHandler)

	mux.HandleFunc("/api/tasks/status", TasksStatusHandler)

	handler := CORSMiddleware(mux)
	log.Println("PolyLabs Go Backend starting on http://0.0.0.0:8000")
	log.Fatal(http.ListenAndServe(":8000", handler))
}
