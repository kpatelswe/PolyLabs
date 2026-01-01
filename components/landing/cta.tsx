import { Button } from "@/components/ui/button"
import { TrendingUp } from "@/components/icons"
import Link from "next/link"

export function CTA() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-16 text-center md:px-16">
          {/* Background pattern */}
          <div className="absolute inset-0 -z-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,white,transparent_50%)]" />
          </div>

          <div className="relative z-10">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-primary-foreground md:text-4xl">
              Ready to Prove Your Forecasting Skills?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-foreground/80">
              Join thousands of traders competing in prediction market leagues. Free to play, skill-based, and more fun
              than trading alone.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" variant="secondary" className="gap-2 px-8">
                <Link href="/auth/sign-up">
                  Create Free Account
                  <TrendingUp className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link href="/leagues">Browse Public Leagues</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
