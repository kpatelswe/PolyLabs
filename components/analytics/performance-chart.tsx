"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { Trade } from "@/lib/types"

interface PerformanceChartProps {
  trades: Trade[]
  startingBalance: number
}

export function PerformanceChart({ trades, startingBalance }: PerformanceChartProps) {
  // Calculate cumulative P&L over time
  const chartData = trades
    .slice()
    .reverse()
    .reduce<{ date: string; balance: number; pnl: number }[]>((acc, trade) => {
      const prevBalance = acc.length > 0 ? acc[acc.length - 1].balance : startingBalance
      const pnl = trade.pnl ?? 0
      const newBalance = prevBalance + (trade.trade_type === "sell" ? pnl : -trade.total_value)

      acc.push({
        date: new Date(trade.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        balance: newBalance,
        pnl: newBalance - startingBalance,
      })
      return acc
    }, [])

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Make trades to see your performance chart
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "hsl(var(--card-foreground))" }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Balance"]}
            />
            <Line type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
