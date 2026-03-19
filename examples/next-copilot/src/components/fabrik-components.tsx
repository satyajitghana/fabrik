"use client"

import { defineComponent } from "@fabrik/ui"
import { z } from "zod"
import { TbDropletFilled, TbWind } from "react-icons/tb"
import { HiArrowTrendingUp, HiArrowTrendingDown } from "react-icons/hi2"

// ---------------------------------------------------------------------------
// Weather Card
// ---------------------------------------------------------------------------

const weatherSchema = z.object({
  city: z.string(),
  temp: z.number(),
  condition: z.string(),
  humidity: z.number().optional(),
  wind: z.string().optional(),
})

function WeatherCard({ city, temp, condition, humidity, wind }: z.infer<typeof weatherSchema>) {
  const icons: Record<string, string> = {
    sunny: "\u2600\uFE0F", cloudy: "\u2601\uFE0F", rainy: "\uD83C\uDF27\uFE0F", snowy: "\u2744\uFE0F",
  }
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden my-3">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">{city}</p>
            <div className="flex items-baseline mt-1">
              <span className="text-[40px] font-extralight leading-none tracking-tighter">{temp}</span>
              <span className="text-base text-muted-foreground ml-0.5">°F</span>
            </div>
            <p className="text-[13px] text-muted-foreground capitalize mt-1">{condition}</p>
          </div>
          <span className="text-[40px] leading-none">{icons[condition] ?? "\uD83C\uDF21\uFE0F"}</span>
        </div>
      </div>
      {(humidity !== undefined || wind) && (
        <div className="flex gap-5 px-5 py-2.5 border-t border-border bg-muted/30 text-[11px] text-muted-foreground">
          {humidity !== undefined && (
            <span className="flex items-center gap-1"><TbDropletFilled className="w-3.5 h-3.5 text-blue-400" />{humidity}%</span>
          )}
          {wind && (
            <span className="flex items-center gap-1"><TbWind className="w-3.5 h-3.5 text-muted-foreground" />{wind}</span>
          )}
        </div>
      )}
    </div>
  )
}

export const weatherCard = defineComponent({
  name: "weather_card",
  description: "Shows weather for a city",
  schema: weatherSchema,
  component: WeatherCard,
})

// ---------------------------------------------------------------------------
// Stats Grid
// ---------------------------------------------------------------------------

const statsGridSchema = z.object({
  stats: z.array(z.object({
    label: z.string(),
    value: z.string(),
    change: z.string().optional(),
    changeType: z.enum(["increase", "decrease"]).optional(),
  })),
  columns: z.number().optional(),
})

function StatsGrid({ stats, columns = 2 }: z.infer<typeof statsGridSchema>) {
  return (
    <div className="grid gap-3 my-3" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(140px, 1fr))` }}>
      {stats.map(stat => (
        <div key={stat.label} className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">{stat.label}</p>
          <p className="text-[24px] font-semibold tracking-tight mt-1">{stat.value}</p>
          {stat.change && (
            <div className="flex items-center gap-1 mt-1.5">
              {stat.changeType === "increase"
                ? <HiArrowTrendingUp className="w-4 h-4 text-[var(--success,#10b981)]" />
                : <HiArrowTrendingDown className="w-4 h-4 text-destructive" />
              }
              <span className={`text-[12px] font-medium ${stat.changeType === "increase" ? "text-[var(--success,#10b981)]" : "text-destructive"}`}>
                {stat.change}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export const statsGrid = defineComponent({
  name: "stats_grid",
  description: "Grid of stat cards with KPI values and trend indicators",
  schema: statsGridSchema,
  component: StatsGrid,
})

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

const tableSchema = z.object({
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
  caption: z.string().optional(),
})

function TableComponent({ headers, rows, caption }: z.infer<typeof tableSchema>) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden my-3">
      {caption && (
        <div className="px-5 py-3.5 border-b border-border">
          <h3 className="text-sm font-medium">{caption}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {headers.map(h => (
                <th key={h} className="px-5 py-2.5 text-left text-[11px] font-medium text-muted-foreground tracking-wide uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="text-[13px]">
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                {row.map((cell, j) => (
                  <td key={j} className={`px-5 py-3 ${j === 0 ? "font-medium" : "text-muted-foreground"}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const table = defineComponent({
  name: "table",
  description: "Data table with headers and rows",
  schema: tableSchema,
  component: TableComponent,
})

// ---------------------------------------------------------------------------
export const demoLibrary = [weatherCard, statsGrid, table]
