import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Trophy, Globe, Lock } from "@/components/icons"
import type { League } from "@/lib/types"

interface LeagueCardProps {
  league: League
  memberCount?: number
  userRank?: number
  userPnl?: number
}

export function LeagueCard({ league, memberCount, userRank, userPnl }: LeagueCardProps) {
  const statusColors = {
    active: "bg-accent/20 text-accent",
    completed: "bg-muted text-muted-foreground",
    upcoming: "bg-warning/20 text-warning",
  }

  return (
    <Link href={`/dashboard/leagues/${league.id}`}>
      <Card className="transition-all hover:border-primary/50 hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {league.is_public ? (
                <Globe className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
              <CardTitle className="text-lg">{league.name}</CardTitle>
            </div>
            <Badge variant="secondary" className={statusColors[league.status]}>
              {league.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {league.description && (
            <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{league.description}</p>
          )}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                {memberCount ?? league.member_count ?? 0} members
              </span>
              <span className="text-muted-foreground">${league.starting_capital.toLocaleString()} capital</span>
            </div>
            {userRank && (
              <div className="flex items-center gap-1 font-medium">
                <Trophy className="h-4 w-4 text-primary" />
                Rank #{userRank}
              </div>
            )}
          </div>
          {userPnl !== undefined && (
            <div className="mt-2 text-right">
              <span className={userPnl >= 0 ? "text-accent" : "text-destructive"}>
                {userPnl >= 0 ? "+" : ""}${userPnl.toLocaleString()} P&L
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
