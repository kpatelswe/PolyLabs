"use client"

import { Button } from "@/components/ui/button"
import { TrendingUp, Trophy, Users } from "@/components/icons"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.55_0.2_250/0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,oklch(0.65_0.18_160/0.08),transparent_50%)]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Now in Beta
          </div>

          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Fantasy Leagues for{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Prediction Markets
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
            Compete with friends on real Polymarket events. Build your portfolio, climb the leaderboard, and prove your
            forecasting skills in a skill-based game that rewards insight.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="gap-2 px-8">
              <Link href="/auth/sign-up">
                Start Competing
                <TrendingUp className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 px-8 bg-transparent">
              <Link href="#how-it-works">Learn More</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 border-t border-border pt-10">
            <div className="flex flex-col items-center">
              <div className="mb-2 flex items-center gap-2 text-2xl font-bold text-foreground md:text-3xl">
                <Trophy className="h-6 w-6 text-primary" />
                100+
              </div>
              <p className="text-sm text-muted-foreground">Active Leagues</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-2 flex items-center gap-2 text-2xl font-bold text-foreground md:text-3xl">
                <Users className="h-6 w-6 text-primary" />
                2,500+
              </div>
              <p className="text-sm text-muted-foreground">Traders</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-2 flex items-center gap-2 text-2xl font-bold text-foreground md:text-3xl">
                <TrendingUp className="h-6 w-6 text-primary" />
                $10M+
              </div>
              <p className="text-sm text-muted-foreground">Virtual Traded</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
