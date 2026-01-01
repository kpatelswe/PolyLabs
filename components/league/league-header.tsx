"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Globe, Lock, Copy, Check, Loader2, Users, Settings } from "@/components/icons"
import { createClient } from "@/lib/supabase/client"
import type { League, Profile } from "@/lib/types"
import Link from "next/link"

interface LeagueHeaderProps {
  league: League & { commissioner: Profile }
  isMember: boolean
  isCommissioner: boolean
  userId: string
}

export function LeagueHeader({ league, isMember, isCommissioner, userId }: LeagueHeaderProps) {
  const router = useRouter()
  const [isJoining, setIsJoining] = useState(false)
  const [copied, setCopied] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleJoin = async () => {
    setIsJoining(true)
    setError(null)
    const supabase = createClient()

    try {
      // Check if invite code is required
      if (!league.is_public && inviteCode !== league.invite_code) {
        throw new Error("Invalid invite code")
      }

      const { error: joinError } = await supabase.from("league_members").insert({
        league_id: league.id,
        user_id: userId,
        current_balance: league.starting_capital,
      })

      if (joinError) throw joinError

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join league")
    } finally {
      setIsJoining(false)
    }
  }

  const copyInviteCode = () => {
    if (league.invite_code) {
      navigator.clipboard.writeText(league.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const statusColors = {
    active: "bg-accent/20 text-accent",
    completed: "bg-muted text-muted-foreground",
    upcoming: "bg-warning/20 text-warning",
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              {league.is_public ? (
                <Globe className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
              <h1 className="text-2xl font-bold text-card-foreground">{league.name}</h1>
              <Badge variant="secondary" className={statusColors[league.status]}>
                {league.status}
              </Badge>
            </div>
            {league.description && <p className="mb-4 text-muted-foreground">{league.description}</p>}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Created by {league.commissioner?.display_name ?? league.commissioner?.username}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {!isMember && league.status === "active" && (
              <div className="space-y-3">
                {!league.is_public && (
                  <Input
                    placeholder="Enter invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full"
                  />
                )}
                <Button onClick={handleJoin} disabled={isJoining} className="w-full">
                  {isJoining ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    "Join League"
                  )}
                </Button>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            )}

            {isMember && (
              <Button asChild>
                <Link href={`/dashboard/markets?league=${league.id}`}>Trade Markets</Link>
              </Button>
            )}

            {isCommissioner && !league.is_public && league.invite_code && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
                <span className="text-sm text-muted-foreground">Invite:</span>
                <code className="font-mono text-sm text-card-foreground">{league.invite_code}</code>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyInviteCode}>
                  {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            )}

            {isCommissioner && (
              <Button asChild variant="outline" size="sm" className="bg-transparent">
                <Link href={`/dashboard/leagues/${league.id}/settings`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
