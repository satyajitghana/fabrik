import type { FabrikMessage, FabrikThread, Part, StreamEvent } from "../core/types"
import { generateId } from "../core/utils"

/** Create a mock FabrikThread with messages */
export function mockThread(
  messages: Array<{ role: "user" | "assistant"; text?: string; parts?: Part[] }>
): FabrikThread {
  const now = new Date().toISOString()

  return {
    id: generateId(),
    messages: messages.map((msg) => {
      const parts: Part[] =
        msg.parts ?? (msg.text ? [{ type: "text", text: msg.text }] : [])
      return mockMessage(msg.role, parts)
    }),
    status: "idle",
    createdAt: now,
    updatedAt: now,
  }
}

/** Create a mock FabrikMessage */
export function mockMessage(
  role: "user" | "assistant",
  parts: Part[]
): FabrikMessage {
  return {
    id: generateId(),
    role,
    parts,
    createdAt: new Date().toISOString(),
  }
}

/** Create convenience events for testing: [start, text delta(s), done] */
export function mockTextEvents(text: string): StreamEvent[] {
  const chunkSize = Math.max(1, Math.ceil(text.length / 3))
  const events: StreamEvent[] = [{ type: "start", runId: generateId() }]

  for (let i = 0; i < text.length; i += chunkSize) {
    events.push({ type: "text", delta: text.slice(i, i + chunkSize) })
  }

  events.push({ type: "done" })
  return events
}

/** Create convenience events for testing: [start, component_start, component_done, done] */
export function mockComponentEvents(
  name: string,
  props: Record<string, unknown>
): StreamEvent[] {
  const id = generateId()

  return [
    { type: "start", runId: generateId() },
    { type: "component_start", id, name },
    { type: "component_done", id, props },
    { type: "done" },
  ]
}
