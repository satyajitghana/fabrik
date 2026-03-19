import type { Provider, StreamOptions, StreamEvent } from "../core/types"

// ---------------------------------------------------------------------------
// custom() — wraps a user-provided stream function into a Provider
// ---------------------------------------------------------------------------

export interface CustomProviderOptions {
  name: string
  stream: (
    options: StreamOptions,
  ) => AsyncIterable<StreamEvent> | Promise<AsyncIterable<StreamEvent>>
}

export function custom(options: CustomProviderOptions): Provider {
  const { name, stream } = options

  return {
    name,
    async *stream(streamOptions: StreamOptions): AsyncIterable<StreamEvent> {
      const result = stream(streamOptions)
      const iterable = result instanceof Promise ? await result : result
      yield* iterable
    },
  }
}

// ---------------------------------------------------------------------------
// EventStream — push-based async iterable for bridging agent frameworks
// ---------------------------------------------------------------------------

export class EventStream implements AsyncIterable<StreamEvent> {
  private queue: StreamEvent[] = []
  private resolve: ((value: IteratorResult<StreamEvent>) => void) | null = null
  private done = false
  private error: Error | null = null

  /** Push an event into the stream. */
  push(event: StreamEvent): void {
    if (this.done) return

    if (this.resolve) {
      const r = this.resolve
      this.resolve = null
      r({ value: event, done: false })
    } else {
      this.queue.push(event)
    }
  }

  /** Signal that the stream has ended successfully. */
  end(): void {
    if (this.done) return
    this.done = true

    if (this.resolve) {
      const r = this.resolve
      this.resolve = null
      r({ value: undefined as unknown as StreamEvent, done: true as const })
    }
  }

  /** Signal that the stream has ended with an error. */
  fail(err: Error | string): void {
    if (this.done) return
    this.done = true
    this.error = typeof err === "string" ? new Error(err) : err

    if (this.resolve) {
      const r = this.resolve
      this.resolve = null
      r({ value: undefined as unknown as StreamEvent, done: true as const })
    }
  }

  [Symbol.asyncIterator](): AsyncIterator<StreamEvent> {
    return {
      next: (): Promise<IteratorResult<StreamEvent>> => {
        // Drain queued events first
        if (this.queue.length > 0) {
          return Promise.resolve({
            value: this.queue.shift()!,
            done: false,
          })
        }

        // If an error was recorded, reject
        if (this.error) {
          return Promise.reject(this.error)
        }

        // If already done, signal completion
        if (this.done) {
          return Promise.resolve({
            value: undefined as unknown as StreamEvent,
            done: true as const,
          })
        }

        // Wait for the next push / end / fail
        return new Promise<IteratorResult<StreamEvent>>((resolve) => {
          this.resolve = resolve
        })
      },
    }
  }
}

/** Create a new EventStream instance. */
export function eventStream(): EventStream {
  return new EventStream()
}

// ---------------------------------------------------------------------------
// parseSseStream — generic SSE parser → StreamEvent
// ---------------------------------------------------------------------------

/**
 * Parses a standard `text/event-stream` response where each SSE `data:`
 * payload is a JSON-encoded `StreamEvent`.
 */
export async function* parseSseStream(
  response: Response,
): AsyncIterable<StreamEvent> {
  const body = response.body
  if (!body) return

  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      // Keep the last partial line in the buffer
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        const trimmed = line.trim()

        if (trimmed === "" || trimmed.startsWith(":")) continue

        if (trimmed.startsWith("data:")) {
          const data = trimmed.slice(5).trim()
          if (data === "[DONE]") return

          try {
            const event: StreamEvent = JSON.parse(data)
            yield event
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    }

    // Process any remaining data in buffer
    const remaining = buffer.trim()
    if (remaining.startsWith("data:")) {
      const data = remaining.slice(5).trim()
      if (data && data !== "[DONE]") {
        try {
          const event: StreamEvent = JSON.parse(data)
          yield event
        } catch {
          // Skip malformed JSON
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// ---------------------------------------------------------------------------
// parseOpenAiStream — OpenAI SSE → fabrik StreamEvents
// ---------------------------------------------------------------------------

/**
 * Parses an OpenAI-compatible SSE stream (e.g., from a proxy or direct API
 * call made via `fetch`) and converts the chunks into fabrik `StreamEvent`s.
 */
export async function* parseOpenAiStream(
  response: Response,
): AsyncIterable<StreamEvent> {
  const body = response.body
  if (!body) return

  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  const runId = generateId()
  yield { type: "start", runId }

  // Track in-flight tool calls by index
  const toolCalls = new Map<
    number,
    { id: string; name: string; args: string }
  >()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        const trimmed = line.trim()

        if (trimmed === "" || trimmed.startsWith(":")) continue

        if (trimmed.startsWith("data:")) {
          const data = trimmed.slice(5).trim()
          if (data === "[DONE]") {
            // Flush remaining tool calls
            for (const [, tc] of toolCalls) {
              yield {
                type: "tool_call_done",
                id: tc.id,
                toolName: tc.name,
                args: safeJsonParse(tc.args),
              }
            }
            toolCalls.clear()
            yield { type: "done" }
            return
          }

          let chunk: Record<string, unknown>
          try {
            chunk = JSON.parse(data) as Record<string, unknown>
          } catch {
            continue
          }

          const choices = chunk.choices as Array<{ delta?: { content?: string; tool_calls?: Array<{ index?: number; id?: string; function?: { name?: string; arguments?: string } }> }; finish_reason?: string | null }> | undefined
          const delta = choices?.[0]?.delta
          if (!delta) continue

          // --- Text content ---
          if (delta.content) {
            yield { type: "text", delta: delta.content }
          }

          // --- Tool calls ---
          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0

              if (!toolCalls.has(idx)) {
                const callId = tc.id ?? generateId()
                const name = tc.function?.name ?? ""
                toolCalls.set(idx, { id: callId, name, args: "" })
                yield { type: "tool_call_start", id: callId, toolName: name }
              }

              const tracked = toolCalls.get(idx)!

              if (tc.function?.name && !tracked.name) {
                tracked.name = tc.function.name
              }

              if (tc.function?.arguments) {
                tracked.args += tc.function.arguments
                yield {
                  type: "tool_call_delta",
                  id: tracked.id,
                  delta: tc.function.arguments,
                }
              }
            }
          }

          // --- Finish reason ---
          const finishReason = choices?.[0]?.finish_reason
          if (finishReason === "stop" || finishReason === "tool_calls") {
            for (const [, tc] of toolCalls) {
              yield {
                type: "tool_call_done",
                id: tc.id,
                toolName: tc.name,
                args: safeJsonParse(tc.args),
              }
            }
            toolCalls.clear()
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  // If we reached here without [DONE], still emit done
  for (const [, tc] of toolCalls) {
    yield {
      type: "tool_call_done",
      id: tc.id,
      toolName: tc.name,
      args: safeJsonParse(tc.args),
    }
  }
  yield { type: "done" }
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function safeJsonParse(str: string): Record<string, unknown> {
  try {
    return str ? JSON.parse(str) : {}
  } catch {
    return { _raw: str }
  }
}
