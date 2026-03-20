"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, useInView, useReducedMotion, AnimatePresence } from "motion/react"
import { PiFeatherDuotone } from "react-icons/pi"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DemoItemType =
  | "user"
  | "assistant-text"
  | "step"
  | "component"
  | "skeleton"
  | "typing"
  | "elicitation"

interface DemoItem {
  type: DemoItemType
  content?: string
  stepStatus?: "running" | "done"
  stepDuration?: string
  componentType?: "weather" | "chart" | "stats"
  options?: string[]
}

interface ScriptEntry {
  delay: number
  item: DemoItem
}

// ---------------------------------------------------------------------------
// Demo script (~20 seconds total)
// ---------------------------------------------------------------------------

const DEMO_SCRIPT: ScriptEntry[] = [
  // --- Weather flow ---
  { delay: 0, item: { type: "user", content: "Show me the weather in San Francisco" } },
  { delay: 1500, item: { type: "typing" } },
  { delay: 2000, item: { type: "step", content: "Connecting to Open-Meteo API\u2026", stepStatus: "running" } },
  { delay: 2800, item: { type: "step", content: "Connecting to Open-Meteo API\u2026", stepStatus: "done", stepDuration: "0.4s" } },
  { delay: 3200, item: { type: "step", content: "Fetching weather data\u2026", stepStatus: "running" } },
  { delay: 3800, item: { type: "step", content: "Fetching weather data\u2026", stepStatus: "done", stepDuration: "0.6s" } },
  { delay: 4200, item: { type: "assistant-text", content: "Here\u2019s the live weather for San Francisco!" } },
  { delay: 5000, item: { type: "skeleton" } },
  { delay: 5500, item: { type: "component", componentType: "weather" } },

  // --- Chart flow ---
  { delay: 7000, item: { type: "user", content: "Revenue chart" } },
  { delay: 8200, item: { type: "step", content: "Querying database\u2026", stepStatus: "running" } },
  { delay: 8800, item: { type: "step", content: "Querying database\u2026", stepStatus: "done", stepDuration: "0.3s" } },
  { delay: 9500, item: { type: "assistant-text", content: "Here\u2019s the quarterly revenue data:" } },
  { delay: 10000, item: { type: "skeleton" } },
  { delay: 10500, item: { type: "component", componentType: "chart" } },

  // --- Dashboard flow ---
  { delay: 12000, item: { type: "user", content: "Dashboard stats" } },
  { delay: 13200, item: { type: "step", content: "Aggregating metrics\u2026", stepStatus: "running" } },
  { delay: 13800, item: { type: "step", content: "Aggregating metrics\u2026", stepStatus: "done", stepDuration: "0.5s" } },
  { delay: 14000, item: { type: "assistant-text", content: "Here are your dashboard stats:" } },
  { delay: 14800, item: { type: "skeleton" } },
  { delay: 15300, item: { type: "component", componentType: "stats" } },

  // --- Elicitation ---
  { delay: 16000, item: { type: "elicitation", content: "Would you like a detailed breakdown?", options: ["Yes", "No"] } },
]

const TOTAL_DURATION = 18000
const RESTART_PAUSE = 3000

// ---------------------------------------------------------------------------
// Spring configs (matching page.tsx)
// ---------------------------------------------------------------------------

const spring = { type: "spring" as const, damping: 30, stiffness: 300 }
const gentleSpring = { type: "spring" as const, damping: 25, stiffness: 200 }

// ---------------------------------------------------------------------------
// Mini demo components (inline, no external deps)
// ---------------------------------------------------------------------------

function DemoWeatherCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 max-w-[280px] shadow-sm">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
        San Francisco
      </p>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-[40px] font-light tabular-nums">64</span>
        <span className="text-sm text-muted-foreground">&deg;F</span>
        <span className="ml-auto text-2xl" aria-hidden="true">
          &#9728;&#65039;
        </span>
      </div>
      <p className="text-xs text-muted-foreground">Sunny</p>
      <div className="flex gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
        <span>
          <span aria-hidden="true">&#128167;</span> 45%
        </span>
        <span>
          <span aria-hidden="true">&#128168;</span> 6.6 mph
        </span>
      </div>
    </div>
  )
}

