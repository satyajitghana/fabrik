export default function GenerativeUIPage() {
  return (
    <article className="prose prose-sm max-w-none">
      <h1>Generative UI</h1>
      <p>
        Generative UI is the core concept behind Fabrik. Instead of the AI responding with only
        text, it can render React components — charts, cards, forms, dashboards — choosing the
        right visual representation based on context and user intent.
      </p>

      <h2>How it works</h2>
      <p>The flow from user message to rendered component:</p>
      <ol>
        <li>
          <strong>Registration</strong> — You define components with{" "}
          <code>defineComponent()</code>. Each has a name, description, Zod schema, and React
          component. The SDK converts schemas to JSON Schema.
        </li>
        <li>
          <strong>Tool exposure</strong> — Components are registered as LLM tools with the{" "}
          <code>show_</code> prefix. The LLM sees <code>show_weather_card</code>,{" "}
          <code>show_bar_chart</code>, etc., along with their JSON Schema parameters.
        </li>
        <li>
          <strong>User message</strong> — When a user sends &quot;Show me Q3 revenue&quot;, the
          message goes to the LLM along with the system prompt and available tools.
        </li>
        <li>
          <strong>LLM decision</strong> — The LLM decides whether to respond with text, call a
          tool, or both. If it decides to show a bar chart, it calls{" "}
          <code>show_bar_chart</code> with arguments matching the schema.
        </li>
        <li>
          <strong>Streaming</strong> — The tool call streams as events:{" "}
          <code>component_start</code> (component identified),{" "}
          <code>component_delta</code> (props streaming as JSON), and{" "}
          <code>component_done</code> (final validated props).
        </li>
        <li>
          <strong>Rendering</strong> — The client validates props with Zod, looks up the
          component in the registry, and renders your React component with the validated props.
        </li>
      </ol>

      <h2>The streaming pipeline</h2>
      <p>
        Under the hood, the SDK uses a reducer-based architecture to manage streaming state.
        Each <code>StreamEvent</code> dispatches a state action:
      </p>
      <pre><code>{`// Simplified stream processing
for await (const event of provider.stream(options)) {
  switch (event.type) {
    case "text":
      // Append text delta to current assistant message
      dispatch({ type: "APPEND_TEXT", delta: event.delta })
      break
    case "component_start":
      // Add pending component part to message
      dispatch({ type: "COMPONENT_START", id: event.id, name: event.name })
      break
    case "component_done":
      // Validate props, update status to "done"
      dispatch({ type: "COMPONENT_DONE", id: event.id, props: event.props })
      break
    case "step_start":
      // Show tool step indicator
      dispatch({ type: "STEP_START", id: event.id, title: event.title })
      break
    // ... more event types
  }
}`}</code></pre>

      <h2>Message parts</h2>
      <p>
        Each <code>FabrikMessage</code> contains an array of <code>Part</code>s. Parts can be
        interleaved — a single assistant message might contain text, then a component, then more
        text:
      </p>
      <table>
        <thead>
          <tr>
            <th>Part Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>text</code></td>
            <td>Markdown text content</td>
          </tr>
          <tr>
            <td><code>component</code></td>
            <td>
              A rendered React component with name, props, and status (pending/streaming/done/error)
            </td>
          </tr>
          <tr>
            <td><code>thinking</code></td>
            <td>Extended thinking content (collapsible, with duration)</td>
          </tr>
          <tr>
            <td><code>step</code></td>
            <td>Tool step indicator (running/done/failed, with title and duration)</td>
          </tr>
          <tr>
            <td><code>image</code></td>
            <td>Image attachment with URL and alt text</td>
          </tr>
          <tr>
            <td><code>ask</code></td>
            <td>Elicitation prompt (confirm, choice, text, permission)</td>
          </tr>
          <tr>
            <td><code>artifact</code></td>
            <td>Code or HTML artifact with syntax highlighting</td>
          </tr>
        </tbody>
      </table>

      <h2>Multi-step tool calls</h2>
      <p>
        The LLM can make multiple tool calls in a single response. The SDK processes them
        sequentially, executing up to <code>maxSteps</code> iterations (default 10). This
        enables patterns like:
      </p>
      <ul>
        <li>Fetching data with a tool, then rendering it with a component</li>
        <li>Making a decision, then showing the result</li>
        <li>Chaining multiple components in a single response</li>
      </ul>

      <h2>Loading states</h2>
      <p>
        While the LLM streams component props, you can show a loading state. Define a{" "}
        <code>loading</code> component that receives partial props:
      </p>
      <pre><code>{`const barChart = defineComponent({
  name: "bar_chart",
  description: "Renders a bar chart",
  schema: z.object({
    title: z.string(),
    data: z.array(z.object({
      label: z.string(),
      value: z.number(),
    })),
  }),
  component: BarChart,
  loading: ({ title }) => (
    <div className="animate-pulse rounded-xl border p-6">
      <div className="h-4 w-40 rounded bg-muted" />
      <div className="mt-4 h-48 rounded bg-muted" />
    </div>
  ),
  stepTitle: "Loading chart...",
})`}</code></pre>

      <h2>Custom rendering with useChat</h2>
      <p>
        If you want full control over how messages and components render, use{" "}
        <code>useChat()</code> instead of the drop-in <code>&lt;Chat&gt;</code>:
      </p>
      <pre><code>{`import { useChat, Message } from "@fabrik/ui/react"

function CustomChat() {
  const { messages, isLoading, send, input } = useChat()

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>
          {msg.role === "user" ? (
            <p>{msg.parts.filter(p => p.type === "text").map(p => p.text).join("")}</p>
          ) : (
            <Message message={msg} />
          )}
        </div>
      ))}
      <input
        value={input.value}
        onChange={(e) => input.set(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") send()
        }}
      />
    </div>
  )
}`}</code></pre>

      <h2>Tools vs. components</h2>
      <p>Fabrik distinguishes between <strong>tools</strong> and <strong>components</strong>:</p>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Tool (<code>defineTool</code>)</th>
            <th>Component (<code>defineComponent</code>)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Purpose</strong></td>
            <td>Execute server-side logic (fetch data, compute)</td>
            <td>Render a React component in the chat</td>
          </tr>
          <tr>
            <td><strong>LLM tool name</strong></td>
            <td>Same as <code>name</code></td>
            <td>Prefixed: <code>show_&#123;name&#125;</code></td>
          </tr>
          <tr>
            <td><strong>Output</strong></td>
            <td>Return value fed back to the LLM</td>
            <td>React component rendered in the UI</td>
          </tr>
          <tr>
            <td><strong>Runs on</strong></td>
            <td>Server (in the stream loop)</td>
            <td>Client (in the browser)</td>
          </tr>
        </tbody>
      </table>
    </article>
  )
}
