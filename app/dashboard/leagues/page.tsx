import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { LeagueCard } from "@/components/dashboard/league-card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trophy } from "@/components/icons"
import Link from "next/link"

export default async function MyLeaguesPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch leagues user is a member of (using admin client to bypass potential RLS issues)
  const { data: memberships } = await adminClient
    .from("league_members")
    .select(`
      *,
      league:leagues(*)
    `)
    .eq("user_id", user?.id)
    .order("joined_at", { ascending: false })

  // Fetch leagues user is commissioner of
  const { data: ownedLeagues } = await adminClient
    .from("leagues")
    .select("*")
    .eq("commissioner_id", user?.id)
    .order("created_at", { ascending: false })

  const activeLeagues = memberships?.filter((m) => m.league?.status === "active") ?? []
  const completedLeagues = memberships?.filter((m) => m.league?.status === "completed") ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Leagues</h1>
          <p className="text-muted-foreground">Manage your prediction market leagues</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/leagues/create">
            <Plus className="mr-2 h-4 w-4" />
            Create League
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active ({activeLeagues.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedLeagues.length})</TabsTrigger>
          <TabsTrigger value="owned">My Created ({ownedLeagues?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {activeLeagues.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeLeagues.map((membership) => (
                <LeagueCard
                  key={membership.id}
                  league={membership.league}
                  userRank={membership.rank ?? undefined}
                  userPnl={membership.total_pnl}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No active leagues"
              description="Join a public league or create your own to start competing"
            />
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedLeagues.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedLeagues.map((membership) => (
                <LeagueCard
                  key={membership.id}
                  league={membership.league}
                  userRank={membership.rank ?? undefined}
                  userPnl={membership.total_pnl}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="No completed leagues" description="Your completed leagues will appear here" />
          )}
        </TabsContent>

        <TabsContent value="owned" className="mt-6">
          {ownedLeagues && ownedLeagues.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ownedLeagues.map((league) => (
                <LeagueCard key={league.id} league={league} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No created leagues"
              description="Create your first league and invite friends to compete"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
      <Trophy className="mb-4 h-12 w-12 text-muted-foreground/50" />
      <h3 className="mb-2 text-lg font-medium text-foreground">{title}</h3>
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/dashboard/leagues/create">Create League</Link>
        </Button>
        <Button asChild variant="outline" className="bg-transparent">
          <Link href="/leagues">Browse Leagues</Link>
        </Button>
      </div>
    </div>
  )
}
