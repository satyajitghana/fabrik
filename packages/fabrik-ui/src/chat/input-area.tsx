"use client"

import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
  type ChangeEvent,
} from "react"
import { useChat } from "../react/use-chat"
import { cn } from "./utils"

export interface InputAreaProps {
  placeholder?: string
  className?: string
}

export function InputArea({
  placeholder = "Send a message...",
  className,
}: InputAreaProps) {
  const { input, send, status } = useChat()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isDisabled = status === "streaming" || status === "waiting"

  // Auto-resize textarea
  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [])

  useEffect(() => {
    resize()
  }, [input.value, resize])

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      input.set(e.target.value)
    },
    [input],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        if (!isDisabled && input.value.trim()) {
          send()
        }
      }
    },
    [isDisabled, input.value, send],
  )

  const handleFileClick = useCallback(() => {
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.multiple = true
    fileInput.accept = "image/*,.pdf,.txt,.csv,.json,.md"
    fileInput.onchange = () => {
      if (fileInput.files) {
        Array.from(fileInput.files).forEach((f) => input.addFile(f))
      }
    }
    fileInput.click()
  }, [input])

  return (
    <div className={cn("relative", className)}>
      {/* File chips */}
      {input.files.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pb-2">
          {input.files.map((f, i) => {
            const isImage = f.type.startsWith("image/")
            return (
              <div
                key={`${f.name}-${i}`}
                className={cn(
                  "group/chip relative inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2 py-1",
                  "bg-[var(--muted)] text-[var(--muted-foreground)]",
                  isImage ? "pl-1" : "",
                )}
              >
                {isImage ? (
                  <img
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    className="h-8 w-8 rounded object-cover"
                  />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                )}
                <span className="max-w-[120px] truncate text-xs">{f.name}</span>
                <button
                  type="button"
                  onClick={() => input.removeFile(i)}
                  className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full hover:bg-[var(--border)] transition-colors"
                  aria-label={`Remove ${f.name}`}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div
        className={cn(
          "flex items-end gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-2 py-1.5",
          "shadow-sm transition-shadow duration-200 focus-within:shadow-md",
        )}
      >
        {/* Attachment button */}
        <button
          type="button"
          onClick={handleFileClick}
          disabled={isDisabled}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
            "transition-colors duration-150",
            "disabled:pointer-events-none disabled:opacity-40",
          )}
          aria-label="Attach file"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input.value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isDisabled}
          rows={1}
          className={cn(
            "max-h-[200px] min-h-[34px] flex-1 resize-none bg-transparent py-1.5 text-sm leading-relaxed",
            "text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]",
            "outline-none",
            "disabled:opacity-50",
          )}
        />

        {/* Send button */}
        <button
          type="button"
          onClick={send}
          disabled={isDisabled || !input.value.trim()}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            "bg-[var(--primary)] text-[var(--primary-foreground)]",
            "transition-all duration-150",
            "hover:opacity-90 active:scale-95",
            "disabled:opacity-30 disabled:hover:opacity-30 disabled:active:scale-100",
          )}
          aria-label={isDisabled ? "Sending..." : "Send message"}
        >
          {isDisabled ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="animate-spin"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
