export default function ExamplesPage() {
  return (
    <article className="prose prose-sm max-w-none">
      <h1>Examples</h1>
      <p>
        The repository includes 7 example apps demonstrating different patterns. Each runs
        independently and can be used as a starting point for your own project.
      </p>

      <h2>Running examples</h2>
      <pre><code>{`# Clone and install
git clone https://github.com/fabrik-ui/fabrik.git
cd fabrik
pnpm install

# Run a specific example
pnpm --filter next-chat dev      # localhost:4100
pnpm --filter next-widget dev    # localhost:4200
pnpm --filter next-copilot dev   # localhost:4300
pnpm --filter custom-agent dev   # localhost:4400
pnpm --filter local-model dev    # localhost:4500
pnpm --filter pages-demo dev     # localhost:4600

# Run the marketing site
pnpm --filter web dev            # localhost:3000`}</code></pre>
      <p>
        All examples use a mock provider by default, so no API keys are needed. To use a real
        LLM, add your API key to <code>.env.local</code> and swap the provider in{" "}
        <code>app/api/chat/route.ts</code>.
      </p>

      <hr />

      <h2>next-chat</h2>
      <p className="text-muted-foreground">Port 4100 — Full-featured chat application</p>
      <p>
        Demonstrates the complete Fabrik SDK feature set: generative UI components (weather
        cards, bar charts, stats grids, data tables), elicitations (confirm, choice,
        multi-choice, text, permission), artifacts (HTML, code), code diffs, thinking blocks,
        and tool steps.
      </p>
      <p>Key patterns:</p>
      <ul>
        <li>Client/server split with <code>server()</code> adapter and <code>handler()</code></li>
        <li>Component library with <code>createLibrary()</code></li>
        <li>Custom message rendering with <code>useChat()</code> and <code>&lt;Message&gt;</code></li>
        <li>All 5 elicitation types with <code>respond()</code></li>
        <li>Artifact panel with maximize and copy</li>
      </ul>

      <hr />

      <h2>next-widget</h2>
      <p className="text-muted-foreground">Port 4200 — Marketing page with floating chat</p>
      <p>
        A complete marketing landing page (hero, features, pricing, footer) with a floating
        chat button (<code>&lt;Fab&gt;</code>) in the bottom-right corner. Demonstrates how to
        add AI chat to an existing website without modifying the page layout.
      </p>
      <p>Key patterns:</p>
      <ul>
        <li><code>&lt;Fab position=&quot;bottom-right&quot; welcome=&quot;Ask Acme AI&quot; /&gt;</code></li>
        <li>Focus trapping and Escape-to-close in the chat panel</li>
        <li>Mobile-responsive: panel goes full-screen on small viewports</li>
        <li>Coexists with existing page content without layout interference</li>
      </ul>

      <hr />

      <h2>next-copilot</h2>
      <p className="text-muted-foreground">Port 4300 — Side-panel copilot</p>
      <p>
        A document viewer with a copilot chat panel on the right side. The copilot can answer
        questions about the document, summarize sections, explain code examples, and suggest
        improvements. Includes a resizable divider between panels.
      </p>
      <p>Key patterns:</p>
      <ul>
        <li>Split-pane layout with resizable divider</li>
        <li>Context-aware suggestions (document-specific pills)</li>
        <li>Custom chat input with form handling</li>
        <li>Generative UI components in a sidebar context</li>
      </ul>

      <hr />

      <h2>custom-agent</h2>
      <p className="text-muted-foreground">Port 4400 — Multi-step reasoning agent</p>
      <p>
        Demonstrates a custom provider that simulates a multi-step agent workflow. The agent
        plans, searches, analyzes, then responds — with each step visible as a real-time tool
        step indicator.
      </p>
      <p>Key patterns:</p>
      <ul>
        <li>Custom provider using <code>custom()</code> from <code>@fabrik/ui/custom</code></li>
        <li>Multi-step tool calls with <code>step_start</code> / <code>step_done</code> events</li>
        <li>Streaming text interleaved with step indicators</li>
        <li>Custom empty state with agent-specific suggestions</li>
      </ul>

      <hr />

      <h2>local-model</h2>
      <p className="text-muted-foreground">Port 4500 — Ollama integration</p>
      <p>
        Chat with a local Ollama model. Runs entirely on your machine with no external API
        calls. Falls back to a mock provider if Ollama is not running.
      </p>
      <p>Key patterns:</p>
      <ul>
        <li>Custom provider that connects to Ollama&apos;s local API</li>
        <li>Automatic fallback to mock when local model is unavailable</li>
        <li>Demonstrates the provider abstraction — same client code, different backend</li>
      </ul>

      <hr />

      <h2>pages-demo</h2>
      <p className="text-muted-foreground">Port 4600 — AI-rendered pages with routing</p>
      <p>
        A full e-commerce storefront (home, shop, cart) where page content is AI-generated.
        Uses <code>FabrikPages</code> and <code>defineRoute()</code> to map URLs to AI-rendered
        pages with caching.
      </p>
      <p>Key patterns:</p>
      <ul>
        <li><code>defineRoute()</code> for URL-based page generation</li>
        <li>Page-level caching to avoid re-rendering on navigation</li>
        <li>Complex interactive UI (product cards, cart, filters) rendered by the AI</li>
        <li>Client-side routing with animated page transitions</li>
      </ul>

      <hr />

      <h2>web (marketing site)</h2>
      <p className="text-muted-foreground">Port 3000 — Marketing site + playground</p>
      <p>
        The Fabrik UI marketing website with an interactive playground. The playground lets
        visitors try the SDK directly in the browser with pre-configured mock data.
      </p>
    </article>
  )
}
