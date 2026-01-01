import { createClient } from "@/lib/supabase/server"
import { StatsCard } from "@/components/dashboard/stats-card"
import { LeagueCard } from "@/components/dashboard/league-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, DollarSign, Activity, Target, Plus, ChevronRight } from "@/components/icons"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user?.id).single()

  // Fetch user's league memberships with league details
  const { data: memberships } = await supabase
    .from("league_members")
    .select(`
      *,
      league:leagues(*)
    `)
    .eq("user_id", user?.id)
    .order("joined_at", { ascending: false })
    .limit(4)

  // Calculate aggregate stats
  const totalPnl = memberships?.reduce((sum, m) => sum + (m.total_pnl ?? 0), 0) ?? 0
  const totalTrades = memberships?.reduce((sum, m) => sum + (m.total_trades ?? 0), 0) ?? 0
  const avgWinRate =
    memberships && memberships.length > 0
      ? memberships.reduce((sum, m) => sum + (m.win_rate ?? 0), 0) / memberships.length
      : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {profile?.display_name ?? profile?.username ?? "Trader"}
          </h1>
          <p className="text-muted-foreground">{"Here's how your predictions are performing"}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/leagues/create">
            <Plus className="mr-2 h-4 w-4" />
            Create League
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total P&L"
          value={`${totalPnl >= 0 ? "+" : ""}$${totalPnl.toLocaleString()}`}
          change="Across all leagues"
          changeType={totalPnl >= 0 ? "positive" : "negative"}
          icon={DollarSign}
        />
        <StatsCard
          title="Active Leagues"
          value={memberships?.length ?? 0}
          change={`${profile?.total_leagues_joined ?? 0} total joined`}
          icon={Trophy}
        />
        <StatsCard title="Total Trades" value={totalTrades} change="All time" icon={Activity} />
        <StatsCard
          title="Avg Win Rate"
          value={`${avgWinRate.toFixed(0)}%`}
          change="Across leagues"
          changeType={avgWinRate >= 50 ? "positive" : "negative"}
          icon={Target}
        />
      </div>

      {/* My Leagues */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Leagues</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/leagues">
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {memberships && memberships.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {memberships.map((membership) => (
                <LeagueCard
                  key={membership.id}
                  league={membership.league}
                  userRank={membership.rank ?? undefined}
                  userPnl={membership.total_pnl}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-medium text-foreground">No leagues yet</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Create your own league or join an existing one to start competing
              </p>
              <div className="flex justify-center gap-3">
                <Button asChild>
                  <Link href="/dashboard/leagues/create">Create League</Link>
                </Button>
                <Button asChild variant="outline" className="bg-transparent">
                  <Link href="/leagues">Browse Leagues</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
