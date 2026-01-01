import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Crown, Medal, Award } from "@/components/icons"
import type { LeagueMember } from "@/lib/types"
import { cn } from "@/lib/utils"

interface LeaderboardRowProps {
  member: LeagueMember
  rank: number
  isCurrentUser?: boolean
}

export function LeaderboardRow({ member, rank, isCurrentUser }: LeaderboardRowProps) {
  const getRankIcon = () => {
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

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg p-3 transition-colors",
        isCurrentUser ? "bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted/50",
      )}
    >
      <div className="flex w-8 items-center justify-center">{getRankIcon()}</div>

      <Avatar className="h-10 w-10">
        <AvatarImage src={member.profile?.avatar_url ?? undefined} />
        <AvatarFallback className="bg-primary/10 text-primary">
          {member.profile?.username?.slice(0, 2).toUpperCase() ?? "??"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <p className="font-medium text-foreground">
          {member.profile?.display_name ?? member.profile?.username}
          {isCurrentUser && <span className="ml-2 text-xs text-muted-foreground">(You)</span>}
        </p>
        <p className="text-sm text-muted-foreground">
          {member.total_trades} trades · {member.win_rate.toFixed(0)}% win rate
        </p>
      </div>

      <div className="text-right">
        <p className={cn("font-semibold", member.total_pnl >= 0 ? "text-accent" : "text-destructive")}>
          {member.total_pnl >= 0 ? "+" : ""}${member.total_pnl.toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground">${member.current_balance.toLocaleString()}</p>
      </div>
    </div>
  )
}
