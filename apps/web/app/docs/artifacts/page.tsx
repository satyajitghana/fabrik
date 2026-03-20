export default function ArtifactsPage() {
  return (
    <article className="prose prose-sm max-w-none">
      <h1>Artifacts & Code Diffs</h1>
      <p>
        Artifacts are standalone content blocks the AI generates — HTML pages, code snippets,
        SVGs, or markdown documents. Code diffs show file changes with accept/reject controls.
      </p>

      <h2>Artifact types</h2>

      <h3>HTML artifacts</h3>
      <p>
        When the AI generates HTML content, it renders in a sandboxed <code>&lt;iframe&gt;</code>{" "}
        with no script execution. The iframe auto-resizes to fit the content. Users can
        maximize it to full screen.
      </p>
      <pre><code>{`// Stream events for an HTML artifact:
{ type: "artifact_start", id: "a1", title: "Landing Page", language: "html" }
{ type: "artifact_delta", id: "a1", delta: "<html><body>..." }
{ type: "artifact_delta", id: "a1", delta: "...more HTML..." }
{ type: "artifact_done", id: "a1" }`}</code></pre>
      <p>
        The <code>&lt;ArtifactPanel&gt;</code> component renders the HTML artifact with:
      </p>
      <ul>
        <li>Sandboxed iframe (<code>sandbox=&quot;&quot;</code>) with no JavaScript execution</li>
        <li><code>referrerPolicy=&quot;no-referrer&quot;</code> for privacy</li>
        <li>Auto-resizing to content height (capped at 600px inline, unlimited maximized)</li>
        <li>Copy button to copy the raw HTML</li>
        <li>Maximize button for full-screen viewing</li>
        <li>Language badge showing &quot;HTML&quot;</li>
      </ul>

      <h3>Code artifacts</h3>
      <p>
        Code artifacts render with Shiki syntax highlighting. The SDK supports TypeScript,
        JavaScript, Python, Rust, Go, Java, C/C++, SQL, YAML, TOML, Markdown, Bash, CSS, JSON,
        and more.
      </p>
      <pre><code>{`// Stream events for a code artifact:
{ type: "artifact_start", id: "a2", title: "API Client", language: "typescript" }
{ type: "artifact_delta", id: "a2", delta: "import { fetch } from..." }
{ type: "artifact_done", id: "a2" }`}</code></pre>
      <p>Features:</p>
      <ul>
        <li>Shiki syntax highlighting with the <code>vitesse-dark</code> theme</li>
        <li>Lazy loading — Shiki is loaded on demand, with a plain text fallback</li>
        <li>Streaming support — code highlights progressively as content arrives</li>
        <li>Copy and maximize buttons</li>
      </ul>

      <h3>Markdown artifacts</h3>
      <p>
        Markdown artifacts render as formatted text within the artifact panel, useful for longer
        documents or reports the AI generates.
      </p>

      <h2>Artifact part type</h2>
      <pre><code>{`interface ArtifactPart {
  type: "artifact"
  id: string
  title: string
  language: string  // "html", "typescript", "python", "svg", etc.
  content: string
  status: "streaming" | "done"
}`}</code></pre>

      <h2>Using ArtifactPanel</h2>
      <p>
        If you use <code>&lt;Chat&gt;</code>, artifacts render automatically. For custom UIs,
        import the component:
      </p>
      <pre><code>{`import { ArtifactPanel } from "@fabrik/ui/react"

function MyArtifactRenderer({ part }: { part: ArtifactPart }) {
  return <ArtifactPanel artifact={part} onClose={() => {}} />
}`}</code></pre>

      <h2>Code diffs</h2>
      <p>
        The <code>&lt;CodeDiff&gt;</code> component renders GitHub-style unified diffs with line
        numbers, color-coded additions/removals, and accept/reject buttons.
      </p>
      <pre><code>{`import { CodeDiff } from "@fabrik/ui/react"

<CodeDiff
  filename="src/utils.ts"
  language="typescript"
  original={\`function add(a: number, b: number) {
  return a + b
}\`}
  modified={\`function add(a: number, b: number): number {
  return a + b
}

function subtract(a: number, b: number): number {
  return a - b
}\`}
  onAccept={() => console.log("Changes accepted")}
  onReject={() => console.log("Changes rejected")}
/>`}</code></pre>

      <h3>CodeDiff props</h3>
      <table>
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>filename</code></td>
            <td><code>string</code></td>
            <td>File path shown in the header</td>
          </tr>
          <tr>
            <td><code>language</code></td>
            <td><code>string?</code></td>
            <td>Language badge (optional)</td>
          </tr>
          <tr>
            <td><code>original</code></td>
            <td><code>string</code></td>
            <td>Original file content</td>
          </tr>
          <tr>
            <td><code>modified</code></td>
            <td><code>string</code></td>
            <td>Modified file content</td>
          </tr>
          <tr>
            <td><code>onAccept</code></td>
            <td><code>() =&gt; void</code></td>
            <td>Called when user clicks Accept</td>
          </tr>
          <tr>
            <td><code>onReject</code></td>
            <td><code>() =&gt; void</code></td>
            <td>Called when user clicks Reject</td>
          </tr>
          <tr>
            <td><code>status</code></td>
            <td><code>&quot;pending&quot; | &quot;accepted&quot; | &quot;rejected&quot;</code></td>
            <td>Controls button display vs. status badge</td>
          </tr>
        </tbody>
      </table>

      <h3>Diff algorithm</h3>
      <p>
        The component uses an LCS (Longest Common Subsequence) based diff algorithm. It
        computes a unified diff with old/new line numbers, addition/removal coloring, and
        stats (+N / -N lines).
      </p>

      <h2>Security</h2>
      <p>Artifact rendering includes multiple layers of protection:</p>
      <ul>
        <li>
          <strong>HTML artifacts</strong> render in an iframe with{" "}
          <code>sandbox=&quot;&quot;</code> — no scripts, no forms, no navigation.
        </li>
        <li>
          <strong>Shiki output</strong> is sanitized: <code>&lt;script&gt;</code> and{" "}
          <code>&lt;iframe&gt;</code> tags are stripped, <code>on*</code> event handlers are
          blocked, and <code>javascript:</code> URLs are neutralized.
        </li>
        <li>
          <strong>Referrer policy</strong> is set to <code>no-referrer</code> on iframes to
          prevent data leakage.
        </li>
      </ul>
    </article>
  )
}
