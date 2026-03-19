"use client"

import {
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react"
import { motion } from "motion/react"
import { useChat } from "../react/use-chat"
import { Message } from "../react/message"
import type {
  ThinkingPart,
  StepPart,
  AskPart,
  FabrikMessage,
} from "../core/types"
import { InputArea } from "./input-area"
import { Thinking } from "./thinking"
import { StepList } from "./step-list"
import { ChoicePicker } from "./choice-picker"
import { ConfirmDialog } from "./confirm-dialog"
import { TypingDots } from "./typing-dots"
import { MessageActions } from "./message-actions"
import { cn } from "./utils"

// ---------------------------------------------------------------------------
// <Chat> — drop-in chat component
// ---------------------------------------------------------------------------

export interface ChatProps {
  sidebar?: boolean
  placeholder?: string
  welcome?: ReactNode
  className?: string
  onFeedback?: (messageId: string, type: "up" | "down") => void
}

export function Chat({
  sidebar,
  placeholder,
  welcome,
  className,
  onFeedback,
}: ChatProps) {
  const { messages, status, respond, isLoading } = useChat()

  // ---- Auto-scroll with user-scroll-pause -----------------------------------
  const scrollRef = useRef<HTMLDivElement>(null)
  const isAutoScrollRef = useRef(true)
  const lastScrollTopRef = useRef(0)

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [])

  // On scroll: detect user scroll-up to pause auto-scroll
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 40
      // If user scrolled up, disable auto-scroll
      if (scrollTop < lastScrollTopRef.current && !isAtBottom) {
        isAutoScrollRef.current = false
      }
      // If user scrolled back to bottom, re-enable
      if (isAtBottom) {
        isAutoScrollRef.current = true
      }
      lastScrollTopRef.current = scrollTop
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [])

  // Auto-scroll when messages change
  useEffect(() => {
    if (isAutoScrollRef.current) {
      scrollToBottom()
    }
  }, [messages, status, scrollToBottom])

  // ---- Helpers ---------------------------------------------------------------

  const collectTextFromMessage = (msg: FabrikMessage): string => {
    return msg.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as { text: string }).text)
      .join("\n")
  }

  const renderThinking = (part: ThinkingPart) => <Thinking part={part} />

  const renderStep = (part: StepPart) => <StepList steps={[part]} />

  const renderAsk = (part: AskPart) => {
    if (part.status !== "pending") return null
    const cfg = part.config
    if (cfg.type === "confirm") {
      return (
        <ConfirmDialog
          config={cfg}
          onRespond={(confirmed) => respond(part.id, confirmed)}
        />
      )
    }
    if (cfg.type === "choice" || cfg.type === "multi_choice") {
      return (
        <ChoicePicker
          config={cfg}
          onRespond={(value) => respond(part.id, value)}
        />
      )
    }
    return null
  }

  const isEmpty = messages.length === 0

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-[var(--card)]",
        className,
      )}
    >
      {/* Sidebar layout wrapper */}
      <div className="flex min-h-0 flex-1">
        {sidebar && <Sidebar />}

        <div className="flex min-h-0 flex-1 flex-col">
          {/* Message area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto scroll-smooth"
          >
            {isEmpty ? (
              <EmptyState welcome={welcome} />
            ) : (
              <div className="mx-auto max-w-2xl px-4 py-6">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={cn(
                      "group mb-6",
                      msg.role === "user" && "flex justify-end",
                    )}
                  >
                    {msg.role === "user" ? (
                      <UserBubble msg={msg} />
                    ) : (
                      <AssistantMessage
                        msg={msg}
                        renderThinking={renderThinking}
                        renderStep={renderStep}
                        renderAsk={renderAsk}
                        onFeedback={onFeedback}
                        collectText={collectTextFromMessage}
                      />
                    )}
                  </motion.div>
                ))}

                {/* Typing indicator */}
                {isLoading &&
                  messages.length > 0 &&
                  messages[messages.length - 1]!.role === "user" && (
                    <div className="mb-6 flex items-start gap-3">
                      <AssistantAvatar />
                      <TypingDots />
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-[var(--border)] bg-[var(--card)] px-4 pb-4 pt-3">
            <div className="mx-auto max-w-2xl">
              <InputArea placeholder={placeholder} />
              <p className="mt-2 text-center text-[11px] text-[var(--muted-foreground)]">
                AI responses may not always be accurate. Please verify important information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function UserBubble({ msg }: { msg: FabrikMessage }) {
  return (
    <div
      className={cn(
        "max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5",
        "bg-[var(--primary)] text-[var(--primary-foreground)]",
      )}
    >
      <Message
        message={msg}
        className="text-sm leading-relaxed [&_p]:text-inherit"
      />
    </div>
  )
}

function AssistantMessage({
  msg,
  renderThinking,
  renderStep,
  renderAsk,
  onFeedback,
  collectText,
}: {
  msg: FabrikMessage
  renderThinking: (part: ThinkingPart) => ReactNode
  renderStep: (part: StepPart) => ReactNode
  renderAsk: (part: AskPart) => ReactNode
  onFeedback?: (messageId: string, type: "up" | "down") => void
  collectText: (msg: FabrikMessage) => string
}) {
  return (
    <div className="flex items-start gap-3">
      <AssistantAvatar />
      <div className="min-w-0 flex-1">
        <Message
          message={msg}
          className={cn(
            "text-sm leading-relaxed text-[var(--foreground)]",
            "[&_p]:mb-2 [&_p:last-child]:mb-0",
          )}
          renderThinking={renderThinking}
          renderStep={renderStep}
          renderAsk={renderAsk}
        />
        {/* Actions row */}
        <div className="mt-1.5">
          <MessageActions
            messageId={msg.id}
            text={collectText(msg)}
            onFeedback={onFeedback}
          />
        </div>
      </div>
    </div>
  )
}

function AssistantAvatar() {
  return (
    <div
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
        "bg-[var(--muted)]",
      )}
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
        className="text-[var(--muted-foreground)]"
      >
        <path d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5Z" />
        <path d="M8.5 14.5A6.5 6.5 0 0 0 2 21h20a6.5 6.5 0 0 0-6.5-6.5h-7Z" />
      </svg>
    </div>
  )
}

