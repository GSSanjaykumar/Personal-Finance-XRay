import { motion } from "framer-motion"
import { RefreshCw } from "lucide-react"
import { Reveal } from "@/components/v0-ui/surface"
import { recurring } from "@/v0-lib/data"
import { useToast } from "@/components/v0-ui/toast"

export function RecurringPayments({ data = recurring }: { data?: any }) {
  const { toast } = useToast()
  const monthly = data.reduce((a, r) => a + r.amount, 0)

  return (
    <Reveal delay={0.1} className="h-full">
      <div className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold">Recurring Payments</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              ₹{monthly.toLocaleString("en-IN", { minimumFractionDigits: 2 })}/mo across {data.length} subscriptions
            </p>
          </div>
          <button
            onClick={() => toast({ tone: "info", title: "Syncing subscriptions", description: "Scanning for new recurring charges." })}
            className="group flex size-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-muted-foreground transition-colors hover:border-[var(--border-strong)] hover:text-foreground"
            aria-label="Sync subscriptions"
          >
            <RefreshCw className="size-4 transition-transform duration-500 group-hover:rotate-180" />
          </button>
        </div>

        <div className="mt-5 flex-1 space-y-1">
          {data.map((r, i) => (
            <motion.button
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              onClick={() => toast({ tone: "info", title: r.name, description: `${r.cadence} · ${r.next}` })}
              className="group flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors duration-200 hover:bg-[var(--surface-2)]"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-3)] text-xs font-semibold text-muted-foreground transition-colors group-hover:bg-[var(--accent-soft)] group-hover:text-[var(--accent)]">
                {r.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">{r.name}</span>
                <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-md bg-[var(--surface-3)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    {r.cadence}
                  </span>
                  {r.next}
                </span>
              </span>
              <span className="tabular text-sm font-semibold">
                ₹{r.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </Reveal>
  )
}
