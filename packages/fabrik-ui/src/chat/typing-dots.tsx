"use client"

import { motion } from "motion/react"

const dotStyle =
  "h-1.5 w-1.5 rounded-full bg-[var(--muted-foreground)]"

export function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-2" role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={dotStyle}
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}
