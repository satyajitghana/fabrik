"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, useInView, useReducedMotion, AnimatePresence } from "motion/react"
import { PiFeatherDuotone, PiCheckBold, PiCodeBold, PiGlobeBold } from "react-icons/pi"

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
  | "elicitation-choice"
  | "elicitation-confirm"
  | "artifact-html"
  | "artifact-code"
  | "code-diff"

interface DemoItem {
  type: DemoItemType
  content?: string
  stepStatus?: "running" | "done"
  stepDuration?: string
  componentType?: "weather" | "chart" | "stats"
  options?: string[]
  selectedOption?: string
  confirmLabels?: { accept: string; deny: string }
  artifactTitle?: string
  diffLines?: { type: "add" | "remove" | "context"; text: string }[]
}

interface ScriptEntry {
  delay: number
  item: DemoItem
}

// ---------------------------------------------------------------------------
// Demo script (~30 seconds, comprehensive)
// ---------------------------------------------------------------------------

const DEMO_SCRIPT: ScriptEntry[] = [
  // --- Weather flow ---
  { delay: 0, item: { type: "user", content: "What's the weather in San Francisco?" } },
  { delay: 1200, item: { type: "typing" } },
  { delay: 1600, item: { type: "step", content: "Calling weather API…", stepStatus: "running" } },
  { delay: 2400, item: { type: "step", content: "Calling weather API…", stepStatus: "done", stepDuration: "0.4s" } },
  { delay: 2800, item: { type: "assistant-text", content: "Here's the current weather:" } },
  { delay: 3200, item: { type: "skeleton" } },
  { delay: 3700, item: { type: "component", componentType: "weather" } },

  // --- Elicitation: choice pills ---
  { delay: 5200, item: { type: "elicitation-choice", content: "Want to see more data?", options: ["Revenue chart", "Dashboard stats", "Both"] } },
  { delay: 6500, item: { type: "elicitation-choice", content: "Want to see more data?", options: ["Revenue chart", "Dashboard stats", "Both"], selectedOption: "Both" } },

  // --- Chart + Stats flow ---
  { delay: 7000, item: { type: "typing" } },
  { delay: 7400, item: { type: "step", content: "Querying analytics DB…", stepStatus: "running" } },
  { delay: 8000, item: { type: "step", content: "Querying analytics DB…", stepStatus: "done", stepDuration: "0.3s" } },
  { delay: 8200, item: { type: "step", content: "Aggregating metrics…", stepStatus: "running" } },
  { delay: 8800, item: { type: "step", content: "Aggregating metrics…", stepStatus: "done", stepDuration: "0.5s" } },
  { delay: 9200, item: { type: "assistant-text", content: "Here's your quarterly revenue and dashboard:" } },
  { delay: 9600, item: { type: "skeleton" } },
  { delay: 10100, item: { type: "component", componentType: "chart" } },
  { delay: 11000, item: { type: "skeleton" } },
  { delay: 11500, item: { type: "component", componentType: "stats" } },

  // --- Artifact: HTML preview ---
  { delay: 13000, item: { type: "user", content: "Generate a landing page hero" } },
  { delay: 14200, item: { type: "typing" } },
  { delay: 14600, item: { type: "step", content: "Generating HTML…", stepStatus: "running" } },
  { delay: 15400, item: { type: "step", content: "Generating HTML…", stepStatus: "done", stepDuration: "0.8s" } },
  { delay: 15800, item: { type: "assistant-text", content: "Here's a hero section:" } },
  { delay: 16300, item: { type: "artifact-html", artifactTitle: "hero.html" } },

  // --- Code diff ---
  { delay: 18500, item: { type: "user", content: "Refactor the Button component to use CVA" } },
  { delay: 19700, item: { type: "typing" } },
  { delay: 20100, item: { type: "step", content: "Analyzing component…", stepStatus: "running" } },
  { delay: 20700, item: { type: "step", content: "Analyzing component…", stepStatus: "done", stepDuration: "0.3s" } },
  { delay: 21100, item: { type: "assistant-text", content: "Here's the refactor:" } },
  { delay: 21500, item: {
    type: "code-diff",
    artifactTitle: "button.tsx",
    diffLines: [
      { type: "remove", text: 'className={`btn ${variant}`}' },
      { type: "add", text: 'className={buttonVariants({ variant })}' },
      { type: "context", text: "  {...props}" },
      { type: "context", text: "/>" },
    ],
  }},

  // --- Confirmation elicitation ---
  { delay: 23500, item: { type: "elicitation-confirm", content: "Apply this change?", confirmLabels: { accept: "Apply", deny: "Discard" } } },
]

