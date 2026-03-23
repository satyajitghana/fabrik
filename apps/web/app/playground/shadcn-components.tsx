"use client"

/**
 * Registers shadcn/ui components as LLM-callable tools (show_* prefix).
 * Each component accepts flat data props — no nested component trees.
 * The LLM picks which component to render based on the data and context.
 */

import { defineComponent } from "@fabrik-sdk/ui"
import { z } from "zod"

// ---------------------------------------------------------------------------
// LAYOUT: Card
// ---------------------------------------------------------------------------

const cardSchema = z.object({
  title: z.string().optional().describe("Card title"),
  description: z.string().optional().describe("Subtitle/description below title"),
  content: z.string().describe("Main body content (supports markdown-style formatting)"),
  footer: z.string().optional().describe("Footer text"),
})

function CardComponent({ title, description, content, footer }: z.infer<typeof cardSchema>) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm my-2">
      {(title || description) && (
        <div className="px-5 pt-5 pb-0">
          {title && <h3 className="text-sm font-semibold">{title}</h3>}
          {description && <p className="text-[12px] text-muted-foreground mt-0.5">{description}</p>}
        </div>
      )}
      <div className="px-5 py-4 text-[13px] leading-relaxed whitespace-pre-wrap">{content}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-border text-[11px] text-muted-foreground">{footer}</div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// LAYOUT: Tabs
// ---------------------------------------------------------------------------

import { useState } from "react"

const tabsSchema = z.object({
  tabs: z.array(z.object({
    label: z.string().describe("Tab label"),
    content: z.string().describe("Tab content"),
  })).describe("Array of tabs with label and content"),
  defaultTab: z.number().optional().describe("Index of default active tab (0-based)"),
})

