import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PositionCard } from "@/components/dashboard/position-card"
import { LineChart, Plus, BarChart3 } from "@/components/icons"
import type { Position } from "@/lib/types"
import Link from "next/link"

interface LeaguePositionsProps {
  positions: Position[]
  leagueMemberId: string
  leagueId: string
}

export function LeaguePositions({ positions, leagueId }: LeaguePositionsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>My Positions</CardTitle>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="bg-transparent">
            <Link href={`/dashboard/leagues/${leagueId}/analytics`}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/dashboard/markets?league=${leagueId}`}>
              <Plus className="mr-2 h-4 w-4" />
              New Trade
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {positions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {positions.map((position) => (
              <PositionCard key={position.id} position={position} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <LineChart className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-medium text-foreground">No positions yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">Start trading to build your portfolio</p>
            <Button asChild>
              <Link href={`/dashboard/markets?league=${leagueId}`}>Browse Markets</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
