import type {
  ClientState,
  FabrikMessage,
  FabrikThread,
  Part,
  StreamEvent,
  ComponentPart,
  TextPart,
  ThinkingPart,
  StepPart,
} from "./types"
import { generateId } from "./utils"

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type StateAction =
  | { type: "INIT_THREAD"; threadId: string }
  | { type: "SET_CURRENT_THREAD"; threadId: string }
  | { type: "DELETE_THREAD"; threadId: string }
  | { type: "UPDATE_THREAD_NAME"; threadId: string; name: string }
  | { type: "LOAD_THREAD"; thread: FabrikThread }
  | { type: "ADD_USER_MESSAGE"; threadId: string; text: string; images?: { url: string; alt?: string }[] }
  | { type: "STREAM_EVENT"; threadId: string; event: StreamEvent }
  | { type: "SET_INPUT"; value: string }
  | { type: "ADD_FILE"; file: File }
  | { type: "CLEAR_FILES" }
  | { type: "RESPOND_ASK"; threadId: string; askId: string; response: unknown }

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

export function createInitialState(threadId?: string): ClientState {
  const id = threadId ?? generateId()
  return {
    currentThreadId: id,
    threads: {
      [id]: createThread(id),
    },
    input: { value: "", files: [] },
    streaming: { isActive: false },
  }
}

