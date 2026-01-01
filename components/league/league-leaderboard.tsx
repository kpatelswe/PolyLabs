import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LeaderboardRow } from "@/components/dashboard/leaderboard-row"
import type { LeagueMember } from "@/lib/types"

interface LeagueLeaderboardProps {
  members: LeagueMember[]
  currentUserId: string
}

export function LeagueLeaderboard({ members, currentUserId }: LeagueLeaderboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {members.map((member, index) => (
            <LeaderboardRow
              key={member.id}
              member={member}
              rank={index + 1}
              isCurrentUser={member.user_id === currentUserId}
            />
          ))}
          {members.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">No members yet. Be the first to join!</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
