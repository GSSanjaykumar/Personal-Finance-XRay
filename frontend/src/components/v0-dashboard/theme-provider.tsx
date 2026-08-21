import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type Accent = "midnight" | "green" | "violet"
export type Density = "comfortable" | "compact"

type Prefs = {
  accent: Accent
  density: Density
  motion: boolean
  currency: string
}

type ThemeContextValue = Prefs & {
  setAccent: (a: Accent) => void
  setDensity: (d: Density) => void
  setMotion: (m: boolean) => void
  setCurrency: (c: string) => void
}

const DEFAULTS: Prefs = {
  accent: "midnight",
  density: "comfortable",
  motion: true,
  currency: "USD",
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("fx-prefs")
      if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) })
    } catch {}
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    root.setAttribute("data-accent", prefs.accent)
    root.setAttribute("data-density", prefs.density)
    root.setAttribute("data-motion", prefs.motion ? "on" : "off")
    try {
      localStorage.setItem("fx-prefs", JSON.stringify(prefs))
    } catch {}
  }, [prefs, mounted])

  const value: ThemeContextValue = {
    ...prefs,
    setAccent: (accent) => setPrefs((p) => ({ ...p, accent })),
    setDensity: (density) => setPrefs((p) => ({ ...p, density })),
    setMotion: (motion) => setPrefs((p) => ({ ...p, motion })),
    setCurrency: (currency) => setPrefs((p) => ({ ...p, currency })),
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
