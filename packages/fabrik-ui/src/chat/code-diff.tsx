"use client"

import { useState, useCallback, useMemo, type CSSProperties } from "react"
import { motion } from "motion/react"
import { cn } from "./utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DiffLineType = "unchanged" | "added" | "removed"

interface DiffLine {
  type: DiffLineType
  content: string
  oldLine?: number
  newLine?: number
}

export interface CodeDiffProps {
  filename: string
  language?: string
  original: string
  modified: string
  onAccept?: () => void
  onReject?: () => void
  status?: "pending" | "accepted" | "rejected"
  className?: string
}

// ---------------------------------------------------------------------------
// LCS-based diff algorithm
// ---------------------------------------------------------------------------

function computeDiff(originalLines: string[], modifiedLines: string[]): DiffLine[] {
  const m = originalLines.length
  const n = modifiedLines.length

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  )

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] = originalLines[i - 1] === modifiedLines[j - 1]
        ? (dp[i - 1]![j - 1] ?? 0) + 1
        : Math.max(dp[i - 1]![j] ?? 0, dp[i]![j - 1] ?? 0)
    }
  }

  // Backtrack to produce diff
  const result: DiffLine[] = []
  let i = m
  let j = n

  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      originalLines[i - 1] === modifiedLines[j - 1]
    ) {
      result.unshift({
        type: "unchanged",
        content: originalLines[i - 1]!,
        oldLine: i,
        newLine: j,
      })
      i--
      j--
    } else if (j > 0 && (i === 0 || (dp[i]![j - 1] ?? 0) >= (dp[i - 1]![j] ?? 0))) {
      result.unshift({
        type: "added",
        content: modifiedLines[j - 1]!,
        newLine: j,
      })
      j--
    } else {
      result.unshift({
        type: "removed",
        content: originalLines[i - 1]!,
        oldLine: i,
      })
      i--
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Inline SVG icons — no external dependency
// ---------------------------------------------------------------------------

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// <CodeDiff> component
// ---------------------------------------------------------------------------

export function CodeDiff({
  filename,
  language,
  original,
  modified,
  onAccept,
  onReject,
  status = "pending",
  className,
}: CodeDiffProps) {
  const [localStatus, setLocalStatus] = useState(status)

  // Recompute when status prop changes
  const effectiveStatus = status !== "pending" ? status : localStatus

  const diffLines = useMemo(() => {
    const origLines = original.split("\n")
    const modLines = modified.split("\n")
    return computeDiff(origLines, modLines)
  }, [original, modified])

  const stats = useMemo(() => {
    let added = 0
    let removed = 0
    for (const line of diffLines) {
      if (line.type === "added") added++
      if (line.type === "removed") removed++
    }
    return { added, removed }
  }, [diffLines])

  const handleAccept = useCallback(() => {
    setLocalStatus("accepted")
    onAccept?.()
  }, [onAccept])

  const handleReject = useCallback(() => {
    setLocalStatus("rejected")
    onReject?.()
  }, [onReject])

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "my-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--muted)]">
            <FileIcon className="text-[var(--muted-foreground)]" />
          </div>
          <span className="truncate text-[13px] font-medium font-mono text-[var(--foreground)]">
            {filename}
          </span>
          {language && (
            <span
              className={cn(
                "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-mono font-medium",
                "bg-[var(--muted)] text-[var(--muted-foreground)]",
              )}
            >
              {language}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Diff stats */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono tabular-nums">
            {stats.added > 0 && (
              <span className="text-[color:var(--success,#10b981)] font-semibold">
                +{stats.added}
              </span>
            )}
            {stats.removed > 0 && (
              <span className="text-[var(--destructive)] font-semibold">
                -{stats.removed}
              </span>
            )}
          </div>

          {/* Action buttons / status badge */}
          {effectiveStatus === "pending" ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleAccept}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium",
                  "bg-[var(--primary)] text-[var(--primary-foreground)]",
                  "hover:opacity-90 transition-opacity duration-150",
                )}
                aria-label="Accept changes"
              >
                <CheckIcon className="w-3 h-3" />
                Accept
              </button>
              <button
                type="button"
                onClick={handleReject}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium",
                  "border border-[var(--border)] text-[var(--muted-foreground)]",
                  "hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors duration-150",
                )}
                aria-label="Reject changes"
              >
                <XIcon className="w-3 h-3" />
                Reject
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
            >
              {effectiveStatus === "accepted" ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-medium",
                    "text-[color:var(--success,#10b981)]",
                  )}
                  style={{
                    background:
                      "color-mix(in oklch, var(--success, #10b981) 12%, transparent)",
                  }}
                >
                  <CheckIcon className="w-3 h-3" />
                  Accepted
                </span>
              ) : (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-medium",
                    "text-[var(--destructive)]",
                  )}
                  style={{
                    background:
                      "color-mix(in oklch, var(--destructive) 12%, transparent)",
                  }}
                >
                  <XIcon className="w-3 h-3" />
                  Rejected
                </span>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Diff body */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-[13px] leading-[1.6]">
          <tbody>
            {diffLines.map((line, idx) => (
              <DiffRow key={idx} line={line} />
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Single diff row
// ---------------------------------------------------------------------------

function DiffRow({ line }: { line: DiffLine }) {
  const bgStyle = useMemo((): CSSProperties | undefined => {
    if (line.type === "removed") {
      return {
        background:
          "color-mix(in oklch, var(--destructive) 8%, transparent)",
      }
    }
    if (line.type === "added") {
      return {
        background:
          "color-mix(in oklch, var(--success, #10b981) 8%, transparent)",
      }
    }
    return undefined
  }, [line.type])

  const prefixColor =
    line.type === "removed"
      ? "text-[var(--destructive)]"
      : line.type === "added"
        ? "text-[color:var(--success,#10b981)]"
        : "text-transparent"

  const prefix =
    line.type === "removed" ? "-" : line.type === "added" ? "+" : " "

  return (
    <tr style={bgStyle}>
      {/* Old line number */}
      <td className="select-none w-[1%] whitespace-nowrap px-3 py-0 text-right text-[11px] text-[var(--muted-foreground)] opacity-50 align-top">
        {line.oldLine ?? ""}
      </td>
      {/* New line number */}
      <td className="select-none w-[1%] whitespace-nowrap pr-3 py-0 text-right text-[11px] text-[var(--muted-foreground)] opacity-50 align-top">
        {line.newLine ?? ""}
      </td>
      {/* Prefix character */}
      <td
        className={cn(
          "select-none w-[1%] whitespace-nowrap px-1 py-0 font-bold align-top",
          prefixColor,
        )}
      >
        {prefix}
      </td>
      {/* Line content */}
      <td className="whitespace-pre py-0 pr-4 text-[var(--foreground)]">
        {line.content}
      </td>
    </tr>
  )
}
