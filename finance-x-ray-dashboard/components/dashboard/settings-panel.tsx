"use client"

import { AnimatePresence, motion } from "motion/react"
import { X, Check } from "lucide-react"
import { useTheme, type Accent, type Density } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const accents: { id: Accent; label: string; swatch: string }[] = [
  { id: "midnight", label: "Midnight Blue", swatch: "#5b7cfa" },
  { id: "emerald", label: "Emerald Wealth", swatch: "#10b981" },
  { id: "royal", label: "Royal AI", swatch: "#7c5cff" },
]

const densities: { id: Density; label: string }[] = [
  { id: "comfortable", label: "Comfortable" },
  { id: "compact", label: "Compact" },
]

const currencies = ["USD", "EUR", "GBP", "JPY"]
const languages = ["English", "Español", "Français", "Deutsch"]

export function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { accent, setAccent, density, setDensity, motion: motionOn, setMotion, currency, setCurrency } = useTheme()

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[85] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 right-0 z-[86] flex w-[400px] max-w-[90vw] flex-col border-l border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--shadow-lift)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div>
                <h2 className="text-base font-semibold">Personalization</h2>
                <p className="text-xs text-muted-foreground">Make Finance X-Ray yours.</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-[var(--surface-3)] hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6">
              <Section title="Accent color" desc="Applied instantly across the dashboard.">
                <div className="grid grid-cols-1 gap-2">
                  {accents.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setAccent(a.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5",
                        accent === a.id
                          ? "border-[var(--accent)] bg-[var(--surface-2)]"
                          : "border-[var(--border)] hover:border-[var(--border-strong)]",
                      )}
                    >
                      <span className="size-6 rounded-full ring-2 ring-white/10" style={{ background: a.swatch }} />
                      <span className="flex-1 text-sm font-medium">{a.label}</span>
                      {accent === a.id && <Check className="size-4 text-[var(--accent)]" />}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Layout density">
                <div className="grid grid-cols-2 gap-2">
                  {densities.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDensity(d.id)}
                      className={cn(
                        "rounded-xl border p-3 text-sm font-medium transition-all duration-200",
                        density === d.id
                          ? "border-[var(--accent)] bg-[var(--surface-2)] text-foreground"
                          : "border-[var(--border)] text-muted-foreground hover:border-[var(--border-strong)]",
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Animations" desc="Reduce motion for a calmer experience.">
                <button
                  onClick={() => setMotion(!motionOn)}
                  className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] p-3"
                >
                  <span className="text-sm font-medium">{motionOn ? "Enabled" : "Reduced"}</span>
                  <span
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors duration-200",
                      motionOn ? "bg-[var(--accent)]" : "bg-[var(--surface-3)]",
                    )}
                  >
                    <motion.span
                      layout
                      className="absolute top-0.5 size-5 rounded-full bg-white shadow"
                      style={{ left: motionOn ? "22px" : "2px" }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </span>
                </button>
              </Section>

              <Section title="Currency">
                <div className="grid grid-cols-4 gap-2">
                  {currencies.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCurrency(c)}
                      className={cn(
                        "rounded-lg border py-2 text-sm font-medium transition-colors",
                        currency === c
                          ? "border-[var(--accent)] bg-[var(--surface-2)] text-foreground"
                          : "border-[var(--border)] text-muted-foreground hover:border-[var(--border-strong)]",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Language">
                <select className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--accent)]">
                  {languages.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </Section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {desc && <p className="mb-3 mt-0.5 text-xs text-muted-foreground">{desc}</p>}
      {!desc && <div className="mb-3" />}
      {children}
    </div>
  )
}
