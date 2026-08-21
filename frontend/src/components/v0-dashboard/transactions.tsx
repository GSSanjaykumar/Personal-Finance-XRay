import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import { Reveal } from "@/components/v0-ui/surface"
import { transactions } from "@/v0-lib/data"
import { useToast } from "@/components/v0-ui/toast"

export function Transactions({ data = transactions }: { data?: any }) {
  const { toast } = useToast()

  return (
    <Reveal className="h-full">
      <div className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <h2 className="text-base font-semibold">Recent Transactions</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Across all linked accounts</p>
          </div>
          <button
            onClick={() => toast({ tone: "info", title: "All transactions", description: "Opening full transaction history." })}
            className="text-sm font-medium text-[var(--accent)] transition-opacity hover:opacity-80"
          >
            View all
          </button>
        </div>

        <div className="flex-1 px-3 pb-3">
          {data.map((t, i) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              onClick={() =>
                toast({ tone: "info", title: t.name, description: `${t.category} · ${t.method} · ${t.date}` })
              }
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-200 hover:bg-[var(--surface-2)]"
            >
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105"
                style={{
                  background: t.incoming ? "var(--positive-soft)" : "var(--surface-3)",
                  color: t.incoming ? "var(--positive)" : "var(--muted)",
                }}
              >
                <t.icon className="size-[18px]" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-foreground">{t.name}</span>
                  {t.pending && (
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ background: "var(--warning-soft)", color: "var(--warning)" }}
                    >
                      Pending
                    </span>
                  )}
                </span>
                <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-md bg-[var(--surface-3)] px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {t.category}
                  </span>
                  {t.method}
                </span>
              </span>

              <span className="text-right">
                <span
                  className="tabular block text-sm font-semibold"
                  style={{ color: t.amount > 0 ? "var(--positive)" : "var(--foreground)" }}
                >
                  {t.amount > 0 ? "+" : "-"}₹
                  {Math.abs(t.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{t.date}</span>
              </span>
              <ArrowUpRight className="size-4 -translate-x-1 text-subtle opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
            </motion.button>
          ))}
        </div>
      </div>
    </Reveal>
  )
}
