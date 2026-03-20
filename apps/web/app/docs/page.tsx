export default function DocsPage() {
  return (
    <article className="prose prose-sm max-w-none">
      <h1>Fabrik UI</h1>
      <p className="lead text-lg text-muted-foreground">
        Generative UI SDK for any LLM. The AI decides what to show — not just what to say.
      </p>

      <p>
        Fabrik lets you define React components that the AI can render at runtime. When a user asks
        &quot;show me the weather&quot;, the LLM calls <code>show_weather_card()</code> and your
        component renders with real data — charts, cards, dashboards, entire pages.
      </p>

      <h2>Key Features</h2>
      <ul>
        <li>
          <strong>Generative UI</strong> — Define React components with Zod schemas. The LLM
          decides which to render based on user intent.
        </li>
        <li>
          <strong>Any LLM</strong> — OpenAI, Anthropic, Google, or any provider via the AI SDK.
          53+ providers supported.
        </li>
        <li>
          <strong>Streaming</strong> — Text and components stream progressively over SSE. Tool
          steps show what the AI is doing in real time.
        </li>
        <li>
          <strong>Elicitation</strong> — AI asks follow-up questions with confirm dialogs, choice
          pills, text inputs, and permission requests — all inline in chat.
        </li>
        <li>
          <strong>Artifacts</strong> — HTML rendered in sandboxed iframes, code highlighted with
          Shiki, and GitHub-style diffs with accept/reject.
        </li>
        <li>
          <strong>Secure by default</strong> — API keys never leave the server. The client
          communicates through your API route.
        </li>
      </ul>

      <h2>Quick Example</h2>
      <p>Two files to get a working generative UI chat:</p>

      <h3>Server route</h3>
      <pre><code>{`// app/api/chat/route.ts
import { openai } from "@fabrik/ui/openai"
import { handler } from "@fabrik/ui/server"

export const POST = handler({
  provider: openai({ model: "gpt-4o" }),
})
// Reads OPENAI_API_KEY from .env.local automatically`}</code></pre>

      <h3>Client page</h3>
      <pre><code>{`// app/page.tsx
"use client"
import { Fabrik, Chat } from "@fabrik/ui/react"
import { server } from "@fabrik/ui/server"

const provider = server({ url: "/api/chat" })

export default function Page() {
  return (
    <Fabrik provider={provider}>
      <Chat />
    </Fabrik>
  )
}`}</code></pre>

      <p>
        That gives you a full chat interface with auto-scroll, typing indicators, message
        actions, file attachments, and markdown rendering. See the{" "}
        <a href="/docs/quickstart">Quickstart guide</a> for the full setup with generative UI
        components.
      </p>

      <h2>How It Works</h2>
      <ol>
        <li>
          You define components with <code>defineComponent()</code> — a name, description, Zod
          schema, and React component.
        </li>
        <li>
          Pass them to <code>&lt;Fabrik&gt;</code>. The SDK converts schemas to JSON Schema and
          registers them as tools for the LLM.
        </li>
        <li>
          When the user sends a message, the LLM sees available tools like{" "}
          <code>show_weather_card</code>. If it decides to render one, it calls the tool with
          validated props.
        </li>
        <li>
          The stream delivers events (<code>component_start</code>, <code>component_delta</code>,{" "}
          <code>component_done</code>) that the client reduces into rendered React components.
        </li>
      </ol>

      <h2>Next Steps</h2>
      <ul>
        <li>
          <a href="/docs/quickstart">Quickstart</a> — Install and build your first generative UI in
          5 minutes
        </li>
        <li>
          <a href="/docs/providers">Providers</a> — Configure OpenAI, Anthropic, Google, or a
          custom backend
        </li>
        <li>
          <a href="/docs/components">Components</a> — Define components the AI can render
        </li>
        <li>
          <a href="/docs/examples">Examples</a> — See 7 example apps that demonstrate different
          patterns
        </li>
      </ul>
    </article>
  )
}
