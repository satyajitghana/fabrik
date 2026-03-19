"use client"

import { useState, useCallback } from "react"
import { motion } from "motion/react"
import type { ChoiceAsk, MultiChoiceAsk } from "../core/types"
import { cn } from "./utils"

export interface ChoicePickerProps {
  config: ChoiceAsk | MultiChoiceAsk
  onRespond: (value: unknown) => void
}

export function ChoicePicker({ config, onRespond }: ChoicePickerProps) {
  if (config.type === "choice") {
    return <SingleChoice config={config} onRespond={onRespond} />
  }
  return <MultiChoice config={config} onRespond={onRespond} />
}

// ---------------------------------------------------------------------------
// Single Choice — pill buttons
// ---------------------------------------------------------------------------

function SingleChoice({
  config,
  onRespond,
}: {
  config: ChoiceAsk
  onRespond: (value: unknown) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="w-full max-w-md"
    >
      <h3 className="text-sm font-semibold text-[var(--foreground)]">
        {config.title}
      </h3>
      {config.message && (
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {config.message}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {config.options.map((opt) => (
          <motion.button
            key={opt.value}
            type="button"
            onClick={() => onRespond(opt.value)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "rounded-full border border-[var(--border)] px-4 py-1.5 text-sm font-medium",
              "text-[var(--foreground)] hover:bg-[var(--muted)]",
              "transition-colors duration-150",
            )}
          >
            {opt.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Multi Choice — checkbox cards with selection state
// ---------------------------------------------------------------------------

function MultiChoice({
  config,
  onRespond,
}: {
  config: MultiChoiceAsk
  onRespond: (value: unknown) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = useCallback((value: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      return next
    })
  }, [])

  const canSubmit =
    selected.size >= (config.min ?? 0) &&
    (config.max == null || selected.size <= config.max)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="w-full max-w-md"
    >
      <h3 className="text-sm font-semibold text-[var(--foreground)]">
        {config.title}
      </h3>
      {config.message && (
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {config.message}
        </p>
      )}
      <div className="mt-3 space-y-2">
        {config.options.map((opt) => {
          const isSelected = selected.has(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all duration-150",
                isSelected
                  ? "border-[var(--primary)] bg-[var(--muted)]"
                  : "border-[var(--border)] hover:border-[var(--muted-foreground)]",
              )}
            >
              {/* Checkbox indicator */}
              <span
                className={cn(
                  "mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors duration-150",
                  isSelected
                    ? "border-[var(--primary)] bg-[var(--primary)]"
                    : "border-[var(--muted-foreground)]",
                )}
              >
                {isSelected && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="stroke-[var(--primary-foreground)]"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              <div>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {opt.label}
                </span>
                {opt.description && (
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                    {opt.description}
                  </p>
                )}
              </div>
            </button>
          )
        })}
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => onRespond(Array.from(selected))}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150",
            canSubmit
              ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
              : "cursor-not-allowed bg-[var(--border)] text-[var(--muted-foreground)]",
          )}
        >
          Continue
        </button>
      </div>
    </motion.div>
  )
}
