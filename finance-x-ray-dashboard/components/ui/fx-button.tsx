"use client"

import { forwardRef, type ButtonHTMLAttributes } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Variant = "primary" | "secondary" | "ghost" | "outline"
type Size = "sm" | "md" | "lg" | "icon"

interface FxButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const base =
  "relative inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-medium outline-none transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]"

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_6px_20px_-8px_var(--accent)] hover:bg-[var(--accent-hover)] hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-8px_var(--accent)]",
  secondary:
    "bg-[var(--surface-3)] text-foreground border border-[var(--border-strong)] hover:-translate-y-0.5 hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)]",
  outline:
    "border border-[var(--border-strong)] text-foreground hover:-translate-y-0.5 hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)]",
  ghost: "text-muted-foreground hover:bg-[var(--surface-3)] hover:text-foreground",
}

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4",
  lg: "h-11 px-5",
  icon: "size-10",
}

export const FxButton = forwardRef<HTMLButtonElement, FxButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {children}
      </button>
    )
  },
)
FxButton.displayName = "FxButton"
