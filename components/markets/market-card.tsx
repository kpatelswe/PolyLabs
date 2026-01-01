"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, TrendingUp, DollarSign } from "@/components/icons"
import type { PolymarketMarket } from "@/lib/polymarket"
import { getMarketPrices } from "@/lib/polymarket"
import Link from "next/link"

interface MarketCardProps {
  market: PolymarketMarket
  leagueId?: string
}

export function MarketCard({ market, leagueId }: MarketCardProps) {
  const prices = getMarketPrices(market)
  const volume = Number.parseFloat(market.volume || "0")
  const endDate = market.endDate ? new Date(market.endDate) : null
  
  // Use the market id (not conditionId) for the URL since that's what the API returns
  const marketUrl = `/dashboard/markets/${encodeURIComponent(market.id || market.conditionId)}${leagueId ? `?league=${leagueId}` : ""}`

  return (
    <Link href={marketUrl} className="block">
      <Card className="flex h-full flex-col transition-all hover:border-primary/50 hover:shadow-lg hover:scale-[1.02] cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <Badge variant="secondary" className="shrink-0 capitalize">
              {market.category}
            </Badge>
            {endDate && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {endDate.toLocaleDateString()}
              </span>
            )}
          </div>
          <CardTitle className="line-clamp-2 text-base">{market.question}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          {/* Price Display */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-accent/10 p-3 text-center">
              <p className="text-xs text-muted-foreground">YES</p>
              <p className="text-xl font-bold text-accent">{(prices.yes * 100).toFixed(0)}¢</p>
            </div>
            <div className="rounded-lg bg-destructive/10 p-3 text-center">
              <p className="text-xs text-muted-foreground">NO</p>
              <p className="text-xl font-bold text-destructive">{(prices.no * 100).toFixed(0)}¢</p>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {volume >= 1000000
                ? `$${(volume / 1000000).toFixed(1)}M`
                : volume >= 1000
                  ? `$${(volume / 1000).toFixed(0)}K`
                  : `$${volume.toFixed(0)}`}{" "}
              vol
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {market.liquidity ? `$${Number.parseFloat(market.liquidity).toLocaleString()} liq` : "Active"}
            </span>
          </div>

          {/* Trade Button */}
          <div className="mt-auto">
            <Button className="w-full" onClick={(e) => e.stopPropagation()}>
              Trade
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

