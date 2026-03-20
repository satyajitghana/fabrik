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

export interface GoogleOptions {
  apiKey?: string
  model?: string
}

export function google(options: GoogleOptions = {}): Provider {
  const { apiKey: providedKey, model: defaultModel } = options

  // Read from env var if not provided (server-side only)
  const resolveApiKey = (): string => {
    const key =
      providedKey ??
      (typeof process !== "undefined"
        ? process.env?.GOOGLE_AI_API_KEY
        : undefined)
    if (!key) {
      throw new Error(
        "Google AI API key not found. Pass apiKey option or set GOOGLE_AI_API_KEY environment variable.",
      )
    }
    return key
  }

  return {
    name: "google",

    async *stream(streamOptions: StreamOptions): AsyncIterable<StreamEvent> {
      const apiKey = resolveApiKey()
      const { messages, systemPrompt, tools, model, signal } = streamOptions
      const resolvedModel = model ?? defaultModel ?? "gemini-2.0-flash"

      // Dynamic import — @google/genai is an optional peer dependency
      // @ts-expect-error -- @google/genai is an optional peer dep; not present at type-check time
      const { GoogleGenAI } = await import("@google/genai")

      const client = new GoogleGenAI({ apiKey })

      const googleMessages = convertMessages(messages)
      const googleTools = tools.length > 0 ? convertTools(tools) : undefined

      const runId = generateId()
      yield { type: "start", runId }

      // Google GenAI stream chunk shape (minimal interface for the fields we access)
      interface GoogleChunk {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string
              functionCall?: { name?: string; args?: Record<string, unknown> | string }
            }>
          }
        }>
      }
      let stream: AsyncIterable<GoogleChunk>
      try {
        stream = await client.models.generateContentStream({
          model: resolvedModel,
          contents: googleMessages,
          ...(systemPrompt
            ? { config: { systemInstruction: systemPrompt } }
            : {}),
          ...(googleTools ? { tools: googleTools } : {}),
          ...(signal ? { signal } : {}),
        })
      } catch (err: unknown) {
        yield { type: "error", message: errorMessage(err) }
        return
      }

      try {
        for await (const chunk of stream) {
          const candidates = chunk.candidates
          if (!candidates || candidates.length === 0) continue

          const parts = candidates[0]?.content?.parts
          if (!parts) continue

          for (const part of parts) {
            // --- Text content ---
            if (part.text) {
              yield { type: "text", delta: part.text }
            }

            // --- Function calls ---
            if (part.functionCall) {
              const callId = generateId()
              const toolName = part.functionCall.name ?? ""
              const args =
                typeof part.functionCall.args === "object"
                  ? part.functionCall.args
                  : {}

              yield { type: "tool_call_start", id: callId, toolName }
              yield {
                type: "tool_call_done",
                id: callId,
                toolName,
                args: args as Record<string, unknown>,
              }
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

interface GoogleMessage {
  role: "user" | "model"
  parts: { text: string }[]
}

function convertMessages(messages: FabrikMessage[]): GoogleMessage[] {
  const out: GoogleMessage[] = []

  for (const msg of messages) {
    // System messages are handled via systemInstruction, skip them here
    if (msg.role === "system") continue

    const textParts = msg.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as { type: "text"; text: string }).text)

    if (textParts.length > 0) {
      out.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: textParts.map((text) => ({ text })),
      })
    }
  }

  return out
}

interface GoogleTool {
  functionDeclarations: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }[]
}

function convertTools(tools: ToolSpec[]): GoogleTool[] {
  return [
    {
      functionDeclarations: tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })),
    },
  ]
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}
