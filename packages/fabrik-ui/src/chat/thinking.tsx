"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import type { ThinkingPart } from "../core/types"
import { cn } from "./utils"

export interface ThinkingProps {
  part: ThinkingPart
}

export function Thinking({ part }: ThinkingProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isStreaming = part.status === "streaming"

  const label = isStreaming
    ? "Thinking..."
    : part.durationMs
      ? `Thought for ${(part.durationMs / 1000).toFixed(1)}s`
      : "Thought for a moment"

  return (
    <div className="py-1">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium",
          "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
          "transition-colors duration-150",
        )}
      >
        {/* Spinner while streaming, chevron when done */}
        {isStreaming ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="animate-spin"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : (
          <motion.svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <polyline points="9 18 15 12 9 6" />
          </motion.svg>
        )}
        <span>{label}</span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && part.text && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "ml-2 mt-1 border-l-2 border-[var(--border)] pl-3",
              )}
            >
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--muted-foreground)]">
                {part.text}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
