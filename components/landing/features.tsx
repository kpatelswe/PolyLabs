import { Card, CardContent } from "@/components/ui/card"
import { Trophy, BarChart3, Users, Target, Zap, Shield } from "@/components/icons"

const features = [
  {
    icon: Trophy,
    title: "Competitive Leagues",
    description:
      "Create public or private leagues with custom rules. Invite friends, university clubs, or online communities to compete.",
  },
  {
    icon: Target,
    title: "Real Markets",
    description:
      "Trade on actual Polymarket events - politics, sports, crypto, entertainment. Your predictions, real-world outcomes.",
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    description: "Track your win rate, ROI, and trading patterns. Analyze strategies and learn from top performers.",
  },
  {
    icon: Zap,
    title: "Scoring Systems",
    description:
      "Choose from standard, early conviction, or risk-adjusted scoring. Reward bold predictions or consistent accuracy.",
  },
  {
    icon: Users,
    title: "Social Competition",
    description:
      "Live leaderboards, weekly recaps, and achievement badges. See how you stack up against the competition.",
  },
  {
    icon: Shield,
    title: "Risk Controls",
    description:
      "Commissioners set position limits, leverage caps, and market restrictions. Safe, skill-based competition.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Everything You Need to Compete
          </h2>
          <p className="text-lg text-muted-foreground">
            A complete platform for prediction market leagues - from casual games with friends to serious forecasting
            competitions.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg"
            >
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-card-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
