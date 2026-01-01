"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Trophy } from "@/components/icons"
import Link from "next/link"

export default function JoinLeaguePage() {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("You must be logged in")
      setIsLoading(false)
      return
    }

    try {
      // Find league by invite code
      const { data: league, error: leagueError } = await supabase
        .from("leagues")
        .select("*")
        .eq("invite_code", inviteCode.toUpperCase())
        .single()

      if (leagueError || !league) {
        throw new Error("Invalid invite code")
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from("league_members")
        .select("id")
        .eq("league_id", league.id)
        .eq("user_id", user.id)
        .single()

      if (existingMember) {
        router.push(`/dashboard/leagues/${league.id}`)
        return
      }

      // Join the league
      const { error: joinError } = await supabase.from("league_members").insert({
        league_id: league.id,
        user_id: user.id,
        current_balance: league.starting_capital,
      })

      if (joinError) throw joinError

      router.push(`/dashboard/leagues/${league.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join league")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Join a League</CardTitle>
          <CardDescription>Enter the invite code to join a private league</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-code">Invite Code</Label>
              <Input
                id="invite-code"
                placeholder="e.g., ABC123XY"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="text-center font-mono text-lg uppercase tracking-wider"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading || !inviteCode}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join League"
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Or{" "}
            <Link href="/leagues" className="text-primary underline underline-offset-4">
              browse public leagues
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
