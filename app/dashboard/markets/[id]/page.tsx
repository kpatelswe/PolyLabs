import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { fetchMarket, getMarketPrices } from "@/lib/polymarket"
import { TradePanel } from "@/components/markets/trade-panel"
import { PriceChart } from "@/components/markets/price-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, DollarSign, TrendingUp, ExternalLink, ArrowLeft, Activity, BarChart3 } from "@/components/icons"
import Link from "next/link"

export default async function MarketDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ league?: string }>
}) {
  const { id } = await params
  const { league: selectedLeagueId } = await searchParams

  const supabase = await createClient()
  const adminClient = createAdminClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch market data - don't require login to view
  const market = await fetchMarket(id)
  if (!market) notFound()

  // Fetch user's league memberships only if logged in
  let memberships: Array<{
    id: string
    league: { id: string; name: string; max_position_size: number; allowed_categories: string[] } | null
    current_balance: number
    total_trades: number
  }> | null = null
  
  if (user) {
    // Use admin client to fetch memberships to bypass RLS issues
    const { data: membershipsData } = await adminClient
      .from("league_members")
      .select(`
        *,
        league:leagues(id, name, max_position_size, allowed_categories)
      `)
      .eq("user_id", user.id)
    memberships = membershipsData as typeof memberships
  }

  const prices = getMarketPrices(market)
  const volume = Number.parseFloat(market.volume || "0")
  const liquidity = Number.parseFloat(market.liquidity || "0")
  const endDate = market.endDate ? new Date(market.endDate) : null

  // Calculate implied probability
  const impliedProb = prices.yes * 100

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link href={`/dashboard/markets${selectedLeagueId ? `?league=${selectedLeagueId}` : ""}`}>
          <ArrowLeft className="h-4 w-4" />
          Back to Markets
        </Link>
      </Button>

      {/* Market Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {market.category}
            </Badge>
            {market.active && (
              <Badge variant="outline" className="border-accent text-accent">
                <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
                Live
              </Badge>
            )}
            {endDate && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Ends {endDate.toLocaleDateString("en-US", { 
                  month: "short", 
                  day: "numeric",
                  year: "numeric"
                })}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">{market.question}</h1>
          
          {/* Quick Stats Bar */}
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Volume</span>
              <span className="font-semibold text-foreground">
                {volume >= 1000000
                  ? `$${(volume / 1000000).toFixed(1)}M`
                  : volume >= 1000
                    ? `$${(volume / 1000).toFixed(0)}K`
                    : `$${volume.toFixed(0)}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Liquidity</span>
              <span className="font-semibold text-foreground">
                {liquidity >= 1000
                  ? `$${(liquidity / 1000).toFixed(0)}K`
                  : `$${liquidity.toFixed(0)}`}
              </span>
            </div>
            <Button asChild variant="outline" size="sm" className="ml-auto shrink-0 bg-transparent">
              <a 
                href={market.slug ? `https://polymarket.com/event/${market.slug}` : `https://polymarket.com/search?q=${encodeURIComponent(market.question)}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Polymarket
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Current Prices Card */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
              <CardContent className="p-6 text-center">
                <p className="text-sm font-medium text-muted-foreground">YES</p>
                <p className="my-2 text-5xl font-bold text-accent">{(prices.yes * 100).toFixed(0)}¢</p>
                <p className="text-sm text-muted-foreground">
                  {impliedProb.toFixed(1)}% chance
                </p>
              </CardContent>
            </Card>
            <Card className="border-destructive/20 bg-gradient-to-br from-destructive/5 to-destructive/10">
              <CardContent className="p-6 text-center">
                <p className="text-sm font-medium text-muted-foreground">NO</p>
                <p className="my-2 text-5xl font-bold text-destructive">{(prices.no * 100).toFixed(0)}¢</p>
                <p className="text-sm text-muted-foreground">
                  {(100 - impliedProb).toFixed(1)}% chance
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Price Chart */}
          <PriceChart conditionId={id} currentPrice={prices.yes} />

          {/* Tabs for Info */}
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>
            
            <TabsContent value="about" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About this market</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {market.description || "No description available for this market."}
                  </p>
                  <div className="mt-6 rounded-lg bg-muted/50 p-4">
                    <h4 className="font-medium text-foreground mb-2">Resolution Criteria</h4>
                    <p className="text-sm text-muted-foreground">
                      This market will resolve to YES if the event occurs as described before the end date. 
                      Otherwise, it will resolve to NO. Resolution is determined by official sources.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Simulated activity - in real app would come from API */}
                    {[
                      { action: "Bought YES", amount: "$250", time: "2 mins ago", user: "trader_1" },
                      { action: "Sold NO", amount: "$180", time: "5 mins ago", user: "predictor_x" },
                      { action: "Bought YES", amount: "$500", time: "12 mins ago", user: "whale_42" },
                      { action: "Bought NO", amount: "$100", time: "18 mins ago", user: "newbie_99" },
                    ].map((activity, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${activity.action.includes("YES") ? "bg-accent" : "bg-destructive"}`} />
                          <div>
                            <p className="text-sm font-medium text-foreground">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">{activity.user}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">{activity.amount}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="stats" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5" />
                    Market Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Volume</span>
                        <span className="font-semibold text-foreground">
                          ${volume.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Liquidity</span>
                        <span className="font-semibold text-foreground">
                          ${liquidity.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">24h Volume</span>
                        <span className="font-semibold text-foreground">
                          ${(volume * 0.05).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Best Bid (YES)</span>
                        <span className="font-semibold text-accent">
                          {((prices.yes - 0.01) * 100).toFixed(1)}¢
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Best Ask (YES)</span>
                        <span className="font-semibold text-accent">
                          {((prices.yes + 0.01) * 100).toFixed(1)}¢
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Spread</span>
                        <span className="font-semibold text-foreground">2¢</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Trade Panel Sidebar */}
        <div className="lg:sticky lg:top-6">
          <TradePanel
            market={market}
            memberships={(memberships ?? []).filter((m: { id: string; league: { id: string; name: string; max_position_size: number; allowed_categories: string[] } | null }) => m.league)}
            selectedLeagueId={selectedLeagueId}
          />
        </div>
      </div>
    </div>
  )
}

