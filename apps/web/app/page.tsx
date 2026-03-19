"use client"

import { PiFeatherDuotone, PiLightningFill, PiPaintBrushFill, PiPlugFill, PiChatCircleDotsFill, PiStackFill, PiGlobeFill, PiArrowRightBold, PiTerminalFill, PiGithubLogoFill, PiCopySimpleBold, PiCheckBold, PiListBold, PiXBold } from "react-icons/pi"
import { useState, useRef } from "react"
import { motion, useInView, useReducedMotion } from "motion/react"
import { StreamingCode } from "@/components/streaming-code"

export default function Page() {
  return (
    <div className="min-h-svh bg-background text-foreground font-sans">
      <Nav />
      <main id="main-content">
        <Hero />
        <CodeSection />
        <Features />
        <Examples />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}

function Nav() {
  const [open, setOpen] = useState(false)
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-14">
        <a href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <PiFeatherDuotone className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Fabrik UI</span>
        </a>
        <ul className="hidden md:flex items-center gap-5 text-[13px]">
          <li><a href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">Docs</a></li>
          <li><a href="/playground" className="text-muted-foreground hover:text-foreground transition-colors">Playground</a></li>
          <li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
          <li><a href="#examples" className="text-muted-foreground hover:text-foreground transition-colors">Examples</a></li>
          <li>
            <a href="https://github.com" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="View on GitHub">
              <PiGithubLogoFill className="w-4 h-4" />
            </a>
          </li>
        </ul>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <PiXBold className="w-5 h-5" /> : <PiListBold className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border px-6 py-4">
          <ul className="flex flex-col gap-3 text-sm">
            <li><a href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">Docs</a></li>
            <li><a href="/playground" className="text-muted-foreground hover:text-foreground transition-colors">Playground</a></li>
            <li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
            <li><a href="#examples" className="text-muted-foreground hover:text-foreground transition-colors">Examples</a></li>
            <li>
              <a href="https://github.com" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="View on GitHub">
                <PiGithubLogoFill className="w-4 h-4 inline-block mr-1.5" />
                GitHub
              </a>
            </li>
          </ul>
        </div>
      )}
    </nav>
  )
}

const spring = { type: "spring" as const, damping: 30, stiffness: 300 }
const gentleSpring = { type: "spring" as const, damping: 25, stiffness: 200 }

