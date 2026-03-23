"use client"

import { useEffect, useState, useRef } from "react"
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
  const codeRef = useRef<HTMLDivElement>(null)
  const inView = useInView(containerRef, { once: true, margin: "-40px" })
  const [html, setHtml] = useState("")
  const [visibleLines, setVisibleLines] = useState(reduced ? Infinity : 0)
  const [started, setStarted] = useState(false)
  const trimmed = code.trim()
  const totalLines = trimmed.split("\n").length

  // Syntax highlight the full code
  useEffect(() => {
    codeToHtml(trimmed, { lang, theme: "vitesse-dark" }).then(setHtml)
  }, [trimmed, lang])

  // Start revealing when in view
  useEffect(() => {
    if (inView && !started && !reduced) setStarted(true)
  }, [inView, started, reduced])

  // Reveal lines progressively
  useEffect(() => {
    if (!started || reduced || visibleLines >= totalLines) return
    const delay = visibleLines === 0 ? 100 : 120
    const timer = setTimeout(() => setVisibleLines(v => v + 1), delay)
    return () => clearTimeout(timer)
  }, [started, visibleLines, totalLines, reduced])

  // Control line visibility via DOM after Shiki renders
  useEffect(() => {
    if (!codeRef.current || !html) return
    const lines = codeRef.current.querySelectorAll(".line")
    lines.forEach((line, i) => {
      const el = line as HTMLElement
      el.style.transition = "opacity 0.2s ease-out"
      el.style.opacity = reduced || i < visibleLines ? "1" : "0"
    })
  }, [visibleLines, html, reduced])

  const allVisible = reduced || visibleLines >= totalLines

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
        <div className="p-5 overflow-x-auto text-[13px] leading-[1.7]">
          {html ? (
            <div
              ref={codeRef}
              className="[&_pre]:!bg-transparent [&_code]:!bg-transparent"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            // Invisible placeholder to reserve height before Shiki loads
            <pre className="!bg-transparent font-mono whitespace-pre opacity-0 select-none" aria-hidden>
              <code>{trimmed}</code>
            </pre>
          )}
        </div>
      </div>

      {/* Output preview — appears after code is fully revealed */}
      <motion.div
        initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        animate={allVisible ? { opacity: 1, y: 0 } : {}}
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
              animate={allVisible ? { opacity: 1, scale: 1 } : {}}
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
