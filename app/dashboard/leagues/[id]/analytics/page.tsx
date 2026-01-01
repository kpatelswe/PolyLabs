import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PerformanceChart } from "@/components/analytics/performance-chart"
import { AchievementBadge } from "@/components/achievements/achievement-badge"
import { ArrowLeft, Trophy, Target, Activity, TrendingUp } from "@/components/icons"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function LeagueAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Fetch league
  const { data: league, error } = await supabase.from("leagues").select("*").eq("id", id).single()

  if (error || !league) notFound()

  // Fetch user's membership
  const { data: membership } = await supabase
    .from("league_members")
    .select("*")
    .eq("league_id", id)
    .eq("user_id", user.id)
    .single()

  if (!membership) {
    redirect(`/dashboard/leagues/${id}`)
  }

  // Fetch trades
  const { data: trades } = await supabase
    .from("trades")
    .select("*")
    .eq("league_member_id", membership.id)
    .order("created_at", { ascending: false })

  // Fetch achievements
  const { data: achievements } = await supabase
    .from("achievements")
    .select("*")
    .eq("user_id", user.id)
    .eq("league_id", id)

  // Calculate analytics
  const totalTrades = trades?.length ?? 0
  const buyTrades = trades?.filter((t) => t.trade_type === "buy").length ?? 0
  const sellTrades = trades?.filter((t) => t.trade_type === "sell").length ?? 0
  const profitableTrades = trades?.filter((t) => t.trade_type === "sell" && (t.pnl ?? 0) > 0).length ?? 0
  const winRate = sellTrades > 0 ? (profitableTrades / sellTrades) * 100 : 0

  const yesTradesCount = trades?.filter((t) => t.outcome === "yes").length ?? 0
  const noTradesCount = trades?.filter((t) => t.outcome === "no").length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/dashboard/leagues/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to League
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics: {league.name}</h1>
        <p className="text-muted-foreground">Your performance breakdown in this league</p>
      </div>

      {/* Key Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total P&L</p>
                <p className={`text-xl font-bold ${membership.total_pnl >= 0 ? "text-accent" : "text-destructive"}`}>
                  {membership.total_pnl >= 0 ? "+" : ""}${membership.total_pnl.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-xl font-bold text-foreground">{winRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-xl font-bold text-foreground">{totalTrades}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Rank</p>
                <p className="text-xl font-bold text-foreground">#{membership.rank ?? "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <PerformanceChart trades={trades ?? []} startingBalance={league.starting_capital} />

      {/* Trade Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trade Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Buy Orders</span>
                <span className="font-medium text-foreground">{buyTrades}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sell Orders</span>
                <span className="font-medium text-foreground">{sellTrades}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Profitable Sells</span>
                <span className="font-medium text-accent">{profitableTrades}</span>
              </div>
              <hr className="border-border" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">YES Bets</span>
                <span className="font-medium text-foreground">{yesTradesCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">NO Bets</span>
                <span className="font-medium text-foreground">{noTradesCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            {achievements && achievements.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {achievements.map((achievement) => (
                  <AchievementBadge key={achievement.id} achievement={achievement} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Trophy className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">No achievements yet</p>
                <p className="text-sm text-muted-foreground">Keep trading to unlock badges!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
