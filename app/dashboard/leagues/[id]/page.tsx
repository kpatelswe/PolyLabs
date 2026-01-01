import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LeagueHeader } from "@/components/league/league-header"
import { LeagueStats } from "@/components/league/league-stats"
import { LeagueLeaderboard } from "@/components/league/league-leaderboard"
import { LeaguePositions } from "@/components/league/league-positions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function LeaguePage({
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

  // Fetch league with commissioner profile
  const { data: league, error } = await supabase
    .from("leagues")
    .select(`
      *,
      commissioner:profiles!leagues_commissioner_id_fkey(*)
    `)
    .eq("id", id)
    .single()

  if (error || !league) notFound()

  // Fetch all members with their profiles
  const { data: members } = await supabase
    .from("league_members")
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq("league_id", id)
    .order("total_pnl", { ascending: false })

  // Find current user's membership
  const currentMembership = members?.find((m) => m.user_id === user.id)
  const isCommissioner = league.commissioner_id === user.id
  const isMember = !!currentMembership

  // Fetch user's positions in this league
  const { data: positions } = currentMembership
    ? await supabase
        .from("positions")
        .select("*")
        .eq("league_member_id", currentMembership.id)
        .order("created_at", { ascending: false })
    : { data: [] }

  return (
    <div className="space-y-6">
      <LeagueHeader league={league} isMember={isMember} isCommissioner={isCommissioner} userId={user.id} />

      {isMember && currentMembership && (
        <LeagueStats
          balance={currentMembership.current_balance}
          pnl={currentMembership.total_pnl}
          winRate={currentMembership.win_rate}
          totalTrades={currentMembership.total_trades}
          rank={members?.findIndex((m) => m.user_id === user.id)! + 1}
          totalMembers={members?.length ?? 0}
        />
      )}

      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          {isMember && <TabsTrigger value="positions">My Positions</TabsTrigger>}
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-6">
          <LeagueLeaderboard members={members ?? []} currentUserId={user.id} />
        </TabsContent>

        {isMember && (
          <TabsContent value="positions" className="mt-6">
            <LeaguePositions positions={positions ?? []} leagueMemberId={currentMembership!.id} leagueId={id} />
          </TabsContent>
        )}

        <TabsContent value="rules" className="mt-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-card-foreground">League Rules</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-card-foreground">Starting Capital:</strong> $
                {league.starting_capital.toLocaleString()}
              </p>
              <p>
                <strong className="text-card-foreground">Max Position Size:</strong> {league.max_position_size}% of
                portfolio
              </p>
              <p>
                <strong className="text-card-foreground">Scoring Type:</strong>{" "}
                {league.scoring_type.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </p>
              <p>
                <strong className="text-card-foreground">Allowed Categories:</strong>{" "}
                {league.allowed_categories.join(", ")}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
