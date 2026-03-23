"use client"

import { Fabrik, useChat, Message } from "@fabrik-sdk/ui/react"
import { createCopilotProvider } from "@/lib/mock-provider"
import { demoLibrary } from "@/components/fabrik-components"
import { useRef, useEffect, useState, useCallback } from "react"
import { motion, useReducedMotion } from "motion/react"
import type { FabrikMessage, TextPart, ComponentPart, ThinkingPart, StepPart } from "@fabrik-sdk/ui"
import {
  PiFeatherDuotone,
  PiPaperPlaneRightFill,
  PiSpinnerGapBold,
  PiCheckBold,
  PiXBold,
  PiCaretRightBold,
  PiTextAlignLeftFill,
  PiCodeBlockBold,
  PiListBulletsBold,
  PiLightbulbFilamentBold,
  PiBookOpenTextFill,
} from "react-icons/pi"

const spring = { type: "spring" as const, damping: 30, stiffness: 300 }

const provider = createCopilotProvider()

export default function Home() {
  return (
    <Fabrik provider={provider} components={demoLibrary} theme="light">
      <div className="flex h-dvh flex-col bg-background font-sans">
        <Header />
        <div className="flex flex-1 min-h-0">
          <DocumentPanel />
          <ResizableDivider />
          <CopilotPanel />
        </div>
      </div>
    </Fabrik>
  )
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header() {
  return (
    <header className="flex items-center justify-between px-5 h-[52px] border-b border-border shrink-0">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-foreground flex items-center justify-center">
          <PiFeatherDuotone className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-[14px] font-semibold tracking-tight">fabrik</span>
        <span className="text-[12px] text-muted-foreground ml-1">/ copilot demo</span>
      </div>
      <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--success,#10b981)]" />
          Copilot active
        </span>
      </div>
    </header>
  )
}

// ---------------------------------------------------------------------------
// Resizable Divider
// ---------------------------------------------------------------------------

function ResizableDivider() {
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = useCallback(() => {
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return
    const handleMouseUp = () => setIsDragging(false)
    window.addEventListener("mouseup", handleMouseUp)
    return () => window.removeEventListener("mouseup", handleMouseUp)
  }, [isDragging])

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`w-[1px] shrink-0 bg-border cursor-col-resize hover:bg-ring/40 transition-colors relative group ${isDragging ? "bg-ring/40" : ""}`}
    >
      <div className="absolute inset-y-0 -left-1 -right-1" />
      <div className={`absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-1 h-8 rounded-full transition-opacity ${isDragging ? "bg-ring/60 opacity-100" : "bg-border opacity-0 group-hover:opacity-100"}`} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Document Panel (left side)
// ---------------------------------------------------------------------------

function DocumentPanel() {
  return (
    <div className="flex-1 min-w-0 overflow-y-auto">
      <article className="max-w-[720px] mx-auto px-8 py-10">
        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground mb-4">
            <span className="bg-foreground text-primary-foreground px-2 py-0.5 rounded-full font-medium">Article</span>
            <span>12 min read</span>
            <span className="mx-1">-</span>
            <span>Mar 15, 2026</span>
          </div>
          <h1 className="text-[32px] font-bold tracking-tight leading-[1.15]">
            Building with AI: Patterns for the Next Generation of Interfaces
          </h1>
          <p className="text-[16px] text-muted-foreground mt-3 leading-relaxed">
            How streaming architecture, component-driven AI, and thoughtful state management
            are shaping the future of human-computer interaction.
          </p>
        </div>

        {/* Author */}
        <div className="flex items-center gap-3 py-4 border-y border-border mb-8">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary flex items-center justify-center text-primary-foreground text-[13px] font-semibold">
            AK
          </div>
          <div>
            <p className="text-[13px] font-medium">Alex Kim</p>
            <p className="text-[12px] text-muted-foreground">Engineering @ fabrik</p>
          </div>
        </div>

        {/* Section 1 */}
        <section className="mb-8">
          <h2 className="text-[22px] font-semibold tracking-tight mb-3">Introduction</h2>
          <p className="text-[15px] leading-[1.75] text-foreground/90 mb-4">
            The way we build interfaces is changing. For decades, developers have hand-crafted every screen,
            every state, every interaction. But large language models introduce a new possibility:
            interfaces that generate themselves based on context, intent, and data.
          </p>
          <p className="text-[15px] leading-[1.75] text-foreground/90 mb-4">
            This isn{"'"}t about replacing designers or developers. It{"'"}s about creating a new layer of
            intelligence that sits between your data and your users. The AI doesn{"'"}t just answer questions —
            it decides <em>how</em> to answer them, choosing the right visual representation dynamically.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mb-8">
          <h2 className="text-[22px] font-semibold tracking-tight mb-3">The Streaming Paradigm</h2>
          <p className="text-[15px] leading-[1.75] text-foreground/90 mb-4">
            When working with LLMs, latency is the enemy. A model might take 3-5 seconds to generate a
            full response, but users expect feedback within milliseconds. The solution is streaming —
            delivering tokens as they{"'"}re generated rather than waiting for completion.
          </p>
          <p className="text-[15px] leading-[1.75] text-foreground/90 mb-4">
            There are two main approaches for browser-based streaming:
          </p>
          <ul className="space-y-2 mb-4 ml-5">
            <li className="text-[15px] leading-[1.75] text-foreground/90 list-disc">
              <strong>Server-Sent Events (SSE)</strong> — Unidirectional, simple to implement, works over HTTP/1.1.
              Ideal for most AI chat applications.
            </li>
            <li className="text-[15px] leading-[1.75] text-foreground/90 list-disc">
              <strong>WebSockets</strong> — Bidirectional, lower overhead per message, but more complex to manage.
              Better for real-time collaborative features.
            </li>
          </ul>
          <p className="text-[15px] leading-[1.75] text-foreground/90">
            For most AI applications, SSE provides the best balance of simplicity and performance.
            The key insight is using <strong>async iterators</strong> as the internal abstraction,
            regardless of the transport layer.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mb-8">
          <h2 className="text-[22px] font-semibold tracking-tight mb-3">Beyond Text: Component-Driven AI</h2>
          <p className="text-[15px] leading-[1.75] text-foreground/90 mb-4">
            The real breakthrough happens when the AI can render more than text. Imagine asking
            {" \""}show me this quarter{"'"}s revenue{"\""} and receiving an interactive chart instead of
            a markdown table. Or asking about the weather and seeing a beautifully designed weather card.
          </p>
          <p className="text-[15px] leading-[1.75] text-foreground/90 mb-4">
            This requires three pieces:
          </p>
          <ol className="space-y-2 mb-4 ml-5">
            <li className="text-[15px] leading-[1.75] text-foreground/90 list-decimal">
              <strong>A component registry</strong> — A catalog of available UI components with their schemas
            </li>
            <li className="text-[15px] leading-[1.75] text-foreground/90 list-decimal">
              <strong>Schema validation</strong> — Using Zod to ensure props match expected shapes
            </li>
            <li className="text-[15px] leading-[1.75] text-foreground/90 list-decimal">
              <strong>A rendering pipeline</strong> — That maps stream events to rendered components
            </li>
          </ol>
        </section>

        {/* Code block */}
        <section className="mb-8">
          <h2 className="text-[22px] font-semibold tracking-tight mb-3">Putting It Together</h2>
          <p className="text-[15px] leading-[1.75] text-foreground/90 mb-4">
            Here{"'"}s a simplified example of a streaming hook that handles both text and component events:
          </p>
          <div className="rounded-xl border border-border bg-foreground text-[13px] font-mono overflow-hidden mb-4">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/[0.03]">
              <span className="text-[11px] text-white/40">useStream.ts</span>
              <span className="text-[11px] text-white/30">TypeScript</span>
            </div>
            <pre className="p-4 overflow-x-auto text-white/80 leading-relaxed">
              <code>{`function useStream(provider: Provider) {
  const [messages, dispatch] = useReducer(reducer, [])
  const abortRef = useRef<AbortController>()

  const send = useCallback(async (text: string) => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    dispatch({ type: "add_user", text })

    const stream = provider.stream({
      messages: [...messages, userMsg(text)],
      signal: abortRef.current.signal,
    })

    for await (const event of stream) {
      switch (event.type) {
        case "text":
          dispatch({ type: "append_text", delta: event.delta })
          break
        case "component_done":
          dispatch({ type: "add_component", ...event })
          break
        case "step_start":
          dispatch({ type: "step", ...event })
          break
      }
    }
  }, [messages, provider])

  return { messages, send }
}`}</code>
            </pre>
          </div>
        </section>

        {/* Section 4 */}
        <section className="mb-8">
          <h2 className="text-[22px] font-semibold tracking-tight mb-3">State Management Patterns</h2>
          <p className="text-[15px] leading-[1.75] text-foreground/90 mb-4">
            AI conversations introduce unique state challenges. Messages can be modified mid-stream
            as the model generates tokens. Components can arrive out of order. Errors need graceful
            degradation — a failed component render shouldn{"'"}t crash the entire conversation.
          </p>
          <p className="text-[15px] leading-[1.75] text-foreground/90 mb-4">
            The key patterns are:
          </p>
          <ul className="space-y-2 mb-4 ml-5">
            <li className="text-[15px] leading-[1.75] text-foreground/90 list-disc">
              <strong>Optimistic updates</strong> — Show user messages immediately, before the server acknowledges
            </li>
            <li className="text-[15px] leading-[1.75] text-foreground/90 list-disc">
              <strong>Reducer-based state</strong> — Use <code className="text-[13px] bg-muted px-1.5 py-0.5 rounded">useReducer</code> for
              predictable, debuggable state transitions
            </li>
            <li className="text-[15px] leading-[1.75] text-foreground/90 list-disc">
              <strong>Error boundaries</strong> — Wrap component renders so a single malformed prop
              doesn{"'"}t break the thread
            </li>
          </ul>
        </section>

        {/* Conclusion */}
        <section className="mb-12">
          <h2 className="text-[22px] font-semibold tracking-tight mb-3">Conclusion</h2>
          <p className="text-[15px] leading-[1.75] text-foreground/90 mb-4">
            The best AI interfaces blur the line between chat and traditional UI. They let the
            model orchestrate rich, interactive experiences — not just generate text. By combining
            streaming architecture, a component registry, and careful state management, you can
            build interfaces that feel intelligent and responsive.
          </p>
          <p className="text-[15px] leading-[1.75] text-foreground/90">
            The future of UI isn{"'"}t about more templates. It{"'"}s about giving the AI the
            building blocks and letting it compose them in ways we haven{"'"}t imagined yet.
          </p>
        </section>

        {/* Footer */}
        <footer className="border-t border-border pt-6 pb-10 text-[13px] text-muted-foreground">
          <p>Published by the fabrik-ui team. Built with Next.js and TypeScript.</p>
        </footer>
      </article>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Copilot Panel (right side)
// ---------------------------------------------------------------------------

function CopilotPanel() {
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
    <motion.div
      initial={reduced ? false : { opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={spring}
      className="w-[380px] shrink-0 flex flex-col bg-card"
    >
      {/* Copilot Header */}
      <div className="flex items-center gap-2 px-4 h-[48px] border-b border-border shrink-0">
        <div className="h-6 w-6 rounded-md flex items-center justify-center bg-primary">
          <PiFeatherDuotone className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <span className="text-[13px] font-semibold tracking-tight">Copilot</span>
        <span className="text-[11px] text-muted-foreground ml-auto">Ask about this document</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="px-4 py-5">
          {messages.length === 0 && (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
            >
              <CopilotEmptyState />
            </motion.div>
          )}
          <div className="space-y-4">
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
      <div className="shrink-0 border-t border-border px-3 py-3">
        <form onSubmit={e => { e.preventDefault(); send() }}>
          <div className="flex items-end gap-2 rounded-xl border border-border bg-background p-1.5 pl-3.5 focus-within:ring-2 focus-within:ring-ring/20 transition-shadow">
            <textarea
              value={input.value}
              onChange={e => input.set(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Ask about this document..."
              rows={1}
              disabled={streaming}
              className="flex-1 resize-none bg-transparent py-2 text-[13px] leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none font-sans"
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
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Copilot Empty State
// ---------------------------------------------------------------------------

function CopilotEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-4 bg-primary/[0.08]">
        <PiFeatherDuotone className="w-5 h-5 text-primary" />
      </div>
      <h3 className="text-[14px] font-semibold tracking-tight">Document Copilot</h3>
      <p className="text-[12px] text-muted-foreground mt-1.5 max-w-[260px] leading-relaxed">
        Ask me anything about the article. I can summarize, explain code, or suggest improvements.
      </p>
      <div className="flex flex-col gap-1.5 mt-5 w-full">
        <SuggestionPill icon={<PiTextAlignLeftFill />} text="Summarize this article" />
        <SuggestionPill icon={<PiCodeBlockBold />} text="Explain the code example" />
        <SuggestionPill icon={<PiListBulletsBold />} text="Show the document outline" />
        <SuggestionPill icon={<PiLightbulbFilamentBold />} text="Suggest improvements" />
        <SuggestionPill icon={<PiBookOpenTextFill />} text="Key takeaways" />
      </div>
    </div>
  )
}

function SuggestionPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  const { input, send } = useChat()
  return (
    <button onClick={() => { input.set(text); setTimeout(send, 50) }}
      className="flex items-center gap-2.5 rounded-lg border border-border px-3.5 py-2.5 text-[12px] text-muted-foreground hover:text-foreground hover:border-foreground/20 hover:bg-muted/50 transition-all text-left">
      <span className="text-[14px] shrink-0">{icon}</span>
      {text}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Message components
// ---------------------------------------------------------------------------

function UserBubble({ message }: { message: FabrikMessage }) {
  const text = message.parts.filter(p => p.type === "text").map(p => (p as TextPart).text).join("")
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-foreground text-primary-foreground px-3.5 py-2 text-[13px] leading-relaxed">
        {text}
      </div>
    </div>
  )
}

function AssistantBlock({ message }: { message: FabrikMessage }) {
  return (
    <div className="flex gap-2.5">
      <div className="mt-0.5 h-6 w-6 rounded-md shrink-0 flex items-center justify-center bg-primary">
        <PiFeatherDuotone className="w-3 h-3 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
        {message.parts.map((part, i) => {
          switch (part.type) {
            case "text": return <TextBlock key={i} part={part as TextPart} />
            case "component": return <CompRender key={i} part={part as ComponentPart} />
            case "thinking": return <ThinkBlock key={i} part={part as ThinkingPart} />
            case "step": return <StepLine key={i} part={part as StepPart} />
            default: return null
          }
        })}
      </div>
    </div>
  )
}

function TextBlock({ part }: { part: TextPart }) {
  // Simple markdown-ish rendering: bold, inline code, line breaks
  const segments = part.text.split(/(\*\*[^*]+\*\*|`[^`]+`|\n)/)
  return (
    <p className="text-[13px] leading-[1.7] text-foreground">
      {segments.map((seg, i) => {
        if (seg.startsWith("**") && seg.endsWith("**")) {
          return <strong key={i} className="font-semibold">{seg.slice(2, -2)}</strong>
        }
        if (seg.startsWith("`") && seg.endsWith("`")) {
          return <code key={i} className="text-[12px] bg-muted px-1 py-0.5 rounded font-mono">{seg.slice(1, -1)}</code>
        }
        if (seg === "\n") return <br key={i} />
        return <span key={i}>{seg}</span>
      })}
    </p>
  )
}

function CompRender({ part }: { part: ComponentPart }) {
  if (part.status === "pending" || part.status === "streaming") {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-3 my-2 space-y-2 animate-pulse">
        <div className="h-3 w-2/5 rounded bg-muted" />
        <div className="h-2.5 w-full rounded bg-muted" />
        <div className="h-2.5 w-3/4 rounded bg-muted" />
      </div>
    )
  }
  return <Message message={{ id: "", role: "assistant", parts: [part], createdAt: "" }} />
}

function ThinkBlock({ part }: { part: ThinkingPart }) {
  const active = part.status === "streaming"
  return (
    <details className="group text-[12px]">
      <summary className="flex items-center gap-1.5 text-muted-foreground cursor-pointer select-none list-none">
        {active
          ? <PiSpinnerGapBold className="w-3 h-3 animate-spin text-primary" />
          : <PiCaretRightBold className="w-2.5 h-2.5 transition-transform group-open:rotate-90" />
        }
        {active ? "Thinking..." : `Thought for ${part.durationMs ? (part.durationMs / 1000).toFixed(1) + "s" : "a moment"}`}
      </summary>
      <div className="mt-1 ml-4 rounded-lg border border-border bg-muted/50 px-2.5 py-2 text-[11px] text-muted-foreground leading-relaxed max-h-32 overflow-y-auto">
        {part.text}
      </div>
    </details>
  )
}

function StepLine({ part }: { part: StepPart }) {
  return (
    <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
      {part.stepStatus === "running" && <PiSpinnerGapBold className="w-3 h-3 animate-spin text-primary" />}
      {part.stepStatus === "done" && <PiCheckBold className="w-3 h-3 text-[var(--success,#10b981)]" />}
      {part.stepStatus === "failed" && <PiXBold className="w-3 h-3 text-destructive" />}
      <span>{part.title}</span>
      {part.durationMs != null && part.stepStatus !== "running" && (
        <span className="text-[10px] opacity-50 tabular-nums">{(part.durationMs / 1000).toFixed(1)}s</span>
      )}
    </div>
  )
}

function Dots() {
  return (
    <div className="flex gap-2.5">
      <div className="h-6 w-6 rounded-md shrink-0 flex items-center justify-center bg-primary">
        <PiFeatherDuotone className="w-3 h-3 text-primary-foreground" />
      </div>
      <div className="flex items-center gap-1 pt-1.5">
        {[0, 1, 2].map(i => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
            style={{ animation: `bounce-dot 1.4s infinite ease-in-out both`, animationDelay: `${i * 0.16}s` }} />
        ))}
      </div>
    </div>
  )
}
