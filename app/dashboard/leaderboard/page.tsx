import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Crown, Medal, Award, TrendingUp, Target, Activity } from "@/components/icons"
import Link from "next/link"

export default async function GlobalLeaderboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch top performers across all leagues (by total P&L)
  const { data: topByPnl } = await supabase
    .from("league_members")
    .select(`
      *,
      profile:profiles(*),
      league:leagues(name)
    `)
    .order("total_pnl", { ascending: false })
    .limit(50)

  // Fetch top by win rate (minimum 10 trades)
  const { data: topByWinRate } = await supabase
    .from("league_members")
    .select(`
      *,
      profile:profiles(*),
      league:leagues(name)
    `)
    .gte("total_trades", 10)
    .order("win_rate", { ascending: false })
    .limit(50)

  // Fetch most active traders
  const { data: mostActive } = await supabase
    .from("league_members")
    .select(`
      *,
      profile:profiles(*),
      league:leagues(name)
    `)
    .order("total_trades", { ascending: false })
    .limit(50)

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="w-5 text-center text-sm font-medium text-muted-foreground">{rank}</span>
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LeaderboardTable = ({
    data,
    valueKey,
    valueLabel,
    formatter,
  }: { data: any[]; valueKey: string; valueLabel: string; formatter: (v: number) => string }) => (
    <div className="space-y-2">
      {data?.map((member, index) => (
        <Link
          key={member.id}
          href={`/dashboard/leagues/${member.league?.id || member.league_id}`}
          className={`flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50 ${
            member.user_id === user?.id ? "bg-primary/5 ring-1 ring-primary/20" : ""
          }`}
        >
          <div className="flex w-8 items-center justify-center">{getRankIcon(index + 1)}</div>
          <Avatar className="h-10 w-10">
            <AvatarImage src={member.profile?.avatar_url || "/placeholder.svg"} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {member.profile?.username?.slice(0, 2).toUpperCase() ?? "??"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium text-foreground">
              {member.profile?.display_name ?? member.profile?.username}
              {member.user_id === user?.id && <span className="ml-2 text-xs text-muted-foreground">(You)</span>}
            </p>
            <p className="text-sm text-muted-foreground">{member.league?.name}</p>
          </div>
          <div className="text-right">
            <p
              className={`font-semibold ${valueKey === "total_pnl" ? (member[valueKey] >= 0 ? "text-accent" : "text-destructive") : "text-foreground"}`}
            >
              {formatter(member[valueKey])}
            </p>
            <Badge variant="outline" className="text-xs">
              {valueLabel}
            </Badge>
          </div>
        </Link>
      ))}
      {(!data || data.length === 0) && (
        <p className="py-8 text-center text-muted-foreground">
          No data yet. Start trading to appear on the leaderboard!
        </p>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Global Leaderboard</h1>
        <p className="text-muted-foreground">Top performers across all leagues</p>
      </div>

      <Tabs defaultValue="pnl" className="w-full">
        <TabsList>
          <TabsTrigger value="pnl" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Top P&L
          </TabsTrigger>
          <TabsTrigger value="winrate" className="gap-2">
            <Target className="h-4 w-4" />
            Best Win Rate
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            <Activity className="h-4 w-4" />
            Most Active
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pnl">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers by P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <LeaderboardTable
                data={topByPnl ?? []}
                valueKey="total_pnl"
                valueLabel="Total P&L"
                formatter={(v) => `${v >= 0 ? "+" : ""}$${v.toLocaleString()}`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="winrate">
          <Card>
            <CardHeader>
              <CardTitle>Best Win Rate (min 10 trades)</CardTitle>
            </CardHeader>
            <CardContent>
              <LeaderboardTable
                data={topByWinRate ?? []}
                valueKey="win_rate"
                valueLabel="Win Rate"
                formatter={(v) => `${v.toFixed(1)}%`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Most Active Traders</CardTitle>
            </CardHeader>
            <CardContent>
              <LeaderboardTable
                data={mostActive ?? []}
                valueKey="total_trades"
                valueLabel="Trades"
                formatter={(v) => `${v} trades`}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
