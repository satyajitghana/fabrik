"use client"

import { motion } from "motion/react"

export interface PermissionDialogProps {
  title: string
  message: string
  resource: string
  onRespond: (granted: boolean) => void
}

export function PermissionDialog({ title, message, resource, onRespond }: PermissionDialogProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border p-4 my-2"
      style={{ borderColor: "var(--border)", background: "var(--card)" }}
    >
      <div className="flex items-start gap-3">
        <div className="relative mt-0.5 h-8 w-8 rounded-lg overflow-hidden shrink-0">
          <div className="absolute inset-0" style={{ backgroundColor: "var(--primary)", opacity: 0.1 }} />
          <div className="relative flex items-center justify-center h-full">
            <svg className="w-4 h-4" style={{ color: "var(--primary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium">{title}</p>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{message}</p>
          <p className="text-[11px] mt-1 font-mono px-2 py-0.5 rounded inline-block" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>{resource}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onRespond(false)}
              className="rounded-lg border px-3 py-1.5 text-[12px] transition-colors hover:bg-[var(--muted)]"
              style={{ borderColor: "var(--border)" }}
            >
              Deny
            </button>
            <button
              onClick={() => onRespond(true)}
              className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
              style={{ background: "var(--primary)" }}
            >
              Allow
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
