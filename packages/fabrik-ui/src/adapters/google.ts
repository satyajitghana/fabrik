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
  baseURL?: string
}

export function google(options: GoogleOptions = {}): Provider {
  const { apiKey: providedKey, model: defaultModel, baseURL: providedBaseURL } = options

  const baseURL = providedBaseURL ?? "https://generativelanguage.googleapis.com/v1beta"

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

      const googleMessages = convertMessages(messages)
      const googleTools = tools.length > 0 ? convertTools(tools) : undefined

      const runId = generateId()
      yield { type: "start", runId }

      // Build request body
      const body: Record<string, unknown> = {
        contents: googleMessages,
      }

      if (systemPrompt) {
        body.systemInstruction = { parts: [{ text: systemPrompt }] }
      }

      if (googleTools) {
        body.tools = googleTools
        body.toolConfig = { functionCallingConfig: { mode: "AUTO" } }
      }

      // Use raw REST API — the @google/genai npm package has broken
      // function calling with gemini-3-flash-preview
      const url = `${baseURL}/models/${resolvedModel}:streamGenerateContent?alt=sse&key=${apiKey}`

      let response: Response
      try {
        response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal,
        })
      } catch (err: unknown) {
        yield { type: "error", message: errorMessage(err) }
        return
      }

      if (!response.ok) {
        let msg: string
        try {
          const errBody = await response.json()
          msg = JSON.stringify(errBody)
        } catch {
          msg = `HTTP ${response.status} ${response.statusText}`
        }
        yield { type: "error", message: msg }
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        yield { type: "error", message: "Empty response body" }
        return
      }

      const decoder = new TextDecoder()
      let buffer = ""

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Process SSE events
          const parts = buffer.split(/\r?\n\r?\n/)
          buffer = parts.pop()!

          for (const part of parts) {
            const trimmed = part.trim()
            if (!trimmed) continue

            const dataPrefix = "data: "
            if (!trimmed.startsWith(dataPrefix)) continue

            const jsonStr = trimmed.slice(dataPrefix.length)

            let chunk: GoogleResponse
            try {
              chunk = JSON.parse(jsonStr)
            } catch {
              continue
            }

            const candidates = chunk.candidates
            if (!candidates || candidates.length === 0) continue

            const responseParts = candidates[0]?.content?.parts
            if (!responseParts) continue

            for (const p of responseParts) {
              if (p.text) {
                yield { type: "text", delta: p.text }
              }

              if (p.functionCall) {
                const callId = p.functionCall.id ?? generateId()
                const toolName = p.functionCall.name ?? ""
                const args =
                  typeof p.functionCall.args === "object"
                    ? p.functionCall.args
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
        }

        // Process remaining buffer
        if (buffer.trim()) {
          const remaining = buffer.trim()
          if (remaining.startsWith("data: ")) {
            try {
              const chunk: GoogleResponse = JSON.parse(remaining.slice(6))
              const responseParts = chunk.candidates?.[0]?.content?.parts
              if (responseParts) {
                for (const p of responseParts) {
                  if (p.text) yield { type: "text", delta: p.text }
                  if (p.functionCall) {
                    const callId = p.functionCall.id ?? generateId()
                    const toolName = p.functionCall.name ?? ""
                    const args = typeof p.functionCall.args === "object" ? p.functionCall.args : {}
                    yield { type: "tool_call_start", id: callId, toolName }
                    yield { type: "tool_call_done", id: callId, toolName, args: args as Record<string, unknown> }
                  }
                }
              }
            } catch {
              // Malformed trailing data
            }
          }
        }
      } catch (err: unknown) {
        if (signal?.aborted) return
        yield { type: "error", message: errorMessage(err) }
        return
      } finally {
        reader.releaseLock()
      }

      yield { type: "done" }
    },
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GoogleResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
        functionCall?: {
          name?: string
          args?: Record<string, unknown> | string
          id?: string
        }
      }>
    }
    finishReason?: string
  }>
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface GoogleMessage {
  role: "user" | "model"
  parts: Array<{ text?: string; functionCall?: Record<string, unknown>; functionResponse?: Record<string, unknown> }>
}

function convertMessages(messages: FabrikMessage[]): GoogleMessage[] {
  const out: GoogleMessage[] = []

  for (const msg of messages) {
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
    parameters?: Record<string, unknown>
  }[]
}

function convertTools(tools: ToolSpec[]): GoogleTool[] {
  return [
    {
      functionDeclarations: tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: convertToOpenAPISchema(t.parameters),
      })),
    },
  ]
}

/**
 * Convert JSON Schema to OpenAPI Schema 3.0 format required by Google's API.
 */
function convertToOpenAPISchema(
  schema: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!schema || Object.keys(schema).length === 0) return undefined
  return convertSchemaNode(schema)
}

function convertSchemaNode(node: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  if (node.type) result.type = String(node.type).toUpperCase()
  if (node.description) result.description = node.description
  if (node.required) result.required = node.required
  if (node.format) result.format = node.format
  if (node.enum) result.enum = node.enum
  if (node.default !== undefined) result.default = node.default

  // Convert anyOf with null type to nullable
  if (Array.isArray(node.anyOf)) {
    const nullSchema = node.anyOf.find(
      (s: Record<string, unknown>) => typeof s === "object" && s?.type === "null"
    )
    const nonNullSchemas = node.anyOf.filter(
      (s: Record<string, unknown>) => !(typeof s === "object" && s?.type === "null")
    )

    if (nullSchema && nonNullSchemas.length === 1) {
      const converted = convertSchemaNode(nonNullSchemas[0] as Record<string, unknown>)
      Object.assign(result, converted)
      result.nullable = true
    } else if (nullSchema) {
      result.anyOf = nonNullSchemas.map((s: Record<string, unknown>) =>
        convertSchemaNode(s as Record<string, unknown>)
      )
      result.nullable = true
    } else {
      result.anyOf = node.anyOf.map((s: Record<string, unknown>) =>
        convertSchemaNode(s as Record<string, unknown>)
      )
    }
  }

  if (node.properties && typeof node.properties === "object") {
    const props: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(node.properties as Record<string, Record<string, unknown>>)) {
      props[key] = convertSchemaNode(val)
    }
    result.properties = props
  }

  if (node.items && typeof node.items === "object") {
    result.items = convertSchemaNode(node.items as Record<string, unknown>)
  }

  return result
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}
