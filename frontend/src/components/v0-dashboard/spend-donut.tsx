import { useState } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { Reveal } from "@/components/v0-ui/surface"
import { spendBreakdown } from "@/v0-lib/data"
import { useToast } from "@/components/v0-ui/toast"
import { cn } from "@/v0-lib/utils"

const shades = [
  "var(--accent)",
  "color-mix(in oklab, var(--accent) 78%, var(--surface))",
  "color-mix(in oklab, var(--accent) 56%, var(--surface))",
  "color-mix(in oklab, var(--accent) 38%, var(--surface))",
  "var(--surface-3)",
]

export function SpendDonut({ data = [] }: { data?: any }) {
  const { toast } = useToast()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const totalSpend = data?.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0) || 0;

  return (
    <Reveal delay={0.1} className="h-full">
      <div className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <div className="relative mx-auto h-[180px] w-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="pct"
                nameKey="name"
                innerRadius={62}
                outerRadius={86}
                paddingAngle={3}
                cornerRadius={5}
                stroke="none"
                animationDuration={1100}
                onMouseEnter={(_, i) => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {data.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={shades[i]}
                    opacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
                    style={{ transition: "opacity 0.2s", cursor: "pointer" }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] font-medium uppercase tracking-wider text-subtle">
              {activeIndex === null || !data[activeIndex] ? "Total spend" : data[activeIndex].name}
            </span>
            <span className="tabular text-2xl font-semibold tracking-tight">
              ₹{(activeIndex === null || !data[activeIndex] ? totalSpend : data[activeIndex].amount).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-1">
          {spendBreakdown.map((s, i) => (
            <button
              key={s.name}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={() =>
                toast({ tone: "info", title: `Filter: ${s.name}`, description: `Showing transactions in ${s.name}.` })
              }
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors duration-200",
                activeIndex === i ? "bg-[var(--surface-2)]" : "hover:bg-[var(--surface-2)]",
              )}
            >
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: shades[i] }} />
              <span className="flex-1 text-sm text-foreground">{s.name}</span>
              <span className="tabular w-10 text-right text-xs text-muted-foreground">{s.pct}%</span>
              <span className="tabular w-16 text-right text-sm font-medium text-foreground">
                ${s.amount.toLocaleString("en-US")}
              </span>
            </button>
          ))}
        </div>
      </div>
    </Reveal>
  )
}
