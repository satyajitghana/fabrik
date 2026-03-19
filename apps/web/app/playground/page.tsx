"use client"

import { Fabrik, useChat, Message } from "@fabrik/ui/react"
import { createPlaygroundProvider } from "./mock-provider"
import { playgroundLibrary } from "./components"
import { useRef, useEffect } from "react"
import { motion, useReducedMotion } from "motion/react"
import { PiFeatherDuotone, PiPaperPlaneRightFill, PiSpinnerGapBold, PiArrowLeftBold } from "react-icons/pi"
import type { FabrikMessage, TextPart, ComponentPart, StepPart } from "@fabrik/ui"

const spring = { type: "spring" as const, damping: 30, stiffness: 300 }

const provider = createPlaygroundProvider()

export default function PlaygroundPage() {
  return (
    <Fabrik provider={provider} components={playgroundLibrary}>
      <div className="min-h-svh bg-background">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between px-6 h-14">
            <div className="flex items-center gap-3">
              <a href="/" aria-label="Go back" className="text-muted-foreground hover:text-foreground transition-colors">
                <PiArrowLeftBold className="w-4 h-4" />
              </a>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md flex items-center justify-center bg-primary">
                  <PiFeatherDuotone className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <span className="text-[13px] font-semibold">Playground</span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground/70">Try: weather, chart, dashboard</span>
          </div>
        </motion.header>

        {/* Chat */}
        <ChatArea />
      </div>
    </Fabrik>
  )
}

function ChatArea() {
  const { messages, isLoading, input, send, status } = useChat()
  const reduced = useReducedMotion()
  const scrollRef = useRef<HTMLDivElement>(null)
  const pendingSendRef = useRef(false)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (pendingSendRef.current && input.value) {
      pendingSendRef.current = false
      send()
    }
  }, [input.value, send])

  function handleSuggestion(text: string) {
    input.set(text)
    pendingSendRef.current = true
  }

  return (
    <div className="max-w-2xl mx-auto h-[calc(100svh-3.5rem)]">
      <div className="flex flex-col h-full">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-8">
          {messages.length === 0 && (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <PiFeatherDuotone className="w-8 h-8 mb-4 text-primary" />
              <h2 className="text-[15px] font-semibold">Try the Playground</h2>
              <p className="text-[13px] text-muted-foreground mt-1 max-w-sm">
                Type "weather", "chart", or "dashboard" to see generative UI in action.
              </p>
              <div className="flex gap-2 mt-4">
                {["Show weather", "Revenue chart", "Dashboard stats"].map(t => (
                  <button key={t} onClick={() => handleSuggestion(t)}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-ring transition-all">
                    {t}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          <div className="space-y-4">
            {messages.map(msg =>
              msg.role === "user"
                ? <motion.div key={msg.id} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="flex justify-end"><div className="max-w-[75%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 text-[13px]">{msg.parts.filter(p => p.type === "text").map(p => (p as TextPart).text).join("")}</div></motion.div>
                : <motion.div key={msg.id} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="flex gap-2.5">
                    <div className="mt-0.5 h-6 w-6 rounded-md shrink-0 flex items-center justify-center bg-primary">
                      <PiFeatherDuotone className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
                      <Message message={msg} />
                    </div>
                  </motion.div>
            )}
          </div>
        </div>

        <div className="border-t border-border px-4 py-3">
          <form onSubmit={e => { e.preventDefault(); send() }}>
            <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-1.5 pl-3.5 focus-within:ring-2 focus-within:ring-primary/20 transition-shadow">
              <textarea value={input.value} onChange={e => input.set(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Try: weather, chart, dashboard..."
                rows={1} disabled={status === "streaming"}
                className="flex-1 resize-none bg-transparent py-2 text-[13px] placeholder:text-muted-foreground focus:outline-none" />
              <button type="submit" disabled={!input.value.trim() || status === "streaming"}
                aria-label="Send message"
                className="shrink-0 h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-20 transition-opacity hover:opacity-80">
                {status === "streaming" ? <PiSpinnerGapBold className="w-3.5 h-3.5 animate-spin" /> : <PiPaperPlaneRightFill className="w-3.5 h-3.5" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