function EmptyState({ welcome }: { welcome?: ReactNode }) {
  const { input, send } = useChat()

  const suggestions = [
    "What can you help me with?",
    "Tell me about yourself",
    "Show me an example",
  ]

  const handleSuggestion = useCallback(
    (text: string) => {
      input.set(text)
      // Small delay to let state propagate
      requestAnimationFrame(() => send())
    },
    [input, send],
  )

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div
          className={cn(
            "mb-5 flex h-14 w-14 items-center justify-center rounded-2xl",
            "bg-[var(--muted)]",
          )}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--muted-foreground)]"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>

        {welcome ?? (
          <>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              How can I help you today?
            </h2>
            <p className="mt-1.5 max-w-sm text-sm text-[var(--muted-foreground)]">
              Ask me anything or choose a suggestion below to get started.
            </p>
          </>
        )}

        {/* Suggestion pills */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSuggestion(s)}
              className={cn(
                "rounded-full border border-[var(--border)] px-4 py-2 text-sm",
                "text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
                "transition-colors duration-150",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sidebar (thread list)
// ---------------------------------------------------------------------------

function Sidebar() {
  // Lazy-import to keep sidebar optional and avoid hooks if not rendered
  // We access the thread list through the existing hook path
  return <SidebarInner />
}

function SidebarInner() {
  // We need useThreadList but it's not in useChat, so import directly
  const { messages } = useChat()

  return (
    <div
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--muted)]",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <span className="text-sm font-semibold text-[var(--foreground)]">
          Chats
        </span>
        <button
          type="button"
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md",
            "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
            "transition-colors duration-150",
          )}
          aria-label="New chat"
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
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Thread list placeholder */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {messages.length > 0 ? (
          <div
            className={cn(
              "rounded-lg bg-[var(--border)]/50 px-3 py-2",
            )}
          >
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              Current conversation
            </span>
            <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
              {messages.length} message{messages.length !== 1 ? "s" : ""}
            </p>
          </div>
        ) : (
          <p className="px-3 py-8 text-center text-xs text-[var(--muted-foreground)]">
            No conversations yet
          </p>
        )}
      </div>
    </div>
  )
}
