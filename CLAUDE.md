# Fabrik UI

Generative UI SDK for any LLM. Monorepo with pnpm workspaces and Turborepo.

## Brand Guidelines

**All output — examples, website, docs, components, marketing — must follow these brand guidelines.**

See `.impeccable.md` for the full Design Context. Key points:

- **Brand Color:** Teal — use as the primary accent across all surfaces
- **Personality:** Technical, Sharp, Fast
- **References:** Stripe, Tailwind CSS
- **Typography:** Geist Sans + Geist Mono
- **Accessibility:** WCAG AA compliance required
- **Design Principles:** Speed over ceremony, precision not decoration, show don't tell, accessible by default, teal is the signature

## Code Standards

- **`any` is banned.** Never use `any` in TypeScript. Use proper types, generics, `unknown`, or specific interfaces instead. This applies to all packages, examples, and app code.
- **API keys are server-side only.** Never expose API keys in frontend/client code. Use the `handler()` + `server()` pattern.
- **Use design tokens.** Never hard-code hex colors. Use CSS variables (`var(--primary)`, `var(--border)`, etc.).
- **Respect reduced motion.** All animations must check `useReducedMotion()` and degrade gracefully.

## Architecture

### Client-Server Pattern

```
Client (browser)                    Server (API route)
─────────────────                   ──────────────────
server({ url: "/api/chat" })  →→→   handler({ provider: aiSdk({ model: google("gemini-3-flash-preview") }) })
    ↓ SSE stream                         ↓ AI SDK reads GOOGLE_GENERATIVE_AI_API_KEY from env
<Fabrik provider={...}>                  ↓ streams to LLM
  <Chat />                               ↓ yields StreamEvents
</Fabrik>                           ←←←  SSE response
```

### Key imports

```typescript
// Client-side
import { Fabrik, Chat, useChat, Message } from "@fabrik-sdk/ui/react"
import { server } from "@fabrik-sdk/ui/server"
import { defineComponent } from "@fabrik-sdk/ui"

// Server-side — AI SDK adapter (primary, 53+ providers)
import { handler } from "@fabrik-sdk/ui/server"
import { aiSdk } from "@fabrik-sdk/ui/ai-sdk"
import { google } from "@ai-sdk/google"               // reads GOOGLE_GENERATIVE_AI_API_KEY
import { openai } from "@ai-sdk/openai"               // reads OPENAI_API_KEY
import { anthropic } from "@ai-sdk/anthropic"          // reads ANTHROPIC_API_KEY

// Server-side — native adapters (alternative)
import { openai } from "@fabrik-sdk/ui/openai"         // reads OPENAI_API_KEY
import { anthropic } from "@fabrik-sdk/ui/anthropic"   // reads ANTHROPIC_API_KEY
import { google } from "@fabrik-sdk/ui/google"         // reads GOOGLE_AI_API_KEY
```

## Project Structure

```
apps/web/                — Next.js 16 marketing site, playground, docs (fumadocs)
packages/ui/             — 55+ shadcn components (shared design system)
packages/fabrik-ui/      — Core SDK
  src/core/              — Client, stream, reducer, registry, types
  src/react/             — <Fabrik>, useChat(), <Message>, <Chat>, <Fab>
  src/chat/              — Elicitations, artifacts, code diffs, input, motion utils
  src/adapters/          — OpenAI, Anthropic, Google, AI SDK, custom
  src/server/            — handler(), server() adapter
  src/pages/             — FabrikPages route-based rendering
  src/themes/            — CSS variable presets (default, blue, neutral)
  src/ui/                — Pre-built component schemas
packages/cli/            — CLI tool (fabrik init, fabrik add)
packages/create-fabrik-app/ — Project scaffolding
examples/
  next-chat/             — Full chat demo (port 4100)
  next-widget/           — FAB widget overlay (port 4200)
  next-copilot/          — Two-panel copilot (port 4300)
  custom-agent/          — Multi-step agent (port 4400)
  local-model/           — Mock Ollama provider (port 4500)
  pages-demo/            — Fabrik Store e-commerce (port 4600)
```

## Tech Stack

- **Runtime:** Node >=20
- **Package Manager:** pnpm 9.x
- **Framework:** React 19, Next.js 16
- **Styling:** Tailwind CSS 4, CVA, tw-animate-css
- **Animation:** Motion (spring physics)
- **Charts:** Recharts
- **Syntax Highlighting:** Shiki
- **Validation:** Zod 4
- **Primitives:** Base UI (@base-ui/react)
- **Testing:** Playwright (E2E, per-example)
- **Docs:** Fumadocs

## Testing

Each example has its own `tests/screenshot.spec.ts` and `tests/screenshots/` folder.

```bash
npx playwright test                      # All 44 tests (parallel, 7 workers)
npx playwright test examples/next-chat/  # One example
```

## Building

```bash
npx turbo build --filter=@fabrik-sdk/ui   # Build SDK
pnpm run dev                           # Start all examples + website
```
