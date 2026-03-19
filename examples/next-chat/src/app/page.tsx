"use client"

import { Fabrik, useChat, Message } from "@fabrik/ui/react"
import { createMockProvider } from "@/lib/mock-provider"
import { demoLibrary } from "@/components/fabrik-components"
import { useRef, useEffect } from "react"
import { motion, useReducedMotion } from "motion/react"
import type { FabrikMessage, TextPart, ComponentPart, ThinkingPart, StepPart, AskPart, ChoiceAsk } from "@fabrik/ui"
import { PiFeatherDuotone, PiPaperPlaneRightFill, PiSpinnerGapBold, PiCheckBold, PiXBold, PiCaretRightBold, PiCloudSunFill, PiChartBarFill, PiSquaresFourFill, PiTableFill, PiBrainFill } from "react-icons/pi"

const spring = { type: "spring" as const, damping: 30, stiffness: 300 }

const provider = createMockProvider()

export default function Home() {
  return (
    <Fabrik provider={provider} components={demoLibrary} theme="light">
      <div className="flex h-dvh flex-col bg-background font-sans">
        <Header />
        <ChatView />
      </div>
    </Fabrik>
  )
}

function Header() {
  return (
    <header className="flex items-center px-5 h-[52px] border-b border-border shrink-0">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-foreground flex items-center justify-center">
          <PiFeatherDuotone className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-[14px] font-semibold tracking-tight">fabrik</span>
      </div>
    </header>
  )
}

function ChatView() {
  const { messages, isLoading, input, send, status } = useChat()
  const reduced = useReducedMotion()
  const scrollRef = useRef<HTMLDivElement>(null)
  const autoScroll = useRef(true)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const h = () => { autoScroll.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100 }
    el.addEventListener("scroll", h, { passive: true })
    return () => el.removeEventListener("scroll", h)
  }, [])

  useEffect(() => {
    if (autoScroll.current && scrollRef.current)
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isLoading])

  const streaming = status === "streaming"

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[660px] px-5 py-8">
          {messages.length === 0 && (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
            >
              <EmptyState />
            </motion.div>
          )}
          <div className="space-y-5">
            {messages.map(msg =>
              msg.role === "user"
                ? <motion.div key={msg.id} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring}><UserBubble message={msg} /></motion.div>
                : <motion.div key={msg.id} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring}><AssistantBlock message={msg} /></motion.div>
            )}
            {streaming && messages[messages.length - 1]?.role !== "assistant" && <Dots />}
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border px-5 py-3">
        <form onSubmit={e => { e.preventDefault(); send() }} className="mx-auto max-w-[660px]">
          <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-1.5 pl-3.5 focus-within:ring-2 focus-within:ring-ring/20 transition-shadow">
            <textarea
              value={input.value}
              onChange={e => input.set(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Message fabrik..."
              rows={1}
              disabled={streaming}
              className="flex-1 resize-none bg-transparent py-2 text-[14px] leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none font-sans"
            />
            <button
              type="submit"
              disabled={!input.value.trim() || streaming}
              aria-label="Send message"
              className="shrink-0 h-8 w-8 rounded-lg bg-foreground text-primary-foreground flex items-center justify-center disabled:opacity-20 transition-opacity hover:opacity-80"
            >
              {streaming
                ? <PiSpinnerGapBold className="w-4 h-4 animate-spin" />
                : <PiPaperPlaneRightFill className="w-3.5 h-3.5" />
              }
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

function UserBubble({ message }: { message: FabrikMessage }) {
  const text = message.parts.filter(p => p.type === "text").map(p => (p as TextPart).text).join("")
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] rounded-2xl rounded-br-md bg-foreground text-primary-foreground px-4 py-2.5 text-[14px] leading-relaxed">
        {text}
      </div>
    </div>
  )
}

function AssistantBlock({ message }: { message: FabrikMessage }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 h-7 w-7 rounded-lg shrink-0 flex items-center justify-center bg-primary">
        <PiFeatherDuotone className="w-3.5 h-3.5 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0 space-y-2 pt-0.5">
        {message.parts.map((part, i) => {
          switch (part.type) {
            case "text": return <p key={i} className="text-[14px] leading-[1.7] text-foreground">{(part as TextPart).text}</p>
            case "component": return <CompRender key={i} part={part as ComponentPart} />
            case "thinking": return <ThinkBlock key={i} part={part as ThinkingPart} />
            case "step": return <StepLine key={i} part={part as StepPart} />
            case "ask": return <AskBlock key={i} part={part as AskPart} />
            default: return null
          }
        })}
      </div>
    </div>
  )
}

