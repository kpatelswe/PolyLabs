import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, TrendingUp, Target, Activity, Trophy } from "@/components/icons"

interface LeagueStatsProps {
  balance: number
  pnl: number
  winRate: number
  totalTrades: number
  rank: number
  totalMembers: number
}

export function LeagueStats({ balance, pnl, winRate, totalTrades, rank, totalMembers }: LeagueStatsProps) {
  const stats = [
    {
      label: "Balance",
      value: `$${balance.toLocaleString()}`,
      icon: DollarSign,
    },
    {
      label: "Total P&L",
      value: `${pnl >= 0 ? "+" : ""}$${pnl.toLocaleString()}`,
      icon: TrendingUp,
      isPositive: pnl >= 0,
    },
    {
      label: "Win Rate",
      value: `${winRate.toFixed(0)}%`,
      icon: Target,
    },
    {
      label: "Total Trades",
      value: totalTrades.toString(),
      icon: Activity,
    },
    {
      label: "Rank",
      value: `#${rank} of ${totalMembers}`,
      icon: Trophy,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p
                className={`text-lg font-semibold ${
                  stat.isPositive !== undefined
                    ? stat.isPositive
                      ? "text-accent"
                      : "text-destructive"
                    : "text-card-foreground"
                }`}
              >
                {stat.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
