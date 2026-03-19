"use client"

import { motion } from "motion/react"
import type { StepPart } from "../core/types"
import { cn } from "./utils"

export interface StepListProps {
  steps: StepPart[]
}

export function StepList({ steps }: StepListProps) {
  if (steps.length === 0) return null

  return (
    <div className="space-y-1 py-1">
      {steps.map((step, i) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300, delay: i * 0.06 }}
          className="flex items-center gap-2.5 py-0.5"
        >
          {/* Status icon */}
          <span className="flex h-4 w-4 shrink-0 items-center justify-center">
            {step.stepStatus === "running" && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className={cn(
                  "animate-spin text-[var(--muted-foreground)]",
                )}
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            )}
            {step.stepStatus === "done" && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--success,#10b981)]"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {step.stepStatus === "failed" && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--destructive)]"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
          </span>

          {/* Title */}
          <span
            className={cn(
              "text-xs font-medium",
              step.stepStatus === "running"
                ? "text-[var(--muted-foreground)]"
                : step.stepStatus === "done"
                  ? "text-[var(--muted-foreground)]"
                  : "text-[var(--destructive)]",
            )}
          >
            {step.title}
          </span>

          {/* Duration */}
          {step.durationMs != null && step.stepStatus !== "running" && (
            <span className="text-[10px] tabular-nums text-[var(--muted-foreground)]">
              {(step.durationMs / 1000).toFixed(1)}s
            </span>
          )}
        </motion.div>
      ))}
    </div>
  )
}
