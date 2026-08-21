import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, AlertTriangle, Sparkles, CreditCard, Check } from "lucide-react"
import { notifications as seed, type Notification } from "@/v0-lib/data"

const toneStyles: Record<Notification["tone"], { icon: typeof CheckCircle2; color: string }> = {
  positive: { icon: CheckCircle2, color: "var(--positive)" },
  warning: { icon: AlertTriangle, color: "var(--warning)" },
  info: { icon: Sparkles, color: "var(--accent)" },
  negative: { icon: CreditCard, color: "var(--negative)" },
}

export function NotificationCenter({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items, setItems] = useState(seed)
  const unread = items.filter((i) => i.unread).length

  const markAll = () => setItems((prev) => prev.map((i) => ({ ...i, unread: false })))
  const markOne = (id: string) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, unread: false } : i)))

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-[70]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed right-4 top-[64px] z-[80] w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-2)] shadow-[var(--shadow-lift)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Notifications</h3>
                {unread > 0 && (
                  <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
                    {unread} new
                  </span>
                )}
              </div>
              <button
                onClick={markAll}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Check className="size-3.5" /> Mark all read
              </button>
            </div>
            <div className="max-h-[420px] overflow-y-auto p-2">
              {items.map((n, i) => {
                const { icon: Icon, color } = toneStyles[n.tone]
                return (
                  <motion.button
                    key={n.id}
                    onClick={() => markOne(n.id)}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-[var(--surface-3)]"
                  >
                    <span
                      className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `color-mix(in oklab, ${color} 15%, transparent)`, color }}
                    >
                      <Icon className="size-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">{n.title}</span>
                        {n.unread && <span className="size-1.5 shrink-0 rounded-full bg-[var(--accent)]" />}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{n.body}</span>
                      <span className="mt-1 block text-[11px] text-subtle">{n.time}</span>
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