function DemoBarChart() {
  const bars = [
    { label: "Q1", value: 65, color: "var(--chart-1, #0d9488)" },
    { label: "Q2", value: 75, color: "var(--chart-2, #6366f1)" },
    { label: "Q3", value: 85, color: "var(--chart-3, #f59e0b)" },
    { label: "Q4", value: 95, color: "var(--chart-4, #ef4444)" },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-sm font-semibold mb-3">Quarterly Revenue</p>
      <div className="space-y-2">
        {bars.map((b) => (
          <div key={b.label} className="flex items-center gap-2 text-xs">
            <span className="w-6 text-muted-foreground text-right tabular-nums">{b.label}</span>
            <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
              <motion.div
                className="h-full rounded"
                style={{ background: b.color }}
                initial={{ width: 0 }}
                animate={{ width: `${b.value}%` }}
                transition={{ ...gentleSpring, delay: 0.1 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DemoStatsGrid() {
  const stats = [
    { label: "Revenue", value: "$1.92M", change: "+14.3%", up: true },
    { label: "Users", value: "12,847", change: "+8.2%", up: true },
    { label: "Conversion", value: "3.24%", change: "\u22120.5%", up: false },
  ]

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((s) => (
        <div key={s.label} className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
          <p className="text-lg font-semibold mt-0.5 tabular-nums">{s.value}</p>
          <p
            className={`text-[11px] font-medium ${
              s.up ? "text-[var(--success,#10b981)]" : "text-destructive"
            }`}
          >
            {s.change}
          </p>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function SkeletonLoader() {
  return (
    <div className="space-y-2 max-w-[280px]" aria-hidden="true">
      <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
      <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
      <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Streaming text hook
// ---------------------------------------------------------------------------

function useStreamingText(
  text: string,
  active: boolean,
  reduced: boolean | null,
): { visibleText: string; done: boolean } {
  const [charIndex, setCharIndex] = useState(0)

  useEffect(() => {
    if (reduced || !active) return
    if (charIndex >= text.length) return

    const char = text[charIndex]
    const isNewline = char === "\n"
    const isSpace = char === " "
    const delay = isNewline ? 40 : isSpace ? 10 : 18

    const timer = setTimeout(() => {
      setCharIndex((prev) => Math.min(prev + 1, text.length))
    }, delay)

    return () => clearTimeout(timer)
  }, [active, charIndex, text, reduced])

  useEffect(() => {
    setCharIndex(0)
  }, [text])

  const visibleText = reduced ? text : text.slice(0, charIndex)
  const done = reduced ? true : charIndex >= text.length

  return { visibleText, done }
}

// ---------------------------------------------------------------------------
// Individual demo message renderer
// ---------------------------------------------------------------------------

interface DemoMessageProps {
  item: DemoItem
  reduced: boolean | null
}

function DemoMessage({ item, reduced }: DemoMessageProps) {
  switch (item.type) {
    case "user":
      return <UserBubble text={item.content ?? ""} reduced={reduced} />
    case "assistant-text":
      return <AssistantText text={item.content ?? ""} reduced={reduced} />
    case "step":
      return <StepItem item={item} reduced={reduced} />
    case "component":
      return <ComponentItem componentType={item.componentType ?? "weather"} reduced={reduced} />
    case "skeleton":
      return (
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="pl-8"
        >
          <SkeletonLoader />
        </motion.div>
      )
    case "typing":
      return (
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="pl-8"
        >
          <TypingDots />
        </motion.div>
      )
    case "elicitation":
      return <ElicitationItem item={item} reduced={reduced} />
    default:
      return null
  }
}

function UserBubble({ text, reduced }: { text: string; reduced: boolean | null }) {
  const { visibleText, done } = useStreamingText(text, true, reduced)

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="flex justify-end"
    >
      <div className="rounded-2xl rounded-br-md bg-primary text-primary-foreground px-3.5 py-2 text-sm max-w-[80%]">
        {visibleText}
        {!done && (
          <span className="inline-block w-[2px] h-[1em] bg-primary-foreground/50 align-text-bottom ml-px animate-[cursor-blink_1s_steps(2)_infinite]" />
        )}
      </div>
    </motion.div>
  )
}

function AssistantText({ text, reduced }: { text: string; reduced: boolean | null }) {
  const { visibleText, done } = useStreamingText(text, true, reduced)

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="flex items-start gap-2"
    >
      <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center shrink-0 mt-0.5">
        <PiFeatherDuotone className="w-3 h-3 text-primary-foreground" />
      </div>
      <div className="text-sm text-foreground leading-relaxed">
        {visibleText}
        {!done && (
          <span className="inline-block w-[2px] h-[1em] bg-foreground/30 align-text-bottom ml-px animate-[cursor-blink_1s_steps(2)_infinite]" />
        )}
      </div>
    </motion.div>
  )
}

function StepItem({ item, reduced }: { item: DemoItem; reduced: boolean | null }) {
  const isDone = item.stepStatus === "done"

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={spring}
      className="flex items-center gap-2 pl-8 text-xs text-muted-foreground"
    >
      {isDone ? (
        <svg
          className="w-3.5 h-3.5 text-[var(--success,#10b981)] shrink-0"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="8" fill="currentColor" opacity="0.15" />
          <path
            d="M5 8l2 2 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          className="w-3.5 h-3.5 text-muted-foreground animate-spin shrink-0"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
          <path
            d="M14 8a6 6 0 00-6-6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
      <span>{item.content}</span>
      {isDone && item.stepDuration && (
        <span className="text-muted-foreground/50 tabular-nums">{item.stepDuration}</span>
      )}
    </motion.div>
  )
}

function ComponentItem({
  componentType,
  reduced,
}: {
  componentType: string
  reduced: boolean | null
}) {
  const componentMap: Record<string, () => React.JSX.Element> = {
    weather: DemoWeatherCard,
    chart: DemoBarChart,
    stats: DemoStatsGrid,
  }

  const Component = componentMap[componentType]
  if (!Component) return null

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...gentleSpring, delay: 0.05 }}
      className="pl-8"
    >
      <Component />
    </motion.div>
  )
}

function ElicitationItem({ item, reduced }: { item: DemoItem; reduced: boolean | null }) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={gentleSpring}
      className="pl-8"
    >
      <p className="text-sm text-foreground mb-2">{item.content}</p>
      <div className="flex gap-2" aria-hidden="true">
        {item.options?.map((opt) => (
          <span
            key={opt}
            tabIndex={-1}
            className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground cursor-default select-none hover:bg-accent transition-colors"
          >
            {opt}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Visible items state — tracks what's rendered in the mock chat
// ---------------------------------------------------------------------------

/**
 * Build the visible items list from the script based on the current step index.
 *
 * We apply coalescing logic:
 * - "typing" is removed once the next item arrives
 * - "skeleton" is removed once a "component" replaces it
 * - "step" running entries are replaced by their "done" counterpart
 */
function buildVisibleItems(script: ScriptEntry[], stepIndex: number): DemoItem[] {
  const items: DemoItem[] = []
  const stepsInProgress = new Map<string, number>() // content -> index in items array

  for (let i = 0; i <= stepIndex && i < script.length; i++) {
    const entry = script[i]
    if (!entry) continue
    const item = entry.item

    // Remove typing indicator when anything new arrives
    const lastItem = items[items.length - 1]
    if (item.type !== "typing" && items.length > 0 && lastItem?.type === "typing") {
      items.pop()
    }

    // Remove skeleton when component arrives
    const lastItemAfterTyping = items[items.length - 1]
    if (item.type === "component" && items.length > 0 && lastItemAfterTyping?.type === "skeleton") {
      items.pop()
    }

    // Replace running step with done step
    if (item.type === "step" && item.content) {
      const existingIdx = stepsInProgress.get(item.content)
      if (existingIdx !== undefined && item.stepStatus === "done") {
        items[existingIdx] = item
        stepsInProgress.delete(item.content)
        continue
      }
      if (item.stepStatus === "running") {
        stepsInProgress.set(item.content, items.length)
      }
    }

    items.push(item)
  }

  return items
}

// ---------------------------------------------------------------------------
// Main showcase component
// ---------------------------------------------------------------------------

export function DemoShowcase() {
  const reduced = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inView = useInView(sectionRef, { once: false, margin: "-100px" })

  const [stepIndex, setStepIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Calculate progress
  const progress =
    stepIndex < 0
      ? 0
      : Math.min(
          100,
          ((DEMO_SCRIPT[stepIndex]?.delay ?? TOTAL_DURATION) / TOTAL_DURATION) * 100,
        )

  // Build the visible items from current step
  const visibleItems = stepIndex < 0 ? [] : buildVisibleItems(DEMO_SCRIPT, stepIndex)

  // Cleanup timeouts
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }, [])

  // Start/restart the demo playback
  const startPlayback = useCallback(() => {
    clearAllTimeouts()
    setStepIndex(-1)
    setIsPlaying(true)

    // Schedule each step
    DEMO_SCRIPT.forEach((entry, idx) => {
      const t = setTimeout(() => {
        setStepIndex(idx)
      }, entry.delay)
      timeoutsRef.current.push(t)
    })

    // Schedule restart
    const restartTimer = setTimeout(() => {
      setStepIndex(-1)
      setIsPlaying(false)
      // Will re-trigger via the effect below
    }, TOTAL_DURATION + RESTART_PAUSE)
    timeoutsRef.current.push(restartTimer)
  }, [clearAllTimeouts])

  // Start playing when in view
  useEffect(() => {
    if (inView && !isPlaying) {
      startPlayback()
    }
    if (!inView && isPlaying) {
      clearAllTimeouts()
      setIsPlaying(false)
      setStepIndex(-1)
    }
  }, [inView, isPlaying, startPlayback, clearAllTimeouts])

  // Loop: when playback finishes (isPlaying goes false while still in view), restart
  useEffect(() => {
    if (inView && !isPlaying && stepIndex === -1) {
      const loopTimer = setTimeout(() => {
        if (sectionRef.current) {
          startPlayback()
        }
      }, 500)
      return () => clearTimeout(loopTimer)
    }
  }, [inView, isPlaying, stepIndex, startPlayback])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearAllTimeouts()
  }, [clearAllTimeouts])

  // Auto-scroll the messages container
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [visibleItems.length])

  // For reduced motion: show all items instantly
  const displayItems = reduced ? DEMO_SCRIPT.map((e) => e.item) : visibleItems

  // Filter out intermediate items for reduced motion display
  const reducedItems = reduced ? buildVisibleItems(DEMO_SCRIPT, DEMO_SCRIPT.length - 1) : displayItems

  return (
    <section
      ref={sectionRef}
      className="max-w-4xl mx-auto px-6 py-20"
      role="region"
      aria-label="Live demo of Fabrik UI capabilities"
    >
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold tracking-tight">See it in action</h2>
        <p className="text-sm text-muted-foreground mt-2">
          A live demo &mdash; no setup required.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg mx-auto max-w-2xl">
        {/* Mock header bar */}
        <div className="flex items-center gap-2 px-4 h-12 border-b border-border">
          <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center">
            <PiFeatherDuotone className="w-3 h-3 text-primary-foreground" />
          </div>
          <span className="text-[13px] font-semibold">fabrik</span>
        </div>

        {/* Messages area */}
        <div
          ref={scrollRef}
          className="px-4 py-5 space-y-4 min-h-[400px] max-h-[500px] overflow-hidden scroll-smooth"
          aria-live="polite"
        >
          <AnimatePresence mode="popLayout">
            {(reduced ? reducedItems : visibleItems).map((item, i) => (
              <DemoMessage key={`${item.type}-${item.content ?? item.componentType ?? ""}-${i}`} item={item} reduced={reduced} />
            ))}
          </AnimatePresence>
        </div>

        {/* Disabled input bar */}
        <div className="px-4 py-3 border-t border-border">
          <div
            className="rounded-2xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground"
            aria-hidden="true"
            tabIndex={-1}
          >
            Message fabrik...
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-border">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${reduced ? 100 : progress}%` }}
            role="progressbar"
            aria-valuenow={Math.round(reduced ? 100 : progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Demo progress"
          />
        </div>
      </div>
    </section>
  )
}
