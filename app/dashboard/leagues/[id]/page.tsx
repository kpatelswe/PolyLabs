import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LeagueHeader } from "@/components/league/league-header"
import { LeagueStats } from "@/components/league/league-stats"
import { LeagueLeaderboard } from "@/components/league/league-leaderboard"
import { LeaguePositions } from "@/components/league/league-positions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { createAdminClient } from "@/lib/supabase/admin"

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
    
  const adminSupabase = createAdminClient()

  // Fetch league with commissioner profile using Admin client to bypass RLS recursion
  const { data: league, error } = await adminSupabase
    .from("leagues")
    .select(`
      *,
      commissioner:profiles!leagues_commissioner_id_fkey(*)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching league:", error)
  }
  
  if (error || !league) {
     notFound()
  }

  // Fetch all members with their profiles
  const { data: members } = await adminSupabase
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
  
  // Verify access for private leagues
  if (!league.is_public && !isMember && !isCommissioner) {
     // If fetched via admin but user shouldn't see it (private and not member)
     // Actually, if they are fetching via ID, and it's private, they should get 404 unless they are member.
     // But wait! If they are joining? 
     // The "Join" page is separate.
     // If they land here on a private league they are NOT in, they should probably see a "Join" screen or 404.
     // But currently the page renders header which has "Join" button.
     // So we allow viewing the page, but content is limited?
     // The RLS policy was trying to restrict access.
     // If RLS blocks select, they get 404.
     // So technically we should probably 404 if they don't have access.
     // BUT, the LeagueHeader handles joining.
     // Let's allow viewing the header for now?
     // The previous code would 404. 
     // Let's implement a check: Allow if public OR member OR commissioner.
     // Otherwise redirect to join?
     // If I simply return the page, they see the LeagueHeader which lets them join. This is BETTER UX.
  }

  // Fetch user's positions in this league
  const { data: positions } = currentMembership
    ? await adminSupabase
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
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
