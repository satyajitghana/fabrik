"use client"

import { z } from "zod"
import { defineLangComponent } from "../library"

// ---------------------------------------------------------------------------
// Stack — flex container
// ---------------------------------------------------------------------------

export const StackDef = defineLangComponent({
  name: "Stack",
  description: "Flex container. direction: row/column, gap: s/m/l, align: start/center/end/stretch, wrap: true/false",
  schema: z.object({
    children: z.array(z.unknown()),
    direction: z.enum(["row", "column"]).optional(),
    gap: z.enum(["s", "m", "l", "xl"]).optional(),
    align: z.enum(["start", "center", "end", "stretch"]).optional(),
    justify: z.enum(["start", "center", "end", "between"]).optional(),
    wrap: z.boolean().optional(),
  }),
  component: ({ props, renderNode }) => {
    const gapMap: Record<string, string> = { s: "gap-1.5", m: "gap-3", l: "gap-5", xl: "gap-8" }
    const alignMap: Record<string, string> = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" }
    const justifyMap: Record<string, string> = { start: "justify-start", center: "justify-center", end: "justify-end", between: "justify-between" }

    const dir = props.direction === "row" ? "flex-row" : "flex-col"
    const gap = gapMap[String(props.gap ?? "m")] ?? "gap-3"
    const align = alignMap[String(props.align ?? "")] ?? ""
    const justify = justifyMap[String(props.justify ?? "")] ?? ""
    const wrap = props.wrap ? "flex-wrap" : ""

    return (
      <div className={`flex ${dir} ${gap} ${align} ${justify} ${wrap}`.trim()}>
        {renderNode(props.children)}
      </div>
    )
  },
})

// ---------------------------------------------------------------------------
// Card — container card
// ---------------------------------------------------------------------------

export const CardDef = defineLangComponent({
  name: "Card",
  description: "Container card with border and padding. variant: card/sunk/clear",
  schema: z.object({
    children: z.array(z.unknown()),
    variant: z.enum(["card", "sunk", "clear"]).optional(),
  }),
  component: ({ props, renderNode }) => {
    const variants: Record<string, string> = {
      card: "rounded-xl border border-border bg-card p-5 shadow-sm",
      sunk: "rounded-xl bg-muted/50 p-5",
      clear: "p-5",
    }
    const cls = variants[String(props.variant ?? "card")] ?? variants.card

    // Strip borders from direct children to avoid box-in-box
    return <div className={`${cls} [&>div]:border-0 [&>div]:shadow-none [&>div]:rounded-none [&>div]:my-0`}>{renderNode(props.children)}</div>
  },
})

// ---------------------------------------------------------------------------
// CardHeader — card title + subtitle
// ---------------------------------------------------------------------------

export const CardHeaderDef = defineLangComponent({
  name: "CardHeader",
  description: "Card header with title and optional subtitle",
  schema: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
  }),
  component: ({ props }) => {
    const title = props.title as string | undefined
    const subtitle = props.subtitle as string | undefined
    return (
      <div className="mb-3">
        {title && <h3 className="text-sm font-semibold">{title}</h3>}
        {subtitle && <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    )
  },
})
