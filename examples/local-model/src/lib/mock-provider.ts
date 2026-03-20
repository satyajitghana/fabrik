import type { Provider, StreamEvent, StreamOptions, FabrikMessage } from "@fabrik/ui"

/**
 * Mock provider for the local-model example.
 * Works without any external services — provides basic text responses
 * and a weather card demo.
 */
export function createMockProvider(): Provider {
  return {
    name: "mock-local",
    async *stream(options: StreamOptions): AsyncIterable<StreamEvent> {
      const lastMessage = getLastUserMessage(options.messages)
      const text = lastMessage.toLowerCase()

      await delay(200)

      if (text.includes("weather")) {
        yield* weatherResponse()
      } else if (text.includes("hello") || text.includes("hi") || text.includes("hey")) {
        yield* greetingResponse()
      } else if (text.includes("what") && text.includes("model")) {
        yield* modelInfoResponse()
      } else if (text.includes("how") && text.includes("work")) {
        yield* howItWorksResponse()
      } else {
        yield* defaultResponse(lastMessage)
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Weather — static mock data with a weather card component
// ---------------------------------------------------------------------------

async function* weatherResponse(): AsyncIterable<StreamEvent> {
  yield { type: "step_start", id: "s1", title: "Fetching weather data..." }
  await delay(500)
  yield { type: "step_done", id: "s1", stepStatus: "done", durationMs: 500 }

  yield { type: "step_start", id: "s2", title: "Processing results..." }
  await delay(300)
  yield { type: "step_done", id: "s2", stepStatus: "done", durationMs: 300 }

  await delay(150)

  yield { type: "component_start", id: "c1", name: "weather_card" }
  await delay(50)
  yield {
    type: "component_done",
    id: "c1",
    props: {
      city: "San Francisco",
      temp: 68,
      condition: "sunny",
      humidity: 65,
      wind: "4.3 mph",
    },
  }

  await delay(150)
  yield* streamText(
    "Here's the weather for San Francisco! It's currently clear with a temperature of 68°F. " +
    "Humidity is 65% with winds at 4.3 mph. " +
    "This is mock data — connect a real model for live weather lookups."
  )
}

// ---------------------------------------------------------------------------
// Greeting
// ---------------------------------------------------------------------------

async function* greetingResponse(): AsyncIterable<StreamEvent> {
  yield* streamText(
    "Hello! I'm a mock provider running in place of a local model. " +
    "This example is designed to work with Ollama, but since it's not running, " +
    "I'm here to demonstrate the chat interface. " +
    "Try asking about the weather or how this example works!"
  )
}

// ---------------------------------------------------------------------------
// Model info
// ---------------------------------------------------------------------------

async function* modelInfoResponse(): AsyncIterable<StreamEvent> {
  yield* streamText(
    "This example is configured to use llama3.1 via Ollama. " +
    "You can change the model in ollama-provider.ts. " +
    "Ollama supports many models including Mistral, Phi, Gemma, CodeLlama, and more. " +
    "Right now you're seeing the mock provider since Ollama isn't running."
  )
}

// ---------------------------------------------------------------------------
// How it works
// ---------------------------------------------------------------------------

async function* howItWorksResponse(): AsyncIterable<StreamEvent> {
  yield { type: "step_start", id: "s1", title: "Explaining architecture..." }
  await delay(400)
  yield { type: "step_done", id: "s1", stepStatus: "done", durationMs: 400 }

  await delay(150)
  yield* streamText(
    "This example uses fabrik-ui's custom() adapter. " +
    "When Ollama is running, it sends requests to Ollama's OpenAI-compatible endpoint " +
    "at localhost:11434/v1/chat/completions. " +
    "The SSE response is parsed into fabrik StreamEvents and rendered in the chat UI. " +
    "Since Ollama isn't available right now, this mock provider handles the responses instead."
  )
}

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

async function* defaultResponse(userMessage: string): AsyncIterable<StreamEvent> {
  yield* streamText(
    `You said: "${userMessage}"\n\n` +
    "I'm a mock provider standing in for a local Ollama model. Try:\n" +
    "- **Weather** — See a weather card component\n" +
    "- **How does this work?** — Learn about the architecture\n" +
    "- **What model are you?** — Info about the Ollama setup\n" +
    "- **Hello** — A friendly greeting\n\n" +
    "To use a real model, install Ollama from ollama.com, then run:\n" +
    "`ollama serve && ollama pull llama3.1`"
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function* streamText(text: string): AsyncIterable<StreamEvent> {
  const words = text.split(" ")
  for (let i = 0; i < words.length; i++) {
    yield { type: "text", delta: (i === 0 ? "" : " ") + words[i]! }
    await delay(25)
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

function getLastUserMessage(messages: FabrikMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]!
    if (msg.role === "user") {
      return msg.parts
        .filter(p => p.type === "text")
        .map(p => ("text" in p ? (p as { text: string }).text : ""))
        .join(" ")
    }
  }
  return ""
}
