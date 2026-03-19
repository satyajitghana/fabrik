import type {
  Provider,
  StreamOptions,
  StreamEvent,
  FabrikMessage,
  ToolSpec,
} from "../core/types"

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface AnthropicOptions {
  apiKey: string
  model?: string
}

export function anthropic(options: AnthropicOptions): Provider {
  const { apiKey, model: defaultModel } = options

  return {
    name: "anthropic",

    async *stream(streamOptions: StreamOptions): AsyncIterable<StreamEvent> {
      const { messages, systemPrompt, tools, model, signal } = streamOptions
      const resolvedModel = model ?? defaultModel ?? "claude-sonnet-4-20250514"

      // Dynamic import — @anthropic-ai/sdk is an optional peer dependency
      // @ts-expect-error -- @anthropic-ai/sdk is an optional peer dep; not present at type-check time
      const { default: Anthropic } = await import("@anthropic-ai/sdk")

      const client = new Anthropic({ apiKey })

      const anthropicMessages = convertMessages(messages)
      const anthropicTools = tools.length > 0 ? convertTools(tools) : undefined

      const runId = generateId()
      yield { type: "start", runId }

      // Anthropic SDK stream event shape (minimal interface for the fields we access)
      type AnthropicEvent =
        | { type: "content_block_start"; index: number; content_block: { type: string; id?: string; name?: string } }
        | { type: "content_block_delta"; index: number; delta: { type: string; text?: string; thinking?: string; partial_json?: string } }
        | { type: "content_block_stop"; index: number }
        | { type: "message_delta" }
        | { type: "message_stop" }
      let stream: AsyncIterable<AnthropicEvent>
      try {
        stream = client.messages.stream({
          model: resolvedModel,
          messages: anthropicMessages,
          ...(systemPrompt ? { system: systemPrompt } : {}),
          ...(anthropicTools ? { tools: anthropicTools } : {}),
          max_tokens: 8192,
          ...(signal ? { signal } : {}),
        })
      } catch (err: unknown) {
        yield { type: "error", message: errorMessage(err) }
        return
      }

      // Track thinking blocks for duration calculation
      const thinkingTimers = new Map<number, { id: string; startMs: number }>()
      // Track the current block index → assigned ID mapping
      const blockIds = new Map<number, string>()

      try {
        for await (const event of stream) {
          switch (event.type) {
            case "content_block_start": {
              const idx: number = event.index
              const block = event.content_block

              if (block.type === "thinking") {
                const id = generateId()
                blockIds.set(idx, id)
                thinkingTimers.set(idx, { id, startMs: Date.now() })
                yield { type: "thinking_start", id }
              } else if (block.type === "tool_use") {
                const id = block.id ?? generateId()
                blockIds.set(idx, id)
                yield { type: "tool_call_start", id, toolName: block.name ?? "" }
              } else if (block.type === "text") {
                // Text block started — nothing to yield, wait for deltas
                const id = generateId()
                blockIds.set(idx, id)
              }
              break
            }

            case "content_block_delta": {
              const idx: number = event.index
              const delta = event.delta

              if (delta.type === "text_delta") {
                yield { type: "text", delta: delta.text ?? "" }
              } else if (delta.type === "thinking_delta") {
                const id = blockIds.get(idx) ?? generateId()
                yield { type: "thinking_delta", id, delta: delta.thinking ?? "" }
              } else if (delta.type === "input_json_delta") {
                const id = blockIds.get(idx) ?? generateId()
                yield { type: "tool_call_delta", id, delta: delta.partial_json ?? "" }
              }
              break
            }

            case "content_block_stop": {
              const idx: number = event.index
              const timer = thinkingTimers.get(idx)

              if (timer) {
                const durationMs = Date.now() - timer.startMs
                yield { type: "thinking_done", id: timer.id, durationMs }
                thinkingTimers.delete(idx)
              }
              break
            }

            case "message_delta": {
              // message_delta may contain stop_reason and usage — nothing to yield
              break
            }

            case "message_stop": {
              // Stream complete
              break
            }
          }
        }
      } catch (err: unknown) {
        yield { type: "error", message: errorMessage(err) }
        return
      }

      yield { type: "done" }
    },
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface AnthropicMessage {
  role: "user" | "assistant"
  content: string
}

function convertMessages(messages: FabrikMessage[]): AnthropicMessage[] {
  const out: AnthropicMessage[] = []

  for (const msg of messages) {
    // System messages are handled via the `system` param, skip them here
    if (msg.role === "system") continue

    const textParts = msg.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as { type: "text"; text: string }).text)

    if (textParts.length > 0) {
      out.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: textParts.join("\n"),
      })
    }
  }

  return out
}

interface AnthropicTool {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

function convertTools(tools: ToolSpec[]): AnthropicTool[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters,
  }))
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}
