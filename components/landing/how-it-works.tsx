import { ChevronRight } from "@/components/icons"

const steps = [
  {
    number: "01",
    title: "Create or Join a League",
    description:
      "Start your own league with custom rules or join an existing public league. Invite friends with a simple code.",
  },
  {
    number: "02",
    title: "Get Your Starting Capital",
    description: "Each league begins with virtual capital. Standard is $10,000 - commissioners can customize this.",
  },
  {
    number: "03",
    title: "Trade on Real Markets",
    description:
      "Browse active Polymarket events and build your portfolio. Buy YES or NO shares based on your predictions.",
  },
  {
    number: "04",
    title: "Climb the Leaderboard",
    description: "Track your P&L, win rate, and rank. The best forecasters rise to the top when markets resolve.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-secondary/30 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">How It Works</h2>
          <p className="text-lg text-muted-foreground">
            Get started in minutes. No real money required - just your forecasting skills.
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-[27px] top-8 hidden h-[calc(100%-4rem)] w-0.5 bg-border md:block" />

            <div className="space-y-8">
              {steps.map((step, index) => (
                <div key={step.number} className="relative flex gap-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {step.number}
                  </div>
                  <div className="flex-1 pt-2">
                    <h3 className="mb-2 text-xl font-semibold text-foreground">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="hidden h-6 w-6 self-center text-muted-foreground/50 md:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
