import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { TrendingUp, Sparkles } from "lucide-react"
import { Reveal } from "@/components/v0-ui/surface"
import { forecast } from "@/v0-lib/data"
import { useToast } from "@/components/v0-ui/toast"

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 shadow-[var(--shadow-lift)]">
      <p className="text-[11px] font-medium uppercase tracking-wider text-subtle">{label}</p>
      <p className="tabular text-sm font-semibold text-foreground">₹{payload[0].value}k</p>
      <p className="text-[11px] text-muted-foreground">projected net worth</p>
    </div>
  )
}

export function Forecast({ data = [] }: { data?: any }) {
  const { toast } = useToast()
  const isEmpty = !data || data.length === 0

  return (
    <Reveal delay={0.1} className="h-full">
      <div className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold">Predictive Forecast</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Projected net worth · next 6 months</p>
          </div>
          {!isEmpty ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ background: "var(--positive-soft)", color: "var(--positive)" }}
            >
              <TrendingUp className="size-3.5" />
              Trend
            </span>
          ) : null}
        </div>

        <div className="mt-5 flex items-baseline gap-2">
          {!isEmpty ? (
            <>
              <span className="tabular text-4xl font-semibold tracking-tight">₹{data[data.length - 1]?.value}k</span>
              <span className="text-sm text-muted-foreground">projected</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Not enough data to generate forecast</span>
          )}
        </div>

        <div className="mt-4 h-[190px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--subtle)", fontSize: 12 }}
                dy={6}
              />
              <YAxis hide domain={["dataMin - 3", "dataMax + 2"]} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border-strong)", strokeDasharray: "4 4" }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--accent)"
                strokeWidth={2.5}
                fill="url(#forecastFill)"
                dot={{ r: 3, fill: "var(--accent)", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "var(--accent)", stroke: "var(--surface)", strokeWidth: 2 }}
                animationDuration={1400}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {!isEmpty ? (
          <button
            onClick={() =>
              toast({
                tone: "info",
                title: "Why this prediction?",
                description: `Based on your recent income stability and savings rate, growth compounds to ₹${data[data.length - 1]?.value}k.`,
              })
            }
            className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-medium text-[var(--accent)] transition-opacity hover:opacity-80"
          >
            <Sparkles className="size-3.5" />
            Why this prediction?
          </button>
        ) : null}
      </div>
    </Reveal>
  )
}