function Hero() {
  const reduced = useReducedMotion()

  return (
    <section className="relative max-w-3xl mx-auto px-6 pt-20 pb-12 text-center overflow-hidden">
      {/* Teal ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[600px] h-[600px] rounded-full opacity-[0.07] blur-[100px]"
        style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }}
      />

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0 }}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground mb-6"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
        Now in public beta
      </motion.div>

      <motion.h1
        initial={reduced ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.1 }}
        className="text-4xl sm:text-[52px] font-bold tracking-tight leading-[1.1]"
      >
        Generative UI
        <br />
        <span className="text-primary">for any LLM</span>
      </motion.h1>

      <motion.p
        initial={reduced ? false : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...gentleSpring, delay: 0.25 }}
        className="text-base text-muted-foreground mt-5 max-w-lg mx-auto leading-relaxed"
      >
        Build AI interfaces where the model decides what to render — charts, cards, dashboards, entire pages. Not just text.
      </motion.p>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...gentleSpring, delay: 0.35 }}
        className="flex gap-3 justify-center mt-8"
      >
        <a href="/docs" className="rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-[13px] font-medium transition-opacity hover:opacity-90 flex items-center gap-2">
          Get Started
          <PiArrowRightBold className="w-3.5 h-3.5" />
        </a>
        <a href="https://github.com" className="rounded-lg border border-border px-5 py-2.5 text-[13px] font-medium hover:bg-accent transition-colors flex items-center gap-2">
          <PiGithubLogoFill className="w-4 h-4" />
          GitHub
        </a>
      </motion.div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...gentleSpring, delay: 0.45 }}
      >
        <InstallCommand />
      </motion.div>
    </section>
  )
}

function InstallCommand() {
  const [copied, setCopied] = useState(false)
  const cmd = "pnpm add @fabrik/ui zod motion"
  const copy = () => { navigator.clipboard.writeText(cmd); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <div className="mt-6 inline-flex items-center gap-3 bg-foreground text-muted-foreground px-4 py-2.5 rounded-lg text-[13px] font-mono">
      <PiTerminalFill className="w-3.5 h-3.5 opacity-50" />
      <code className="text-primary-foreground">{cmd}</code>
      <button onClick={copy} className="opacity-50 hover:opacity-100 transition-opacity ml-1" aria-label="Copy install command">
        {copied ? <PiCheckBold className="w-3.5 h-3.5 text-success" /> : <PiCopySimpleBold className="w-3.5 h-3.5 text-primary-foreground" />}
      </button>
    </div>
  )
}

const EXAMPLE_CODE = `import { Fabrik, Chat } from "@fabrik/ui/react"
import { openai } from "@fabrik/ui/openai"

export default function App() {
  return (
    <Fabrik
      provider={openai({ model: "gpt-4o" })}
      components={[weatherCard, barChart]}
    >
      <Chat />
    </Fabrik>
  )
}`

function CodeSection() {
  const reduced = useReducedMotion()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <motion.section
      ref={ref}
      initial={reduced ? false : { opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ ...gentleSpring, delay: 0.1 }}
      className="max-w-3xl mx-auto px-6 pb-16"
    >
      <StreamingCode code={EXAMPLE_CODE} lang="tsx" filename="app/page.tsx" />
      <p className="text-center text-xs text-muted-foreground mt-3">5 lines to a working generative UI chat.</p>
    </motion.section>
  )
}

const features = [
  { icon: PiPlugFill, title: "Any LLM Provider", desc: "OpenAI, Anthropic, Google, Mistral, Groq — 53+ providers via AI SDK. Or bring your own." },
  { icon: PiPaintBrushFill, title: "Generative UI", desc: "The model calls show_weather_card() and your React component renders. Charts, tables, dashboards." },
  { icon: PiLightningFill, title: "Streaming + Steps", desc: "Text and components stream in progressively. Animated tool steps show what the AI is doing." },
  { icon: PiChatCircleDotsFill, title: "Elicitation", desc: "AI asks follow-up questions with choice pills, confirmations, text inputs — inline in chat." },
  { icon: PiStackFill, title: "55 Components", desc: "Full shadcn library included. Add more with fabrik add. Cards, charts, tables, forms, dialogs." },
  { icon: PiGlobeFill, title: "fabrik-pages", desc: "Define routes + prompts. The AI renders entire pages. No hand-written UI needed." },
]

function Features() {
  const reduced = useReducedMotion()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <section id="features" className="max-w-4xl mx-auto px-6 py-20">
      <motion.div
        ref={ref}
        initial={reduced ? false : { opacity: 0, y: 15 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={gentleSpring}
        className="text-center mb-12"
      >
        <h2 className="text-2xl font-bold tracking-tight">Built for speed</h2>
        <p className="text-sm text-muted-foreground mt-2">One SDK. One hook. One provider. Done.</p>
      </motion.div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <FeatureCard key={f.title} feature={f} index={i} />
        ))}
      </div>
    </section>
  )
}

function FeatureCard({ feature: f, index }: { feature: typeof features[0]; index: number }) {
  const reduced = useReducedMotion()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })

  return (
    <motion.div
      ref={ref}
      initial={reduced ? false : { opacity: 0, y: 25, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ ...gentleSpring, delay: index * 0.08 }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center mb-3">
        <f.icon className="w-4 h-4 text-accent-foreground" />
      </div>
      <h3 className="text-sm font-semibold">{f.title}</h3>
      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{f.desc}</p>
    </motion.div>
  )
}

const examples = [
  { title: "Chat", desc: "Full chat with live weather, charts, thinking steps, elicitation", port: "4100" },
  { title: "Widget", desc: "Marketing page with floating chat FAB button", port: "4200" },
  { title: "Copilot", desc: "Side-panel copilot for documents and code", port: "4300" },
  { title: "Custom Agent", desc: "Multi-step reasoning agent with custom provider", port: "4400" },
  { title: "Local Model", desc: "Ollama integration with automatic fallback", port: "4500" },
  { title: "Pages Demo", desc: "Route-based AI page rendering with caching", port: "4600" },
]

function Examples() {
  const reduced = useReducedMotion()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <section id="examples" className="bg-card border-y border-border">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <motion.div
          ref={ref}
          initial={reduced ? false : { opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={gentleSpring}
          className="text-center mb-12"
        >
          <h2 className="text-2xl font-bold tracking-tight">Examples</h2>
          <p className="text-sm text-muted-foreground mt-2">See what you can build.</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {examples.map((e, i) => (
            <ExampleCard key={e.title} example={e} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ExampleCard({ example: e, index }: { example: typeof examples[0]; index: number }) {
  const reduced = useReducedMotion()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })
  const fromLeft = index % 2 === 0

  return (
    <motion.div
      ref={ref}
      initial={reduced ? false : { opacity: 0, x: fromLeft ? -20 : 20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ ...gentleSpring, delay: index * 0.08 }}
      className="rounded-xl border border-border bg-background p-5"
    >
      <h3 className="text-sm font-semibold">{e.title}</h3>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{e.desc}</p>
      <span className="text-xs font-mono text-muted-foreground/50 mt-2.5 block">localhost:{e.port}</span>
    </motion.div>
  )
}

function CTASection() {
  const reduced = useReducedMotion()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section className="max-w-3xl mx-auto px-6 py-20 text-center">
      <motion.div
        ref={ref}
        initial={reduced ? false : { opacity: 0, scale: 0.95 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ ...gentleSpring, delay: 0.1 }}
        className="rounded-2xl bg-accent p-10 relative overflow-hidden"
      >
        {/* Subtle teal glow on CTA */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full opacity-[0.06] blur-[80px]"
          style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }}
        />
        <PiFeatherDuotone className="w-8 h-8 mx-auto mb-4 text-accent-foreground relative" />
        <h2 className="text-xl font-bold tracking-tight relative">Ship your first AI interface</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto relative">
          Install the SDK, pick your LLM, and start rendering components in minutes.
        </p>
        <div className="flex gap-3 justify-center mt-6 relative">
          <a href="/docs" className="rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-[13px] font-medium transition-opacity hover:opacity-90">
            Get started
          </a>
          <a href="https://github.com" className="rounded-lg border border-border bg-background px-5 py-2.5 text-[13px] font-medium hover:bg-accent transition-colors">
            Star on GitHub
          </a>
        </div>
      </motion.div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="max-w-5xl mx-auto px-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <PiFeatherDuotone className="w-3.5 h-3.5" />
          <span>Fabrik UI — Open source under MIT</span>
        </div>
        <nav aria-label="Footer">
          <div className="flex items-center gap-4">
            <a href="/docs" className="hover:text-foreground transition-colors">Docs</a>
            <a href="/playground" className="hover:text-foreground transition-colors">Playground</a>
            <a href="https://github.com" className="hover:text-foreground transition-colors">GitHub</a>
          </div>
        </nav>
      </div>
    </footer>
  )
}
