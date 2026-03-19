<div align="center">
  <img src="assets/logo.svg" alt="fabrik logo" width="64" height="64" />
  <h1>@fabrik/ui</h1>
  <p><strong>Generative UI SDK for any LLM</strong></p>
  <p>The AI decides what to show — not just say.</p>

  <p>
    <a href="#quickstart">Quickstart</a> •
    <a href="#features">Features</a> •
    <a href="#adapters">Adapters</a> •
    <a href="#components">Components</a> •
    <a href="#architecture">Architecture</a>
  </p>
</div>

---

## Quickstart

```bash
pnpm add @fabrik/ui zod motion
```

```tsx
import { Fabrik, useChat, Message } from "@fabrik/ui/react"
import { openai } from "@fabrik/ui/openai"
import { defineComponent } from "@fabrik/ui"

// Define components the AI can render
const weatherCard = defineComponent({
  name: "weather_card",
  description: "Shows weather for a city",
  schema: z.object({ city: z.string(), temp: z.number() }),
  component: WeatherCard,
})

// One provider, one hook, done
function App() {
  return (
    <Fabrik provider={openai({ apiKey: "...", model: "gpt-4o" })} components={[weatherCard]}>
      <Chat />
    </Fabrik>
  )
}

function Chat() {
  const { messages, input, send, isLoading } = useChat()
  return (
    <div>
      {messages.map(msg => <Message key={msg.id} message={msg} />)}
      <input value={input.value} onChange={e => input.set(e.target.value)} />
      <button onClick={send} disabled={isLoading}>Send</button>
    </div>
  )
}
```

## Features

- **Generative UI** — LLM decides which components to render, not just text
- **Any LLM** — OpenAI, Anthropic, Google, 53+ via AI SDK, or bring your own
- **Streaming** — Text and components stream in progressively
- **Thinking Steps** — Animated tool progress like Claude (✓ Searching API... 0.6s)
- **Elicitation** — AI asks follow-up questions with choice pills, confirmations
- **55 shadcn components** — Full UI library included
- **Recharts** — Beautiful charts with shadcn color palette
- **motion/react** — Spring animations, layout transitions, enter/exit
- **Dark mode** — CSS variables, theme presets
- **Mobile-first** — Responsive at every breakpoint
- **One hook** — `useChat()` gives you everything
- **One provider** — `<Fabrik>` wraps your app, no nesting

## Adapters

```tsx
// OpenAI
import { openai } from "@fabrik/ui/openai"
const provider = openai({ apiKey: "sk-...", model: "gpt-4o" })

// Anthropic
import { anthropic } from "@fabrik/ui/anthropic"
const provider = anthropic({ apiKey: "sk-ant-...", model: "claude-sonnet-4-20250514" })

// Google
import { google } from "@fabrik/ui/google"
const provider = google({ apiKey: "...", model: "gemini-2.0-flash" })

// Any AI SDK provider (53+)
import { aiSdk } from "@fabrik/ui/ai-sdk"
import { mistral } from "@ai-sdk/mistral"
const provider = aiSdk({ model: mistral("mistral-large-latest") })

// Custom / Local (Ollama, LangChain, etc.)
import { custom } from "@fabrik/ui/custom"
const provider = custom({
  name: "my-agent",
  stream: async function* (options) { /* yield events */ }
})

// Server-side (keep API keys safe)
import { server } from "@fabrik/ui/server"
const provider = server({ url: "/api/chat" })
```

## Components

The SDK includes 55 shadcn components plus generative UI components:

| Category | Components |
|----------|-----------|
| Data Display | Card, Table, DataGrid, CodeBlock, Markdown, Image, Alert, Badge, Avatar |
| Dashboard | StatCard, StatsGrid, KpiCard, ProgressBar, MetricList, Timeline |
| Charts | BarChart, LineChart, PieChart, AreaChart, Sparkline (Recharts) |
| Layout | Tabs, Accordion, Grid, Stack, Section, ScrollArea, Divider |
| Interactive | Button, Dialog, Sheet, Dropdown, Carousel, CommandPalette |
| Forms | Form, Input, Select, Checkbox, RadioGroup, Toggle, Slider, DatePicker |
| Chat | Chat, Fab, InputArea, Thinking, StepList, TypingDots, MessageActions |

## Architecture

```
fabrik/
├── packages/
│   ├── fabrik-ui/        # SDK — published as "@fabrik/ui"
│   │   ├── src/core/     # Engine: client, stream, reducer, registry, types
│   │   ├── src/react/    # React: <Fabrik>, useChat(), <Message>
│   │   ├── src/chat/     # Chat UI: <Chat>, <Fab>, thinking, steps
│   │   ├── src/adapters/ # LLM: OpenAI, Anthropic, Google, AI SDK, custom
│   │   ├── src/server/   # SSE handler + proxy adapter
│   │   ├── src/themes/   # CSS variables, presets
│   │   └── src/testing/  # Mock provider, fixtures
│   ├── ui/               # 55 shadcn components
│   └── cli/              # fabrik init, fabrik add
├── examples/next-chat/   # Working demo app
├── plans/                # 17 architecture plan documents
└── tests/                # Playwright visual tests
```

## Testing

```bash
# Unit tests (130 tests)
pnpm --filter @fabrik/ui test

# Playwright visual tests (10 tests — desktop + mobile)
npx playwright test
```

## License

MIT
