// Polymarket API client for fetching real market data
const POLYMARKET_API = "https://clob.polymarket.com"
const GAMMA_API = "https://gamma-api.polymarket.com"

export interface PolymarketMarket {
  id: string
  question: string
  slug: string
  conditionId: string
  outcomes: string[]
  outcomePrices: string[]
  volume: string
  liquidity: string
  endDate: string
  image: string
  description: string
  category: string
  active: boolean
}

export interface PolymarketEvent {
  id: string
  slug: string
  title: string
  description: string
  startDate: string
  endDate: string
  image: string
  markets: PolymarketMarket[]
}

// Fetch active markets from Polymarket
export async function fetchMarkets(limit = 50, offset = 0): Promise<PolymarketMarket[]> {
  try {
    const response = await fetch(`${GAMMA_API}/markets?limit=${limit}&offset=${offset}&active=true&closed=false`, {
      next: { revalidate: 10 }, // Cache for 10 seconds
    })

    if (!response.ok) {
      throw new Error("Failed to fetch markets")
    }

    const data = await response.json()
    return data.map(formatMarket)
  } catch (error) {
    console.error("Error fetching markets:", error)
    return []
  }
}

// Fetch a single market by ID
export async function fetchMarket(conditionId: string): Promise<PolymarketMarket | null> {
  try {
    const response = await fetch(`${GAMMA_API}/markets/${conditionId}`, {
      next: { revalidate: 30 },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return formatMarket(data)
  } catch (error) {
    console.error("Error fetching market:", error)
    return null
  }
}

// Search markets by query
export async function searchMarkets(query: string): Promise<PolymarketMarket[]> {
  try {
    const response = await fetch(`${GAMMA_API}/markets?_q=${encodeURIComponent(query)}&active=true&closed=false`, {
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      throw new Error("Failed to search markets")
    }

    const data = await response.json()
    return data.map(formatMarket)
  } catch (error) {
    console.error("Error searching markets:", error)
    return []
  }
}

// Fetch markets by category with pagination
export async function fetchMarketsByCategory(category: string, limit = 50, offset = 0): Promise<PolymarketMarket[]> {
  try {
    // Try fetching with the tag parameter
    const response = await fetch(
      `${GAMMA_API}/markets?tag=${encodeURIComponent(category)}&active=true&closed=false&limit=${limit}&offset=${offset}`,
      {
        next: { revalidate: 60 },
      }
    )

    if (!response.ok) {
      throw new Error("Failed to fetch markets by category")
    }

    let data = await response.json()
    let markets = data.map(formatMarket)
    
    // If no results with tag, fetch all and filter client-side
    if (markets.length === 0) {
      const allResponse = await fetch(
        `${GAMMA_API}/markets?active=true&closed=false&limit=100&offset=${offset}`,
        {
          next: { revalidate: 60 },
        }
      )
      
      if (allResponse.ok) {
        const allData = await allResponse.json()
        markets = allData.map(formatMarket).filter((m: PolymarketMarket) => {
          const marketCategory = m.category?.toLowerCase() || ''
          const searchCategory = category.toLowerCase()
          return marketCategory.includes(searchCategory) || 
                 marketCategory.replace('-', ' ').includes(searchCategory.replace('-', ' '))
        })
      }
    }
    
    return markets.slice(0, limit)
  } catch (error) {
    console.error("Error fetching markets by category:", error)
    return []
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatMarket(data: any): PolymarketMarket {
  // Parse outcome prices - they come as JSON string or array
  let outcomePrices: string[] = ["0.5", "0.5"]
  try {
    if (typeof data.outcomePrices === "string") {
      outcomePrices = JSON.parse(data.outcomePrices)
    } else if (Array.isArray(data.outcomePrices)) {
      outcomePrices = data.outcomePrices.map(String)
    }
  } catch {
    // Use default
  }

  let outcomes: string[] = ["Yes", "No"]
  try {
    if (typeof data.outcomes === "string") {
      outcomes = JSON.parse(data.outcomes)
    } else if (Array.isArray(data.outcomes)) {
      outcomes = data.outcomes
    }
  } catch {
    // Use default
  }

  return {
    id: data.id || data.conditionId,
    question: data.question || data.title || "",
    slug: data.slug || data.events?.[0]?.slug || "",
    conditionId: data.conditionId || data.id,
    outcomes,
    outcomePrices,
    volume: data.volume || data.volumeNum?.toString() || "0",
    liquidity: data.liquidity || "0",
    endDate: data.endDate || data.end_date_iso || "",
    image: data.image || "",
    description: data.description || "",
    category: data.category || data.tags?.[0] || "general",
    active: data.active !== false && !data.closed,
  }
}

// Get YES/NO prices from market
export function getMarketPrices(market: PolymarketMarket) {
  const yesPrice = Number.parseFloat(market.outcomePrices[0] || "0.5")
  const noPrice = Number.parseFloat(market.outcomePrices[1] || "0.5")

  return {
    yes: Math.min(Math.max(yesPrice, 0.01), 0.99),
    no: Math.min(Math.max(noPrice, 0.01), 0.99),
  }
}

export interface PriceHistoryPoint {
  timestamp: number
  date: string
  price: number
}

// Fetch price history for a market
export async function fetchPriceHistory(conditionId: string, interval: '1d' | '1w' | '1m' | 'all' = '1m'): Promise<PriceHistoryPoint[]> {
  try {
    // First fetch the market to get token IDs
    const marketResponse = await fetch(`${GAMMA_API}/markets/${conditionId}`, {
      next: { revalidate: 60 },
    })
    
    if (!marketResponse.ok) {
      console.error("Failed to fetch market for price history")
      return generateMockPriceHistory(interval)
    }
    
    const marketData = await marketResponse.json()
    
    // Try to get clob token ids
    let clobTokenId = null
    if (marketData.clobTokenIds) {
      try {
        const tokenIds = typeof marketData.clobTokenIds === 'string' 
          ? JSON.parse(marketData.clobTokenIds) 
          : marketData.clobTokenIds
        clobTokenId = tokenIds[0] // YES token
      } catch {
        // Use fallback
      }
    }
    
    // If we have a clob token id, try the CLOB API
    if (clobTokenId) {
      try {
        const fidelity = interval === '1d' ? 60 : interval === '1w' ? 360 : 1440
        const priceResponse = await fetch(
          `${POLYMARKET_API}/prices-history?market=${clobTokenId}&interval=max&fidelity=${fidelity}`,
          { next: { revalidate: 300 } }
        )
        
        if (priceResponse.ok) {
          const priceData = await priceResponse.json()
          if (priceData.history && priceData.history.length > 0) {
            return priceData.history.map((point: { t: number; p: number }) => ({
              timestamp: point.t * 1000,
              date: new Date(point.t * 1000).toLocaleDateString(),
              price: point.p
            })).slice(-getPointsForInterval(interval))
          }
        }
      } catch (e) {
        console.error("CLOB price history failed:", e)
      }
    }
    
    // Fallback to mock data based on current price
    const currentPrice = marketData.outcomePrices ? 
      (typeof marketData.outcomePrices === 'string' ? 
        JSON.parse(marketData.outcomePrices)[0] : 
        marketData.outcomePrices[0]) : 0.5
    
    return generateMockPriceHistory(interval, Number(currentPrice))
  } catch (error) {
    console.error("Error fetching price history:", error)
    return generateMockPriceHistory(interval)
  }
}

function getPointsForInterval(interval: string): number {
  switch (interval) {
    case '1d': return 24
    case '1w': return 7 * 24
    case '1m': return 30
    default: return 90
  }
}

function generateMockPriceHistory(interval: '1d' | '1w' | '1m' | 'all', currentPrice = 0.5): PriceHistoryPoint[] {
  const points = getPointsForInterval(interval)
  const now = Date.now()
  const history: PriceHistoryPoint[] = []
  
  let price = currentPrice - 0.1 + Math.random() * 0.2 // Start near current
  
  for (let i = points; i >= 0; i--) {
    const msPerPoint = interval === '1d' ? 3600000 : 
                       interval === '1w' ? 3600000 : 
                       86400000
    const timestamp = now - (i * msPerPoint)
    
    // Random walk towards current price
    const drift = (currentPrice - price) * 0.1
    price = Math.max(0.01, Math.min(0.99, price + drift + (Math.random() - 0.5) * 0.05))
    
    history.push({
      timestamp,
      date: new Date(timestamp).toLocaleDateString(),
      price: Number(price.toFixed(3))
    })
  }
  
  // Ensure last point is current price
  if (history.length > 0) {
    history[history.length - 1].price = currentPrice
  }
  
  return history
}
