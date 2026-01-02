"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowUp, ArrowDown, AlertCircle } from "@/components/icons"
import { createClient } from "@/lib/supabase/client"
import type { PolymarketMarket } from "@/lib/polymarket"
import { getMarketPrices } from "@/lib/polymarket"
import type { LeagueMember } from "@/lib/types"
import { processTradeViaAPI } from "@/lib/api"

interface TradePanelProps {
  market: PolymarketMarket
  memberships: (LeagueMember & { league: { id: string; name: string; max_position_size: number } })[]
  selectedLeagueId?: string
}

export function TradePanel({ market, memberships, selectedLeagueId }: TradePanelProps) {
  const router = useRouter()
  const [outcome, setOutcome] = useState<"yes" | "no">("yes")
  const [amount, setAmount] = useState("")
  const [leagueId, setLeagueId] = useState(selectedLeagueId || memberships[0]?.league?.id || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const prices = getMarketPrices(market)
  const currentPrice = outcome === "yes" ? prices.yes : prices.no
  const amountNum = Number.parseFloat(amount) || 0
  const shares = amountNum / currentPrice
  const potentialProfit = shares - amountNum

  const selectedMembership = memberships.find((m) => m.league?.id === leagueId)
  const maxTrade = selectedMembership
    ? (selectedMembership.current_balance * selectedMembership.league.max_position_size) / 100
    : 0

  const handleTrade = async () => {
    if (!selectedMembership || amountNum <= 0) return

    setIsLoading(true)
    setError(null)

    try {
      // Validate trade
      if (amountNum > selectedMembership.current_balance) {
        throw new Error("Insufficient balance")
      }

      if (amountNum > maxTrade) {
        throw new Error(`Maximum position size is $${maxTrade.toFixed(2)}`)
      }

      // Process trade via Backend API
      await processTradeViaAPI({
        league_member_id: selectedMembership.id,
        market_id: market.conditionId,
        market_slug: market.slug,
        market_question: market.question,
        trade_type: "buy",
        outcome,
        shares,
        price: currentPrice,
      })

      router.push(`/dashboard/leagues/${leagueId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place trade")
    } finally {
      setIsLoading(false)
    }
  }

  if (memberships.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
            <div>
              <h3 className="font-semibold text-card-foreground">Join a League to Trade</h3>
              <p className="text-sm text-muted-foreground">You need to be in a league to place trades</p>
            </div>
            <Button asChild>
              <a href="/leagues">Browse Leagues</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Place Trade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* League Selection */}
        <div className="space-y-2">
          <Label>League</Label>
          <Select value={leagueId} onValueChange={setLeagueId}>
            <SelectTrigger>
              <SelectValue placeholder="Select league" />
            </SelectTrigger>
            <SelectContent>
              {memberships.map((m) => (
                <SelectItem key={m.league.id} value={m.league.id}>
                  {m.league.name} (${m.current_balance.toLocaleString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Outcome Selection */}
        <Tabs value={outcome} onValueChange={(v) => setOutcome(v as "yes" | "no")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="yes" className="gap-2">
              <ArrowUp className="h-4 w-4" />
              YES {(prices.yes * 100).toFixed(0)}¢
            </TabsTrigger>
            <TabsTrigger value="no" className="gap-2">
              <ArrowDown className="h-4 w-4" />
              NO {(prices.no * 100).toFixed(0)}¢
            </TabsTrigger>
          </TabsList>

          <TabsContent value="yes" className="mt-4">
            <div className={`rounded-lg p-4 ${outcome === "yes" ? "bg-accent/10 ring-2 ring-accent" : "bg-muted/50"}`}>
              <p className="text-sm text-muted-foreground">{"You're betting this will happen"}</p>
              <p className="text-2xl font-bold text-accent">{(prices.yes * 100).toFixed(1)}%</p>
            </div>
          </TabsContent>

          <TabsContent value="no" className="mt-4">
            <div
              className={`rounded-lg p-4 ${outcome === "no" ? "bg-destructive/10 ring-2 ring-destructive" : "bg-muted/50"}`}
            >
              <p className="text-sm text-muted-foreground">{"You're betting this won't happen"}</p>
              <p className="text-2xl font-bold text-destructive">{(prices.no * 100).toFixed(1)}%</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Amount Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="amount">Amount ($)</Label>
            <span className="text-xs text-muted-foreground">Max: ${maxTrade.toFixed(0)}</span>
          </div>
          <Input
            id="amount"
            type="number"
            min="1"
            max={maxTrade}
            step="1"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div className="flex gap-2">
            {[10, 25, 50, 100].map((pct) => (
              <Button
                key={pct}
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent"
                onClick={() => setAmount(((maxTrade * pct) / 100).toFixed(0))}
              >
                {pct}%
              </Button>
            ))}
          </div>
        </div>

        {/* Trade Summary */}
        {amountNum > 0 && (
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shares</span>
              <span className="font-medium text-card-foreground">{shares.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avg. Price</span>
              <span className="font-medium text-card-foreground">{(currentPrice * 100).toFixed(1)}¢</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Potential Profit</span>
              <span className="font-medium text-accent">+${potentialProfit.toFixed(2)}</span>
            </div>
          </div>
        )}

        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <Button onClick={handleTrade} disabled={isLoading || amountNum <= 0 || !leagueId} className="w-full" size="lg">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Placing Trade...
            </>
          ) : (
            `Buy ${outcome.toUpperCase()} for $${amountNum.toFixed(2)}`
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
