export default function ElicitationsPage() {
  return (
    <article className="prose prose-sm max-w-none">
      <h1>Elicitations</h1>
      <p>
        Elicitations let the AI ask follow-up questions inline in the chat. Instead of guessing
        what the user wants, the AI can present a confirmation dialog, choice pills, a text
        input, or a permission request. The stream pauses until the user responds.
      </p>

      <h2>How it works</h2>
      <ol>
        <li>
          The LLM calls the built-in <code>ask_user</code> tool with a configuration object.
        </li>
        <li>
          The stream emits an <code>ask</code> event. The client renders the appropriate dialog.
        </li>
        <li>
          The stream <strong>pauses</strong> until the user responds.
        </li>
        <li>
          When the user answers, <code>respond(askId, value)</code> is called. The response is
          sent back to the LLM, which continues generating.
        </li>
      </ol>
      <p>
        Elicitation is enabled by default. Set <code>ask=&#123;false&#125;</code> on{" "}
        <code>&lt;Fabrik&gt;</code> to disable it.
      </p>

      <h2>Elicitation types</h2>

      <h3>1. Confirm</h3>
      <p>
        A yes/no dialog. Use for destructive actions or when the AI needs explicit approval.
      </p>
      <pre><code>{`// The LLM generates this ask config:
{
  type: "confirm",
  title: "Delete all records?",
  message: "This will permanently remove 1,847 records from the database.",
  confirmLabel: "Delete",   // optional, defaults to "Confirm"
  cancelLabel: "Keep"       // optional, defaults to "Cancel"
}`}</code></pre>
      <p>
        <strong>User response:</strong> <code>true</code> (confirmed) or <code>false</code>{" "}
        (cancelled). The built-in <code>&lt;ConfirmDialog&gt;</code> renders as a card with two
        buttons.
      </p>

      <h3>2. Choice</h3>
      <p>
        Single-select from a list of options. The AI presents choices as pills or a list.
      </p>
      <pre><code>{`{
  type: "choice",
  title: "Which city?",
  message: "I found weather data for multiple cities.",  // optional
  options: [
    { value: "sf", label: "San Francisco", description: "California, US" },
    { value: "ny", label: "New York", description: "New York, US" },
    { value: "ld", label: "London", description: "England, UK" },
  ]
}`}</code></pre>
      <p>
        <strong>User response:</strong> The <code>value</code> string of the selected option
        (e.g., <code>&quot;sf&quot;</code>). The <code>&lt;ChoicePicker&gt;</code> renders
        options as clickable pills with optional descriptions.
      </p>

      <h3>3. Multi-choice</h3>
      <p>
        Select multiple options. Supports min/max constraints.
      </p>
      <pre><code>{`{
  type: "multi_choice",
  title: "Select toppings",
  message: "Choose up to 3 toppings for your pizza.",
  options: [
    { value: "pepperoni", label: "Pepperoni" },
    { value: "mushrooms", label: "Mushrooms" },
    { value: "olives", label: "Olives" },
    { value: "peppers", label: "Bell Peppers" },
    { value: "onions", label: "Onions" },
  ],
  min: 1,   // optional: minimum selections
  max: 3,   // optional: maximum selections
}`}</code></pre>
      <p>
        <strong>User response:</strong> An array of <code>value</code> strings (e.g.,{" "}
        <code>[&quot;pepperoni&quot;, &quot;mushrooms&quot;]</code>). The same{" "}
        <code>&lt;ChoicePicker&gt;</code> component handles both single and multi-choice.
      </p>

      <h3>4. Text input</h3>
      <p>
        Free-form text input. Use when the AI needs specific information from the user.
      </p>
      <pre><code>{`{
  type: "text",
  title: "Enter your email",
  message: "I'll send the report to this address.",  // optional
  placeholder: "you@example.com",                     // optional
}`}</code></pre>
      <p>
        <strong>User response:</strong> A string with the user&apos;s text input. The{" "}
        <code>&lt;TextInputDialog&gt;</code> renders a card with a text field and submit button.
      </p>

      <h3>5. Permission</h3>
      <p>
        Request access to a specific resource. Similar to confirm, but semantically distinct —
        used for actions like accessing files, APIs, or external services.
      </p>
      <pre><code>{`{
  type: "permission",
  title: "Access your calendar?",
  message: "I need to read your calendar to find available meeting slots.",
  resource: "google-calendar:read",
}`}</code></pre>
      <p>
        <strong>User response:</strong> <code>true</code> (granted) or <code>false</code>{" "}
        (denied). The <code>&lt;PermissionDialog&gt;</code> renders a card with Allow/Deny
        buttons and shows the resource identifier.
      </p>

      <h2>Handling responses in code</h2>
      <p>
        The <code>useChat()</code> hook provides a <code>respond</code> function:
      </p>
      <pre><code>{`const { respond } = useChat()

// In your elicitation handler:
respond(askId, true)           // confirm
respond(askId, "sf")           // choice
respond(askId, ["a", "b"])     // multi_choice
respond(askId, "hello@ex.com") // text
respond(askId, false)          // permission denied`}</code></pre>

      <h2>Built-in dialog components</h2>
      <p>
        The SDK ships with styled dialog components for each type. If you use{" "}
        <code>&lt;Chat&gt;</code>, they render automatically. If you build a custom UI, import
        them individually:
      </p>
      <pre><code>{`import {
  ConfirmDialog,
  ChoicePicker,
  TextInputDialog,
  PermissionDialog,
} from "@fabrik/ui/react"

// Example: render based on ask type
function AskRenderer({ part }: { part: AskPart }) {
  const { respond } = useChat()
  if (part.status !== "pending") return null

  const cfg = part.config
  switch (cfg.type) {
    case "confirm":
      return (
        <ConfirmDialog
          config={cfg}
          onRespond={(confirmed) => respond(part.id, confirmed)}
        />
      )
    case "choice":
    case "multi_choice":
      return (
        <ChoicePicker
          config={cfg}
          onRespond={(value) => respond(part.id, value)}
        />
      )
    case "text":
      return (
        <TextInputDialog
          title={cfg.title}
          message={cfg.message}
          placeholder={cfg.placeholder}
          onRespond={(text) => respond(part.id, text)}
        />
      )
    case "permission":
      return (
        <PermissionDialog
          title={cfg.title}
          message={cfg.message}
          resource={cfg.resource}
          onRespond={(granted) => respond(part.id, granted)}
        />
      )
  }
}`}</code></pre>

      <h2>Type definitions</h2>
      <pre><code>{`type AskConfig =
  | ConfirmAsk
  | ChoiceAsk
  | MultiChoiceAsk
  | TextAsk
  | PermissionAsk

interface AskOption {
  value: string
  label: string
  description?: string
}

interface AskPart {
  type: "ask"
  id: string
  config: AskConfig
  response?: unknown
  status: "pending" | "answered" | "cancelled"
}`}</code></pre>
    </article>
  )
}
