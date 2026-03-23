"use client"

import { Fabrik, useChat, Message } from "@fabrik-sdk/ui/react"
import { server } from "@fabrik-sdk/ui/server"
import { playgroundLibrary } from "./components"
import { shadcnLibrary } from "./shadcn-components"
import { playgroundTools } from "./tools"
import { createLangLibrary, allLangComponents } from "@fabrik-sdk/ui/lang"

// Generate DSL prompt once
const langLibrary = createLangLibrary(allLangComponents)
const dslPrompt = langLibrary.prompt()
import { useRef, useEffect } from "react"
import { motion, useReducedMotion } from "motion/react"
import { PiFeatherDuotone, PiPaperPlaneRightFill, PiArrowLeftBold, PiCheckCircleFill } from "react-icons/pi"
import { Loader2Icon } from "lucide-react"
import type { TextPart, ToolDef } from "@fabrik-sdk/ui"

const spring = { type: "spring" as const, damping: 30, stiffness: 300 }

const provider = server({ url: "/api/chat" })

export default function PlaygroundPage() {
  return (
    <Fabrik
      provider={provider}
      components={[...playgroundLibrary, ...shadcnLibrary]}
      tools={playgroundTools as ToolDef[]}
      maxSteps={5}
      systemPrompt={[
        "You are a helpful AI assistant that renders rich UI using Fabrik Lang DSL.",
        "",
        "## How to respond",
        "For ANY request that benefits from visual presentation (dashboards, comparisons, data display, charts, cards, etc.), output Fabrik Lang DSL code. The DSL will be parsed and rendered as interactive UI.",
        "",
        "For simple text answers (greetings, short facts, math results), respond with plain text.",
        "",
        "## Data fetching",
        "Use tools FIRST to get real data, THEN output DSL with the data:",
        "- WEATHER: Call get_weather tool, then output DSL with the result",
        '- WEATHER (no city): Call __fabrik_ask_permission with title="Location Access", message="Can I access your location to show local weather?", resource="Location". If allowed → get_location → get_weather. If denied → __fabrik_ask_text to ask city.',
        "- STOCKS: Call get_stock_price tool, then output DSL with the result",
        "- SEARCH: Call web_search tool, then output DSL with the result",
        "- MATH: Call calculate tool, then respond with result",
        "",
        dslPrompt,
      ].join("\n")}
    >
      <div className="min-h-svh bg-background">
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
                  <PiFeatherDuotone className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-[13px] font-semibold">Playground</span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground/70">Powered by Gemini</span>
          </div>
        </motion.header>

        <ChatArea />
      </div>
    </Fabrik>
  )
}

function ChatArea() {
  const { messages, input, send, status } = useChat()
  const reduced = useReducedMotion()
  const scrollRef = useRef<HTMLDivElement>(null)
  const pendingSendRef = useRef(false)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, status])

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

  // Check if an assistant message has any visible content
  function hasContent(msg: typeof messages[0]): boolean {
    return msg.parts.some(p =>
      (p.type === "text" && (p as TextPart).text.trim().length > 0) ||
      p.type === "component" ||
      p.type === "step" ||
      p.type === "ui" ||
      p.type === "ask"
    )
  }

  const isStreaming = status === "streaming"

  return (
    <div className="max-w-4xl mx-auto min-h-[calc(100svh-3.5rem)] flex flex-col">
      <div className="flex flex-col flex-1">
        <div ref={scrollRef} className="flex-1 px-4 py-8">
          {messages.length === 0 && !isStreaming && (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <PiFeatherDuotone className="w-8 h-8 mb-4 text-primary" />
              <h2 className="text-[15px] font-semibold">Fabrik Playground</h2>
              <p className="text-[13px] text-muted-foreground mt-1 max-w-sm">
                Chat with a real LLM. Ask for weather, charts, or dashboards to see generative UI.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {["What's the weather?", "AAPL stock dashboard", "Compare React vs Vue vs Svelte", "Search for Next.js 16"].map(t => (
                  <button key={t} onClick={() => handleSuggestion(t)}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-ring transition-all">
                    {t}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          <div className="space-y-3">
            {messages.map((msg, msgIdx) => {
              if (msg.role === "user") {
                const text = msg.parts.filter(p => p.type === "text").map(p => (p as TextPart).text).join("")
                if (!text.trim()) return null
                return (
                  <motion.div key={msg.id} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="flex justify-end">
                    <div className="max-w-[75%] rounded-2xl rounded-br-md bg-primary text-white px-4 py-2.5 text-[13px]">
                      {text}
                    </div>
                  </motion.div>
                )
              }

              if (!hasContent(msg)) return null

              // Show avatar only on the last assistant message
              const isLastAssistant = messages.slice(msgIdx + 1).every(m => m.role === "user" || !hasContent(m))

              return (
                <motion.div key={msg.id} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="flex gap-2.5">
                  <div className="w-6 shrink-0">
                    {isLastAssistant && (
                      <div className="mt-0.5 h-6 w-6 rounded-md flex items-center justify-center bg-primary">
                        <PiFeatherDuotone className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5 pt-0.5 text-[13px] leading-relaxed">
                    <Message message={msg} />
                  </div>
                </motion.div>
              )
            })}

            {/* Loading indicator with spinner */}
            {isStreaming && (
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={spring}
                className="flex gap-2.5"
              >
                <div className="w-6 shrink-0">
                  <div className="mt-0.5 h-6 w-6 rounded-md flex items-center justify-center bg-primary">
                    <PiFeatherDuotone className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1.5 text-[13px] text-muted-foreground">
                  <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-border px-4 py-3 bg-background/80 backdrop-blur-md">
          <form onSubmit={e => { e.preventDefault(); send() }}>
            <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-1.5 pl-3.5 focus-within:ring-2 focus-within:ring-primary/20 transition-shadow">
              <textarea value={input.value} onChange={e => input.set(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Ask anything..."
                rows={1} disabled={isStreaming}
                className="flex-1 resize-none bg-transparent py-2 text-[13px] placeholder:text-muted-foreground focus:outline-none" />
              <button type="submit" disabled={!input.value.trim() || isStreaming}
                aria-label="Send message"
                className="shrink-0 h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center disabled:opacity-20 transition-opacity hover:opacity-80">
                {isStreaming ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" /> : <PiPaperPlaneRightFill className="w-3.5 h-3.5" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
