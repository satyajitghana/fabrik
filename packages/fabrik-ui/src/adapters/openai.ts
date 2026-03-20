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

export interface OpenAiOptions {
  apiKey?: string
  model?: string
  baseUrl?: string
}

export function openai(options: OpenAiOptions = {}): Provider {
  const { apiKey: providedKey, model: defaultModel, baseUrl } = options

  // Read from env var if not provided (server-side only)
  const resolveApiKey = (): string => {
    const key =
      providedKey ??
      (typeof process !== "undefined" ? process.env?.OPENAI_API_KEY : undefined)
    if (!key) {
      throw new Error(
        "OpenAI API key not found. Pass apiKey option or set OPENAI_API_KEY environment variable.",
      )
    }
    return key
  }

  return {
    name: "openai",

    async *stream(streamOptions: StreamOptions): AsyncIterable<StreamEvent> {
      const apiKey = resolveApiKey()
      const { messages, systemPrompt, tools, model, signal } = streamOptions
      const resolvedModel = model ?? defaultModel ?? "gpt-4o"

      // Dynamic import — openai is an optional peer dependency
      // @ts-expect-error -- openai is an optional peer dep; not present at type-check time
      const { default: OpenAI } = await import("openai")

      const client = new OpenAI({
        apiKey,
        ...(baseUrl ? { baseURL: baseUrl } : {}),
      })

      const openAiMessages = convertMessages(messages, systemPrompt)
      const openAiTools = tools.length > 0 ? convertTools(tools) : undefined

      const runId = generateId()
      yield { type: "start", runId }

      // OpenAI stream chunk shape (minimal interface for the fields we access)
      interface OpenAiChunk {
        choices?: Array<{
          delta?: {
            content?: string
            tool_calls?: Array<{
              index?: number
              id?: string
              function?: { name?: string; arguments?: string }
            }>
          }
          finish_reason?: string | null
        }>
      }
      let stream: AsyncIterable<OpenAiChunk>
      try {
        stream = await client.chat.completions.create({
          model: resolvedModel,
          messages: openAiMessages,
          tools: openAiTools,
          stream: true,
          ...(signal ? { signal } : {}),
        })
      } catch (err: unknown) {
        yield { type: "error", message: errorMessage(err) }
        return
      }

      // Track in-flight tool calls by index
      const toolCalls = new Map<
        number,
        { id: string; name: string; args: string }
      >()

      try {
        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta
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
                // First chunk for this tool call
                const callId = tc.id ?? generateId()
                const name = tc.function?.name ?? ""
                toolCalls.set(idx, { id: callId, name, args: "" })
                yield { type: "tool_call_start", id: callId, toolName: name }
              }

              const tracked = toolCalls.get(idx)!

              // Accumulate name if it arrives in later chunks
              if (tc.function?.name && !tracked.name) {
                tracked.name = tc.function.name
              }

              // Accumulate argument deltas
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
          const finishReason = chunk.choices?.[0]?.finish_reason
          if (finishReason === "stop" || finishReason === "tool_calls") {
            // Flush any completed tool calls
            for (const [, tc] of toolCalls) {
              let parsedArgs: Record<string, unknown> = {}
              try {
                parsedArgs = tc.args ? JSON.parse(tc.args) : {}
              } catch {
                // If parsing fails, wrap the raw string
                parsedArgs = { _raw: tc.args }
              }
              yield {
                type: "tool_call_done",
                id: tc.id,
                toolName: tc.name,
                args: parsedArgs,
              }
            }
            toolCalls.clear()
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

interface OpenAiMessage {
  role: "system" | "user" | "assistant"
  content: string
}

function convertMessages(
  messages: FabrikMessage[],
  systemPrompt: string,
): OpenAiMessage[] {
  const out: OpenAiMessage[] = []

  if (systemPrompt) {
    out.push({ role: "system", content: systemPrompt })
  }

  for (const msg of messages) {
    const textParts = msg.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as { type: "text"; text: string }).text)

    if (textParts.length > 0) {
      out.push({
        role: msg.role === "system" ? "system" : msg.role,
        content: textParts.join("\n"),
      })
    }
  }

  return out
}

interface OpenAiTool {
  type: "function"
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

function convertTools(tools: ToolSpec[]): OpenAiTool[] {
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }))
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}
