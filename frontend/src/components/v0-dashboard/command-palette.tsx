import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Search,
  ArrowLeftRight,
  Tag,
  FileText,
  TrendingUp,
  Sparkles,
  Settings,
  Upload,
  CornerDownLeft,
  type LucideIcon,
} from "lucide-react"
import { useToast } from "@/components/v0-ui/toast"

type Command = { id: string; label: string; hint: string; group: string; icon: LucideIcon }

const commands: Command[] = [
  { id: "c1", label: "Search transactions", hint: "Find any transaction", group: "Navigate", icon: ArrowLeftRight },
  { id: "c2", label: "View categories", hint: "Spending by category", group: "Navigate", icon: Tag },
  { id: "c3", label: "Open reports", hint: "Monthly summaries", group: "Navigate", icon: FileText },
  { id: "c4", label: "Predictive forecast", hint: "Projected net worth", group: "Navigate", icon: TrendingUp },
  { id: "c5", label: "Ask AI Assistant", hint: "Chat about your finances", group: "AI", icon: Sparkles },
  { id: "c6", label: "Find anomalies", hint: "Unusual spending patterns", group: "AI", icon: Sparkles },
  { id: "c7", label: "Summarize spending", hint: "This month at a glance", group: "AI", icon: Sparkles },
  { id: "c8", label: "Upload statement", hint: "Import a PDF or CSV", group: "Actions", icon: Upload },
  { id: "c9", label: "Open settings", hint: "Theme, currency, layout", group: "Actions", icon: Settings },
]

export function CommandPalette({
  open,
  onOpenChange,
  onOpenSettings,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onOpenSettings: () => void
}) {
  const [query, setQuery] = useState("")
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        onOpenChange(!open)
      }
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  useEffect(() => {
    if (open) {
      setQuery("")
      setIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const filtered = useMemo(
    () => commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()) || c.hint.toLowerCase().includes(query.toLowerCase())),
    [query],
  )

  const run = (c: Command) => {
    onOpenChange(false)
    if (c.id === "c9") {
      onOpenSettings()
      return
    }
    toast({ tone: "info", title: c.label, description: c.hint })
  }

  const groups = useMemo(() => {
    const map = new Map<string, Command[]>()
    filtered.forEach((c) => map.set(c.group, [...(map.get(c.group) ?? []), c]))
    return [...map.entries()]
  }, [filtered])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-2)] shadow-[var(--shadow-lift)]"
          >
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setIndex(0)
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault()
                    setIndex((i) => Math.min(i + 1, filtered.length - 1))
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault()
                    setIndex((i) => Math.max(i - 1, 0))
                  } else if (e.key === "Enter" && filtered[index]) {
                    run(filtered[index])
                  }
                }}
                placeholder="Search transactions, categories, insights..."
                className="h-14 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-subtle"
              />
              <kbd className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                ESC
              </kbd>
            </div>

            <div className="max-h-[340px] overflow-y-auto p-2">
              {filtered.length === 0 && (
                <div className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No results for &ldquo;{query}&rdquo;
                </div>
              )}
              {groups.map(([group, items]) => (
                <div key={group} className="mb-1">
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">{group}</p>
                  {items.map((c) => {
                    const globalIndex = filtered.indexOf(c)
                    const isActive = globalIndex === index
                    return (
                      <button
                        key={c.id}
                        onMouseEnter={() => setIndex(globalIndex)}
                        onClick={() => run(c)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors"
                        style={isActive ? { background: "var(--surface-3)" } : undefined}
                      >
                        <span
                          className="flex size-8 items-center justify-center rounded-lg"
                          style={{
                            background: c.group === "AI" ? "var(--accent-soft)" : "var(--surface)",
                            color: c.group === "AI" ? "var(--accent)" : "var(--muted)",
                          }}
                        >
                          <c.icon className="size-4" />
                        </span>
                        <span className="flex-1">
                          <span className="block text-sm font-medium text-foreground">{c.label}</span>
                          <span className="block text-xs text-muted-foreground">{c.hint}</span>
                        </span>
                        {isActive && <CornerDownLeft className="size-3.5 text-subtle" />}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
