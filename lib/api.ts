// API client for FastAPI backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface MarketPriceResponse {
  market_id: string
  yes_price: number
  no_price: number
  volume: number
  liquidity: number
}

export interface TradeRequest {
  league_member_id: string
  market_id: string
  market_slug?: string
  market_question: string
  trade_type: "buy" | "sell"
  outcome: "yes" | "no"
  shares: number
  price: number
}

// Market endpoints
export async function fetchMarketsFromAPI(limit = 50, offset = 0, category?: string) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  if (category) params.set("category", category)

  const response = await fetch(`${API_URL}/api/markets?${params}`)
  if (!response.ok) throw new Error("Failed to fetch markets")
  return response.json()
}

export async function fetchMarketPrice(marketId: string): Promise<MarketPriceResponse> {
  const response = await fetch(`${API_URL}/api/markets/${marketId}/price`)
  if (!response.ok) throw new Error("Failed to fetch market price")
  return response.json()
}

// Position updates
export async function triggerPositionPriceUpdate() {
  const response = await fetch(`${API_URL}/api/positions/update-prices`, {
    method: "POST",
  })
  if (!response.ok) throw new Error("Failed to trigger position update")
  return response.json()
}

// League rankings
export async function updateLeagueRankings(leagueId: string) {
  const response = await fetch(`${API_URL}/api/leagues/${leagueId}/update-rankings`, {
    method: "POST",
  })
  if (!response.ok) throw new Error("Failed to update rankings")
  return response.json()
}

export async function updateAllRankings() {
  const response = await fetch(`${API_URL}/api/leagues/update-all-rankings`, {
    method: "POST",
  })
  if (!response.ok) throw new Error("Failed to update all rankings")
  return response.json()
}

// Achievements
export async function checkAchievements(userId: string, leagueId?: string) {
  const params = leagueId ? `?league_id=${leagueId}` : ""
  const response = await fetch(`${API_URL}/api/achievements/check/${userId}${params}`, {
    method: "POST",
  })
  if (!response.ok) throw new Error("Failed to check achievements")
  return response.json()
}

// Trade processing via API
export async function processTradeViaAPI(trade: TradeRequest) {
  const response = await fetch(`${API_URL}/api/trades`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trade),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to process trade")
  }
  return response.json()
}
