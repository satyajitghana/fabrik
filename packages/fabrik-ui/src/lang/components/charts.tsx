"use client"

import { z } from "zod"
import { defineLangComponent } from "../library"

// ---------------------------------------------------------------------------
// Chart color palette (teal brand)
// ---------------------------------------------------------------------------

/** Extract props from an ElementNode or plain object */
function extractProps(s: unknown): Record<string, unknown> {
  if (s && typeof s === "object") {
    if ("type" in s && (s as Record<string, unknown>).type === "element" && "props" in s) {
      return (s as { props: Record<string, unknown> }).props
    }
    return s as Record<string, unknown>
  }
  return {}
}

const COLORS = [
  "var(--chart-1, #0d9488)",
  "var(--chart-2, #6366f1)",
  "var(--chart-3, #f59e0b)",
  "var(--chart-4, #ef4444)",
  "var(--chart-5, #8b5cf6)",
]

// ---------------------------------------------------------------------------
// Series — chart data series (data-only)
// ---------------------------------------------------------------------------

export const SeriesDef = defineLangComponent({
  name: "Series",
  description: "Chart data series with category label and values array",
  schema: z.object({
    category: z.string(),
    values: z.array(z.number()),
  }),
  component: ({ props }) => (
    <span className="text-xs text-muted-foreground">[Series: {props.category as string}]</span>
  ),
})

// ---------------------------------------------------------------------------
// Slice — pie chart slice (data-only)
// ---------------------------------------------------------------------------

export const SliceDef = defineLangComponent({
  name: "Slice",
  description: "Pie chart slice with category label and value",
  schema: z.object({
    category: z.string(),
    value: z.number(),
  }),
  component: ({ props }) => (
    <span className="text-xs text-muted-foreground">[Slice: {props.category as string}]</span>
  ),
})

// ---------------------------------------------------------------------------
// BarChart — simple CSS-based bar chart (no Recharts dependency)
// ---------------------------------------------------------------------------

