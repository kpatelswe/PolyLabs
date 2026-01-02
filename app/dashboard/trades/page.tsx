import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, ArrowUp, ArrowDown } from "@/components/icons"

export default async function TradesPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch all user's league memberships (using admin client)
  const { data: memberships } = await adminClient
    .from("league_members")
    .select("id, league:leagues(id, name)")
    .eq("user_id", user?.id)

  const memberIds = memberships?.map((m) => m.id) ?? []

  // Fetch trades across all leagues (using admin client)
  const { data: trades } = memberIds.length > 0 
    ? await adminClient
        .from("trades")
        .select(`
          *,
          league_member:league_members(
            league:leagues(name)
          )
        `)
        .in("league_member_id", memberIds)
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [] }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Trade History</h1>
        <p className="text-muted-foreground">View all your trades across leagues</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          {trades && trades.length > 0 ? (
            <div className="space-y-4">
              {trades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        trade.trade_type === "buy" ? "bg-accent/10" : "bg-destructive/10"
                      }`}
                    >
                      {trade.trade_type === "buy" ? (
                        <ArrowUp className="h-5 w-5 text-accent" />
                      ) : (
                        <ArrowDown className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="line-clamp-1 font-medium text-card-foreground">{trade.market_question}</p>
                      <p className="text-sm text-muted-foreground">
                        {trade.trade_type.toUpperCase()} {trade.shares.toFixed(2)} {trade.outcome.toUpperCase()} @{" "}
                        {(trade.price * 100).toFixed(1)}¢
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-card-foreground">${trade.total_value.toFixed(2)}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {trade.league_member?.league?.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(trade.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <History className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-medium text-foreground">No trades yet</h3>
              <p className="text-sm text-muted-foreground">Your trading history will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
