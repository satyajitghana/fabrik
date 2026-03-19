"use client"

import { motion } from "motion/react"
import type { ConfirmAsk } from "../core/types"
import { cn } from "./utils"

export interface ConfirmDialogProps {
  config: ConfirmAsk
  onRespond: (confirmed: boolean) => void
}

export function ConfirmDialog({ config, onRespond }: ConfirmDialogProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      role="alertdialog"
      aria-modal="true"
      className={cn(
        "w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm",
      )}
    >
      <h3 className="text-sm font-semibold text-[var(--foreground)]">
        {config.title}
      </h3>
      {config.message && (
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
          {config.message}
        </p>
      )}
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onRespond(false)}
          className={cn(
            "rounded-lg px-3.5 py-2 text-sm font-medium",
            "text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
            "transition-colors duration-150",
          )}
        >
          {config.cancelLabel ?? "Cancel"}
        </button>
        <button
          type="button"
          onClick={() => onRespond(true)}
          className={cn(
            "rounded-lg px-3.5 py-2 text-sm font-medium",
            "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90",
            "transition-colors duration-150",
          )}
        >
          {config.confirmLabel ?? "Confirm"}
        </button>
      </div>
    </motion.div>
  )
}
