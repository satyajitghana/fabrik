/** Apply dark mode class to the document */
export function applyTheme(mode: "light" | "dark" | "system"): (() => void) | undefined {
  if (typeof document === "undefined") return

  const apply = (isDark: boolean) => {
    document.documentElement.classList.toggle("dark", isDark)
  }

  if (mode === "dark") {
    apply(true)
    return
  }

  if (mode === "light") {
    apply(false)
    return
  }

  // "system" — listen for changes
  const mq = window.matchMedia("(prefers-color-scheme: dark)")
  apply(mq.matches)
  const handler = (e: MediaQueryListEvent) => apply(e.matches)
  mq.addEventListener("change", handler)
  return () => mq.removeEventListener("change", handler)
}
