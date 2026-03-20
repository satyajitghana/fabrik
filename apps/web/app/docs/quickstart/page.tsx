export default function QuickstartPage() {
  return (
    <article className="prose prose-sm max-w-none">
      <h1>Quickstart</h1>
      <p>Get a working generative UI chat in under 5 minutes.</p>

      <h2>1. Install</h2>
      <pre><code>pnpm add @fabrik/ui zod motion</code></pre>
      <p>
        <code>zod</code> is used for component schema validation. <code>motion</code> powers
        animations (spring physics, enter/exit transitions).
      </p>

      <h2>2. Create the server route</h2>
      <p>
        This file runs server-side in your Next.js API route. It handles LLM communication and
        streams responses back as SSE. API keys are read from environment variables — they never
        reach the browser.
      </p>
      <pre><code>{`// app/api/chat/route.ts
import { openai } from "@fabrik/ui/openai"
import { handler } from "@fabrik/ui/server"

export const POST = handler({
  provider: openai({ model: "gpt-4o" }),
})
// Reads OPENAI_API_KEY from .env.local automatically`}</code></pre>

      <h2>3. Create the client page</h2>
      <pre><code>{`// app/page.tsx
"use client"
import { Fabrik, Chat } from "@fabrik/ui/react"
import { server } from "@fabrik/ui/server"
import { defineComponent } from "@fabrik/ui"
import { z } from "zod"

// Connect to your API route
const provider = server({ url: "/api/chat" })

// Define a component the AI can render
const weatherCard = defineComponent({
  name: "weather_card",
  description: "Shows current weather for a city",
  schema: z.object({
    city: z.string(),
    temp: z.number(),
    condition: z.string(),
  }),
  component: ({ city, temp, condition }) => (
    <div className="rounded-xl border p-4">
      <h3 className="font-bold">{city}</h3>
      <p className="text-3xl">{temp}°F</p>
      <p className="text-muted-foreground">{condition}</p>
    </div>
  ),
})

export default function Page() {
  return (
    <Fabrik provider={provider} components={[weatherCard]}>
      <Chat />
    </Fabrik>
  )
}`}</code></pre>

      <h2>4. Add your API key</h2>
      <pre><code>{`# .env.local (never commit this file)
OPENAI_API_KEY=sk-...`}</code></pre>

      <h2>5. Run</h2>
      <pre><code>pnpm dev</code></pre>
      <p>
        Open <code>http://localhost:3000</code> and ask &quot;Show me the weather in San
        Francisco&quot;. The AI will call <code>show_weather_card()</code> and your component
        renders inline.
      </p>

      <h2>What just happened</h2>
      <ol>
        <li>
          <code>defineComponent()</code> registers a component with a name, description, and Zod
          schema. The SDK converts the schema to JSON Schema and exposes it to the LLM as a
          tool called <code>show_weather_card</code>.
        </li>
        <li>
          When the user sends a message, the <code>server()</code> adapter POSTs to your API
          route. The <code>handler()</code> streams LLM responses back as SSE.
        </li>
        <li>
          The LLM decides to call the tool. The stream emits{" "}
          <code>component_start</code> → <code>component_delta</code> →{" "}
          <code>component_done</code> events. The client validates props with Zod and renders
          your React component.
        </li>
      </ol>

      <h2>Switching providers</h2>
      <p>Change one import in your server route — the client code never changes:</p>
      <pre><code>{`// Anthropic
import { anthropic } from "@fabrik/ui/anthropic"
export const POST = handler({
  provider: anthropic({ model: "claude-sonnet-4-20250514" }),
})
// env: ANTHROPIC_API_KEY

// Google
import { google } from "@fabrik/ui/google"
export const POST = handler({
  provider: google({ model: "gemini-2.0-flash" }),
})
// env: GOOGLE_AI_API_KEY`}</code></pre>

      <h2>Using the drop-in Chat component</h2>
      <p>
        The <code>&lt;Chat&gt;</code> component gives you a complete chat interface out of the
        box:
      </p>
      <ul>
        <li>Auto-scrolling with user-scroll-pause detection</li>
        <li>Markdown rendering with syntax highlighting</li>
        <li>Typing indicators and message animations</li>
        <li>Copy, retry, and feedback actions on messages</li>
        <li>File attachment support with image previews</li>
        <li>Empty state with suggestion pills</li>
        <li>Optional sidebar for thread management</li>
      </ul>

      <h2>Using the Fab widget</h2>
      <p>
        For a floating chat button (like Intercom), use <code>&lt;Fab&gt;</code> instead:
      </p>
      <pre><code>{`import { Fabrik, Fab } from "@fabrik/ui/react"

export default function Page() {
  return (
    <Fabrik provider={provider} components={[weatherCard]}>
      <YourExistingPage />
      <Fab position="bottom-right" welcome="Ask Acme AI" />
    </Fabrik>
  )
}`}</code></pre>

      <h2>Next steps</h2>
      <ul>
        <li>
          <a href="/docs/components">Components</a> — Define more generative UI components
        </li>
        <li>
          <a href="/docs/elicitations">Elicitations</a> — Let the AI ask follow-up questions
        </li>
        <li>
          <a href="/docs/providers">Providers</a> — Configure different LLM backends
        </li>
        <li>
          <a href="/docs/examples">Examples</a> — See 7 working example apps
        </li>
      </ul>
    </article>
  )
}
