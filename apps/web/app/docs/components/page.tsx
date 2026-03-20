export default function ComponentsPage() {
  return (
    <article className="prose prose-sm max-w-none">
      <h1>Components</h1>
      <p>
        Fabrik has two types of components:{" "}
        <strong>chat UI components</strong> (the SDK&apos;s built-in interface) and{" "}
        <strong>generative UI components</strong> (custom components the AI can render).
      </p>

      <h2>Chat UI components</h2>
      <p>
        These ship with the SDK and provide a complete chat interface:
      </p>
      <table>
        <thead>
          <tr>
            <th>Component</th>
            <th>Import</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>&lt;Fabrik&gt;</code></td>
            <td><code>@fabrik/ui/react</code></td>
            <td>Root provider. Wraps your app and manages client state, theme, and component registry.</td>
          </tr>
          <tr>
            <td><code>&lt;Chat&gt;</code></td>
            <td><code>@fabrik/ui/react</code></td>
            <td>Full chat interface with auto-scroll, message actions, typing indicators, and optional sidebar.</td>
          </tr>
          <tr>
            <td><code>&lt;Fab&gt;</code></td>
            <td><code>@fabrik/ui/react</code></td>
            <td>Floating action button that opens a chat overlay panel. Focus-trapped, Escape to close.</td>
          </tr>
          <tr>
            <td><code>&lt;InputArea&gt;</code></td>
            <td><code>@fabrik/ui/react</code></td>
            <td>Auto-resizing textarea with file attachment support and send button.</td>
          </tr>
          <tr>
            <td><code>&lt;Message&gt;</code></td>
            <td><code>@fabrik/ui/react</code></td>
            <td>Renders message parts: text (markdown), components, thinking, steps, artifacts.</td>
          </tr>
          <tr>
            <td><code>&lt;ArtifactPanel&gt;</code></td>
            <td><code>@fabrik/ui/react</code></td>
            <td>Renders HTML in sandboxed iframe or code with Shiki syntax highlighting. Maximizable.</td>
          </tr>
          <tr>
            <td><code>&lt;CodeDiff&gt;</code></td>
            <td><code>@fabrik/ui/react</code></td>
            <td>GitHub-style unified diff with line numbers and accept/reject buttons.</td>
          </tr>
        </tbody>
      </table>

      <h2>Defining generative UI components</h2>
      <p>
        Use <code>defineComponent()</code> to create components the AI can render at runtime:
      </p>
      <pre><code>{`import { defineComponent } from "@fabrik/ui"
import { z } from "zod"

export const weatherCard = defineComponent({
  name: "weather_card",
  description: "Shows current weather for a city",
  schema: z.object({
    city: z.string(),
    temp: z.number(),
    condition: z.string(),
    humidity: z.number().optional(),
  }),
  component: WeatherCard,
})`}</code></pre>

      <h3>Required fields</h3>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>name</code></td>
            <td><code>string</code></td>
            <td>
              Unique identifier. The LLM sees this as <code>show_&#123;name&#125;</code>. Use
              snake_case.
            </td>
          </tr>
          <tr>
            <td><code>description</code></td>
            <td><code>string</code></td>
            <td>
              Tells the LLM when to use this component. Be specific — &quot;Shows current weather
              for a city including temperature and conditions&quot;.
            </td>
          </tr>
          <tr>
            <td><code>schema</code></td>
            <td><code>ZodType</code></td>
            <td>
              Zod schema for props. Converted to JSON Schema and sent to the LLM. Props are
              validated before rendering.
            </td>
          </tr>
          <tr>
            <td><code>component</code></td>
            <td><code>ComponentType</code></td>
            <td>React component that receives the validated props.</td>
          </tr>
        </tbody>
      </table>

      <h3>Optional fields</h3>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>loading</code></td>
            <td><code>ComponentType</code></td>
            <td>
              Shown while the LLM is streaming props. Receives partial props (all fields
              optional).
            </td>
          </tr>
          <tr>
            <td><code>stepTitle</code></td>
            <td><code>string | (args) =&gt; string</code></td>
            <td>
              Text shown in the tool step indicator while the component loads. E.g.,{" "}
              <code>&quot;Loading weather...&quot;</code>.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Grouping components</h2>
      <p>
        Use <code>createLibrary()</code> to combine multiple component definitions into a single
        array. It validates that names are unique:
      </p>
      <pre><code>{`import { createLibrary } from "@fabrik/ui"

export const demoLibrary = createLibrary([
  weatherCard,
  barChart,
  statsGrid,
  dataTable,
])`}</code></pre>

      <h2>Passing components to Fabrik</h2>
      <pre><code>{`<Fabrik
  provider={provider}
  components={demoLibrary}
>
  <Chat />
</Fabrik>`}</code></pre>

      <h2>How the LLM sees components</h2>
      <p>
        Each component is registered as a tool with the <code>show_</code> prefix. The LLM
        receives a tool list like:
      </p>
      <pre><code>{`{
  "name": "show_weather_card",
  "description": "Shows current weather for a city",
  "parameters": {
    "type": "object",
    "properties": {
      "city": { "type": "string" },
      "temp": { "type": "number" },
      "condition": { "type": "string" }
    },
    "required": ["city", "temp", "condition"]
  }
}`}</code></pre>
      <p>
        When the LLM decides to render this component, it calls{" "}
        <code>show_weather_card</code> with the appropriate arguments. The SDK validates the
        props against the Zod schema, then renders your React component.
      </p>

      <h2>Writing effective descriptions</h2>
      <p>Tips for component descriptions that help the LLM choose correctly:</p>
      <ul>
        <li>
          <strong>Be specific about when to use it</strong> — &quot;Shows a bar chart for
          comparing categorical data like monthly revenue&quot; is better than &quot;Shows a
          chart&quot;.
        </li>
        <li>
          <strong>Mention data requirements</strong> — &quot;Requires at least 2 data points with
          label and value&quot;.
        </li>
        <li>
          <strong>Differentiate from similar components</strong> — If you have both{" "}
          <code>bar_chart</code> and <code>line_chart</code>, describe when each is appropriate.
        </li>
      </ul>
    </article>
  )
}
