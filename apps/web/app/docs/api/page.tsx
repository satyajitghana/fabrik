export default function ApiReferencePage() {
  return (
    <article className="prose prose-sm max-w-none">
      <h1>API Reference</h1>

      <h2>Core</h2>

      <h3>
        <code>defineComponent&lt;T&gt;(def)</code>
      </h3>
      <p>
        Registers a React component the LLM can render. Returns a frozen{" "}
        <code>ComponentDef&lt;T&gt;</code>.
      </p>
      <pre><code>{`import { defineComponent } from "@fabrik/ui"
import { z } from "zod"

const card = defineComponent({
  name: "weather_card",         // Tool name: show_weather_card
  description: "Shows weather", // Tells the LLM when to use it
  schema: z.object({            // Zod → JSON Schema for the LLM
    city: z.string(),
    temp: z.number(),
  }),
  component: WeatherCard,       // React component
  loading: WeatherSkeleton,     // Optional: shown while streaming props
  stepTitle: "Loading weather", // Optional: tool step indicator text
})`}</code></pre>

      <h3>
        <code>defineTool&lt;In, Out&gt;(def)</code>
      </h3>
      <p>
        Registers a server-side tool the LLM can call. Returns a frozen{" "}
        <code>ToolDef&lt;In, Out&gt;</code>.
      </p>
      <pre><code>{`import { defineTool } from "@fabrik/ui"
import { z } from "zod"

const searchTool = defineTool({
  name: "search_database",
  description: "Searches the product database",
  schema: z.object({ query: z.string() }),
  run: async ({ query }) => {
    const results = await db.search(query)
    return results
  },
  stepTitle: (args) => \`Searching for "\${args.query}"...\`,
})`}</code></pre>

      <h3>
        <code>createLibrary(defs)</code>
      </h3>
      <p>
        Combines multiple component definitions into an array. Validates that names are unique.
      </p>
      <pre><code>{`import { createLibrary } from "@fabrik/ui"

export const library = createLibrary([weatherCard, barChart, statsGrid])`}</code></pre>

      <hr />

      <h2>React</h2>

      <h3>
        <code>&lt;Fabrik&gt;</code>
      </h3>
      <p>
        Root provider component. Creates a <code>FabrikClient</code> and provides state and
        actions via context.
      </p>
      <pre><code>{`import { Fabrik } from "@fabrik/ui/react"

<Fabrik
  provider={provider}          // Required: Provider instance
  components={library}         // Optional: generative UI components
  tools={[searchTool]}         // Optional: server-side tools
  systemPrompt="You are..."    // Optional: prepended to system prompt
  theme="system"               // "light" | "dark" | "system"
  storage="memory"             // "memory" | "local" | custom Storage
  ask={true}                   // Enable elicitation (default: true)
  autoTitle={true}             // Auto-generate thread titles (default: true)
  maxSteps={10}                // Max tool call iterations (default: 10)
  beforeSend={(text) => text}  // Transform/reject messages before sending
  onError={(err) => {}}        // Error callback
>
  {children}
</Fabrik>`}</code></pre>

      <h3>
        <code>useChat()</code>
      </h3>
      <p>
        Hook for accessing chat state and actions. Must be used within{" "}
        <code>&lt;Fabrik&gt;</code>.
      </p>
      <pre><code>{`import { useChat } from "@fabrik/ui/react"

const {
  // State
  messages,     // FabrikMessage[] — current thread messages
  isLoading,    // boolean — streaming or waiting
  status,       // "idle" | "streaming" | "waiting" | "error"
  error,        // Error | null
  threadId,     // string — current thread ID

  // Input
  input: {
    value,      // string — current input text
    set,        // (value: string) => void
    files,      // File[] — attached files
    addFile,    // (file: File) => void
    removeFile, // (index: number) => void
    clearFiles, // () => void
  },

  // Actions
  send,         // () => void — send current input
  cancel,       // () => void — abort active stream
  retry,        // () => void — retry last user message
  respond,      // (askId: string, value: unknown) => void — answer elicitation

  // Thread management
  newThread,    // () => void — create new thread
  switchThread, // (id: string) => void
} = useChat()`}</code></pre>

      <h3>
        <code>&lt;Chat&gt;</code>
      </h3>
      <p>Drop-in chat interface component.</p>
      <pre><code>{`import { Chat } from "@fabrik/ui/react"

<Chat
  sidebar={false}               // Show thread sidebar (default: false)
  placeholder="Send a message"  // Input placeholder text
  welcome={<CustomWelcome />}   // Custom empty state
  className="h-screen"          // Additional CSS classes
  onFeedback={(msgId, type) => {}} // Thumbs up/down callback
/>`}</code></pre>

      <h3>
        <code>&lt;Fab&gt;</code>
      </h3>
      <p>Floating action button that opens a chat overlay panel.</p>
      <pre><code>{`import { Fab } from "@fabrik/ui/react"

<Fab
  position="bottom-right"  // "bottom-right" | "bottom-left"
  welcome="Ask Acme AI"    // Panel header text
  width={400}              // Panel width in px (default: 400)
  height={600}             // Panel height in px (default: 600)
/>`}</code></pre>

      <h3>
        <code>&lt;Message&gt;</code>
      </h3>
      <p>
        Renders a single message&apos;s parts. Handles text (markdown), components, thinking,
        steps, artifacts, and elicitations.
      </p>
      <pre><code>{`import { Message } from "@fabrik/ui/react"

<Message
  message={msg}
  className="text-sm"
  renderThinking={(part) => <CustomThinking part={part} />}
  renderStep={(part) => <CustomStep part={part} />}
  renderAsk={(part) => <CustomAsk part={part} />}
  renderArtifact={(part) => <CustomArtifact part={part} />}
/>`}</code></pre>

      <h3>
        <code>&lt;InputArea&gt;</code>
      </h3>
      <p>Auto-resizing textarea with file attachments, send button, and keyboard shortcuts.</p>
      <pre><code>{`import { InputArea } from "@fabrik/ui/react"

<InputArea
  placeholder="Send a message..."
  className="max-w-2xl"
/>`}</code></pre>

      <hr />

      <h2>Server</h2>

      <h3>
        <code>handler(options)</code>
      </h3>
      <p>
        Creates a Next.js-compatible POST handler that streams LLM responses as SSE.
      </p>
      <pre><code>{`import { handler } from "@fabrik/ui/server"
import { openai } from "@fabrik/ui/openai"

export const POST = handler({
  provider: openai({ model: "gpt-4o" }),
})`}</code></pre>
      <p>
        The handler accepts a <code>Request</code> with a JSON body containing{" "}
        <code>messages</code>, <code>tools</code>, and <code>systemPrompt</code>. It returns a{" "}
        streaming <code>Response</code> with <code>Content-Type: text/event-stream</code>.
      </p>

      <h3>
        <code>server(options)</code>
      </h3>
      <p>
        Creates a client-side <code>Provider</code> that proxies requests to your API route via
        fetch + SSE.
      </p>
      <pre><code>{`import { server } from "@fabrik/ui/server"

const provider = server({ url: "/api/chat" })`}</code></pre>

      <hr />

      <h2>Custom Providers</h2>

      <h3>
        <code>custom(options)</code>
      </h3>
      <p>Wraps a user-provided stream function into a Provider.</p>
      <pre><code>{`import { custom } from "@fabrik/ui/custom"

const provider = custom({
  name: "my-llm",
  stream: async function* (options) {
    yield { type: "start", runId: "..." }
    yield { type: "text", delta: "Hello!" }
    yield { type: "done" }
  },
})`}</code></pre>

      <h3>
        <code>EventStream</code>
      </h3>
      <p>
        Push-based async iterable for bridging callback-based APIs. Call{" "}
        <code>.push(event)</code> to emit events, <code>.end()</code> when done, or{" "}
        <code>.fail(err)</code> on error.
      </p>
      <pre><code>{`import { EventStream } from "@fabrik/ui/custom"

const stream = new EventStream()
stream.push({ type: "text", delta: "hi" })
stream.end()`}</code></pre>

      <h3>
        <code>parseSseStream(response)</code>
      </h3>
      <p>
        Parses a standard SSE response into <code>StreamEvent</code>s.
      </p>

      <h3>
        <code>parseOpenAiStream(response)</code>
      </h3>
      <p>
        Parses an OpenAI-compatible SSE response into Fabrik <code>StreamEvent</code>s. Handles
        text deltas, tool calls, and finish reasons.
      </p>

      <hr />

      <h2>Types</h2>
      <pre><code>{`// Messages
interface FabrikMessage {
  id: string
  role: "user" | "assistant" | "system"
  parts: Part[]
  createdAt: string
}

type Part =
  | TextPart        // { type: "text", text: string }
  | ComponentPart   // { type: "component", id, name, props, status, children? }
  | ThinkingPart    // { type: "thinking", id, text, durationMs?, status }
  | StepPart        // { type: "step", id, title, stepStatus, durationMs? }
  | ImagePart       // { type: "image", url, alt? }
  | AskPart         // { type: "ask", id, config, response?, status }
  | ArtifactPart    // { type: "artifact", id, title, language, content, status }

// Threads
interface FabrikThread {
  id: string
  name?: string
  messages: FabrikMessage[]
  status: "idle" | "streaming" | "waiting" | "error"
  createdAt: string
  updatedAt: string
}

// Provider
interface Provider {
  name: string
  stream(options: StreamOptions): AsyncIterable<StreamEvent>
}

interface StreamOptions {
  messages: FabrikMessage[]
  systemPrompt: string
  tools: ToolSpec[]
  model?: string
  signal?: AbortSignal
}

// Storage
interface Storage {
  loadThreads(): Promise<{ id: string; name?: string; updatedAt: string }[]>
  loadThread(id: string): Promise<FabrikThread | null>
  saveThread(thread: FabrikThread): Promise<void>
  deleteThread(id: string): Promise<void>
}`}</code></pre>
    </article>
  )
}