function TabsComponent({ tabs, defaultTab }: z.infer<typeof tabsSchema>) {
  const [active, setActive] = useState(defaultTab ?? 0)
  return (
    <div className="rounded-xl border border-border bg-card my-2">
      <div className="flex border-b border-border">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`px-4 py-2.5 text-[12px] font-medium transition-colors ${
              active === i
                ? "text-foreground border-b-2 border-primary -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4 text-[13px] leading-relaxed whitespace-pre-wrap">
        {tabs[active]?.content}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// LAYOUT: Accordion
// ---------------------------------------------------------------------------

const accordionSchema = z.object({
  items: z.array(z.object({
    title: z.string().describe("Accordion item title"),
    content: z.string().describe("Expandable content"),
  })).describe("Array of collapsible items"),
})

function AccordionComponent({ items }: z.infer<typeof accordionSchema>) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  return (
    <div className="rounded-xl border border-border bg-card divide-y divide-border my-2">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between px-4 py-3 text-[13px] font-medium text-left hover:bg-muted/50 transition-colors"
          >
            {item.title}
            <svg className={`w-4 h-4 transition-transform ${openIndex === i ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openIndex === i && (
            <div className="px-4 pb-3 text-[12px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// DATA DISPLAY: Table
// ---------------------------------------------------------------------------

const tableSchema = z.object({
  title: z.string().optional().describe("Table title"),
  headers: z.array(z.string()).describe("Column header labels"),
  rows: z.array(z.array(z.string())).describe("2D array of cell values, each row is an array of strings"),
})

function TableComponent({ title, headers, rows }: z.infer<typeof tableSchema>) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden my-2">
      {title && <div className="px-4 py-2.5 border-b border-border text-[12px] font-semibold">{title}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-2.5 text-left font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-muted/20 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2.5">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// FEEDBACK: Alert
// ---------------------------------------------------------------------------

const alertSchema = z.object({
  title: z.string().describe("Alert title"),
  description: z.string().optional().describe("Alert description"),
  variant: z.enum(["default", "info", "success", "warning", "destructive"]).optional().describe("Alert style variant"),
})

function AlertComponent({ title, description, variant = "default" }: z.infer<typeof alertSchema>) {
  const styles: Record<string, string> = {
    default: "border-border",
    info: "border-primary/30 bg-primary/5",
    success: "border-success/30 bg-success/5",
    warning: "border-yellow-500/30 bg-yellow-500/5",
    destructive: "border-destructive/30 bg-destructive/5",
  }
  const icons: Record<string, string> = {
    default: "\u2139\uFE0F",
    info: "\u2139\uFE0F",
    success: "\u2705",
    warning: "\u26A0\uFE0F",
    destructive: "\u274C",
  }
  return (
    <div className={`rounded-xl border p-4 my-2 ${styles[variant] ?? styles.default}`}>
      <div className="flex items-start gap-2">
        <span className="text-sm">{icons[variant] ?? icons.default}</span>
        <div>
          <p className="text-[13px] font-semibold">{title}</p>
          {description && <p className="text-[12px] text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// FEEDBACK: Badge list
// ---------------------------------------------------------------------------

const badgeListSchema = z.object({
  badges: z.array(z.object({
    text: z.string().describe("Badge text"),
    variant: z.enum(["default", "secondary", "outline", "destructive"]).optional(),
  })).describe("Array of badges to display"),
})

function BadgeListComponent({ badges }: z.infer<typeof badgeListSchema>) {
  const variants: Record<string, string> = {
    default: "bg-primary text-white",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-border text-foreground",
    destructive: "bg-destructive text-white",
  }
  return (
    <div className="flex flex-wrap gap-1.5 my-2">
      {badges.map((b, i) => (
        <span key={i} className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${variants[b.variant ?? "default"]}`}>
          {b.text}
        </span>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// FEEDBACK: Progress
// ---------------------------------------------------------------------------

const progressSchema = z.object({
  label: z.string().optional().describe("Label above the progress bar"),
  value: z.number().describe("Progress percentage 0-100"),
  description: z.string().optional().describe("Description below the bar"),
})

function ProgressComponent({ label, value, description }: z.infer<typeof progressSchema>) {
  return (
    <div className="my-2">
      {label && (
        <div className="flex justify-between text-[12px] mb-1.5">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground tabular-nums">{value}%</span>
        </div>
      )}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      {description && <p className="text-[11px] text-muted-foreground mt-1">{description}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// DATA DISPLAY: Key-Value list
// ---------------------------------------------------------------------------

const kvListSchema = z.object({
  title: z.string().optional().describe("List title"),
  items: z.array(z.object({
    key: z.string().describe("Label"),
    value: z.string().describe("Value"),
  })).describe("Key-value pairs to display"),
})

function KVListComponent({ title, items }: z.infer<typeof kvListSchema>) {
  return (
    <div className="rounded-xl border border-border bg-card my-2">
      {title && <div className="px-4 py-2.5 border-b border-border text-[12px] font-semibold">{title}</div>}
      <div className="divide-y divide-border">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between px-4 py-2.5 text-[12px]">
            <span className="text-muted-foreground">{item.key}</span>
            <span className="font-medium tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DATA DISPLAY: Timeline
// ---------------------------------------------------------------------------

const timelineSchema = z.object({
  items: z.array(z.object({
    title: z.string().describe("Event title"),
    description: z.string().optional().describe("Event description"),
    time: z.string().optional().describe("Timestamp or date"),
    status: z.enum(["completed", "current", "upcoming"]).optional(),
  })).describe("Timeline events in chronological order"),
})

function TimelineComponent({ items }: z.infer<typeof timelineSchema>) {
  return (
    <div className="my-2 space-y-0">
      {items.map((item, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
              item.status === "completed" ? "bg-success" :
              item.status === "current" ? "bg-primary ring-2 ring-primary/20" :
              "bg-muted-foreground/30"
            }`} />
            {i < items.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
          </div>
          <div className="pb-4">
            <div className="flex items-baseline gap-2">
              <p className="text-[13px] font-medium">{item.title}</p>
              {item.time && <span className="text-[10px] text-muted-foreground tabular-nums">{item.time}</span>}
            </div>
            {item.description && <p className="text-[12px] text-muted-foreground mt-0.5">{item.description}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// DATA DISPLAY: Code block
// ---------------------------------------------------------------------------

const codeBlockSchema = z.object({
  title: z.string().optional().describe("Filename or title"),
  code: z.string().describe("Code content"),
  language: z.string().optional().describe("Programming language"),
})

function CodeBlockComponent({ title, code, language }: z.infer<typeof codeBlockSchema>) {
  return (
    <div className="rounded-xl overflow-hidden border border-border my-2">
      {title && (
        <div className="flex items-center px-4 py-2 bg-muted/50 border-b border-border">
          <span className="text-[11px] font-mono text-muted-foreground">{title}</span>
          {language && <span className="ml-auto text-[10px] text-muted-foreground/50">{language}</span>}
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-[12px] leading-relaxed bg-card">
        <code>{code}</code>
      </pre>
    </div>
  )
}

// ---------------------------------------------------------------------------
// LAYOUT: Separator with label
// ---------------------------------------------------------------------------

const separatorSchema = z.object({
  label: z.string().optional().describe("Optional label shown in the center of the separator"),
})

function SeparatorComponent({ label }: z.infer<typeof separatorSchema>) {
  if (!label) return <hr className="border-border my-4" />
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 border-t border-border" />
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <div className="flex-1 border-t border-border" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// DATA DISPLAY: Avatar card (person/profile)
// ---------------------------------------------------------------------------

const profileCardSchema = z.object({
  name: z.string().describe("Person's name"),
  role: z.string().optional().describe("Job title or role"),
  avatar: z.string().optional().describe("Avatar URL or initials"),
  details: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional().describe("Additional details like email, location, etc."),
})

function ProfileCardComponent({ name, role, avatar, details }: z.infer<typeof profileCardSchema>) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
  return (
    <div className="rounded-xl border border-border bg-card p-4 my-2">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-[13px] font-semibold">{name}</p>
          {role && <p className="text-[11px] text-muted-foreground">{role}</p>}
        </div>
      </div>
      {details && details.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border space-y-1.5">
          {details.map((d, i) => (
            <div key={i} className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">{d.label}</span>
              <span>{d.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// LAYOUT: Comparison table (vs)
// ---------------------------------------------------------------------------

const comparisonSchema = z.object({
  title: z.string().optional(),
  items: z.array(z.string()).describe("Column names (e.g. feature names)"),
  columns: z.array(z.object({
    name: z.string().describe("Option name (e.g. 'Plan A')"),
    values: z.array(z.string()).describe("Values for each item row"),
  })).describe("Options to compare, each with values matching the items array"),
})

function ComparisonComponent({ title, items, columns }: z.infer<typeof comparisonSchema>) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden my-2">
      {title && <div className="px-4 py-2.5 border-b border-border text-[12px] font-semibold">{title}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Feature</th>
              {columns.map((col, i) => (
                <th key={i} className="px-4 py-2.5 text-left font-semibold">{col.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item, i) => (
              <tr key={i}>
                <td className="px-4 py-2.5 text-muted-foreground">{item}</td>
                {columns.map((col, j) => (
                  <td key={j} className="px-4 py-2.5">{col.values[i] ?? "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// EXPORT: All shadcn component definitions
// ---------------------------------------------------------------------------

export const shadcnCard = defineComponent({ name: "card", description: "A container card with optional title, description, content body, and footer. Use for grouping related information.", schema: cardSchema, component: CardComponent })
export const shadcnTabs = defineComponent({ name: "tabs", description: "Tabbed view with multiple panels. User clicks tabs to switch content. Use for organizing multiple sections of related content.", schema: tabsSchema, component: TabsComponent })
export const shadcnAccordion = defineComponent({ name: "accordion", description: "Collapsible sections. One item open at a time. Use for FAQs, documentation, or long content that should be scannable.", schema: accordionSchema, component: AccordionComponent })
export const shadcnTable = defineComponent({ name: "data_table", description: "Data table with headers and rows. Use for structured data, comparisons, lists of items with multiple attributes.", schema: tableSchema, component: TableComponent })
export const shadcnAlert = defineComponent({ name: "alert", description: "Alert banner with icon. Variants: default, info, success, warning, destructive. Use for notifications, status messages, important callouts.", schema: alertSchema, component: AlertComponent })
export const shadcnBadgeList = defineComponent({ name: "badge_list", description: "A row of colored badges/tags. Use for categories, tags, labels, status indicators.", schema: badgeListSchema, component: BadgeListComponent })
export const shadcnProgress = defineComponent({ name: "progress_bar", description: "Progress bar with optional label and description. Shows percentage completion 0-100.", schema: progressSchema, component: ProgressComponent })
export const shadcnKVList = defineComponent({ name: "key_value_list", description: "Key-value list showing label-value pairs. Use for details, metadata, specifications, settings.", schema: kvListSchema, component: KVListComponent })
export const shadcnTimeline = defineComponent({ name: "timeline", description: "Vertical timeline of events. Each event has title, description, time, and status (completed/current/upcoming). Use for history, roadmaps, process steps.", schema: timelineSchema, component: TimelineComponent })
export const shadcnCodeBlock = defineComponent({ name: "code_block", description: "Code snippet display with optional title and language label. Use for showing code examples, API responses, configuration.", schema: codeBlockSchema, component: CodeBlockComponent })
export const shadcnSeparator = defineComponent({ name: "separator", description: "Horizontal divider with optional centered label. Use to separate sections of content.", schema: separatorSchema, component: SeparatorComponent })
export const shadcnProfileCard = defineComponent({ name: "profile_card", description: "Person/profile card with avatar initials, name, role, and detail rows. Use for team members, contacts, user profiles.", schema: profileCardSchema, component: ProfileCardComponent })
export const shadcnComparison = defineComponent({ name: "comparison_table", description: "Side-by-side comparison table. Items are row labels, columns are the things being compared. Use for pricing plans, feature comparisons, product vs product.", schema: comparisonSchema, component: ComparisonComponent })

export const shadcnLibrary = [
  shadcnCard,
  shadcnTabs,
  shadcnAccordion,
  shadcnTable,
  shadcnAlert,
  shadcnBadgeList,
  shadcnProgress,
  shadcnKVList,
  shadcnTimeline,
  shadcnCodeBlock,
  shadcnSeparator,
  shadcnProfileCard,
  shadcnComparison,
]
