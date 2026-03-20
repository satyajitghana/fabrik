export default function ProvidersPage() {
  return (
    <article className="prose prose-sm max-w-none">
      <h1>Providers</h1>
      <p>
        Fabrik supports any LLM through a <code>Provider</code> interface. Each provider wraps an
        LLM SDK and converts its output into Fabrik <code>StreamEvent</code>s.
      </p>

      <h2>Built-in providers</h2>
      <table>
        <thead>
          <tr>
            <th>Import</th>
            <th>Env Variable</th>
            <th>Example Model</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>@fabrik/ui/openai</code></td>
            <td><code>OPENAI_API_KEY</code></td>
            <td>gpt-4o</td>
          </tr>
          <tr>
            <td><code>@fabrik/ui/anthropic</code></td>
            <td><code>ANTHROPIC_API_KEY</code></td>
            <td>claude-sonnet-4-20250514</td>
          </tr>
          <tr>
            <td><code>@fabrik/ui/google</code></td>
            <td><code>GOOGLE_AI_API_KEY</code></td>
            <td>gemini-2.0-flash</td>
          </tr>
          <tr>
            <td><code>@fabrik/ui/ai-sdk</code></td>
            <td>Varies by model</td>
            <td>Any AI SDK model</td>
          </tr>
        </tbody>
      </table>

      <h2>Server-side handler</h2>
      <p>
        All built-in providers run server-side through the <code>handler()</code> function. This
        creates a Next.js-compatible POST handler that streams LLM responses as SSE:
      </p>
      <pre><code>{`// app/api/chat/route.ts
import { openai } from "@fabrik/ui/openai"
import { handler } from "@fabrik/ui/server"

export const POST = handler({
  provider: openai({ model: "gpt-4o" }),
})`}</code></pre>
      <p>
        The handler accepts a <code>Request</code>, parses the JSON body (messages, tools,
        system prompt), streams events from the provider, and returns a{" "}
        <code>Response</code> with <code>Content-Type: text/event-stream</code>.
      </p>

      <h2>Client-side adapter</h2>
      <p>
        The client connects to your API route with <code>server()</code>. This creates a{" "}
        <code>Provider</code> that sends messages via <code>fetch</code> and parses the SSE
        stream:
      </p>
      <pre><code>{`import { server } from "@fabrik/ui/server"

const provider = server({ url: "/api/chat" })`}</code></pre>
      <p>
        Pass this provider to <code>&lt;Fabrik&gt;</code>. The client never sees API keys — it
        only communicates with your server route.
      </p>

      <h2>Custom provider</h2>
      <p>
        For local models (Ollama), proxy endpoints, or custom backends, use the{" "}
        <code>custom()</code> adapter:
      </p>
      <pre><code>{`import { custom } from "@fabrik/ui/custom"

const provider = custom({
  name: "my-backend",
  stream: async function* ({ messages, tools, signal }) {
    const response = await fetch("/my-llm-endpoint", {
      method: "POST",
      body: JSON.stringify({ messages }),
      signal,
    })

    // Parse SSE from your backend
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      // ... parse events from buffer

      yield { type: "text", delta: "Hello!" }
    }

    yield { type: "done" }
  },
})`}</code></pre>

      <h2>EventStream helper</h2>
      <p>
        For agent frameworks that use a push-based model (callbacks instead of async iterators),
        use <code>EventStream</code>:
      </p>
      <pre><code>{`import { custom, EventStream } from "@fabrik/ui/custom"

const provider = custom({
  name: "my-agent",
  stream: ({ messages }) => {
    const stream = new EventStream()

    // Start your agent in the background
    runAgent(messages, {
      onToken: (token) => stream.push({ type: "text", delta: token }),
      onToolCall: (name, args) => {
        stream.push({ type: "step_start", id: name, title: name })
      },
      onDone: () => {
        stream.push({ type: "done" })
        stream.end()
      },
      onError: (err) => stream.fail(err),
    })

    return stream
  },
})`}</code></pre>

      <h2>SSE parsing utilities</h2>
      <p>
        The <code>@fabrik/ui/custom</code> module also exports helpers for parsing standard SSE
        streams:
      </p>
      <ul>
        <li>
          <code>parseSseStream(response)</code> — Parses a standard{" "}
          <code>text/event-stream</code> response where each <code>data:</code> payload is a
          JSON-encoded <code>StreamEvent</code>.
        </li>
        <li>
          <code>parseOpenAiStream(response)</code> — Parses an OpenAI-compatible SSE stream and
          converts chunks into Fabrik <code>StreamEvent</code>s. Handles tool calls, text
          deltas, and finish reasons.
        </li>
      </ul>

      <h2>Provider interface</h2>
      <p>
        Every provider implements this interface:
      </p>
      <pre><code>{`interface Provider {
  name: string
  stream(options: StreamOptions): AsyncIterable<StreamEvent>
}

interface StreamOptions {
  messages: FabrikMessage[]
  systemPrompt: string
  tools: ToolSpec[]
  model?: string
  signal?: AbortSignal
}`}</code></pre>
      <p>
        The <code>stream()</code> method returns an async iterable of{" "}
        <code>StreamEvent</code>s. See <a href="/docs/streaming">Streaming</a> for the full
        event type reference.
      </p>
    </article>
  )
}
