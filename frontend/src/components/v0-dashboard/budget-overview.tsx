import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { Reveal } from "@/components/v0-ui/surface"
import { budgets } from "@/v0-lib/data"
import { useToast } from "@/components/v0-ui/toast"

const statusMap = {
  over: { label: "Over", color: "var(--negative)", soft: "var(--negative-soft)" },
  watch: { label: "Watch", color: "var(--warning)", soft: "var(--warning-soft)" },
  ontrack: { label: "On track", color: "var(--positive)", soft: "var(--positive-soft)" },
}

export function BudgetOverview({ data = budgets }: { data?: any }) {
  const { toast } = useToast()
  const totalUsed = data.reduce((a, b) => a + b.used, 0)
  const totalBudget = 7700
  const remaining = totalBudget - totalUsed

  return (
    <Reveal className="h-full">
      <div className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold">Budget Overview</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              ${totalUsed.toLocaleString("en-US")} of ${totalBudget.toLocaleString("en-US")} used
            </p>
          </div>
          <div className="text-right">
            <p className="tabular text-2xl font-semibold tracking-tight">${remaining.toLocaleString("en-US")}</p>
            <p className="text-xs text-muted-foreground">remaining</p>
          </div>
        </div>

        <div className="mt-6 flex-1 space-y-5">
          {data.map((b, i) => {
            const pct = Math.min((b.used / b.total) * 100, 100)
            const s = statusMap[b.status]
            return (
              <div key={b.name}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{b.name}</span>
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ background: s.soft, color: s.color }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <span className="tabular text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">${b.used.toLocaleString("en-US")}</span> / $
                    {b.total.toLocaleString("en-US")}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-3)]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: s.color }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <button
          onClick={() =>
            toast({
              tone: "info",
              title: "AI budget optimizer",
              description: "Reallocating $240 from Dining to Savings keeps every category on track.",
            })
          }
          className="mt-6 inline-flex items-center gap-1.5 self-start text-sm font-medium text-[var(--accent)] transition-opacity hover:opacity-80"
        >
          <Sparkles className="size-3.5" />
          Improve budget with AI
        </button>
      </div>
    </Reveal>
  )
}
