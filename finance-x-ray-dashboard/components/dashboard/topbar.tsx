"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Search, Bell } from "lucide-react"
import { NotificationCenter } from "@/components/dashboard/notification-center"
import { notifications } from "@/lib/data"

export function Topbar({ onOpenCommand }: { onOpenCommand: () => void }) {
  const [notifOpen, setNotifOpen] = useState(false)
  const unread = notifications.filter((n) => n.unread).length

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-4 px-5 lg:px-8">
        <button
          onClick={onOpenCommand}
          className="group flex h-10 flex-1 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-subtle transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)] md:max-w-md"
        >
          <Search className="size-4 transition-colors group-hover:text-muted-foreground" />
          <span className="flex-1 text-left">Search transactions, categories, insights...</span>
          <kbd className="hidden items-center gap-0.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:flex">
            ⌘K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-4">
          <span className="hidden text-sm text-muted-foreground md:block">Fri, Aug 2</span>
          <span className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--positive)] opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-[var(--positive)]" />
            </span>
            Synced just now
          </span>

          <div className="relative">
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative flex size-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-[18px]" />
              {unread > 0 && (
                <span className="absolute right-2 top-2 size-2 rounded-full bg-[var(--accent)] ring-2 ring-[var(--surface)]" />
              )}
            </button>
            <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
          </div>

          <button className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1.5 pl-1.5 pr-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)]">
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="flex size-8 items-center justify-center rounded-lg bg-[var(--accent)] text-xs font-semibold text-[var(--accent-foreground)]"
            >
              AR
            </motion.span>
            <span className="hidden text-left sm:block">
              <span className="block text-[13px] font-medium leading-tight">Alex Rivera</span>
              <span className="block text-[11px] leading-tight text-muted-foreground">Premium</span>
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
