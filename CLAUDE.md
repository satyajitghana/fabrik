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

## Design Context

### Users
Broad developer audience — from indie hackers shipping fast to enterprise teams evaluating production-ready SDKs. They encounter Fabrik when building AI-powered interfaces and want to go from zero to working generative UI with minimal friction. They value speed, reliability, and good defaults over customization complexity.

### Brand Personality
**Technical, Sharp, Fast** — a developer-first SDK that conveys power and speed. The interface should feel like a precision tool: no wasted space, no unnecessary decoration. Every element earns its place.

**Brand Color:** Teal — the primary brand accent. Use teal as the signature color across primary actions, highlights, and brand moments.

**Emotional Goals:** Confidence ("this just works"), speed ("I shipped in 5 minutes"), and trust ("this is production-grade").

### Aesthetic Direction
**Visual Tone:** Developer-friendly but visually rich — inspired by Stripe and Tailwind CSS. Clean typography, generous whitespace, colorful gradients for brand moments, but restrained in the component library itself.

**References:**
- **Stripe** — colorful gradients, strong documentation, premium feel with developer trust
- **Tailwind CSS** — bold visual identity, excellent docs, developer community feel

**Anti-references:**
- Overly minimal/gray interfaces that feel lifeless
- Heavy enterprise dashboards with cluttered UI
- Generic SaaS templates with stock illustrations

**Theme:** Light and dark mode support. Neutral base palette (current OKLCH system) with teal as the signature accent color.

**Typography:** Geist Sans + Geist Mono — modern, clean, technically sharp. Maintain current font stack.

### Design Principles
1. **Speed over ceremony** — Every interaction should feel instant. Prefer fewer clicks, faster feedback, and progressive disclosure over upfront complexity.
2. **Precision, not decoration** — Use whitespace, typography, and layout to create clarity. Avoid ornamental elements. If it doesn't help the developer, remove it.
3. **Show, don't tell** — Demonstrate capabilities through live examples, code snippets, and interactive previews rather than marketing copy.
4. **Accessible by default** — Target WCAG AA compliance. All components must support keyboard navigation, screen readers, and sufficient contrast ratios. Respect reduced motion preferences.
5. **Teal is the signature** — Use the teal brand color strategically for primary actions, active states, and brand moments. Let it pop against the neutral base palette.

### Technical Constraints
- **Component System:** 55+ shadcn components on Base UI primitives with CVA variants
- **Color Space:** OKLCH for perceptually uniform color management
- **Animation:** Motion (spring physics) + Tailwind CSS animate utilities
- **Radius Scale:** Base 0.625rem with calculated multiples (sm through 4xl)
- **Spacing:** Tailwind default 4px grid
- **Icons:** Lucide React (components), Phosphor Icons (brand/marketing)

## Code Standards

- **`any` is banned.** Never use `any` in TypeScript. Use proper types, generics, `unknown`, or specific interfaces instead. This applies to all packages, examples, and app code.

## Project Structure

- `apps/web/` — Next.js 16 marketing site and playground
- `packages/ui/` — 55+ shadcn components (shared design system)
- `packages/fabrik-ui/` — Core SDK (core, react, adapters, themes, chat)
- `packages/cli/` — CLI tool
- `packages/create-fabrik-app/` — Project scaffolding
- `examples/` — Example projects

## Tech Stack

- **Runtime:** Node >=20
- **Package Manager:** pnpm 9.x
- **Framework:** React 19, Next.js 16
- **Styling:** Tailwind CSS 4, CVA, tw-animate-css
- **Animation:** Motion (spring physics)
- **Charts:** Recharts
- **Primitives:** Base UI (@base-ui/react)
