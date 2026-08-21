"use client"

import { useState } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Reveal } from "@/components/ui/surface"
import { incomeExpense } from "@/lib/data"
import { cn } from "@/lib/utils"

const ranges = ["3M", "6M", "1Y", "All"] as const

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 shadow-[var(--shadow-lift)]">
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-subtle">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-xs">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize text-muted-foreground">{p.dataKey}</span>
          <span className="tabular ml-auto font-semibold text-foreground">${p.value}k</span>
        </p>
      ))}
    </div>
  )
}

export function CashflowChart() {
  const [range, setRange] = useState<(typeof ranges)[number]>("1Y")

  return (
    <Reveal className="h-full">
      <div className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="tabular text-3xl font-semibold tracking-tight text-[var(--positive)]">+$33.4k</span>
              <span className="text-sm text-muted-foreground">net · {range}</span>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-full bg-[var(--accent)]" /> Income
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-full bg-[var(--subtle)]" /> Expense
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-1">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-200",
                  range === r ? "bg-[var(--surface-3)] text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 h-[280px] w-full flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={incomeExpense} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--subtle)", fontSize: 12 }}
                dy={8}
              />
              <YAxis hide domain={[0, "dataMax + 3"]} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border-strong)", strokeDasharray: "4 4" }} />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="var(--subtle)"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                fill="transparent"
                dot={false}
                animationDuration={1200}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="var(--accent)"
                strokeWidth={2.5}
                fill="url(#incomeFill)"
                dot={false}
                activeDot={{ r: 5, fill: "var(--accent)", stroke: "var(--surface)", strokeWidth: 2 }}
                animationDuration={1400}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Reveal>
  )
}
