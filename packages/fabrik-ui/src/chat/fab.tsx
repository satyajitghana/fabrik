"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { motion, AnimatePresence } from "motion/react"
import { Chat } from "./chat"
import { cn } from "./utils"

// ---------------------------------------------------------------------------
// <Fab> — floating action button that opens a chat panel
// ---------------------------------------------------------------------------

export interface FabProps {
  position?: "bottom-right" | "bottom-left"
  welcome?: string
  width?: number
  height?: number
}

export function Fab({
  position = "bottom-right",
  welcome,
  width = 400,
  height = 600,
}: FabProps) {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const fabRef = useRef<HTMLButtonElement>(null)
  const isMobile = useMobile()

  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])
  const close = useCallback(() => setIsOpen(false), [])

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close()
        fabRef.current?.focus()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [isOpen, close])

  // Focus trap: keep Tab within panel when open
  useEffect(() => {
    if (!isOpen) return
    const panel = panelRef.current
    if (!panel) return

    const focusableSelector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(focusableSelector),
      )
      if (focusable.length === 0) return

      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [isOpen])

  // Focus first focusable element when panel opens
  useEffect(() => {
    if (!isOpen) return
    const panel = panelRef.current
    if (!panel) return
    requestAnimationFrame(() => {
      const textarea = panel.querySelector("textarea")
      textarea?.focus()
    })
  }, [isOpen])

  const isLeft = position === "bottom-left"

  return (
    <>
      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "fixed z-50",
              isMobile
                ? "inset-0"
                : cn(
                    "bottom-24",
                    isLeft ? "left-5" : "right-5",
                  ),
            )}
            style={
              isMobile
                ? undefined
                : { width, height }
            }
          >
            <div
              className={cn(
                "flex h-full flex-col overflow-hidden",
                isMobile
                  ? "bg-[var(--card)]"
                  : cn(
                      "rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl",
                    ),
              )}
            >
              {/* Panel header */}
              <div
                className={cn(
                  "flex items-center justify-between border-b border-[var(--border)] px-4 py-3",
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full",
                      "bg-[var(--primary)]",
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
                      className="text-[var(--primary-foreground)]"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    {welcome ?? "Chat"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md",
                    "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
                    "transition-colors duration-150",
                  )}
                  aria-label="Close chat"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Chat body */}
              <div className="min-h-0 flex-1">
                <Chat />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        ref={fabRef}
        type="button"
        onClick={toggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "fixed z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg",
          "bg-[var(--primary)] text-[var(--primary-foreground)]",
          "transition-shadow duration-200 hover:shadow-xl",
          "bottom-5",
          isLeft ? "left-5" : "right-5",
        )}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        aria-expanded={isOpen}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </motion.svg>
          ) : (
            <motion.svg
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  )
}

// ---------------------------------------------------------------------------
// useMobile — detects viewport < 640px
// ---------------------------------------------------------------------------

function useMobile(breakpoint = 640): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [breakpoint])

  return isMobile
}
