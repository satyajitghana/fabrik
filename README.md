<div align="center">
  <img src="assets/logo.svg" alt="fabrik logo" width="64" height="64" />
  <h1>@fabrik-sdk/ui</h1>
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
pnpm add @fabrik-sdk/ui ai @ai-sdk/google zod motion
```

Create two files:

**`app/api/chat/route.ts`** — Server-side route (API key stays here):

```typescript
import { aiSdk } from "@fabrik-sdk/ui/ai-sdk"
import { google } from "@ai-sdk/google"
import { handler } from "@fabrik-sdk/ui/server"

export const POST = handler({ provider: aiSdk({ model: google("gemini-3-flash-preview") }) })
// Reads GOOGLE_GENERATIVE_AI_API_KEY from your .env.local automatically
```

**`app/page.tsx`** — Client-side app:

```tsx
"use client"
import { Fabrik, Chat } from "@fabrik-sdk/ui/react"
import { server } from "@fabrik-sdk/ui/server"
import { defineComponent } from "@fabrik-sdk/ui"
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
GOOGLE_GENERATIVE_AI_API_KEY=...
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

Fabrik uses [AI SDK](https://sdk.vercel.ai/) as the primary provider interface, giving you access to **53+ providers** through a single adapter. Swap the model import to switch LLMs — API keys are read from environment variables automatically.

```typescript
// app/api/chat/route.ts — AI SDK adapter (recommended)
import { aiSdk } from "@fabrik-sdk/ui/ai-sdk"
import { google } from "@ai-sdk/google"                // reads GOOGLE_GENERATIVE_AI_API_KEY
import { handler } from "@fabrik-sdk/ui/server"
export const POST = handler({ provider: aiSdk({ model: google("gemini-3-flash-preview") }) })
```

```typescript
// Or OpenAI via AI SDK:
import { aiSdk } from "@fabrik-sdk/ui/ai-sdk"
import { openai } from "@ai-sdk/openai"                // reads OPENAI_API_KEY
import { handler } from "@fabrik-sdk/ui/server"
export const POST = handler({ provider: aiSdk({ model: openai("gpt-4o") }) })
```

```typescript
// Or Anthropic via AI SDK:
import { aiSdk } from "@fabrik-sdk/ui/ai-sdk"
import { anthropic } from "@ai-sdk/anthropic"           // reads ANTHROPIC_API_KEY
import { handler } from "@fabrik-sdk/ui/server"
export const POST = handler({ provider: aiSdk({ model: anthropic("claude-sonnet-4-20250514") }) })
```

The client-side code stays the same regardless of which LLM you use:

```tsx
// app/page.tsx — never changes when you switch providers
import { server } from "@fabrik-sdk/ui/server"
const provider = server({ url: "/api/chat" })
```

### Supported providers (via AI SDK)

| AI SDK Package | Env variable | Example model |
|----------------|-------------|---------------|
| `@ai-sdk/openai` | `OPENAI_API_KEY` | `gpt-4o` |
| `@ai-sdk/anthropic` | `ANTHROPIC_API_KEY` | `claude-sonnet-4-20250514` |
| `@ai-sdk/google` | `GOOGLE_GENERATIVE_AI_API_KEY` | `gemini-3-flash-preview` |

Plus 53+ additional providers — Mistral, Groq, Cohere, Perplexity, and more — via [`ai`](https://sdk.vercel.ai/providers).

### Advanced: custom provider

For local models or custom backends, use the `custom` adapter directly on the client:

```tsx
import { custom } from "@fabrik-sdk/ui/custom"

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
```

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
import { defineComponent } from "@fabrik-sdk/ui"
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

The AI SDK adapter (`aiSdk()`) is the recommended way to connect to any LLM. It wraps AI SDK models into Fabrik's streaming protocol, so any provider supported by AI SDK works out of the box.

```
packages/
├── fabrik-ui/          # SDK — "@fabrik-sdk/ui"
│   ├── src/core/       # Client, stream, reducer, registry, types
│   ├── src/react/      # <Fabrik>, useChat(), <Message>, <Chat>, <Fab>
│   ├── src/chat/       # Elicitations, artifacts, code diffs, input
│   ├── src/adapters/   # AI SDK (primary), OpenAI, Anthropic, Google, custom
│   ├── src/server/     # handler(), server() adapter
│   └── src/themes/     # CSS variable presets
├── ui/                 # 55 shadcn components
└── cli/                # fabrik init, fabrik add
```

## License

MIT
