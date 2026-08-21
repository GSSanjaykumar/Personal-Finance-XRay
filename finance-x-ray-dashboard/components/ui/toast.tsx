"use client"

import { createContext, useContext, useCallback, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "motion/react"
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react"

type ToastTone = "success" | "info" | "warning"
type Toast = { id: number; title: string; description?: string; tone: ToastTone }

const ToastContext = createContext<{ toast: (t: Omit<Toast, "id">) => void } | null>(null)

const toneMap = {
  success: { icon: CheckCircle2, color: "var(--positive)" },
  info: { icon: Info, color: "var(--accent)" },
  warning: { icon: AlertTriangle, color: "var(--warning)" },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { ...t, id }])
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4200)
  }, [])

  const dismiss = (id: number) => setToasts((prev) => prev.filter((x) => x.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2.5">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const { icon: Icon, color } = toneMap[t.tone]
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="pointer-events-auto flex items-start gap-3 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] p-3.5 shadow-[var(--shadow-lift)]"
              >
                <span
                  className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `color-mix(in oklab, ${color} 16%, transparent)`, color }}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t.description}</p>}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-[var(--surface-3)] hover:text-foreground"
                  aria-label="Dismiss notification"
                >
                  <X className="size-3.5" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
