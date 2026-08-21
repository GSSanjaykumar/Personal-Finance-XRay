"use client"

import { useEffect, useRef, useState } from "react"
import { animate, useInView } from "motion/react"
import { useTheme } from "@/components/theme-provider"

type Props = {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
}

export function CountUp({ value, decimals = 0, prefix = "", suffix = "", duration = 1.1, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })
  const { motion: motionOn } = useTheme()
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (!motionOn) {
      setDisplay(value)
      return
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
  }, [inView, value, duration, motionOn])

  const formatted = display.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
