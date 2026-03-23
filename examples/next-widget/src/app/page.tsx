"use client"

import { useRef } from "react"
import { Fabrik, Fab } from "@fabrik-sdk/ui/react"
import { createMockProvider } from "@/lib/mock-provider"
import { motion, useInView, useReducedMotion } from "motion/react"
import {
  PiLightningFill,
  PiShieldCheckFill,
  PiChartLineUpFill,
  PiPlugFill,
  PiCheckBold,
  PiArrowRightBold,
} from "react-icons/pi"

const spring = { type: "spring" as const, damping: 30, stiffness: 300 }

const provider = createMockProvider()

function ScrollReveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })
  const reduced = useReducedMotion()
  return (
    <motion.div
      ref={ref}
      initial={reduced ? false : { opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ ...spring, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function Home() {
  return (
    <Fabrik provider={provider} theme="light">
      <div className="min-h-dvh bg-background font-sans">
        <Navbar />
        <Hero />
        <Features />
        <Pricing />
        <Footer />
        <Fab position="bottom-right" welcome="Ask Acme AI" />
      </div>
    </Fabrik>
  )
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground">
            <PiLightningFill className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Acme</span>
        </div>
        <nav className="hidden items-center gap-8 text-[13px] text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#pricing" className="transition-colors hover:text-foreground">Pricing</a>
          <a href="#" className="transition-colors hover:text-foreground">Docs</a>
          <a href="#" className="transition-colors hover:text-foreground">Blog</a>
        </nav>
        <div className="flex items-center gap-3">
          <button className="hidden text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:block">
            Sign in
          </button>
          <button className="rounded-lg bg-foreground px-3.5 py-1.5 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-80">
            Get Started
          </button>
        </div>
      </div>
    </header>
  )
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function Hero() {
  const reduced = useReducedMotion()
  return (
    <section className="relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.04),transparent_60%)]" />
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-28 text-center">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
        >
          <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[12px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success,#10b981)]" />
            Now in public beta
          </div>
          <h1 className="mx-auto max-w-3xl text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.1] tracking-tight text-foreground">
            Your Product Name
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-muted-foreground">
            AI-powered analytics that help you understand your customers, optimize
            conversions, and grow your revenue — all in one place.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-80">
              Start for free
              <PiArrowRightBold className="h-3.5 w-3.5" />
            </button>
            <button className="rounded-lg border border-border px-5 py-2.5 text-[14px] font-medium text-foreground transition-colors hover:bg-accent">
              View demo
            </button>
          </div>
          <p className="mt-4 text-[12px] text-muted-foreground">
            No credit card required. Free for up to 10k events/mo.
          </p>
        </motion.div>

        {/* Hero visual */}
        <ScrollReveal className="mx-auto mt-16 max-w-4xl">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
              <span className="ml-3 text-[11px] text-muted-foreground">dashboard.acme.com</span>
            </div>
            <div className="grid grid-cols-3 gap-4 p-6">
              <MetricCard label="Page Views" value="284,102" change="+12.4%" positive />
              <MetricCard label="Conversions" value="3,847" change="+8.1%" positive />
              <MetricCard label="Bounce Rate" value="32.6%" change="-2.3%" positive />
            </div>
            <div className="px-6 pb-6">
              <div className="h-40 rounded-lg bg-muted/50" />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

function MetricCard({
  label,
  value,
  change,
  positive,
}: {
  label: string
  value: string
  change: string
  positive: boolean
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-[22px] font-semibold tracking-tight">{value}</p>
      <p
        className={`mt-1 text-[12px] font-medium ${
          positive ? "text-[var(--success,#16a34a)]" : "text-destructive"
        }`}
      >
        {change}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features = [
  {
    icon: PiChartLineUpFill,
    title: "Real-time Analytics",
    description:
      "Track user behavior as it happens. Get live dashboards with sub-second latency and zero sampling.",
  },
  {
    icon: PiShieldCheckFill,
    title: "Privacy-first",
    description:
      "No cookies required. GDPR and CCPA compliant out of the box. Your data stays yours.",
  },
  {
    icon: PiLightningFill,
    title: "Blazing Fast",
    description:
      "Lightweight script under 1kB. Zero impact on your Core Web Vitals. Faster than any alternative.",
  },
  {
    icon: PiPlugFill,
    title: "Easy Integrations",
    description:
      "Connect with your existing tools in minutes. Supports Slack, Zapier, Segment, and 50+ more.",
  },
]

function Features() {
  return (
    <section id="features" className="border-t border-border bg-muted/30 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal className="text-center">
          <p className="text-[13px] font-medium text-muted-foreground">Features</p>
          <h2 className="mt-2 text-[28px] font-bold tracking-tight">
            Everything you need to grow
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            A complete analytics platform designed for modern teams that care about
            performance and privacy.
          </p>
        </ScrollReveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {features.map((f, i) => (
            <ScrollReveal
              key={f.title}
              delay={i * 0.08}
            >
              <div
                className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-sm h-full"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <f.icon className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="text-[15px] font-semibold">{f.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "For personal projects and small sites.",
    features: ["10k events/mo", "1 project", "7-day retention", "Community support"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "For growing businesses that need more.",
    features: [
      "1M events/mo",
      "Unlimited projects",
      "1-year retention",
      "Priority support",
      "Custom dashboards",
      "Team members",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large teams with advanced needs.",
    features: [
      "Unlimited events",
      "Unlimited everything",
      "Dedicated support",
      "SLA guarantee",
      "SSO & SAML",
      "Custom contract",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
]

function Pricing() {
  return (
    <section id="pricing" className="border-t border-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal className="text-center">
          <p className="text-[13px] font-medium text-muted-foreground">Pricing</p>
          <h2 className="mt-2 text-[28px] font-bold tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Start free. Upgrade when you need to. No hidden fees, no surprises.
          </p>
        </ScrollReveal>
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <ScrollReveal
              key={plan.name}
              delay={i * 0.08}
            >
              <div
                className={`relative rounded-xl border p-6 h-full ${
                  plan.highlighted
                    ? "border-foreground bg-card shadow-md"
                    : "border-border bg-card"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-3 py-0.5 text-[11px] font-medium text-primary-foreground">
                    Most popular
                  </div>
                )}
                <h3 className="text-[15px] font-semibold">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-0.5">
                  <span className="text-[32px] font-bold tracking-tight">{plan.price}</span>
                  {plan.period && (
                    <span className="text-[14px] text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <p className="mt-2 text-[13px] text-muted-foreground">{plan.description}</p>
                <button
                  className={`mt-6 w-full rounded-lg py-2 text-[13px] font-medium transition-opacity hover:opacity-80 ${
                    plan.highlighted
                      ? "bg-foreground text-primary-foreground"
                      : "border border-border bg-background text-foreground"
                  }`}
                >
                  {plan.cta}
                </button>
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-muted-foreground">
                      <PiCheckBold className="h-3.5 w-3.5 shrink-0 text-[var(--success,#10b981)]" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function Footer() {
  return (
    <ScrollReveal>
      <footer className="border-t border-border py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground">
              <PiLightningFill className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-[13px] font-semibold">Acme</span>
          </div>
          <p className="text-[12px] text-muted-foreground">
            Built with fabrik-ui. This is a demo landing page.
          </p>
        </div>
      </footer>
    </ScrollReveal>
  )
}
