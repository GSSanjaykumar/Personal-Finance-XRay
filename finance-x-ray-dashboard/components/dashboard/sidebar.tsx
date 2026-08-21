"use client"

import { useState } from "react"
import { motion } from "motion/react"
import {
  LayoutDashboard,
  LineChart,
  ArrowLeftRight,
  Tag,
  Sparkles,
  Bot,
  Wallet,
  TrendingUp,
  FileText,
  Settings,
  LogOut,
  Scan,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = { label: string; icon: LucideIcon; badge?: number }

const nav: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Analytics", icon: LineChart },
  { label: "Transactions", icon: ArrowLeftRight },
  { label: "Categories", icon: Tag },
  { label: "AI Insights", icon: Sparkles, badge: 3 },
  { label: "AI Assistant", icon: Bot },
  { label: "Budget", icon: Wallet },
  { label: "Forecast", icon: TrendingUp },
  { label: "Reports", icon: FileText },
  { label: "Settings", icon: Settings },
]

export function Sidebar({ onOpenSettings }: { onOpenSettings: () => void }) {
  const [active, setActive] = useState("Dashboard")

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-[var(--border)] bg-[var(--surface)] px-4 py-6 lg:flex">
      <div className="flex items-center gap-3 px-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_6px_18px_-6px_var(--accent)]">
          <Scan className="size-5" />
        </span>
        <span className="text-[15px] font-semibold tracking-tight">Finance X-Ray</span>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {nav.map((item) => {
          const isActive = active === item.label
          return (
            <button
              key={item.label}
              onClick={() => (item.label === "Settings" ? onOpenSettings() : setActive(item.label))}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl bg-[var(--surface-3)] ring-1 ring-inset ring-[var(--border-strong)]"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              {isActive && (
                <motion.span
                  layoutId="nav-bar"
                  className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--accent)]"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <item.icon
                className={cn(
                  "relative z-10 size-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive && "text-[var(--accent)]",
                )}
              />
              <span className="relative z-10 flex-1 text-left font-medium">{item.label}</span>
              {item.badge && (
                <span className="relative z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-[11px] font-semibold text-[var(--accent-foreground)]">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <button className="group mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-[var(--surface-3)] hover:text-foreground">
        <LogOut className="size-[18px] transition-transform duration-200 group-hover:-translate-x-0.5" />
        <span className="font-medium">Logout</span>
      </button>
    </aside>
  )
}
