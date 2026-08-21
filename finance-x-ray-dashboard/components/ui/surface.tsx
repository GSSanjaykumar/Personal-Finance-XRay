"use client"

import { motion, type HTMLMotionProps } from "motion/react"
import { cn } from "@/lib/utils"

export function Reveal({
  children,
  delay = 0,
  className,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function Card({
  children,
  className,
  interactive = false,
  ...props
}: HTMLMotionProps<"div"> & { interactive?: boolean }) {
  return (
    <motion.div
      whileHover={interactive ? { y: -2 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]",
        interactive &&
          "cursor-pointer transition-colors duration-200 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-lift)]",
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
