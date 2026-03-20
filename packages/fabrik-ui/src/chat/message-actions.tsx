"use client"

import { useCallback, useState } from "react"
import { cn } from "./utils"

export interface MessageActionsProps {
  messageId: string
  text: string
  onFeedback?: (id: string, type: "up" | "down") => void
}

export function MessageActions({
  messageId,
  text,
  onFeedback,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: noop
    }
  }, [text])

  const handleFeedback = useCallback(
    (type: "up" | "down") => {
      const next = feedback === type ? null : type
      setFeedback(next)
      if (next) {
        onFeedback?.(messageId, next)
      }
    },
    [feedback, messageId, onFeedback],
  )

  return (
    <div className="flex items-center gap-0.5">
      {/* Copy button — always subtly visible */}
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-md",
          "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
          "opacity-50 hover:opacity-100 transition-opacity",
          "transition-colors duration-150",
        )}
        aria-label={copied ? "Copied" : "Copy message"}
      >
        {copied ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>

      {/* Feedback buttons — visible on hover */}
      {onFeedback && (
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
          {/* Thumbs up */}
          <button
            type="button"
            onClick={() => handleFeedback("up")}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-md",
              "transition-colors duration-150",
              feedback === "up"
                ? "text-[var(--foreground)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
            )}
            aria-label="Thumbs up"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={feedback === "up" ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 10v12" />
              <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
            </svg>
          </button>

          {/* Thumbs down */}
          <button
            type="button"
            onClick={() => handleFeedback("down")}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-md",
              "transition-colors duration-150",
              feedback === "down"
                ? "text-[var(--foreground)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
            )}
            aria-label="Thumbs down"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={feedback === "down" ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 14V2" />
              <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
