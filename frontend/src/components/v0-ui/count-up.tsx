import { useEffect, useRef, useState } from "react"
import { animate, useInView } from "framer-motion"
import { useTheme } from "@/components/v0-dashboard/theme-provider"

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

  const isNegative = display < 0;
  const absValue = Math.abs(display);
  const formatted = absValue.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span ref={ref} className={className}>
      {isNegative ? "-" : ""}
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