function CompRender({ part }: { part: ComponentPart }) {
  if (part.status === "pending" || part.status === "streaming") return <ComponentSkeleton name={part.name} />
  return <Message message={{ id: "", role: "assistant", parts: [part], createdAt: "" }} />
}

function ComponentSkeleton({ name }: { name: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 my-3 space-y-3 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-muted" />
        <div className="h-3 w-20 rounded bg-muted" />
      </div>
      <div className="h-4 w-3/5 rounded bg-muted" />
      <div className="h-3 w-full rounded bg-muted" />
      <div className="h-3 w-4/5 rounded bg-muted" />
      {name.includes("chart") && <div className="h-32 w-full rounded-lg bg-muted" />}
      {name.includes("grid") && (
        <div className="grid grid-cols-2 gap-3">
          {[0,1,2,3].map(i => <div key={i} className="h-20 rounded-lg bg-muted" />)}
        </div>
      )}
    </div>
  )
}

function ThinkBlock({ part }: { part: ThinkingPart }) {
  const active = part.status === "streaming"
  return (
    <details className="group text-[13px]">
      <summary className="flex items-center gap-1.5 text-muted-foreground cursor-pointer select-none list-none">
        {active
          ? <PiSpinnerGapBold className="w-3.5 h-3.5 animate-spin text-primary" />
          : <PiCaretRightBold className="w-3 h-3 transition-transform group-open:rotate-90" />
        }
        {active ? "Thinking..." : `Thought for ${part.durationMs ? (part.durationMs / 1000).toFixed(1) + "s" : "a moment"}`}
      </summary>
      <div className="mt-1.5 ml-5 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-[12px] text-muted-foreground leading-relaxed max-h-40 overflow-y-auto">
        {part.text}
      </div>
    </details>
  )
}

function StepLine({ part }: { part: StepPart }) {
  return (
    <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
      {part.stepStatus === "running" && <PiSpinnerGapBold className="w-3.5 h-3.5 animate-spin text-primary" />}
      {part.stepStatus === "done" && <PiCheckBold className="w-3.5 h-3.5 text-[var(--success,#10b981)]" />}
      {part.stepStatus === "failed" && <PiXBold className="w-3.5 h-3.5 text-destructive" />}
      <span>{part.title}</span>
      {part.durationMs != null && part.stepStatus !== "running" && (
        <span className="text-[11px] opacity-50 tabular-nums">{(part.durationMs / 1000).toFixed(1)}s</span>
      )}
    </div>
  )
}

function AskBlock({ part }: { part: AskPart }) {
  const { respond } = useChat()
  if (part.status !== "pending") return null
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-[13px]">
      <p className="font-medium">{part.config.title}</p>
      {"options" in part.config && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {(part.config as ChoiceAsk).options.map((o) => (
            <button key={o.value} onClick={() => respond(part.id, o.value)}
              className="rounded-full border border-border px-3 py-1 text-[12px] hover:bg-accent transition-colors">
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Dots() {
  return (
    <div className="flex gap-3">
      <div className="h-7 w-7 rounded-lg shrink-0 flex items-center justify-center bg-primary">
        <PiFeatherDuotone className="w-3.5 h-3.5 text-primary-foreground" />
      </div>
      <div className="flex items-center gap-1 pt-2">
        {[0, 1, 2].map(i => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
            style={{ animation: `bounce-dot 1.4s infinite ease-in-out both`, animationDelay: `${i * 0.16}s` }} />
        ))}
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-2.5">
      <div className="h-3.5 w-2/5 rounded bg-muted animate-pulse" />
      <div className="h-3 w-full rounded bg-muted animate-pulse" />
      <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-5 bg-primary/[0.08]">
        <PiFeatherDuotone className="w-6 h-6 text-primary" />
      </div>
      <h2 className="text-[16px] font-semibold tracking-tight">How can I help you?</h2>
      <p className="text-[13px] text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
        I can show you weather, charts, dashboards, tables — or just chat.
      </p>
      <div className="flex gap-2 mt-6 flex-wrap justify-center">
        <Pill icon={<PiCloudSunFill />} text="Show me the weather" />
        <Pill icon={<PiChartBarFill />} text="Revenue chart" />
        <Pill icon={<PiSquaresFourFill />} text="Dashboard stats" />
        <Pill icon={<PiTableFill />} text="Data table" />
        <Pill icon={<PiBrainFill />} text="Think deeply" />
      </div>
    </div>
  )
}

function Pill({ icon, text }: { icon: React.ReactNode; text: string }) {
  const { input, send } = useChat()
  return (
    <button onClick={() => { input.set(text); setTimeout(send, 50) }}
      className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all">
      <span className="text-[13px]">{icon}</span>
      {text}
    </button>
  )
}