export const BarChartDef = defineLangComponent({
  name: "BarChart",
  description: "Bar chart. labels: x-axis labels, series: Series[] data, variant: grouped/stacked",
  schema: z.object({
    labels: z.array(z.string()),
    series: z.array(z.unknown()),
    variant: z.enum(["grouped", "stacked"]).optional(),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
  }),
  component: ({ props }) => {
    const labels = props.labels as string[]
    const rawSeries = props.series as unknown[]

    // Extract series data from ElementNode or plain objects
    const seriesData = rawSeries.map((s, si) => {
      const p = extractProps(s)
      return {
        category: String(p.category ?? `Series ${si + 1}`),
        values: Array.isArray(p.values) ? p.values as number[] : [],
      }
    })

    const allValues = seriesData.flatMap(s => s.values)
    const max = Math.max(...allValues, 1)

    return (
      <div className="rounded-xl border border-border bg-card p-4 my-1">
        {props.yLabel ? <p className="text-[10px] text-muted-foreground mb-2">{String(props.yLabel)}</p> : null}
        <div className="space-y-2">
          {labels.map((label, li) => (
            <div key={label} className="flex items-center gap-2 text-[12px]">
              <span className="w-20 text-right text-muted-foreground truncate shrink-0 text-[11px]">{label}</span>
              <div className="flex-1 flex gap-0.5">
                {seriesData.map((s, si) => {
                  const val = s.values[li] ?? 0
                  const pct = Math.max((val / max) * 100, val > 0 ? 3 : 0) // min 3% if non-zero
                  return (
                    <div key={si} className="h-7 bg-muted/20 rounded-md flex-1 relative overflow-hidden">
                      <div
                        className="h-full rounded-r-md transition-all absolute left-0 top-0"
                        style={{ width: `${pct}%`, background: COLORS[si % COLORS.length] }}
                        title={`${s.category}: ${val}`}
                      />
                    </div>
                  )
                })}
              </div>
              <span className="w-8 text-right text-muted-foreground/50 tabular-nums shrink-0 text-[11px]">
                {seriesData[0]?.values[li] ?? ""}
              </span>
            </div>
          ))}
        </div>
        {props.xLabel ? <p className="text-[10px] text-muted-foreground mt-2 text-center">{String(props.xLabel)}</p> : null}
        {seriesData.length > 1 && (
          <div className="flex gap-3 mt-3 pt-2 border-t border-border">
            {seriesData.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                {s.category}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  },
})

// ---------------------------------------------------------------------------
// LineChart — simple CSS-based line chart (sparkline style)
// ---------------------------------------------------------------------------

export const LineChartDef = defineLangComponent({
  name: "LineChart",
  description: "Line chart. labels: x-axis, series: Series[] data",
  schema: z.object({
    labels: z.array(z.string()),
    series: z.array(z.unknown()),
    variant: z.enum(["linear", "natural", "step"]).optional(),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
  }),
  component: ({ props }) => {
    const labels = props.labels as string[]
    const rawSeries = props.series as unknown[]

    const seriesData = rawSeries.map((s, si) => {
      const p = extractProps(s)
      return {
        category: String(p.category ?? `Series ${si + 1}`),
        values: Array.isArray(p.values) ? p.values as number[] : [],
      }
    })

    const allValues = seriesData.flatMap(s => s.values)
    const max = Math.max(...allValues, 1)
    const min = Math.min(...allValues, 0)
    const range = max - min || 1

    const width = 300
    const height = 120
    const padding = 4

    return (
      <div className="rounded-xl border border-border bg-card p-4 my-1">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          {seriesData.map((s, si) => {
            const points = s.values.map((v, i) => {
              const x = padding + (i / Math.max(s.values.length - 1, 1)) * (width - 2 * padding)
              const y = padding + (1 - (v - min) / range) * (height - 2 * padding)
              return `${x},${y}`
            })
            return (
              <polyline
                key={si}
                points={points.join(" ")}
                fill="none"
                stroke={COLORS[si % COLORS.length]}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )
          })}
        </svg>
        <div className="flex justify-between text-[9px] text-muted-foreground/50 mt-1 px-1">
          {labels.length <= 8
            ? labels.map(l => <span key={l}>{l}</span>)
            : [labels[0], labels[Math.floor(labels.length / 2)], labels[labels.length - 1]].map(l => <span key={l}>{l}</span>)
          }
        </div>
        {seriesData.length > 1 && (
          <div className="flex gap-3 mt-2">
            {seriesData.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                {s.category}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  },
})

// ---------------------------------------------------------------------------
// PieChart — CSS-based donut/pie
// ---------------------------------------------------------------------------

export const PieChartDef = defineLangComponent({
  name: "PieChart",
  description: "Pie/donut chart. slices: Slice[] data, variant: pie/donut",
  schema: z.object({
    slices: z.array(z.unknown()),
    variant: z.enum(["pie", "donut"]).optional(),
  }),
  component: ({ props }) => {
    const rawSlices = props.slices as unknown[]
    const isDonut = (props.variant as string) === "donut"

    const sliceData = rawSlices.map((s, si) => {
      const p = extractProps(s)
      return {
        category: String(p.category ?? `Slice ${si + 1}`),
        value: Number(p.value ?? 0),
      }
    })

    const total = sliceData.reduce((sum, s) => sum + s.value, 0) || 1

    // Build conic gradient
    let acc = 0
    const stops = sliceData.map((s, i) => {
      const start = acc
      acc += (s.value / total) * 360
      return `${COLORS[i % COLORS.length]} ${start}deg ${acc}deg`
    })

    return (
      <div className="rounded-xl border border-border bg-card p-4 my-1">
        <div className="flex items-center gap-6">
          <div
            className="w-28 h-28 rounded-full shrink-0"
            style={{
              background: `conic-gradient(${stops.join(", ")})`,
              ...(isDonut ? { mask: "radial-gradient(circle 35% at center, transparent 99%, black 100%)", WebkitMask: "radial-gradient(circle 35% at center, transparent 99%, black 100%)" } : {}),
            }}
          />
          <div className="flex-1 space-y-1.5">
            {sliceData.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground">{s.category}</span>
                </div>
                <span className="tabular-nums font-medium">{((s.value / total) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  },
})
