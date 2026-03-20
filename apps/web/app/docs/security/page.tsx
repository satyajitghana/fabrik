export default function SecurityPage() {
  return (
    <article className="prose prose-sm max-w-none">
      <h1>Security</h1>
      <p>
        Fabrik is designed with a strict client/server separation to keep API keys and sensitive
        data secure. This page covers the security model, best practices, and common mistakes to
        avoid.
      </p>

      <h2>Architecture</h2>
      <p>The security model relies on a clear boundary between client and server:</p>
      <pre><code>{`┌─────────────────────────────┐     ┌──────────────────────────────┐
│         Browser             │     │         Server               │
│                             │     │                              │
│  Fabrik provider            │────▶│  API route (/api/chat)       │
│  (server({ url }))          │     │  handler({ provider })       │
│                             │◀────│                              │
│  - Sends messages           │ SSE │  - Reads API keys from env   │
│  - Receives stream events   │     │  - Calls LLM provider        │
│  - Renders components       │     │  - Streams responses         │
│  - Never sees API keys      │     │  - Never exposes credentials │
└─────────────────────────────┘     └──────────────────────────────┘`}</code></pre>

      <h2>How API keys are handled</h2>
      <ol>
        <li>
          API keys are stored in <code>.env.local</code> (never committed to version control).
        </li>
        <li>
          The <code>handler()</code> function runs server-side in your Next.js API route. It
          reads the environment variable directly (e.g., <code>OPENAI_API_KEY</code>).
        </li>
        <li>
          The <code>server()</code> adapter on the client only sends the user&apos;s messages to
          your API route. No API key is ever included in the request.
        </li>
        <li>
          Responses stream back as SSE. The client receives <code>StreamEvent</code> objects —
          text deltas, component props, tool steps — never raw LLM responses or credentials.
        </li>
      </ol>

      <h2>Environment variables</h2>
      <table>
        <thead>
          <tr>
            <th>Variable</th>
            <th>Used By</th>
            <th>Where It Runs</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>OPENAI_API_KEY</code></td>
            <td>OpenAI adapter</td>
            <td>Server only</td>
          </tr>
          <tr>
            <td><code>ANTHROPIC_API_KEY</code></td>
            <td>Anthropic adapter</td>
            <td>Server only</td>
          </tr>
          <tr>
            <td><code>GOOGLE_AI_API_KEY</code></td>
            <td>Google AI adapter</td>
            <td>Server only</td>
          </tr>
        </tbody>
      </table>
      <p>
        In Next.js, environment variables without the <code>NEXT_PUBLIC_</code> prefix are only
        available server-side. Fabrik adapters follow this convention — they never prefix keys
        with <code>NEXT_PUBLIC_</code>.
      </p>

      <h2>Artifact sandboxing</h2>
      <p>
        HTML artifacts are rendered in an <code>&lt;iframe&gt;</code> with strict sandboxing:
      </p>
      <ul>
        <li>
          <code>sandbox=&quot;&quot;</code> — Disables scripts, forms, popups, navigation, and
          all other capabilities by default.
        </li>
        <li>
          <code>referrerPolicy=&quot;no-referrer&quot;</code> — Prevents the iframe from sending
          referrer information.
        </li>
        <li>
          Shiki-highlighted code output is sanitized: <code>&lt;script&gt;</code> and{" "}
          <code>&lt;iframe&gt;</code> tags are stripped, <code>on*</code> event handlers are
          blocked, and <code>javascript:</code> URLs are neutralized.
        </li>
      </ul>

      <h2>Input validation</h2>
      <p>
        All component props are validated against their Zod schema before rendering. If the LLM
        returns malformed props, the component won&apos;t render — preventing injection attacks
        through props.
      </p>

      <h2>What NOT to do</h2>
      <table>
        <thead>
          <tr>
            <th>Bad practice</th>
            <th>Why it&apos;s dangerous</th>
            <th>Correct approach</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Put API keys in client code</td>
            <td>Keys are visible in browser devtools and network tab</td>
            <td>
              Use <code>.env.local</code> + <code>handler()</code> server-side
            </td>
          </tr>
          <tr>
            <td>
              Use <code>NEXT_PUBLIC_</code> prefix for LLM keys
            </td>
            <td>Next.js bundles these into client JavaScript</td>
            <td>
              Use unprefixed env vars (e.g., <code>OPENAI_API_KEY</code>)
            </td>
          </tr>
          <tr>
            <td>Call LLM APIs directly from the browser</td>
            <td>Exposes API keys and allows abuse</td>
            <td>
              Always proxy through <code>handler()</code>
            </td>
          </tr>
          <tr>
            <td>Commit <code>.env.local</code> to git</td>
            <td>Keys are visible in repository history forever</td>
            <td>
              Add <code>.env.local</code> to <code>.gitignore</code>
            </td>
          </tr>
          <tr>
            <td>
              Render unsanitized HTML with <code>dangerouslySetInnerHTML</code>
            </td>
            <td>XSS attacks through LLM-generated content</td>
            <td>
              Use <code>&lt;ArtifactPanel&gt;</code> with sandboxed iframe
            </td>
          </tr>
          <tr>
            <td>Skip Zod validation on component props</td>
            <td>Malformed props could cause crashes or injection</td>
            <td>
              Always use <code>defineComponent()</code> with a Zod schema
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Rate limiting</h2>
      <p>
        The <code>handler()</code> does not include built-in rate limiting. For production
        deployments, add rate limiting at the API route level or use your hosting
        provider&apos;s built-in protections (e.g., Vercel&apos;s rate limiting, Cloudflare WAF).
      </p>

      <h2>Content filtering</h2>
      <p>
        Use the <code>beforeSend</code> prop on <code>&lt;Fabrik&gt;</code> to filter or
        transform user messages before they reach the LLM:
      </p>
      <pre><code>{`<Fabrik
  provider={provider}
  beforeSend={(text) => {
    // Return null to reject the message
    if (containsPII(text)) return null

    // Return transformed text
    return text.trim()
  }}
/>`}</code></pre>

      <h2>System prompt hardening</h2>
      <p>
        The SDK generates a system prompt that includes component descriptions and tool schemas.
        You can prepend your own instructions via the <code>systemPrompt</code> prop:
      </p>
      <pre><code>{`<Fabrik
  provider={provider}
  systemPrompt="You are a helpful assistant for Acme Corp. Never reveal internal data."
/>`}</code></pre>
      <p>
        The user&apos;s custom system prompt is prepended to the auto-generated tool
        instructions. This ensures your safety instructions take priority.
      </p>
    </article>
  )
}
