/**
 * AG-UI Protocol adapter — connects Fabrik to any AG-UI compatible agent.
 *
 * AG-UI is the standard protocol used by CopilotKit, Tambo, and many
 * agent frameworks (LangGraph, CrewAI, Mastra, etc.).
 *
 * Usage:
 *   import { agui } from "@fabrik-sdk/ui/agui"
 *
 *   // Connect to a LangGraph agent
 *   const provider = agui({ url: "http://localhost:8000/agent/run" })
 *
 *   // Or in a handler
 *   export const POST = handler({ provider: agui({ url: AGENT_URL }) })
 */

import type { Provider, StreamEvent, StreamOptions, FabrikMessage } from "../core/types"

export interface AguiOptions {
  /** URL of the AG-UI compatible endpoint */
  url: string
  /** Optional headers to include with requests */
  headers?: Record<string, string>
}

/**
 * AG-UI event types (subset we handle)
 * Full spec: https://docs.ag-ui.com/
 */
interface AguiEvent {
  type: string
  // Text events
  messageId?: string
  delta?: string
  role?: string
  // Tool events
  toolCallId?: string
  toolCallName?: string
  // Run events
  threadId?: string
  runId?: string
  // Error
  message?: string
  // Snapshot
  snapshot?: unknown
}

export function agui(options: AguiOptions): Provider {
  const { url, headers: extraHeaders } = options

  return {
    name: "ag-ui",

    async *stream(streamOptions: StreamOptions): AsyncIterable<StreamEvent> {
      const { messages, tools, systemPrompt, signal } = streamOptions

      const runId = Math.random().toString(36).slice(2)
      yield { type: "start", runId }

      try {
        // Build AG-UI request body
        const body = {
          threadId: `thread-${Date.now()}`,
          runId,
          messages: messages.map(toAguiMessage),
          tools: tools.map(spec => ({
            type: "function",
            function: {
              name: spec.name,
              description: spec.description,
              parameters: spec.parameters,
            },
          })),
          context: systemPrompt ? [{ description: "System prompt", value: systemPrompt }] : [],
        }

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            ...extraHeaders,
          },
          body: JSON.stringify(body),
          signal,
        })

        if (!response.ok) {
          const errText = await response.text().catch(() => response.statusText)
          yield { type: "error", message: `AG-UI error: ${response.status} ${errText}` }
          return
        }

        const reader = response.body?.getReader()
        if (!reader) {
          yield { type: "error", message: "Empty response body from AG-UI endpoint" }
          return
        }

        const decoder = new TextDecoder()
        let buffer = ""
        const toolArgs = new Map<string, string>()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split(/\r?\n\r?\n/)
          buffer = parts.pop()!

          for (const part of parts) {
            const trimmed = part.trim()
            if (!trimmed) continue

            // Parse SSE: data lines + optional event type
            let eventType = ""
            let data = ""
            for (const line of trimmed.split(/\r?\n/)) {
              if (line.startsWith("event: ")) eventType = line.slice(7).trim()
              else if (line.startsWith("data: ")) data = line.slice(6)
            }

            if (!data) continue

            let event: AguiEvent
            try {
              event = JSON.parse(data) as AguiEvent
            } catch {
              continue
            }

            // Map AG-UI events to Fabrik StreamEvents
            const type = eventType || event.type || ""

            switch (type) {
              case "TEXT_MESSAGE_CONTENT":
              case "text_message_content":
                if (event.delta) {
                  yield { type: "text", delta: event.delta }
                }
                break

              case "TOOL_CALL_START":
              case "tool_call_start":
                if (event.toolCallId && event.toolCallName) {
                  yield {
                    type: "tool_call_start",
                    id: event.toolCallId,
                    toolName: event.toolCallName,
                  }
                  toolArgs.set(event.toolCallId, "")
                }
                break

              case "TOOL_CALL_ARGS":
              case "tool_call_args":
                if (event.toolCallId && event.delta) {
                  const current = toolArgs.get(event.toolCallId) ?? ""
                  toolArgs.set(event.toolCallId, current + event.delta)
                  yield {
                    type: "tool_call_delta",
                    id: event.toolCallId,
                    delta: event.delta,
                  }
                }
                break

              case "TOOL_CALL_END":
              case "tool_call_end":
                if (event.toolCallId) {
                  const argsStr = toolArgs.get(event.toolCallId) ?? "{}"
                  let args: Record<string, unknown> = {}
                  try { args = JSON.parse(argsStr) as Record<string, unknown> } catch { /* empty */ }
                  yield {
                    type: "tool_call_done",
                    id: event.toolCallId,
                    toolName: "", // AG-UI sends name in start, not end
                    args,
                  }
                  toolArgs.delete(event.toolCallId)
                }
                break

              case "RUN_FINISHED":
              case "run_finished":
                // Stream complete
                break

              case "RUN_ERROR":
              case "run_error":
                yield { type: "error", message: event.message ?? "AG-UI run error" }
                break

              // Custom Tambo-style component events
              case "tambo.component.start":
              case "CUSTOM": {
                // Handle custom events (Tambo component streaming, etc.)
                if (event.type === "tambo.component.start") {
                  yield { type: "ui_start", id: String(event.toolCallId ?? runId) }
                }
                break
              }
            }
          }
        }
      } catch (err: unknown) {
        if (signal?.aborted) return
        yield { type: "error", message: err instanceof Error ? err.message : String(err) }
      }

      yield { type: "done" }
    },
  }
}

// ---------------------------------------------------------------------------
// Message conversion: Fabrik → AG-UI format
// ---------------------------------------------------------------------------

function toAguiMessage(msg: FabrikMessage): Record<string, unknown> {
  const text = msg.parts
    .filter(p => p.type === "text")
    .map(p => (p as { text: string }).text)
    .join("")

  return {
    id: msg.id,
    role: msg.role,
    content: text || " ",
  }
}
