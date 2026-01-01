"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "@/components/icons"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { PriceHistoryPoint } from "@/lib/polymarket"

interface PriceChartProps {
  conditionId: string
  currentPrice: number
}

type Interval = "1d" | "1w" | "1m" | "all"

const intervals: { value: Interval; label: string }[] = [
  { value: "1d", label: "24H" },
  { value: "1w", label: "1W" },
  { value: "1m", label: "1M" },
  { value: "all", label: "All" },
]

export function PriceChart({ conditionId, currentPrice }: PriceChartProps) {
  const [interval, setInterval] = useState<Interval>("1m")
  const [data, setData] = useState<PriceHistoryPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [priceChange, setPriceChange] = useState({ value: 0, percent: 0 })

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const response = await fetch(`/api/markets/${conditionId}/history?interval=${interval}`)
        if (response.ok) {
          const history = await response.json()
          setData(history)
          
          // Calculate price change
          if (history.length > 1) {
            const firstPrice = history[0].price
            const lastPrice = history[history.length - 1].price
            const change = lastPrice - firstPrice
            const percentChange = (change / firstPrice) * 100
            setPriceChange({ value: change, percent: percentChange })
          }
        }
      } catch (error) {
        console.error("Failed to load price history:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [conditionId, interval])

  const isPositive = priceChange.value >= 0

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Price History</CardTitle>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-3xl font-bold text-foreground">
                {(currentPrice * 100).toFixed(1)}¢
              </span>
              <span
                className={`flex items-center text-sm font-medium ${
                  isPositive ? "text-accent" : "text-destructive"
                }`}
              >
                {isPositive ? "+" : ""}
                {(priceChange.value * 100).toFixed(1)}¢
                <span className="ml-1 text-muted-foreground">
                  ({isPositive ? "+" : ""}
                  {priceChange.percent.toFixed(1)}%)
                </span>
              </span>
            </div>
          </div>
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {intervals.map((int) => (
              <Button
                key={int.value}
                variant={interval === int.value ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setInterval(int.value)}
              >
                {int.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[300px] w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={isPositive ? "hsl(var(--accent))" : "hsl(var(--destructive))"}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={isPositive ? "hsl(var(--accent))" : "hsl(var(--destructive))"}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickMargin={10}
                  minTickGap={50}
                />
                <YAxis
                  domain={[
                    (dataMin: number) => Math.max(0, dataMin - 0.05),
                    (dataMax: number) => Math.min(1, dataMax + 0.05),
                  ]}
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}¢`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  width={50}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const point = payload[0].payload as PriceHistoryPoint
                      return (
                        <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                          <p className="text-xs text-muted-foreground">{point.date}</p>
                          <p className="text-lg font-semibold text-foreground">
                            {(point.price * 100).toFixed(1)}¢
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? "hsl(var(--accent))" : "hsl(var(--destructive))"}
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                  animationDuration={500}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
