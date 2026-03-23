"use client"

import { useState, type ReactNode } from "react"
import { z } from "zod"
import { defineLangComponent } from "../library"

function extractProps(s: unknown): Record<string, unknown> {
  if (s && typeof s === "object") {
    if ("type" in s && (s as Record<string, unknown>).type === "element" && "props" in s) {
      return (s as { props: Record<string, unknown> }).props
    }
    return s as Record<string, unknown>
  }
  return {}
}

// ---------------------------------------------------------------------------
// Tabs — tabbed view
// ---------------------------------------------------------------------------

export const TabsDef = defineLangComponent({
  name: "Tabs",
  description: "Tabbed view. Pass array of TabItem children.",
  schema: z.object({
    items: z.array(z.unknown()),
  }),
  component: ({ props, renderNode }) => {
    return <TabsContainer items={props.items as unknown[]} renderNode={renderNode} />
  },
})

function TabsContainer({ items, renderNode }: { items: unknown[]; renderNode: (v: unknown) => ReactNode }) {
  const [active, setActive] = useState(0)

  // Extract tab data from ElementNode items
  const tabs = items.map((item, i) => {
    const p = extractProps(item)
    return {
      value: String(p.value ?? `tab-${i}`),
      trigger: String(p.trigger ?? `Tab ${i + 1}`),
      content: p.content ?? item,
    }
  })

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden my-1">
      <div className="flex border-b border-border overflow-x-auto">
        {tabs.map((tab, i) => (
          <button
            key={tab.value}
            onClick={() => setActive(i)}
            className={`px-4 py-2.5 text-[12px] font-medium whitespace-nowrap transition-colors ${
              active === i
                ? "text-foreground border-b-2 border-primary -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.trigger}
          </button>
        ))}
      </div>
      <div className="p-4 [&>div]:border-0 [&>div]:shadow-none [&>div]:rounded-none [&>div]:my-0 [&>div]:p-0 [&>div>div]:border-0 [&>div>div]:shadow-none [&>div>div]:rounded-none [&>div>div]:my-0">
        {tabs[active] && renderNode(tabs[active]!.content)}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TabItem — individual tab definition (data-only, rendered by Tabs)
// ---------------------------------------------------------------------------

export const TabItemDef = defineLangComponent({
  name: "TabItem",
  description: "Tab definition. value: unique id, trigger: tab label, content: tab body (array of components)",
  schema: z.object({
    value: z.string(),
    trigger: z.string(),
    content: z.array(z.unknown()),
  }),
  component: ({ props, renderNode }) => {
    // TabItem is rendered by Tabs parent, but if standalone, render content
    return <>{renderNode(props.content)}</>
  },
})

// ---------------------------------------------------------------------------
// Accordion — collapsible sections
// ---------------------------------------------------------------------------

export const AccordionDef = defineLangComponent({
  name: "Accordion",
  description: "Collapsible sections. Pass array of AccordionItem children.",
  schema: z.object({
    items: z.array(z.unknown()),
  }),
  component: ({ props, renderNode }) => {
    return <AccordionContainer items={props.items as unknown[]} renderNode={renderNode} />
  },
})

function AccordionContainer({ items, renderNode }: { items: unknown[]; renderNode: (v: unknown) => ReactNode }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const sections = items.map((item, i) => {
    const p = extractProps(item)
    return {
      id: String(p.id ?? `acc-${i}`),
      title: String(p.title ?? `Section ${i + 1}`),
      content: p.content ?? item,
    }
  })

  return (
    <div className="rounded-xl border border-border bg-card divide-y divide-border my-1">
      {sections.map((section, i) => (
        <div key={section.id}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between px-4 py-3 text-[13px] font-medium text-left hover:bg-muted/50 transition-colors"
          >
            {section.title}
            <svg className={`w-4 h-4 transition-transform shrink-0 ${openIndex === i ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openIndex === i && (
            <div className="px-4 pb-3 text-[12px] leading-relaxed">
              {renderNode(section.content)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// AccordionItem — individual section (data-only, rendered by Accordion)
// ---------------------------------------------------------------------------

export const AccordionItemDef = defineLangComponent({
  name: "AccordionItem",
  description: "Accordion section. id: unique id, title: section label, content: array of components",
  schema: z.object({
    id: z.string(),
    title: z.string(),
    content: z.array(z.unknown()),
  }),
  component: ({ props, renderNode }) => {
    return <>{renderNode(props.content)}</>
  },
})
