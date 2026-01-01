import { createClient } from "@/lib/supabase/server"
import { fetchMarkets, searchMarkets } from "@/lib/polymarket"
import { MarketCard } from "@/components/markets/market-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, LineChart, ChevronLeft, ChevronRight } from "@/components/icons"
import Link from "next/link"

const MARKETS_PER_PAGE = 12

// Categories with actual Polymarket category names and keyword fallbacks
const categories = [
  { value: "all", label: "All", categoryMatches: [], searchTerms: [] },
  { value: "politics", label: "Politics", categoryMatches: ["us-current-affairs", "current-affairs", "politics"], searchTerms: ["election", "president", "congress", "vote", "trump", "biden", "senate", "governor", "democrat", "republican"] },
  { value: "sports", label: "Sports", categoryMatches: ["sports"], searchTerms: ["nfl", "nba", "football", "basketball", "soccer", "championship", "super bowl", "world cup", "playoffs", "mvp"] },
  { value: "crypto", label: "Crypto", categoryMatches: ["crypto"], searchTerms: ["bitcoin", "ethereum", "btc", "eth", "blockchain", "token", "solana", "crypto", "coin", "defi"] },
  { value: "pop-culture", label: "Pop Culture", categoryMatches: ["pop-culture"], searchTerms: ["movie", "oscar", "grammy", "celebrity", "music", "entertainment", "award", "album", "actor", "singer"] },
  { value: "tech", label: "Tech", categoryMatches: ["tech"], searchTerms: ["apple", "google", "microsoft", "ai", "openai", "chatgpt", "twitter", "meta", "tesla", "elon"] },
]

