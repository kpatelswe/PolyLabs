"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Trophy } from "@/components/icons"
import { createLeagueViaAPI } from "@/lib/api"

export default function CreateLeaguePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [startingCapital, setStartingCapital] = useState("10000")
  const [maxPositionSize, setMaxPositionSize] = useState("25")
  const [scoringType, setScoringType] = useState("standard")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("You must be logged in to create a league")
      setIsLoading(false)
      return
    }

    try {
      // Use Python backend API for league creation
      const result = await createLeagueViaAPI({
        name,
        description: description || undefined,
        commissioner_id: user.id,
        is_public: isPublic,
        starting_capital: Number.parseFloat(startingCapital),
        max_position_size: Number.parseFloat(maxPositionSize),
        scoring_type: scoringType,
      })

      router.push(`/dashboard/leagues/${result.league.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create league")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Create a League</h1>
        <p className="text-muted-foreground">Set up your prediction market competition</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                League Details
              </CardTitle>
              <CardDescription>Basic information about your league</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">League Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Election Predictors 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your league and what makes it unique..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <Label>Public League</Label>
                  <p className="text-sm text-muted-foreground">Anyone can discover and join this league</p>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </div>
              {!isPublic && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Private League:</strong> An invite code will be generated after creation. Share it with friends to let them join.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Competition Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Competition Settings</CardTitle>
              <CardDescription>Configure how the competition works</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="capital">Starting Capital ($)</Label>
                  <Input
                    id="capital"
                    type="number"
                    min="1000"
                    max="1000000"
                    value={startingCapital}
                    onChange={(e) => setStartingCapital(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position-size">Max Position Size (%)</Label>
                  <Input
                    id="position-size"
                    type="number"
                    min="5"
                    max="100"
                    value={maxPositionSize}
                    onChange={(e) => setMaxPositionSize(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Scoring Type</Label>
                <Select value={scoringType} onValueChange={setScoringType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard (P&L based)</SelectItem>
                    <SelectItem value="early_conviction">Early Conviction (bonus for early bets)</SelectItem>
                    <SelectItem value="risk_adjusted">Risk Adjusted (Sharpe ratio)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {error && <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" className="bg-transparent" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create League"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

