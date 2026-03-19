"use client"

import { motion } from "motion/react"
import { cn } from "./utils"

export interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className, lines = 3 }: SkeletonProps) {
  return (
    <motion.div
      className={cn("space-y-2.5 py-1", className)}
      role="status"
      aria-label="Loading message"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            "h-3.5 rounded-md bg-[var(--border)]",
            i === lines - 1 ? "w-3/5" : i === 0 ? "w-4/5" : "w-full",
          )}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.div>
  )
}
