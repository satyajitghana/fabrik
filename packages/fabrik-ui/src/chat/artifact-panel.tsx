"use client"

import { useCallback, useEffect, useState, type SyntheticEvent } from "react"
import type { ArtifactPart } from "../core/types"
import { cn } from "./utils"

// ---------------------------------------------------------------------------
// Defense-in-depth: strip dangerous HTML from Shiki output
// ---------------------------------------------------------------------------

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, "")
    .replace(/\bon\w+\s*=/gi, "data-blocked=")
    .replace(/javascript:/gi, "blocked:")
}

// ---------------------------------------------------------------------------
// Lightweight syntax highlighter — wraps common tokens in colored spans
// so code artifacts get basic coloring without pulling in Shiki / Prism.
// ---------------------------------------------------------------------------

// Shiki-based syntax highlighting with lazy loading
import { codeToHtml } from "shiki"

function useHighlightedCode(code: string, language: string) {
  const [html, setHtml] = useState("")
  useEffect(() => {
    if (!code) return
    const lang = language.toLowerCase()
    // Map common language names to Shiki language IDs
    const langMap: Record<string, string> = {
      typescript: "typescript", ts: "typescript", tsx: "tsx",
      javascript: "javascript", js: "javascript", jsx: "jsx",
      python: "python", py: "python",
      html: "html", css: "css", json: "json",
      bash: "bash", sh: "bash", shell: "bash",
      rust: "rust", go: "go", java: "java", c: "c", cpp: "cpp",
      sql: "sql", yaml: "yaml", toml: "toml", markdown: "markdown",
    }
    const shikiLang = langMap[lang] ?? "text"
    codeToHtml(code, { lang: shikiLang, theme: "vitesse-dark" })
      .then(setHtml)
      .catch(() => {
        // Fallback: plain escaped text
        setHtml(`<pre>${code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`)
      })
  }, [code, language])
  return html
}

// ---------------------------------------------------------------------------
// <ArtifactPanel> — renders an artifact as an inline expandable block
// ---------------------------------------------------------------------------

export interface ArtifactPanelProps {
  artifact: ArtifactPart
  onClose?: () => void
}

export function ArtifactPanel({ artifact, onClose }: ArtifactPanelProps) {
  const [copied, setCopied] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(artifact.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: noop
    }
  }, [artifact.content])

  const handleIframeLoad = useCallback((e: SyntheticEvent<HTMLIFrameElement>) => {
    const iframe = e.currentTarget
    try {
      const body = iframe.contentDocument?.body
      if (body) {
        iframe.style.height = `${Math.max(80, Math.min(body.scrollHeight + 16, 600))}px`
      }
    } catch {
      // Sandboxed iframe may throw cross-origin error
    }
  }, [])

  const isStreaming = artifact.status === "streaming"

  return (
    <>
    {isMaximized && <div className="fixed inset-0 z-[9998] bg-black/40" onClick={() => setIsMaximized(false)} />}
    <div
      className={cn(
        "my-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]",
        "shadow-sm",
        isMaximized && "fixed inset-4 z-[9999] my-0 rounded-2xl shadow-2xl flex flex-col",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Artifact icon */}
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--muted)]">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[var(--muted-foreground)]"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <span className="truncate text-[13px] font-medium text-[var(--foreground)]">
            {artifact.title}
          </span>
          {isStreaming && (
            <span className="shrink-0 text-[11px] text-[var(--muted-foreground)]">
              Generating...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Language badge */}
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[11px] font-mono font-medium",
              "bg-[var(--muted)] text-[var(--muted-foreground)]",
            )}
          >
            {artifact.language.toUpperCase()}
          </span>
          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-md",
              "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
              "transition-colors duration-150",
            )}
            aria-label={copied ? "Copied" : "Copy content"}
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
          {/* Maximize button */}
          <button
            type="button"
            onClick={() => setIsMaximized(!isMaximized)}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-md",
              "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
              "transition-colors duration-150",
            )}
            aria-label={isMaximized ? "Exit full screen" : "Full screen"}
          >
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
              {isMaximized ? (
                <>
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </>
              ) : (
                <>
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </>
              )}
            </svg>
          </button>
          {/* Close button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-md",
                "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
                "transition-colors duration-150",
              )}
              aria-label="Close artifact"
            >
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={cn("relative", isMaximized && "flex-1 overflow-auto")}>
        {artifact.language === "html" ? (
          <iframe
            srcDoc={artifact.content}
            sandbox=""
            referrerPolicy="no-referrer"
            className={cn("w-full border-0 bg-white", isMaximized && "h-full")}
            style={isMaximized ? { minHeight: 80 } : { minHeight: 80, height: 120 }}
            title={artifact.title}
            onLoad={isMaximized ? undefined : handleIframeLoad}
          />
        ) : artifact.language === "markdown" ? (
          <div
            className={cn(
              "prose prose-sm max-w-none p-4",
              "text-[var(--foreground)]",
            )}
          >
            <MarkdownContent content={artifact.content} />
          </div>
        ) : (
          <ArtifactCodeBlock code={artifact.content} language={artifact.language} isMaximized={isMaximized} />
        )}

        {/* Streaming overlay */}
        {isStreaming && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--card)] to-transparent" />
        )}
      </div>
    </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Shiki-highlighted code block
// ---------------------------------------------------------------------------

function ArtifactCodeBlock({ code, language, isMaximized }: { code: string; language: string; isMaximized: boolean }) {
  const html = useHighlightedCode(code, language)
  return (
    <div className={cn("overflow-auto bg-zinc-950", isMaximized ? "flex-1" : "max-h-[400px]")}>
      {html ? (
        <div
          className="p-4 text-[13px] leading-relaxed [&_pre]:!bg-transparent [&_code]:!bg-transparent [&_pre]:whitespace-pre-wrap [&_pre]:break-words"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
        />
      ) : (
        <pre className="p-4 text-[13px] leading-relaxed whitespace-pre-wrap break-words text-white/70 font-mono">
          {code}
        </pre>
      )}
    </div>
  )
}

// Simple markdown renderer for artifact content
// ---------------------------------------------------------------------------

function MarkdownContent({ content }: { content: string }) {
  // Basic markdown: render as whitespace-preserving text
  // The full renderMarkdown from the Message component handles inline formatting
  // For artifact preview, we keep it simple
  return <div className="whitespace-pre-wrap text-sm">{content}</div>
}
