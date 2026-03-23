"use client"

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
// Col — column definition (data-only, used by Table)
// ---------------------------------------------------------------------------

export const ColDef = defineLangComponent({
  name: "Col",
  description: "Table column definition. label: header text, type: string/number/boolean",
  schema: z.object({
    label: z.string(),
    type: z.enum(["string", "number", "boolean"]).optional(),
  }),
  component: ({ props }) => (
    <span className="text-xs text-muted-foreground">[Col: {props.label as string}]</span>
  ),
})

// ---------------------------------------------------------------------------
// Table — data table with headers and rows
// ---------------------------------------------------------------------------

export const TableDef = defineLangComponent({
  name: "Table",
  description: "Data table. columns: Col[] definitions, rows: 2D array of cell values",
  schema: z.object({
    columns: z.array(z.unknown()),
    rows: z.array(z.array(z.unknown())),
  }),
  component: ({ props }) => {
    const rawCols = props.columns as unknown[]
    const rows = props.rows as unknown[][]

    // Extract column labels from Col ElementNodes or strings
    const columns = rawCols.map((c, i) => {
      if (typeof c === "string") return { label: c, type: "string" }
      const p = extractProps(c)
      return {
        label: String(p.label ?? `Col ${i + 1}`),
        type: String(p.type ?? "string"),
      }
    })

    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden my-1">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {columns.map((col, i) => (
                  <th key={i} className={`px-4 py-2.5 font-medium text-muted-foreground ${col.type === "number" ? "text-right" : "text-left"}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, ri) => (
                <tr key={ri} className="hover:bg-muted/20 transition-colors">
                  {(row as unknown[]).map((cell, ci) => {
                    const col = columns[ci]
                    return (
                      <td key={ci} className={`px-4 py-2.5 ${col?.type === "number" ? "text-right tabular-nums" : ""}`}>
                        {String(cell ?? "")}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  },
})

// ---------------------------------------------------------------------------
// Button — interactive button (for chat continuations)
// ---------------------------------------------------------------------------

export const ButtonDef = defineLangComponent({
  name: "Button",
  description: "Clickable button. label: text, variant: default/secondary/outline/destructive",
  schema: z.object({
    label: z.string(),
    action: z.string().optional(),
    variant: z.enum(["default", "secondary", "outline", "destructive"]).optional(),
  }),
  component: ({ props }) => {
    const variants: Record<string, string> = {
      default: "bg-primary text-white hover:opacity-90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border border-border hover:bg-muted",
      destructive: "bg-destructive text-white hover:opacity-90",
    }
    const cls = variants[(props.variant as string) ?? "default"] ?? variants.default
    return (
      <button className={`rounded-lg px-4 py-2 text-[13px] font-medium transition-all ${cls}`}>
        {props.label as string}
      </button>
    )
  },
})
