"use client"

import { defineComponent } from "@fabrik/ui"
import { z } from "zod"

// ---------------------------------------------------------------------------
// Schemas — defined once, used for both props + defineComponent
// ---------------------------------------------------------------------------

const weatherSchema = z.object({
  city: z.string(),
  temp: z.number(),
  condition: z.string(),
  humidity: z.number().optional(),
})

const barChartSchema = z.object({
  title: z.string().optional(),
  data: z.array(z.object({ label: z.string(), value: z.number() })),
})

const statsGridSchema = z.object({
  stats: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      change: z.string().optional(),
      changeType: z.enum(["increase", "decrease"]).optional(),
    })
  ),
  columns: z.number().optional(),
})

// ---------------------------------------------------------------------------
// Props derived from schemas
// ---------------------------------------------------------------------------

type WeatherCardProps = z.infer<typeof weatherSchema>
type BarChartProps = z.infer<typeof barChartSchema>
type StatsGridProps = z.infer<typeof statsGridSchema>

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function WeatherCard({ city, temp, condition, humidity }: WeatherCardProps) {
  const icons: Record<string, string> = { sunny: "\u2600\uFE0F", cloudy: "\u2601\uFE0F", rainy: "\uD83C\uDF27\uFE0F", snowy: "\u2744\uFE0F" }
  return (
    <div className="rounded-lg border border-border bg-card p-4 my-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{city}</p>
      <div className="flex items-baseline gap-0.5 mt-1">
        <span className="text-3xl font-light">{temp}</span>
        <span className="text-sm text-muted-foreground">&deg;F</span>
        <span className="ml-auto text-2xl">{icons[condition] ?? "\uD83C\uDF21\uFE0F"}</span>
      </div>
      <p className="text-xs text-muted-foreground capitalize">{condition}</p>
      {humidity && <p className="text-xs text-muted-foreground/70 mt-1">{"\uD83D\uDCA7"} {humidity}%</p>}
    </div>
  )
}

function BarChartComp({ title, data }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value))
  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"]
  return (
    <div className="rounded-lg border border-border bg-card p-4 my-2">
      {title && <p className="text-xs font-medium mb-3">{title}</p>}
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <span className="w-8 text-right text-muted-foreground">{d.label}</span>
            <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
              <div className="h-full rounded" style={{ width: `${(d.value / max) * 100}%`, background: colors[i % colors.length] }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatsGridComp({ stats, columns }: StatsGridProps) {
  return (
    <div className="grid gap-2 my-2" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(140px, 1fr))` }}>
      {stats.map((s) => (
        <div key={s.label} className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
          <p className="text-lg font-semibold mt-0.5">{s.value}</p>
          {s.change && <p className={`text-xs ${s.changeType === "increase" ? "text-success" : "text-destructive"}`}>{s.change}</p>}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component definitions
// ---------------------------------------------------------------------------

export const weatherCard = defineComponent({ name: "weather_card", description: "Weather", schema: weatherSchema, component: WeatherCard })
export const barChart = defineComponent({ name: "bar_chart", description: "Bar chart", schema: barChartSchema, component: BarChartComp })
export const statsGrid = defineComponent({ name: "stats_grid", description: "Stats", schema: statsGridSchema, component: StatsGridComp })

export const playgroundLibrary = [weatherCard, barChart, statsGrid]
