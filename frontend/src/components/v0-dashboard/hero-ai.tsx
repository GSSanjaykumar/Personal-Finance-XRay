import { useState } from "react"
import { motion } from "framer-motion"
import { Sparkles, Gauge, ShieldCheck, Target, ArrowUpRight, Check } from "lucide-react"
import { Reveal } from "@/components/v0-ui/surface"
import { FxButton } from "@/components/v0-ui/fx-button"
import { useToast } from "@/components/v0-ui/toast"

// Mock stats removed as we now use dynamic insights

export function HeroAI({ insights = [], totalSavings = 0, totalExpense = 0 }) {
  const { toast } = useToast()
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)

  const apply = () => {
    if (applied) return
    setApplying(true)
    setTimeout(() => {
      setApplying(false)
      setApplied(true)
      toast({
        tone: "success",
        title: "Recommendation applied",
        description: "We adjusted your dining budget and paused 2 subscriptions. Your insights have been applied.",
      })
    }, 1400)
  }

  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        {/* subtle accent glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
        />
        <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />

        <div className="relative grid gap-8 p-6 lg:grid-cols-[1fr_320px] lg:p-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)]">
              <Sparkles className="size-3.5" />
              AI Financial Intelligence
            </span>

            <h1 className="mt-5 text-pretty text-3xl font-semibold leading-[1.15] tracking-tight lg:text-[2.6rem]">
              {insights.length > 0 ? insights[0].title : "Your financial overview is ready"}
            </h1>

            <p className="mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground">
              {insights.length > 0 ? insights[0].description : "Finance X-Ray analyzed your recent transactions. You're on track."}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <FxButton onClick={apply} loading={applying} className="group">
                {applied ? (
                  <>
                    <Check className="size-4" /> Applied
                  </>
                ) : (
                  <>
                    Apply recommendation
                    <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </>
                )}
              </FxButton>
              <FxButton
                variant="secondary"
                onClick={() => toast({ tone: "info", title: "AI Assistant", description: "Ask anything about your finances." })}
              >
                <Sparkles className="size-4 text-[var(--accent)]" />
                Ask AI Assistant
              </FxButton>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {insights.slice(1, 4).map((insight, i) => (
              <motion.div
                key={`insight-${i}`}
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -2 }}
                className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 transition-colors hover:border-[var(--border-strong)]"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex-shrink-0">
                  <Sparkles className="size-5" />
                </span>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-subtle">{insight.title}</p>
                  <p className="text-sm font-medium leading-tight mt-1">{insight.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Reveal>
  )
}
