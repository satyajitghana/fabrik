/**
 * AI SDK adapter — wraps any Vercel AI SDK provider to work with fabrik-ui.
 *
 * This adapter works with ALL AI SDK providers:
 * - @ai-sdk/openai
 * - @ai-sdk/anthropic
 * - @ai-sdk/google
 * - @ai-sdk/mistral
 * - @ai-sdk/amazon-bedrock
 * - @ai-sdk/azure
 * - @ai-sdk/cohere
 * - @ai-sdk/groq
 * - @ai-sdk/deepseek
 * - @ai-sdk/fireworks
 * - ... and 40+ more
 *
 * Usage:
 *   import { aiSdk } from "@fabrik-sdk/ui/ai-sdk"
 *   import { openai } from "@ai-sdk/openai"
 *
 *   const provider = aiSdk({ model: openai("gpt-4o") })
 *
 * Or with Anthropic:
 *   import { anthropic } from "@ai-sdk/anthropic"
 *   const provider = aiSdk({ model: anthropic("claude-sonnet-4-20250514") })
 *
 * Or with any model:
 *   import { google } from "@ai-sdk/google"
 *   const provider = aiSdk({ model: google("gemini-2.0-flash") })
 */

import type { Provider, StreamEvent, StreamOptions, FabrikMessage } from "../core/types"

// The AI SDK LanguageModel interface (we accept anything with this shape)
interface AiSdkModel {
  readonly modelId: string
  readonly provider: string
  doStream: (options: Record<string, unknown>) => Promise<{
    stream: ReadableStream<unknown>
    rawCall?: unknown
  }>
}

/** Discriminated union of AI SDK stream chunk types we handle */
type AiSdkStreamPart =
  | { type: "text-delta"; textDelta: string }
  | { type: "tool-call"; toolCallId: string; toolName: string; args: string | Record<string, unknown> }
  | { type: "tool-call-streaming-start"; toolCallId: string; toolName: string }
  | { type: "tool-call-delta"; toolCallId: string; argsTextDelta: string }
  | { type: "tool-result"; toolCallId: string; result: unknown }
  | { type: "reasoning"; text: string }
  | { type: "finish" }
  | { type: "error"; error: unknown }

interface AiSdkOptions {
  /** Any AI SDK model instance (from @ai-sdk/openai, @ai-sdk/anthropic, etc.) */
  model: AiSdkModel
}

export function aiSdk(options: AiSdkOptions): Provider {
  const { model } = options

  return {
    name: `ai-sdk/${model.provider}`,

    async *stream(streamOptions: StreamOptions): AsyncIterable<StreamEvent> {
      const runId = Math.random().toString(36).slice(2)
      yield { type: "start", runId }

      try {
        // Convert fabrik messages to AI SDK format
        const messages = toAiSdkMessages(streamOptions.messages)

        // Convert tool specs to AI SDK tool format
        const tools: Record<string, Record<string, unknown>> = {}
        for (const spec of streamOptions.tools) {
          tools[spec.name] = {
            description: spec.description,
            parameters: spec.parameters,
          }
        }

        // Call the model's stream method
        const { stream } = await model.doStream({
          inputFormat: "messages",
          mode: {
            type: Object.keys(tools).length > 0 ? "regular" : "regular",
            tools: Object.entries(tools).map(([name, tool]) => ({
              type: "function",
              name,
              description: tool.description,
              parameters: tool.parameters,
            })),
          },
          prompt: messages,
          system: streamOptions.systemPrompt,
          abortSignal: streamOptions.signal,
        })

        // Process the stream
        const reader = (stream as ReadableStream<AiSdkStreamPart>).getReader()
        const toolCallArgs = new Map<string, string>()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // AI SDK stream parts
          switch (value.type) {
            case "text-delta": {
              yield { type: "text", delta: value.textDelta }
              break
            }

            case "tool-call": {
              // AI SDK sends complete tool calls
              yield {
                type: "tool_call_start",
                id: value.toolCallId,
                toolName: value.toolName,
              }
              yield {
                type: "tool_call_done",
                id: value.toolCallId,
                toolName: value.toolName,
                args: typeof value.args === "string" ? JSON.parse(value.args) : value.args,
              }
              break
            }

            case "tool-call-streaming-start": {
              yield {
                type: "tool_call_start",
                id: value.toolCallId,
                toolName: value.toolName,
              }
              toolCallArgs.set(value.toolCallId, "")
              break
            }

            case "tool-call-delta": {
              const current = toolCallArgs.get(value.toolCallId) ?? ""
              toolCallArgs.set(value.toolCallId, current + value.argsTextDelta)
              yield {
                type: "tool_call_delta",
                id: value.toolCallId,
                delta: value.argsTextDelta,
              }
              break
            }

            case "tool-result": {
              // Tool results are handled by the FabrikClient, not here
              break
            }

            case "reasoning": {
              // Map to thinking events
              yield { type: "thinking_start", id: "thinking" }
              yield { type: "thinking_delta", id: "thinking", delta: value.text }
              break
            }

            case "finish": {
              // Stream is done
              break
            }

            case "error": {
              yield { type: "error", message: String(value.error) }
              break
            }
          }
        }

        yield { type: "done" }
      } catch (error) {
        yield { type: "error", message: (error as Error).message }
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Message conversion
// ---------------------------------------------------------------------------

function toAiSdkMessages(messages: FabrikMessage[]): Record<string, unknown>[] {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => {
      const text = m.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as { text: string }).text)
        .join("")

      return {
        role: m.role === "assistant" ? "assistant" : "user",
        content: text || "(empty)",
      }
    })
}
