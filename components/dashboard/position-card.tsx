import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown } from "@/components/icons"
import type { Position } from "@/lib/types"

interface PositionCardProps {
  position: Position
}

export function PositionCard({ position }: PositionCardProps) {
  const pnlPercent = ((position.current_price ?? position.entry_price) - position.entry_price) / position.entry_price
  const isProfit = position.unrealized_pnl >= 0

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <p className="line-clamp-2 text-sm font-medium text-card-foreground">{position.market_question}</p>
          </div>
          <Badge variant={position.outcome === "yes" ? "default" : "secondary"} className="ml-2 shrink-0">
            {position.outcome.toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Shares</p>
            <p className="font-medium text-card-foreground">{position.shares.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Entry</p>
            <p className="font-medium text-card-foreground">${position.entry_price.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Current</p>
            <p className="font-medium text-card-foreground">
              ${(position.current_price ?? position.entry_price).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">Unrealized P&L</span>
          <span className={`flex items-center gap-1 font-semibold ${isProfit ? "text-accent" : "text-destructive"}`}>
            {isProfit ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            {isProfit ? "+" : ""}${position.unrealized_pnl.toFixed(2)} ({(pnlPercent * 100).toFixed(1)}%)
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
