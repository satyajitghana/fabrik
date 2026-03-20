export default function StreamingPage() {
  return (
    <article className="prose prose-sm max-w-none">
      <h1>Streaming</h1>
      <p>
        Fabrik uses Server-Sent Events (SSE) to stream LLM responses to the browser. Each event
        is a JSON-encoded <code>StreamEvent</code> delivered as an SSE <code>data:</code> line.
      </p>

      <h2>The SSE protocol</h2>
      <p>
        The server response has <code>Content-Type: text/event-stream</code>. Each event is a
        single line starting with <code>data: </code> followed by a JSON object, terminated by a
        double newline:
      </p>
      <pre><code>{`data: {"type":"start","runId":"abc123"}

data: {"type":"text","delta":"Hello"}

data: {"type":"text","delta":", world!"}

data: {"type":"done"}`}</code></pre>
      <p>
        The client reads this stream using the Fetch API&apos;s{" "}
        <code>ReadableStream</code> reader, parsing each line as it arrives.
      </p>

      <h2>StreamEvent types</h2>

      <h3>Lifecycle events</h3>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Fields</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>start</code></td>
            <td><code>runId: string</code></td>
            <td>Stream started. Contains a unique run ID.</td>
          </tr>
          <tr>
            <td><code>done</code></td>
            <td>—</td>
            <td>Stream completed successfully.</td>
          </tr>
          <tr>
            <td><code>error</code></td>
            <td><code>message: string</code></td>
            <td>Stream failed. Contains the error message.</td>
          </tr>
        </tbody>
      </table>

      <h3>Text events</h3>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Fields</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>text</code></td>
            <td><code>delta: string</code></td>
            <td>A text token. Concatenated to form the full response.</td>
          </tr>
        </tbody>
      </table>

      <h3>Component events (generative UI)</h3>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Fields</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>component_start</code></td>
            <td><code>id, name</code></td>
            <td>A component tool call started. Name is without the <code>show_</code> prefix.</td>
          </tr>
          <tr>
            <td><code>component_delta</code></td>
            <td><code>id, delta</code></td>
            <td>Partial JSON of component props. Used for progressive loading.</td>
          </tr>
          <tr>
            <td><code>component_done</code></td>
            <td><code>id, props</code></td>
            <td>Final validated props. Component renders with these.</td>
          </tr>
        </tbody>
      </table>

      <h3>Thinking events</h3>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Fields</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>thinking_start</code></td>
            <td><code>id</code></td>
            <td>Extended thinking block started.</td>
          </tr>
          <tr>
            <td><code>thinking_delta</code></td>
            <td><code>id, delta</code></td>
            <td>Thinking text token.</td>
          </tr>
          <tr>
            <td><code>thinking_done</code></td>
            <td><code>id, durationMs</code></td>
            <td>Thinking complete. Shows duration.</td>
          </tr>
        </tbody>
      </table>

      <h3>Step events</h3>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Fields</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>step_start</code></td>
            <td><code>id, title</code></td>
            <td>A tool step started (e.g., &quot;Searching database...&quot;).</td>
          </tr>
          <tr>
            <td><code>step_done</code></td>
            <td><code>id, stepStatus, durationMs</code></td>
            <td>
              Step completed. Status is <code>&quot;done&quot;</code> or{" "}
              <code>&quot;failed&quot;</code>.
            </td>
          </tr>
        </tbody>
      </table>

      <h3>Artifact events</h3>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Fields</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>artifact_start</code></td>
            <td><code>id, title, language</code></td>
            <td>Artifact generation started. Language determines rendering mode.</td>
          </tr>
          <tr>
            <td><code>artifact_delta</code></td>
            <td><code>id, delta</code></td>
            <td>Artifact content chunk.</td>
          </tr>
          <tr>
            <td><code>artifact_done</code></td>
            <td><code>id</code></td>
            <td>Artifact complete.</td>
          </tr>
        </tbody>
      </table>

      <h3>Elicitation events</h3>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Fields</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>ask</code></td>
            <td><code>id, config</code></td>
            <td>
              Elicitation request. Stream pauses until the user responds. See{" "}
              <a href="/docs/elicitations">Elicitations</a>.
            </td>
          </tr>
        </tbody>
      </table>

      <h3>Tool call events (internal)</h3>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Fields</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>tool_call_start</code></td>
            <td><code>id, toolName</code></td>
            <td>Raw tool call started. Used internally by the client.</td>
          </tr>
          <tr>
            <td><code>tool_call_delta</code></td>
            <td><code>id, delta</code></td>
            <td>Partial JSON of tool arguments.</td>
          </tr>
          <tr>
            <td><code>tool_call_done</code></td>
            <td><code>id, toolName, args</code></td>
            <td>Tool call complete with parsed arguments.</td>
          </tr>
        </tbody>
      </table>

      <h2>Full type definition</h2>
      <pre><code>{`type StreamEvent =
  // Lifecycle
  | { type: "start"; runId: string }
  | { type: "done" }
  | { type: "error"; message: string }
  // Text
  | { type: "text"; delta: string }
  // Components
  | { type: "component_start"; id: string; name: string }
  | { type: "component_delta"; id: string; delta: string }
  | { type: "component_done"; id: string; props: Record<string, unknown> }
  // Thinking
  | { type: "thinking_start"; id: string }
  | { type: "thinking_delta"; id: string; delta: string }
  | { type: "thinking_done"; id: string; durationMs: number }
  // Steps
  | { type: "step_start"; id: string; title: string }
  | { type: "step_done"; id: string; stepStatus: StepStatus; durationMs: number }
  // Artifacts
  | { type: "artifact_start"; id: string; title: string; language: string }
  | { type: "artifact_delta"; id: string; delta: string }
  | { type: "artifact_done"; id: string }
  // Elicitation
  | { type: "ask"; id: string; config: AskConfig }
  // Tool calls (internal)
  | { type: "tool_call_start"; id: string; toolName: string }
  | { type: "tool_call_delta"; id: string; delta: string }
  | { type: "tool_call_done"; id: string; toolName: string; args: Record<string, unknown> }`}</code></pre>

      <h2>Cancellation</h2>
      <p>
        Streams can be cancelled via <code>AbortSignal</code>. The{" "}
        <code>useChat()</code> hook exposes a <code>cancel()</code> function that aborts the
        active stream. On the server, the handler checks <code>req.signal</code> and stops
        iteration when aborted.
      </p>

      <h2>Error handling</h2>
      <p>
        If the provider throws during streaming, the handler catches the error and sends an{" "}
        <code>error</code> event. The client updates the thread status to{" "}
        <code>&quot;error&quot;</code>. The <code>useChat()</code> hook provides a{" "}
        <code>retry()</code> function that resends the last user message.
      </p>
    </article>
  )
}
