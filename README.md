<div align="center">
  <img src="assets/logo.svg" alt="fabrik logo" width="64" height="64" />
  <h1>@fabrik/ui</h1>
  <p><strong>Generative UI SDK for any LLM</strong></p>
  <p>The AI decides what to show — not just say.</p>

  <p>
    <a href="#quickstart">Quickstart</a> •
    <a href="#features">Features</a> •
    <a href="#providers">Providers</a> •
    <a href="#components">Components</a> •
    <a href="#examples">Examples</a>
  </p>
</div>

---

## Quickstart

```bash
pnpm add @fabrik/ui zod motion
```

Create two files:

**`app/api/chat/route.ts`** — Server-side route (API key stays here):

```typescript
import { openai } from "@fabrik/ui/openai"
import { handler } from "@fabrik/ui/server"

export const POST = handler({ provider: openai({ model: "gpt-4o" }) })
// Reads OPENAI_API_KEY from your .env.local automatically
```

**`app/page.tsx`** — Client-side app:

```tsx
"use client"
import { Fabrik, Chat } from "@fabrik/ui/react"
import { server } from "@fabrik/ui/server"
import { defineComponent } from "@fabrik/ui"
import { z } from "zod"

const provider = server({ url: "/api/chat" })

const weatherCard = defineComponent({
  name: "weather_card",
  description: "Shows weather for a city",
  schema: z.object({ city: z.string(), temp: z.number(), condition: z.string() }),
  component: ({ city, temp, condition }) => (
    <div className="rounded-xl border p-4">
      <h3 className="font-bold">{city}</h3>
      <p className="text-3xl">{temp}°F</p>
      <p>{condition}</p>
    </div>
  ),
})

export default function Page() {
  return (
    <Fabrik provider={provider} components={[weatherCard]}>
      <Chat />
    </Fabrik>
  )
}
```

**`.env.local`** — API key (never committed to git):

```bash
OPENAI_API_KEY=sk-...
```

**That's it.** The AI calls `show_weather_card()` and your component renders. API keys never touch the browser.

## Features

- **Generative UI** — LLM calls `show_weather_card()` and your React component renders
- **Any LLM** — OpenAI, Anthropic, Google, Mistral, Groq — 53+ providers
- **Streaming** — Text and components stream in progressively
- **Thinking Steps** — Animated tool progress (Searching API... 0.6s)
- **Elicitation** — AI asks follow-up questions: choice pills, confirmations, text inputs, permissions
- **Artifacts** — HTML in sandboxed iframes, code with Shiki syntax highlighting
- **Code Diffs** — GitHub-style unified diffs with accept/reject
- **55 shadcn components** — Full UI library included
- **Charts** — Recharts with teal palette
- **File attachments** — Image preview thumbnails, drag & drop
- **Markdown** — Bold, italic, code, links in messages
- **Spring animations** — Motion library with spring physics
- **Dark mode** — CSS variable themes, 3 presets
- **Mobile-first** — Responsive at every breakpoint
- **Accessible** — WCAG AA, keyboard nav, screen readers, reduced motion
- **Secure** — API keys never leave the server

## Providers

Swap the import and model to switch LLMs. API keys are read from environment variables automatically.

```typescript
// app/api/chat/route.ts — swap one import to change providers
import { openai } from "@fabrik/ui/openai"        // reads OPENAI_API_KEY
import { handler } from "@fabrik/ui/server"
export const POST = handler({ provider: openai({ model: "gpt-4o" }) })
```

```typescript
// Or Anthropic:
import { anthropic } from "@fabrik/ui/anthropic"   // reads ANTHROPIC_API_KEY
import { handler } from "@fabrik/ui/server"
export const POST = handler({ provider: anthropic({ model: "claude-sonnet-4-20250514" }) })
```

```typescript
// Or Google:
import { google } from "@fabrik/ui/google"         // reads GOOGLE_AI_API_KEY
import { handler } from "@fabrik/ui/server"
export const POST = handler({ provider: google({ model: "gemini-2.0-flash" }) })
```

The client-side code stays the same regardless of which LLM you use:

