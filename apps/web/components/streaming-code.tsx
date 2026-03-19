"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { motion, useReducedMotion, useInView } from "motion/react"
import { codeToHtml } from "shiki"

interface StreamingCodeProps {
  code: string
  lang?: string
  filename?: string
}

export function StreamingCode({ code, lang = "tsx", filename }: StreamingCodeProps) {
  const reduced = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const inView = useInView(containerRef, { once: true, margin: "-40px" })
  const [fullHtml, setFullHtml] = useState("")
  const [visibleChars, setVisibleChars] = useState(reduced ? code.length : 0)
  const [streamDone, setStreamDone] = useState(reduced ? true : false)
  const [started, setStarted] = useState(false)
  const trimmed = code.trim()

  // Pre-render full syntax highlighting
  useEffect(() => {
    codeToHtml(trimmed, { lang, theme: "vitesse-dark" }).then(setFullHtml)
  }, [trimmed, lang])

  // Start streaming when in view
  useEffect(() => {
    if (inView && !started && !reduced) {
      setStarted(true)
    }
  }, [inView, started, reduced])

  // Character-by-character streaming
  useEffect(() => {
    if (!started || reduced) return
    if (visibleChars >= trimmed.length) {
      setStreamDone(true)
      return
    }

    // Variable speed: faster on whitespace/punctuation, slower on keywords
    const char = trimmed[visibleChars]
    const isNewline = char === "\n"
    const isSpace = char === " "
    const baseSpeed = 18 // ms per char (~55 chars/sec)
    const delay = isNewline ? 80 : isSpace ? 12 : baseSpeed

    const timer = setTimeout(() => {
      setVisibleChars(v => Math.min(v + 1, trimmed.length))
    }, delay)

    return () => clearTimeout(timer)
  }, [started, visibleChars, trimmed, reduced])

  // Build visible code string
  const visibleCode = reduced ? trimmed : trimmed.slice(0, visibleChars)

  return (
    <div ref={containerRef}>
      <div
        role="region"
        aria-label={filename ? `Code: ${filename}` : "Code block"}
        className="rounded-xl overflow-hidden border border-white/10 bg-zinc-950"
      >
        {filename && (
          <div className="flex items-center px-4 py-2.5 border-b border-white/10">
            <span className="text-xs text-white/40 font-mono">{filename}</span>
          </div>
        )}
        <div className="p-5 overflow-x-auto text-[13px] leading-[1.7] relative">
          {fullHtml && streamDone ? (
            // Show fully highlighted code when streaming is done
            <div
              className="[&_pre]:!bg-transparent [&_code]:!bg-transparent"
              dangerouslySetInnerHTML={{ __html: fullHtml }}
            />
          ) : (
            // Show streaming plain text with cursor
            <pre className="!bg-transparent font-mono whitespace-pre">
              <code className="text-white/70">
                {visibleCode}
                {!streamDone && started && (
                  <span className="inline-block w-[2px] h-[1.1em] bg-primary align-text-bottom ml-px animate-[cursor-blink_1s_steps(2)_infinite]" />
                )}
              </code>
            </pre>
          )}
        </div>
      </div>

      {/* Rendered output preview — materializes after code finishes streaming */}
      <motion.div
        initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        animate={streamDone ? { opacity: 1, y: 0 } : {}}
        transition={{ type: "spring", damping: 25, stiffness: 200, delay: 0.3 }}
      >
        <div className="mt-3 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="h-1 w-1 rounded-full bg-success" />
              <span className="text-[11px] text-muted-foreground font-mono">Output</span>
            </div>
            <motion.div
              initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
              animate={streamDone ? { opacity: 1, scale: 1 } : {}}
              transition={{ type: "spring", damping: 30, stiffness: 300, delay: 0.5 }}
            >
              <WeatherPreview />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/** Mini weather card that demonstrates the rendered generative UI output */
function WeatherPreview() {
  return (
    <div className="rounded-lg border border-border bg-card p-3 max-w-[200px]">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">San Francisco</p>
      <div className="flex items-baseline gap-0.5 mt-0.5">
        <span className="text-2xl font-light text-foreground">64</span>
        <span className="text-xs text-muted-foreground">°F</span>
        <span className="ml-auto text-lg">☀️</span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-0.5">Sunny</p>
    </div>
  )
}
