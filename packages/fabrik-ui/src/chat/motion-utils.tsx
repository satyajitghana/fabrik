"use client"

import { motion, useReducedMotion, useInView, AnimatePresence } from "motion/react"
import { useRef, type ReactNode } from "react"

// Spring presets
export const springs = {
  snappy: { type: "spring" as const, damping: 30, stiffness: 300 },
  gentle: { type: "spring" as const, damping: 25, stiffness: 200 },
  bouncy: { type: "spring" as const, damping: 15, stiffness: 200 },
} as const

/** Fade + slide up on mount. Reduced-motion aware. */
export function FadeIn({
  children,
  delay = 0,
  y = 12,
  className,
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.gentle, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Fade in when scrolled into view. Triggers once. */
export function ScrollReveal({
  children,
  delay = 0,
  y = 20,
  className,
  margin = "-60px",
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  margin?: string
}) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line -- Motion's MarginType is overly strict; runtime values are valid CSS margin strings
  const inView = useInView(ref, { once: true, margin: margin as `-60px` })

  return (
    <motion.div
      ref={ref}
      initial={reduced ? false : { opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ ...springs.gentle, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Animate a message appearing in a chat list — slide up with spring */
export function MessageEntrance({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={springs.snappy}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Scale up on mount — good for panels, cards, dialogs */
export function ScaleIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ ...springs.snappy, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export { motion, useReducedMotion, useInView, AnimatePresence }
