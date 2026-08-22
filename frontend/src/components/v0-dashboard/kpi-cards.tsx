import { motion } from "framer-motion"
import { TrendingUp, PiggyBank, Wallet, HeartPulse, ArrowUpRight } from "lucide-react"
import { CountUp } from "@/components/v0-ui/count-up"
import { Sparkline } from "@/components/v0-ui/sparkline"
import { kpis } from "@/v0-lib/data"
import { useToast } from "@/components/v0-ui/toast"

const icons = {
  "net-worth": TrendingUp,
  "savings-rate": PiggyBank,
  "safe-to-spend": Wallet,
  "health-score": HeartPulse,
} as const

export function KpiCards({ data = kpis }: { data?: any }) {
  const { toast } = useToast()

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {data.map((k: any, i: number) => {
        const Icon = icons[k.id as keyof typeof icons]
        return (
          <motion.button
            key={k.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -3 }}
            onClick={() =>
              toast({ tone: "info", title: k.label, description: "Opening detailed analytics for this metric." })
            }
            className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left shadow-[var(--shadow-card)] transition-colors duration-200 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-lift)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{k.label}</span>
              <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--surface-2)] text-muted-foreground transition-colors duration-200 group-hover:bg-[var(--accent-soft)] group-hover:text-[var(--accent)]">
                <Icon className="size-4" />
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-1">
              <CountUp
                value={k.value}
                prefix={"prefix" in k ? k.prefix : ""}
                suffix={"suffix" in k ? k.suffix : ""}
                className="tabular text-[28px] font-semibold tracking-tight"
              />
            </div>

            <div className="mt-3 flex items-end justify-between">
              <div className="flex items-center gap-1.5 text-xs">
                {"delta" in k && k.delta ? (
                  <span
                    className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium"
                    style={{ background: "var(--positive-soft)", color: "var(--positive)" }}
                  >
                    <ArrowUpRight className="size-3" />
                    {k.delta}
                  </span>
                ) : (
                  <span className="text-muted-foreground">{"note" in k ? k.note : ""}</span>
                )}
              </div>
              <div className="opacity-90 transition-opacity duration-200 group-hover:opacity-100">
                {k.trend?.length > 0 && <Sparkline data={[...k.trend]} />}
              </div>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