const TOTAL_DURATION = 26000
const RESTART_PAUSE = 3000

// ---------------------------------------------------------------------------
// Spring configs
// ---------------------------------------------------------------------------

const spring = { type: "spring" as const, damping: 30, stiffness: 300 }
const gentleSpring = { type: "spring" as const, damping: 25, stiffness: 200 }

// ---------------------------------------------------------------------------
// Mini demo components
// ---------------------------------------------------------------------------

function DemoWeatherCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 max-w-[280px] shadow-sm">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">San Francisco</p>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-[40px] font-light tabular-nums">64</span>
        <span className="text-sm text-muted-foreground">°F</span>
        <span className="ml-auto text-2xl" aria-hidden>☀️</span>
      </div>
      <p className="text-xs text-muted-foreground">Sunny</p>
      <div className="flex gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
        <span>💧 45%</span>
        <span>💨 6.6 mph</span>
      </div>
    </div>
  )
}

function DemoBarChart() {
  const bars = [
    { label: "Q1", value: 65, color: "var(--chart-1)" },
    { label: "Q2", value: 75, color: "var(--chart-2)" },
    { label: "Q3", value: 85, color: "var(--chart-3)" },
    { label: "Q4", value: 95, color: "var(--chart-4)" },
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
          <p className={`text-[11px] font-medium ${s.up ? "text-[var(--success)]" : "text-destructive"}`}>
            {s.change}
          </p>
        </div>
      ))}
    </div>
  )
}

function DemoArtifactHtml({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden shadow-sm max-w-[360px]">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border">
        <PiGlobeBold className="w-3 h-3 text-muted-foreground" />
        <span className="text-[11px] font-mono text-muted-foreground">{title}</span>
      </div>
      <div className="bg-card p-4">
        <div className="bg-primary/10 rounded-lg p-4 text-center">
          <div className="text-lg font-bold text-foreground">Welcome to Acme</div>
          <p className="text-xs text-muted-foreground mt-1">Build something amazing today.</p>
          <div className="mt-3 inline-flex rounded-md bg-primary px-3 py-1.5 text-[10px] font-medium text-primary-foreground">
            Get Started →
          </div>
        </div>
      </div>
    </div>
  )
}