```tsx
// app/page.tsx — never changes when you switch providers
import { server } from "@fabrik/ui/server"
const provider = server({ url: "/api/chat" })
```

### Supported providers

| Import | Env variable | Default model |
|--------|-------------|---------------|
| `@fabrik/ui/openai` | `OPENAI_API_KEY` | `gpt-4o` |
| `@fabrik/ui/anthropic` | `ANTHROPIC_API_KEY` | `claude-sonnet-4-20250514` |
| `@fabrik/ui/google` | `GOOGLE_AI_API_KEY` | `gemini-2.0-flash` |

### Advanced: custom provider

For local models or custom backends, use the `custom` adapter directly on the client:

```tsx
import { custom } from "@fabrik/ui/custom"

const provider = custom({
  name: "ollama",
  stream: async function* ({ messages }) {
    const res = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      body: JSON.stringify({ model: "llama3", messages, stream: true }),
    })
    // ... yield StreamEvents
  }
})

## Project Structure

A Fabrik app has this structure:

```
my-app/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts        ← Server: LLM provider + API key
│   ├── page.tsx                ← Client: <Fabrik> + <Chat>
│   └── layout.tsx              ← Root layout
├── components/
│   └── fabrik-components.tsx   ← Your generative UI components
├── .env.local                  ← API keys (gitignored)
└── package.json
```

## Components

### Chat UI (SDK)

| Component | Description |
|-----------|-------------|
| `<Chat>` | Drop-in chat with auto-scroll, message actions, typing indicators |
| `<Fab>` | Floating action button that opens a chat overlay |
| `<InputArea>` | Auto-resizing textarea with file attachments + image preview |
| `<Message>` | Renders message parts with markdown, components, artifacts |
| `<ArtifactPanel>` | HTML iframe or Shiki-highlighted code with maximize |
| `<CodeDiff>` | GitHub-style diff with accept/reject |
| `<ConfirmDialog>` | Confirmation with custom labels |
| `<ChoicePicker>` | Single-choice pills or multi-choice checkboxes |
| `<TextInputDialog>` | Text input elicitation |
| `<PermissionDialog>` | Allow/Deny with resource badge |

### Generative UI (define your own)

```tsx
import { defineComponent } from "@fabrik/ui"
import { z } from "zod"

export const barChart = defineComponent({
  name: "bar_chart",
  description: "Renders a bar chart from data",
  schema: z.object({
    title: z.string(),
    data: z.array(z.object({ label: z.string(), value: z.number() })),
  }),
  component: BarChart,
})
```

The AI sees the schema, decides when to render it, and calls it with the right props.

## Examples

| Example | Port | Description |
|---------|------|-------------|
| `next-chat` | 4100 | Full chat: weather, charts, dashboards, elicitations, artifacts, stock data |
| `next-widget` | 4200 | Marketing page with floating FAB chat overlay |
| `next-copilot` | 4300 | Two-panel document editor with AI copilot |
| `custom-agent` | 4400 | Multi-step reasoning agent |
| `local-model` | 4500 | Ollama / local model integration |
| `pages-demo` | 4600 | Fabrik Store — AI-powered e-commerce |
| Website | 4700 | Landing page with streaming code demo |

```bash
pnpm run dev          # Run all examples
pnpm --filter next-chat dev  # Run one example
```

## Testing

Each example has its own E2E tests:

```bash
npx playwright test                        # All 44 tests (parallel)
npx playwright test examples/next-chat/    # One example
```

## Architecture

```
packages/
├── fabrik-ui/          # SDK — "@fabrik/ui"
│   ├── src/core/       # Client, stream, reducer, registry, types
│   ├── src/react/      # <Fabrik>, useChat(), <Message>, <Chat>, <Fab>
│   ├── src/chat/       # Elicitations, artifacts, code diffs, input
│   ├── src/adapters/   # OpenAI, Anthropic, Google, AI SDK, custom
│   ├── src/server/     # handler(), server() adapter
│   └── src/themes/     # CSS variable presets
├── ui/                 # 55 shadcn components
└── cli/                # fabrik init, fabrik add
```

## License

MIT
