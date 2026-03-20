export default function StructurePage() {
  return (
    <article className="prose prose-sm max-w-none">
      <h1>Project Structure</h1>
      <p>
        A typical Fabrik UI project follows the standard Next.js App Router layout with a few
        additional files for the LLM provider and component definitions.
      </p>

      <h2>Minimal project</h2>
      <pre><code>{`my-app/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts        # Server-side LLM handler
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Client page with <Fabrik> + <Chat>
├── components/
│   └── fabrik-components.tsx   # defineComponent() definitions
├── .env.local                  # API keys (never commit)
├── package.json
└── tailwind.config.ts`}</code></pre>

      <h2>File responsibilities</h2>

      <h3>
        <code>app/api/chat/route.ts</code> — Server route
      </h3>
      <p>
        Runs server-side. Creates an LLM provider and exports a POST handler that streams
        responses as SSE. This is the only file that touches API keys.
      </p>
      <pre><code>{`import { openai } from "@fabrik/ui/openai"
import { handler } from "@fabrik/ui/server"

export const POST = handler({
  provider: openai({ model: "gpt-4o" }),
})`}</code></pre>

      <h3>
        <code>app/page.tsx</code> — Client page
      </h3>
      <p>
        Creates a <code>server()</code> adapter that points to your API route, wraps the page in{" "}
        <code>&lt;Fabrik&gt;</code>, and renders <code>&lt;Chat&gt;</code> or a custom UI.
      </p>
      <pre><code>{`"use client"
import { Fabrik, Chat } from "@fabrik/ui/react"
import { server } from "@fabrik/ui/server"
import { demoLibrary } from "@/components/fabrik-components"

const provider = server({ url: "/api/chat" })

export default function Page() {
  return (
    <Fabrik provider={provider} components={demoLibrary}>
      <Chat />
    </Fabrik>
  )
}`}</code></pre>

      <h3>
        <code>components/fabrik-components.tsx</code> — Component definitions
      </h3>
      <p>
        Defines the React components the AI can render. Each component has a name, description,
        Zod schema, and React component. Group them with <code>createLibrary()</code>.
      </p>
      <pre><code>{`import { defineComponent, createLibrary } from "@fabrik/ui"
import { z } from "zod"

const weatherCard = defineComponent({
  name: "weather_card",
  description: "Shows weather for a city",
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

// Export all components as a single library
export const demoLibrary = createLibrary([weatherCard])`}</code></pre>

      <h2>SDK package structure</h2>
      <p>
        The <code>@fabrik/ui</code> package exports multiple entry points. Each import path maps
        to a specific module:
      </p>
      <table>
        <thead>
          <tr>
            <th>Import</th>
            <th>Contents</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>@fabrik/ui</code></td>
            <td>
              Core: <code>defineComponent</code>, <code>defineTool</code>,{" "}
              <code>createLibrary</code>, types
            </td>
          </tr>
          <tr>
            <td><code>@fabrik/ui/react</code></td>
            <td>
              React: <code>Fabrik</code>, <code>Chat</code>, <code>Fab</code>,{" "}
              <code>useChat</code>, <code>Message</code>, <code>InputArea</code>, elicitation
              dialogs
            </td>
          </tr>
          <tr>
            <td><code>@fabrik/ui/server</code></td>
            <td>
              Server: <code>handler()</code>, <code>server()</code>
            </td>
          </tr>
          <tr>
            <td><code>@fabrik/ui/openai</code></td>
            <td>OpenAI adapter</td>
          </tr>
          <tr>
            <td><code>@fabrik/ui/anthropic</code></td>
            <td>Anthropic adapter</td>
          </tr>
          <tr>
            <td><code>@fabrik/ui/google</code></td>
            <td>Google AI adapter</td>
          </tr>
          <tr>
            <td><code>@fabrik/ui/custom</code></td>
            <td>
              Custom provider: <code>custom()</code>, <code>EventStream</code>,{" "}
              <code>parseSseStream()</code>
            </td>
          </tr>
          <tr>
            <td><code>@fabrik/ui/chat</code></td>
            <td>
              Chat UI sub-components: <code>Thinking</code>, <code>StepList</code>,{" "}
              <code>ChoicePicker</code>, <code>ConfirmDialog</code>, etc.
            </td>
          </tr>
          <tr>
            <td><code>@fabrik/ui/pages</code></td>
            <td>
              AI-rendered pages: <code>FabrikPages</code>, <code>defineRoute()</code>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Monorepo structure</h2>
      <p>
        The Fabrik source repo is a pnpm workspace monorepo managed with Turborepo:
      </p>
      <pre><code>{`fabrik/
├── apps/
│   └── web/                  # Marketing site + playground
├── packages/
│   ├── fabrik-ui/            # Core SDK (@fabrik/ui)
│   │   └── src/
│   │       ├── core/         # Client, types, reducer, stream, registry
│   │       ├── react/        # Fabrik provider, useChat, Message
│   │       ├── chat/         # Chat, Fab, InputArea, elicitations, artifacts
│   │       ├── server/       # handler(), server() adapter
│   │       ├── adapters/     # openai, anthropic, google, custom, ai-sdk
│   │       ├── pages/        # FabrikPages, defineRoute, PageCache
│   │       └── themes/       # CSS theme files
│   ├── ui/                   # 55+ shadcn components (shared design system)
│   ├── cli/                  # CLI tool (fabrik add, etc.)
│   └── create-fabrik-app/    # Project scaffolding
├── examples/
│   ├── next-chat/            # Full chat with components, elicitation, artifacts
│   ├── next-widget/          # Marketing page with floating FAB
│   ├── next-copilot/         # Side-panel copilot
│   ├── custom-agent/         # Multi-step reasoning agent
│   ├── local-model/          # Ollama integration
│   └── pages-demo/           # AI-rendered pages with routing
└── tests/                    # Screenshot tests`}</code></pre>
    </article>
  )
}
