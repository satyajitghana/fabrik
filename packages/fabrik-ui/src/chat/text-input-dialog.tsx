"use client"

import { useState } from "react"
import { motion } from "motion/react"

export interface TextInputDialogProps {
  title: string
  message?: string
  placeholder?: string
  onRespond: (text: string) => void
}

export function TextInputDialog({ title, message, placeholder, onRespond }: TextInputDialogProps) {
  const [value, setValue] = useState("")

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border p-4 my-2"
      style={{ borderColor: "var(--border)", background: "var(--card)" }}
    >
      <p className="text-[13px] font-medium">{title}</p>
      {message && <p className="text-[12px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{message}</p>}
      <div className="mt-2.5 flex gap-2">
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && value.trim()) onRespond(value.trim()) }}
          placeholder={placeholder ?? "Type here..."}
          className="flex-1 rounded-lg border px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20"
          style={{ borderColor: "var(--border)", background: "var(--background)" }}
          autoFocus
        />
        <button
          onClick={() => value.trim() && onRespond(value.trim())}
          disabled={!value.trim()}
          className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-[var(--primary-foreground)] disabled:opacity-30 transition-opacity"
          style={{ background: "var(--primary)" }}
        >
          Submit
        </button>
      </div>
    </motion.div>
  )
}