export default async function MarketsPage({
  searchParams,
}: {
  searchParams: Promise<{ league?: string; q?: string; category?: string; page?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Parse page number
  const currentPage = Math.max(1, parseInt(params.page || "1", 10))
  const offset = (currentPage - 1) * MARKETS_PER_PAGE

  // Fetch user's memberships for the trade panel context
  const { data: membershipsData } = await supabase
    .from("league_members")
    .select(`
      id,
      league:leagues(id, name, allowed_categories)
    `)
    .eq("user_id", user?.id)

  // Type the memberships properly - Supabase returns league as an object, not an array
  const memberships = membershipsData as Array<{
    id: string
    league: { id: string; name: string; allowed_categories: string[] } | null
  }> | null

  // Helper function to check if a market matches a category
  const matchesCategory = (market: { question: string; category?: string }, categoryValue: string) => {
    const categoryConfig = categories.find(c => c.value === categoryValue)
    if (!categoryConfig) return false
    
    const question = market.question.toLowerCase()
    const marketCategory = (market.category?.toLowerCase() || '').trim()
    
    // Check if the market's category field matches any of our categoryMatches
    const categoryMatch = categoryConfig.categoryMatches.some(match => 
      marketCategory.includes(match.toLowerCase()) || 
      marketCategory.replace(/[-\s]/g, '') === match.replace(/[-\s]/g, '')
    )
    if (categoryMatch) return true
    
    // Check if any search terms match the question
    return categoryConfig.searchTerms.some(term => 
      question.includes(term.toLowerCase())
    )
  }

  // Fetch markets from Polymarket
  let allMarkets = []
  let markets = []
  let totalFetched = 0
  
  if (params.q) {
    // Search markets
    allMarkets = await searchMarkets(params.q)
    
    // Also filter by category if both search and category are specified
    if (params.category && params.category !== "all") {
      allMarkets = allMarkets.filter(m => matchesCategory(m, params.category!))
    }
    
    totalFetched = allMarkets.length
    markets = allMarkets.slice(offset, offset + MARKETS_PER_PAGE)
  } else if (params.category && params.category !== "all") {
    // Fetch a large batch and filter client-side for reliable category filtering
    allMarkets = await fetchMarkets(200, 0)
    
    // Filter by category
    const filteredMarkets = allMarkets.filter(m => matchesCategory(m, params.category!))
    
    totalFetched = filteredMarkets.length
    markets = filteredMarkets.slice(offset, offset + MARKETS_PER_PAGE)
  } else {
    // Fetch all markets with pagination
    allMarkets = await fetchMarkets(MARKETS_PER_PAGE + 1, offset)
    totalFetched = allMarkets.length
    markets = allMarkets.slice(0, MARKETS_PER_PAGE)
  }

  // Filter by league's allowed categories if league is specified
  if (params.league) {
    const membership = memberships?.find((m) => m.league?.id === params.league)
    if (membership?.league?.allowed_categories) {
      const allowedCategories = membership.league.allowed_categories
      markets = markets.filter((m) =>
        allowedCategories.some((cat: string) =>
          m.category?.toLowerCase().includes(cat.toLowerCase()),
        ),
      )
    }
  }

  // Check if there are more pages
  const hasNextPage = totalFetched > MARKETS_PER_PAGE
  const hasPrevPage = currentPage > 1

  // Build page URL helper
  const buildPageUrl = (page: number) => {
    const searchParamsObj = new URLSearchParams()
    if (params.category) searchParamsObj.set("category", params.category)
    if (params.league) searchParamsObj.set("league", params.league)
    if (params.q) searchParamsObj.set("q", params.q)
    searchParamsObj.set("page", page.toString())
    return `/dashboard/markets?${searchParamsObj.toString()}`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Markets</h1>
          <p className="text-muted-foreground">Browse and trade on real Polymarket prediction markets</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Page {currentPage}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <form className="relative flex-1" action="/dashboard/markets" method="GET">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" placeholder="Search markets..." defaultValue={params.q} className="pl-10" />
          {params.league && <input type="hidden" name="league" value={params.league} />}
          {params.category && <input type="hidden" name="category" value={params.category} />}
        </form>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Link
              key={cat.value}
              href={`/dashboard/markets?category=${cat.value}${params.league ? `&league=${params.league}` : ""}`}
            >
              <Badge
                variant={
                  params.category === cat.value || (!params.category && cat.value === "all") ? "default" : "outline"
                }
                className="cursor-pointer transition-all hover:scale-105"
              >
                {cat.label}
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      {/* League Context */}
      {params.league && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
          <span className="text-sm text-muted-foreground">Trading for league:</span>
          <Badge variant="secondary">
            {memberships?.find((m) => m.league?.id === params.league)?.league?.name || "Selected League"}
          </Badge>
          <Button asChild variant="ghost" size="sm" className="ml-auto">
            <Link href="/dashboard/markets">Clear</Link>
          </Button>
        </div>
      )}

      {/* Markets Grid */}
      {markets.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {markets.map((market) => (
              <MarketCard key={market.conditionId} market={market} leagueId={params.league} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4 pt-6">
            <Button
              asChild
              variant="outline"
              disabled={!hasPrevPage}
              className={!hasPrevPage ? "pointer-events-none opacity-50" : ""}
            >
              <Link href={buildPageUrl(currentPage - 1)}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Link>
            </Button>
            
            <div className="flex items-center gap-2">
              {currentPage > 2 && (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={buildPageUrl(1)}>1</Link>
                  </Button>
                  {currentPage > 3 && <span className="text-muted-foreground">...</span>}
                </>
              )}
              
              {currentPage > 1 && (
                <Button asChild variant="ghost" size="sm">
                  <Link href={buildPageUrl(currentPage - 1)}>{currentPage - 1}</Link>
                </Button>
              )}
              
              <Button variant="default" size="sm" className="pointer-events-none">
                {currentPage}
              </Button>
              
              {hasNextPage && (
                <Button asChild variant="ghost" size="sm">
                  <Link href={buildPageUrl(currentPage + 1)}>{currentPage + 1}</Link>
                </Button>
              )}
            </div>

            <Button
              asChild
              variant="outline"
              disabled={!hasNextPage}
              className={!hasNextPage ? "pointer-events-none opacity-50" : ""}
            >
              <Link href={buildPageUrl(currentPage + 1)}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <LineChart className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="mb-2 text-lg font-medium text-foreground">No markets found</h3>
          <p className="text-sm text-muted-foreground">
            {params.q ? "Try a different search term" : "Markets will appear here when available"}
          </p>
        </div>
      )}
    </div>
  )
}