function createThread(id: string): FabrikThread {
  const now = new Date().toISOString()
  return {
    id,
    messages: [],
    status: "idle",
    createdAt: now,
    updatedAt: now,
  }
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function reduce(state: ClientState, action: StateAction): ClientState {
  switch (action.type) {
    case "INIT_THREAD": {
      return {
        ...state,
        currentThreadId: action.threadId,
        threads: {
          ...state.threads,
          [action.threadId]: createThread(action.threadId),
        },
      }
    }

    case "SET_CURRENT_THREAD": {
      return { ...state, currentThreadId: action.threadId }
    }

    case "DELETE_THREAD": {
      const { [action.threadId]: _, ...rest } = state.threads
      return { ...state, threads: rest }
    }

    case "UPDATE_THREAD_NAME": {
      return updateThread(state, action.threadId, (t) => ({
        ...t,
        name: action.name,
      }))
    }

    case "LOAD_THREAD": {
      return {
        ...state,
        threads: { ...state.threads, [action.thread.id]: action.thread },
      }
    }

    case "ADD_USER_MESSAGE": {
      const parts: Part[] = [{ type: "text", text: action.text }]
      if (action.images) {
        for (const img of action.images) {
          parts.push({ type: "image", url: img.url, alt: img.alt })
        }
      }
      const msg: FabrikMessage = {
        id: generateId(),
        role: "user",
        parts,
        createdAt: new Date().toISOString(),
      }
      return updateThread(state, action.threadId, (t) => ({
        ...t,
        messages: [...t.messages, msg],
        updatedAt: new Date().toISOString(),
      }))
    }

    case "STREAM_EVENT": {
      return processStreamEvent(state, action.threadId, action.event)
    }

    case "SET_INPUT": {
      return { ...state, input: { ...state.input, value: action.value } }
    }

    case "ADD_FILE": {
      return {
        ...state,
        input: { ...state.input, files: [...state.input.files, action.file] },
      }
    }

    case "CLEAR_FILES": {
      return { ...state, input: { ...state.input, files: [] } }
    }

    case "RESPOND_ASK": {
      return updateThread(state, action.threadId, (t) => {
        const messages = t.messages.map((m) => ({
          ...m,
          parts: m.parts.map((p) =>
            p.type === "ask" && p.id === action.askId
              ? { ...p, response: action.response, status: "answered" as const }
              : p
          ),
        }))
        return { ...t, messages, status: "streaming" }
      })
    }

    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Stream event processing
// ---------------------------------------------------------------------------

function processStreamEvent(
  state: ClientState,
  threadId: string,
  event: StreamEvent
): ClientState {
  switch (event.type) {
    case "start": {
      // Create new assistant message, set streaming
      const msg: FabrikMessage = {
        id: generateId(),
        role: "assistant",
        parts: [],
        createdAt: new Date().toISOString(),
      }
      return {
        ...updateThread(state, threadId, (t) => ({
          ...t,
          status: "streaming",
          messages: [...t.messages, msg],
        })),
        streaming: { isActive: true, runId: event.runId },
      }
    }

    case "done": {
      return {
        ...updateThread(state, threadId, (t) => ({ ...t, status: "idle" })),
        streaming: { isActive: false },
      }
    }

    case "error": {
      return {
        ...updateThread(state, threadId, (t) => ({ ...t, status: "error" })),
        streaming: { isActive: false },
      }
    }

    case "text": {
      return updateLastAssistantMessage(state, threadId, (parts) => {
        const last = parts[parts.length - 1]
        if (last && last.type === "text") {
          // Append to existing text part
          return [
            ...parts.slice(0, -1),
            { ...last, text: last.text + event.delta } as TextPart,
          ]
        }
        // Create new text part
        return [...parts, { type: "text", text: event.delta } as TextPart]
      })
    }

    case "component_start": {
      return updateLastAssistantMessage(state, threadId, (parts) => [
        ...parts,
        {
          type: "component",
          id: event.id,
          name: event.name,
          props: {},
          status: "pending",
        } as ComponentPart,
      ])
    }

    case "component_delta": {
      return updateLastAssistantMessage(state, threadId, (parts) =>
        parts.map((p) => {
          if (p.type !== "component" || p.id !== event.id) return p
          const comp = p as ComponentPart & { _rawJson?: string }
          const raw = (comp._rawJson ?? "") + event.delta
          return {
            ...comp,
            _rawJson: raw,
            props: tryParsePartialJson(raw) ?? comp.props,
            status: "streaming" as const,
          }
        })
      )
    }

    case "component_done": {
      return updateLastAssistantMessage(state, threadId, (parts) =>
        parts.map((p) =>
          p.type === "component" && p.id === event.id
            ? { ...p, props: event.props, status: "done" as const }
            : p
        )
      )
    }

    case "thinking_start": {
      return updateLastAssistantMessage(state, threadId, (parts) => [
        ...parts,
        {
          type: "thinking",
          id: event.id,
          text: "",
          status: "streaming",
        } as ThinkingPart,
      ])
    }

    case "thinking_delta": {
      return updateLastAssistantMessage(state, threadId, (parts) =>
        parts.map((p) =>
          p.type === "thinking" && p.id === event.id
            ? { ...p, text: (p as ThinkingPart).text + event.delta }
            : p
        )
      )
    }

    case "thinking_done": {
      return updateLastAssistantMessage(state, threadId, (parts) =>
        parts.map((p) =>
          p.type === "thinking" && p.id === event.id
            ? { ...p, durationMs: event.durationMs, status: "done" as const }
            : p
        )
      )
    }

    case "step_start": {
      return updateLastAssistantMessage(state, threadId, (parts) => [
        ...parts,
        {
          type: "step",
          id: event.id,
          title: event.title,
          stepStatus: "running",
        } as StepPart,
      ])
    }

    case "step_done": {
      return updateLastAssistantMessage(state, threadId, (parts) =>
        parts.map((p) =>
          p.type === "step" && p.id === event.id
            ? { ...p, stepStatus: event.stepStatus, durationMs: event.durationMs }
            : p
        )
      )
    }

    case "ask": {
      const s = updateLastAssistantMessage(state, threadId, (parts) => [
        ...parts,
        { type: "ask", id: event.id, config: event.config, status: "pending" as const },
      ])
      return updateThread(s, threadId, (t) => ({ ...t, status: "waiting" }))
    }

    // Internal tool call events — not added to parts (they're translated by
    // the stream processor into step/component events before reaching here
    // in the normal flow, but we handle them gracefully if they slip through)
    case "tool_call_start":
    case "tool_call_delta":
    case "tool_call_done":
      return state

    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function updateThread(
  state: ClientState,
  threadId: string,
  updater: (thread: FabrikThread) => FabrikThread
): ClientState {
  const thread = state.threads[threadId]
  if (!thread) return state
  return {
    ...state,
    threads: { ...state.threads, [threadId]: updater(thread) },
  }
}

function updateLastAssistantMessage(
  state: ClientState,
  threadId: string,
  updater: (parts: Part[]) => Part[]
): ClientState {
  return updateThread(state, threadId, (t) => {
    const messages = [...t.messages]
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]!
      if (msg.role === "assistant") {
        messages[i] = {
          ...msg,
          parts: updater(msg.parts),
        }
        break
      }
    }
    return { ...t, messages, updatedAt: new Date().toISOString() }
  })
}

/**
 * Try to parse partial JSON (streaming component props).
 * Attempts to close unclosed braces/brackets.
 */
function tryParsePartialJson(raw: string): Record<string, unknown> | null {
  try {
    return JSON.parse(raw)
  } catch {
    // Try closing with }
    try {
      return JSON.parse(raw + "}")
    } catch {
      // Try closing with "}
      try {
        return JSON.parse(raw + '"}"')
      } catch {
        return null
      }
    }
  }
}
