import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Trophy, Target, Zap, Star, Crown, Medal, Award, TrendingUp } from "@/components/icons"
import type { Achievement } from "@/lib/types"

const achievementIcons: Record<string, React.ElementType> = {
  best_roi: TrendingUp,
  sharpest_prediction: Target,
  first_trade: Zap,
  winning_streak: Star,
  league_champion: Crown,
  top_3_finish: Medal,
  consistent_trader: Award,
  default: Trophy,
}

const achievementColors: Record<string, string> = {
  best_roi: "bg-accent/20 text-accent border-accent/30",
  sharpest_prediction: "bg-primary/20 text-primary border-primary/30",
  first_trade: "bg-warning/20 text-warning border-warning/30",
  winning_streak: "bg-chart-4/20 text-chart-4 border-chart-4/30",
  league_champion: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  top_3_finish: "bg-gray-400/20 text-gray-600 border-gray-400/30",
  default: "bg-muted text-muted-foreground border-border",
}

interface AchievementBadgeProps {
  achievement: Achievement
  size?: "sm" | "md" | "lg"
}

export function AchievementBadge({ achievement, size = "md" }: AchievementBadgeProps) {
  const Icon = achievementIcons[achievement.achievement_type] || achievementIcons.default
  const colorClass = achievementColors[achievement.achievement_type] || achievementColors.default

  const sizeClasses = {
    sm: "px-2 py-1 text-xs gap-1",
    md: "px-3 py-1.5 text-sm gap-1.5",
    lg: "px-4 py-2 text-base gap-2",
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  return (
    <Badge variant="outline" className={`${colorClass} ${sizeClasses[size]} font-medium`}>
      <Icon className={iconSizes[size]} />
      {achievement.title}
    </Badge>
  )
}
