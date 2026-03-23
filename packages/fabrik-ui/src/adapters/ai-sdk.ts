/**
 * AI SDK adapter — wraps Vercel AI SDK's streamText() to work with Fabrik.
 *
 * This gives you access to ALL 53+ AI SDK providers:
 *   @ai-sdk/openai, @ai-sdk/anthropic, @ai-sdk/google, @ai-sdk/mistral,
 *   @ai-sdk/amazon-bedrock, @ai-sdk/azure, @ai-sdk/cohere, @ai-sdk/groq,
 *   @ai-sdk/deepseek, @ai-sdk/fireworks, @ai-sdk/xai, and more.
 *
 * Usage (server-side API route):
 *   import { aiSdk } from "@fabrik-sdk/ui/ai-sdk"
 *   import { google } from "@ai-sdk/google"
 *   import { handler } from "@fabrik-sdk/ui/server"
 *
 *   export const POST = handler({
 *     provider: aiSdk({ model: google("gemini-3-flash-preview") })
 *   })
 *
 * Works with any AI SDK provider:
 *   import { openai } from "@ai-sdk/openai"
 *   aiSdk({ model: openai("gpt-4o") })
 *
 *   import { anthropic } from "@ai-sdk/anthropic"
 *   aiSdk({ model: anthropic("claude-sonnet-4-20250514") })
 */

import type {
  Provider,
  StreamEvent,
  StreamOptions,
  FabrikMessage,
} from "../core/types"

interface AiSdkOptions {
  /** Any AI SDK model instance (from @ai-sdk/openai, @ai-sdk/anthropic, etc.) */
  model: Record<string, unknown> & { modelId?: string; provider?: string }
}

export function aiSdk(options: AiSdkOptions): Provider {
  const { model } = options
  const modelId = String(model.modelId ?? "unknown")
  const providerName = String(model.provider ?? "ai-sdk")

  return {
    name: `ai-sdk/${providerName}`,

    async *stream(streamOptions: StreamOptions): AsyncIterable<StreamEvent> {
      const runId = Math.random().toString(36).slice(2)
      yield { type: "start", runId }

      try {
        // Dynamic import — `ai` is a peer dependency
        const { streamText, jsonSchema } = await import("ai")

        // Convert fabrik messages to AI SDK format
        const messages = toAiSdkMessages(streamOptions.messages)

        // Convert tool specs to AI SDK tool format using jsonSchema()
        const tools: Record<string, unknown> = {}
        for (const spec of streamOptions.tools) {
          tools[spec.name] = {
            description: spec.description,
            parameters: jsonSchema(spec.parameters),
          }
        }

        // Stream using the AI SDK
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (streamText as (...args: unknown[]) => ReturnType<typeof streamText>)({
          model,
          messages,
          system: streamOptions.systemPrompt || undefined,
          tools: Object.keys(tools).length > 0 ? tools : undefined,
          abortSignal: streamOptions.signal,
        } as Record<string, unknown>)

        // DSL detection state
        let textBuffer = ""
        let inDslMode = false
        const uiId = generateId()

        // Process the fullStream — iterate over stream parts
        for await (const part of result.fullStream) {
          const p = part as Record<string, unknown>
          const type = p.type as string

          switch (type) {
            case "text-delta": {
              // v5: textDelta, v6: text
              const delta = (p.textDelta ?? p.text ?? "") as string
              if (!delta) break

              textBuffer += delta

              // Detect DSL mode: look for "root =" pattern
              if (!inDslMode) {
                // Check if we're entering DSL mode
                const rootMatch = textBuffer.match(/(?:^|\n)\s*root\s*=\s*/m)
                if (rootMatch) {
                  // Emit any pre-DSL text as regular text
                  const preText = textBuffer.slice(0, rootMatch.index ?? 0).trim()
                  if (preText) yield { type: "text", delta: preText }

                  // Switch to DSL mode
                  inDslMode = true
                  yield { type: "ui_start", id: uiId }
                  // Emit the DSL portion so far
                  const dslSoFar = textBuffer.slice(rootMatch.index ?? 0)
                  if (dslSoFar) yield { type: "ui_delta", id: uiId, delta: dslSoFar }
                } else {
                  // Not in DSL mode yet — emit as regular text
                  yield { type: "text", delta }
                }
              } else {
                // Already in DSL mode — emit as DSL delta
                yield { type: "ui_delta", id: uiId, delta }
              }
              break
            }

            case "tool-call": {
              const callId = (p.toolCallId ?? p.id ?? generateId()) as string
              const toolName = (p.toolName ?? p.name ?? "") as string
              // v5: args, v6: input
              const rawArgs = p.args ?? p.input ?? {}
              const args = typeof rawArgs === "string"
                ? JSON.parse(rawArgs) as Record<string, unknown>
                : rawArgs as Record<string, unknown>

              yield { type: "tool_call_start", id: callId, toolName }
              yield { type: "tool_call_done", id: callId, toolName, args }
              break
            }

            case "error": {
              yield { type: "error", message: String(p.error ?? "Unknown error") }
              break
            }

            // Ignore: step-start, step-finish, tool-result, finish, source, reasoning, raw
          }
        }

        // Close DSL if we were in DSL mode
        if (inDslMode) {
          yield { type: "ui_done", id: uiId }
        }

        yield { type: "done" }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        yield { type: "error", message }
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Message conversion: Fabrik → AI SDK format
// ---------------------------------------------------------------------------

function toAiSdkMessages(
  messages: FabrikMessage[],
): Array<{ role: string; content: string }> {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => {
      const text = m.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as { text: string }).text)
        .join("")

      return {
        role: m.role === "assistant" ? "assistant" : "user",
        content: text || " ",
      }
    })
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
