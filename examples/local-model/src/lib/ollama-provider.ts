import { custom, parseOpenAiStream } from "@fabrik/ui/custom"
import type { StreamEvent } from "@fabrik/ui"

/**
 * Provider that connects to Ollama's OpenAI-compatible API at localhost:11434.
 * Uses parseOpenAiStream() to convert the SSE response into fabrik StreamEvents.
 */
export const ollamaProvider = custom({
  name: "ollama",
  stream: async (options) => {
    // Try connecting to Ollama first
    try {
      const res = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.1",
          messages: options.messages.map((m) => ({
            role: m.role,
            content: m.parts
              .filter((p) => p.type === "text")
              .map((p) => (p as { type: "text"; text: string }).text)
              .join(""),
          })),
          stream: true,
        }),
        signal: options.signal,
      })

      if (!res.ok) {
        throw new Error(`Ollama returned ${res.status}`)
      }

      return parseOpenAiStream(res)
    } catch {
      // Fallback to mock provider if Ollama isn't running
      return mockStream(options.messages)
    }
  },
})

/**
 * Mock fallback that simulates streaming when Ollama is not available.
 * This lets the example work without a running Ollama instance.
 */
async function* mockStream(
  messages: { role: string; parts: { type: string; text?: string }[] }[]
): AsyncIterable<StreamEvent> {
  const runId = Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
  yield { type: "start", runId }

  const lastMessage = messages[messages.length - 1]
  const userText = lastMessage?.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("")

  // Emit a notice that we're using the mock
  const notice =
    "[Mock mode — Ollama is not running at localhost:11434. Start Ollama with `ollama serve` and pull a model with `ollama pull llama3.1` to use a real local model.]\n\n"

  for (const char of notice) {
    yield { type: "text", delta: char }
    await delay(8)
  }

  const response = generateMockResponse(userText)
  const words = response.split(" ")

  for (const word of words) {
    yield { type: "text", delta: word + " " }
    await delay(25 + Math.random() * 35)
  }

  yield { type: "done" }
}

function generateMockResponse(userText: string): string {
  const lower = userText.toLowerCase()

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hello! I'm a simulated local model response. When Ollama is running, this chat will connect to your local llama3.1 model for real inference, completely private and offline."
  }

  if (lower.includes("what") && lower.includes("model")) {
    return "This example is configured to use llama3.1 via Ollama. You can change the model in ollama-provider.ts by modifying the `model` field in the request body. Ollama supports many models including Mistral, Phi, Gemma, CodeLlama, and more."
  }

  if (lower.includes("how") && lower.includes("work")) {
    return "This example uses fabrik-ui's custom() adapter with parseOpenAiStream(). It sends requests to Ollama's OpenAI-compatible endpoint at localhost:11434/v1/chat/completions. The SSE response is parsed into fabrik StreamEvents and rendered in the chat UI. When Ollama isn't available, it falls back to this mock provider."
  }

  return `This is a simulated response to: "${userText}". To get real AI responses, make sure Ollama is running locally. Install it from ollama.com, then run: ollama serve && ollama pull llama3.1`
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
