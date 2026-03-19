"use client"

import { FabrikPages, defineRoute } from "@fabrik/ui/pages"
import type { NavItem } from "@fabrik/ui/pages"
import { createMockProvider } from "@/lib/mock-provider"
import { motion, useReducedMotion } from "motion/react"
import { z } from "zod"

const spring = { type: "spring" as const, damping: 30, stiffness: 300 }

// ---------------------------------------------------------------------------
// Mock provider
// ---------------------------------------------------------------------------

const provider = createMockProvider()

// ---------------------------------------------------------------------------
// Simple components for each page route
// ---------------------------------------------------------------------------

function MetricCard({ label, value, change }: { label: string; value: string; change: string }) {
  const isPositive = change.startsWith("+")
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="rounded-xl border border-border bg-card p-5"
    >
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
      <p className={`text-[12px] mt-1 ${isPositive ? "text-[var(--success,#16a34a)]" : "text-destructive"}`}>
        {change}
      </p>
    </motion.div>
  )
}

function StatsGrid({ stats, columns }: { stats: { label: string; value: string; change: string; changeType: string }[]; columns: number }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(140px, 1fr))` }}
    >
      {stats.map((s, i) => (
        <MetricCard key={s.label} label={s.label} value={s.value} change={s.change} />
      ))}
    </motion.div>
  )
}

function InfoSection({ title, content }: { title: string; content: string }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="rounded-xl border border-border bg-card p-6"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-[14px] text-muted-foreground mt-2 leading-relaxed">{content}</p>
    </motion.div>
  )
}

function ToggleSetting({ label, description, enabled }: { label: string; description: string; enabled: boolean }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
    >
      <div>
        <p className="text-[14px] font-medium">{label}</p>
        <p className="text-[12px] text-muted-foreground mt-0.5">{description}</p>
      </div>
      <span
        role="img"
        aria-label={`${label}: ${enabled ? "enabled" : "disabled"}`}
        className={`w-10 h-6 rounded-full transition-colors ${enabled ? "bg-[var(--success,#10b981)]" : "bg-muted"} relative inline-block`}
      >
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-card transition-transform ${enabled ? "left-5" : "left-1"}`} />
      </span>
    </motion.div>
  )
}

function SettingsPanel({ settings }: { settings: { label: string; description: string; enabled: boolean }[] }) {
  return (
    <div className="space-y-3">
      {settings.map((s) => (
        <ToggleSetting key={s.label} {...s} />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component definitions for the Fabrik route system
// ---------------------------------------------------------------------------

const statsGridDef = {
  name: "stats_grid",
  description: "A grid of KPI stat cards",
  schema: z.object({
    stats: z.array(z.object({
      label: z.string(),
      value: z.string(),
      change: z.string(),
      changeType: z.string(),
    })),
    columns: z.number(),
  }),
  component: StatsGrid,
}

const infoSectionDef = {
  name: "info_section",
  description: "An informational content section with title and body",
  schema: z.object({
    title: z.string(),
    content: z.string(),
  }),
  component: InfoSection,
}

const settingsPanelDef = {
  name: "settings_panel",
  description: "A list of toggle settings",
  schema: z.object({
    settings: z.array(z.object({
      label: z.string(),
      description: z.string(),
      enabled: z.boolean(),
    })),
  }),
  component: SettingsPanel,
}

// ---------------------------------------------------------------------------
// Route definitions
// ---------------------------------------------------------------------------

const routes = [
  defineRoute({
    path: "/",
    prompt: "Show a dashboard with key metrics",
    components: [statsGridDef],
  }),
  defineRoute({
    path: "/about",
    prompt: "Show an about page with company info",
    components: [infoSectionDef],
  }),
  defineRoute({
    path: "/settings",
    prompt: "Show a settings page with toggles",
    components: [settingsPanelDef],
  }),
]

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

const nav: NavItem[] = [
  { label: "Dashboard", path: "/" },
  { label: "About", path: "/about" },
  { label: "Settings", path: "/settings" },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Home() {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-dvh bg-background font-sans"
    >
      <FabrikPages
        provider={provider}
        routes={routes}
        nav={nav}
        theme="light"
        fab={true}
        notFound={
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="flex flex-col items-center justify-center py-28 text-center"
          >
            <h2 className="text-lg font-semibold">Page not found</h2>
            <p className="text-[13px] text-muted-foreground mt-1.5">
              The route you requested does not exist.
            </p>
          </motion.div>
        }
      />
    </motion.div>
  )
}