function DemoCodeDiff({ title, lines }: { title: string; lines: DemoItem["diffLines"] }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden shadow-sm max-w-[360px]">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border">
        <PiCodeBold className="w-3 h-3 text-muted-foreground" />
        <span className="text-[11px] font-mono text-muted-foreground">{title}</span>
      </div>
      <div className="bg-card font-mono text-[11px] leading-relaxed">
        {lines?.map((line, i) => (
          <div
            key={i}
            className={`px-3 py-0.5 ${
              line.type === "add" ? "bg-green-500/10 text-green-600 dark:text-green-400" :
              line.type === "remove" ? "bg-red-500/10 text-red-600 dark:text-red-400 line-through" :
              "text-muted-foreground"
            }`}
          >
            <span className="select-none opacity-50 mr-2">
              {line.type === "add" ? "+" : line.type === "remove" ? "−" : " "}
            </span>
            {line.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2 px-3 py-2 border-t border-border bg-muted/30">
        <span className="rounded-md bg-green-500/15 text-green-600 dark:text-green-400 px-2.5 py-1 text-[10px] font-medium cursor-default">Accept</span>
        <span className="rounded-md bg-red-500/10 text-red-600 dark:text-red-400 px-2.5 py-1 text-[10px] font-medium cursor-default">Reject</span>
      </div>
    </div>
  )
}

function SkeletonLoader() {
  return (
    <div className="space-y-2 max-w-[280px]" aria-hidden>
      <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
      <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
      <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Streaming text hook
// ---------------------------------------------------------------------------

function useStreamingText(text: string, active: boolean, reduced: boolean | null) {
  const [charIndex, setCharIndex] = useState(0)

  useEffect(() => {
    if (reduced || !active || charIndex >= text.length) return
    const char = text[charIndex]
    const delay = char === "\n" ? 40 : char === " " ? 10 : 18
    const timer = setTimeout(() => setCharIndex(prev => Math.min(prev + 1, text.length)), delay)
    return () => clearTimeout(timer)
  }, [active, charIndex, text, reduced])

  useEffect(() => { setCharIndex(0) }, [text])

  return {
    visibleText: reduced ? text : text.slice(0, charIndex),
    done: reduced ? true : charIndex >= text.length,
  }
}

// ---------------------------------------------------------------------------
// Message renderers
// ---------------------------------------------------------------------------

function DemoMessage({ item, reduced }: { item: DemoItem; reduced: boolean | null }) {
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
        <motion.div initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="pl-8">
          <SkeletonLoader />
        </motion.div>
      )
    case "typing":
      return (
        <motion.div initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="pl-8">
          <TypingDots />
        </motion.div>
      )
    case "elicitation-choice":
      return <ChoiceElicitation item={item} reduced={reduced} />
    case "elicitation-confirm":
      return <ConfirmElicitation item={item} reduced={reduced} />
    case "artifact-html":
      return (
        <motion.div initial={reduced ? false : { opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ ...gentleSpring, delay: 0.05 }} className="pl-8">
          <DemoArtifactHtml title={item.artifactTitle ?? "preview.html"} />
        </motion.div>
      )
    case "code-diff":
      return (
        <motion.div initial={reduced ? false : { opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ ...gentleSpring, delay: 0.05 }} className="pl-8">
          <DemoCodeDiff title={item.artifactTitle ?? "diff"} lines={item.diffLines} />
        </motion.div>
      )
    default:
      return null
  }
}

function UserBubble({ text, reduced }: { text: string; reduced: boolean | null }) {
  const { visibleText, done } = useStreamingText(text, true, reduced)
  return (
    <motion.div initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="flex justify-end">
      <div className="rounded-2xl rounded-br-md bg-primary text-primary-foreground px-3.5 py-2 text-sm max-w-[80%]">
        {visibleText}
        {!done && <span className="inline-block w-[2px] h-[1em] bg-primary-foreground/50 align-text-bottom ml-px animate-[cursor-blink_1s_steps(2)_infinite]" />}
      </div>
    </motion.div>
  )
}

function AssistantText({ text, reduced }: { text: string; reduced: boolean | null }) {
  const { visibleText, done } = useStreamingText(text, true, reduced)
  return (
    <motion.div initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="flex items-start gap-2">
      <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center shrink-0 mt-0.5">
        <PiFeatherDuotone className="w-3 h-3 text-primary-foreground" />
      </div>
      <div className="text-sm text-foreground leading-relaxed">
        {visibleText}
        {!done && <span className="inline-block w-[2px] h-[1em] bg-foreground/30 align-text-bottom ml-px animate-[cursor-blink_1s_steps(2)_infinite]" />}
      </div>
    </motion.div>
  )
}

function StepItem({ item, reduced }: { item: DemoItem; reduced: boolean | null }) {
  const isDone = item.stepStatus === "done"
  return (
    <motion.div initial={reduced ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={spring} className="flex items-center gap-2 pl-8 text-xs text-muted-foreground">
      {isDone ? (
        <svg className="w-3.5 h-3.5 text-[var(--success)] shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="8" cy="8" r="8" fill="currentColor" opacity="0.15" />
          <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5 text-muted-foreground animate-spin shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
          <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
      <span>{item.content}</span>
      {isDone && item.stepDuration && <span className="text-muted-foreground/50 tabular-nums">{item.stepDuration}</span>}
    </motion.div>
  )
}

function ComponentItem({ componentType, reduced }: { componentType: string; reduced: boolean | null }) {
  const componentMap: Record<string, () => React.JSX.Element> = {
    weather: DemoWeatherCard,
    chart: DemoBarChart,
    stats: DemoStatsGrid,
  }
  const Component = componentMap[componentType]
  if (!Component) return null
  return (
    <motion.div initial={reduced ? false : { opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ ...gentleSpring, delay: 0.05 }} className="pl-8">
      <Component />
    </motion.div>
  )
}

function ChoiceElicitation({ item, reduced }: { item: DemoItem; reduced: boolean | null }) {
  return (
    <motion.div initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={gentleSpring} className="pl-8">
      <p className="text-sm text-foreground mb-2">{item.content}</p>
      <div className="flex flex-wrap gap-2" aria-hidden>
        {item.options?.map((opt) => (
          <span
            key={opt}
            className={`rounded-full border px-3 py-1 text-xs font-medium cursor-default select-none transition-colors ${
              item.selectedOption === opt
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-foreground hover:bg-accent"
            }`}
          >
            {item.selectedOption === opt && <PiCheckBold className="w-2.5 h-2.5 inline mr-1" />}
            {opt}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

function ConfirmElicitation({ item, reduced }: { item: DemoItem; reduced: boolean | null }) {
  return (
    <motion.div initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={gentleSpring} className="pl-8">
      <p className="text-sm text-foreground mb-2">{item.content}</p>
      <div className="flex gap-2" aria-hidden>
        <span className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium cursor-default">
          {item.confirmLabels?.accept ?? "Confirm"}
        </span>
        <span className="rounded-lg border border-border text-foreground px-3 py-1.5 text-xs font-medium cursor-default">
          {item.confirmLabels?.deny ?? "Cancel"}
        </span>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Build visible items with coalescing logic
// ---------------------------------------------------------------------------

function buildVisibleItems(script: ScriptEntry[], stepIndex: number): DemoItem[] {
  const items: DemoItem[] = []
  const stepsInProgress = new Map<string, number>()
  const elicitationsInProgress = new Map<string, number>()

  for (let i = 0; i <= stepIndex && i < script.length; i++) {
    const entry = script[i]
    if (!entry) continue
    const item = entry.item

    // Remove typing indicator when anything new arrives
    if (item.type !== "typing" && items.length > 0 && items[items.length - 1]?.type === "typing") {
      items.pop()
    }

    // Remove skeleton when component/artifact arrives
    if ((item.type === "component" || item.type === "artifact-html" || item.type === "artifact-code") &&
        items.length > 0 && items[items.length - 1]?.type === "skeleton") {
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

    // Replace elicitation with selected version
    if (item.type === "elicitation-choice" && item.content) {
      const existingIdx = elicitationsInProgress.get(item.content)
      if (existingIdx !== undefined && item.selectedOption) {
        items[existingIdx] = item
        elicitationsInProgress.delete(item.content)
        continue
      }
      if (!item.selectedOption) {
        elicitationsInProgress.set(item.content, items.length)
      }
    }

    items.push(item)
  }

  return items
}

// ---------------------------------------------------------------------------
// Main showcase
// ---------------------------------------------------------------------------

export function DemoShowcase() {
  const reduced = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inView = useInView(sectionRef, { once: false, margin: "-100px" })

  const [stepIndex, setStepIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const progress = stepIndex < 0
    ? 0
    : Math.min(100, ((DEMO_SCRIPT[stepIndex]?.delay ?? TOTAL_DURATION) / TOTAL_DURATION) * 100)

  const visibleItems = stepIndex < 0 ? [] : buildVisibleItems(DEMO_SCRIPT, stepIndex)

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }, [])

  const startPlayback = useCallback(() => {
    clearAllTimeouts()
    setStepIndex(-1)
    setIsPlaying(true)

    DEMO_SCRIPT.forEach((entry, idx) => {
      const t = setTimeout(() => setStepIndex(idx), entry.delay)
      timeoutsRef.current.push(t)
    })

    const restartTimer = setTimeout(() => {
      setStepIndex(-1)
      setIsPlaying(false)
    }, TOTAL_DURATION + RESTART_PAUSE)
    timeoutsRef.current.push(restartTimer)
  }, [clearAllTimeouts])

  useEffect(() => {
    if (inView && !isPlaying) startPlayback()
    if (!inView && isPlaying) {
      clearAllTimeouts()
      setIsPlaying(false)
      setStepIndex(-1)
    }
  }, [inView, isPlaying, startPlayback, clearAllTimeouts])

  useEffect(() => {
    if (inView && !isPlaying && stepIndex === -1) {
      const loopTimer = setTimeout(() => {
        if (sectionRef.current) startPlayback()
      }, 500)
      return () => clearTimeout(loopTimer)
    }
  }, [inView, isPlaying, stepIndex, startPlayback])

  useEffect(() => () => clearAllTimeouts(), [clearAllTimeouts])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [visibleItems.length])

  const displayItems = reduced ? buildVisibleItems(DEMO_SCRIPT, DEMO_SCRIPT.length - 1) : visibleItems

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
          Generative UI, elicitations, artifacts, and code diffs — all streaming.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 h-12 border-b border-border">
          <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center">
            <PiFeatherDuotone className="w-3 h-3 text-primary-foreground" />
          </div>
          <span className="text-[13px] font-semibold">fabrik</span>
          <div className="ml-auto flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
            <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
            <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="px-4 py-5 space-y-4 min-h-[420px] max-h-[520px] overflow-hidden scroll-smooth"
          aria-live="polite"
        >
          <AnimatePresence mode="popLayout">
            {displayItems.map((item, i) => (
              <DemoMessage key={`${item.type}-${item.content ?? item.componentType ?? item.artifactTitle ?? ""}-${i}`} item={item} reduced={reduced} />
            ))}
          </AnimatePresence>
        </div>

        {/* Input bar */}
        <div className="px-4 py-3 border-t border-border">
          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground" aria-hidden tabIndex={-1}>
            Message fabrik...
          </div>
        </div>

        {/* Progress */}
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
