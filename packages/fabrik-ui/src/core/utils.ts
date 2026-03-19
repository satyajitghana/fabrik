let counter = 0

/** Generate a unique ID */
export function generateId(): string {
  return `${Date.now().toString(36)}_${(counter++).toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

/** Format milliseconds as human-readable duration */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  const remaining = Math.round(seconds % 60)
  return `${minutes}m ${remaining}s`
}

/** Check if a tool name is a component render tool */
export function isComponentTool(name: string): boolean {
  return name.startsWith("show_") && name.length > 5
}

/** Extract component name from show_ tool name */
export function extractComponentName(name: string): string {
  return name.slice(5) // Remove "show_" prefix
}

/** Check if a tool name is an internal elicitation tool */
export function isElicitationTool(name: string): boolean {
  return name.startsWith("__fabrik_ask_")
}
