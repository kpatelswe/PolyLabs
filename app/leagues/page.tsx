import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { LeagueCard } from "@/components/dashboard/league-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus } from "@/components/icons"
import Link from "next/link"

export default async function PublicLeaguesPage() {
  const supabase = await createClient()

  // Fetch public leagues with member counts
  const { data: leagues } = await supabase
    .from("leagues")
    .select(`
      *,
      league_members(count)
    `)
    .eq("is_public", true)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  const leaguesWithCount =
    leagues?.map((league) => ({
      ...league,
      member_count: league.league_members?.[0]?.count ?? 0,
    })) ?? []

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Public Leagues</h1>
            <p className="text-muted-foreground">Join a league and start competing on prediction markets</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/leagues/create">
              <Plus className="mr-2 h-4 w-4" />
              Create League
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search leagues..." className="pl-10" />
          </div>
        </div>

        {leaguesWithCount.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {leaguesWithCount.map((league) => (
              <LeagueCard key={league.id} league={league} memberCount={league.member_count} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <h3 className="mb-2 text-lg font-medium text-foreground">No public leagues yet</h3>
            <p className="mb-4 text-muted-foreground">Be the first to create a public league!</p>
            <Button asChild>
              <Link href="/dashboard/leagues/create">Create League</Link>
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
