"use client"

import { defineComponent } from "@fabrik-sdk/ui"
import { z } from "zod"

// ---------------------------------------------------------------------------
// Inline SVG Icons — no external icon library needed
// ---------------------------------------------------------------------------

function DropletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z" />
    </svg>
  )
}

function WindIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.7 7.7A2.5 2.5 0 0 1 15 10H3" />
      <path d="M9.6 4.6A2 2 0 0 1 11 8H3" />
      <path d="M12.6 19.4A2 2 0 0 0 14 16H3" />
    </svg>
  )
}

function TrendUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <polyline points="4 14 10 8 13 11 18 6" />
      <polyline points="14 6 18 6 18 10" />
    </svg>
  )
}

function TrendDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <polyline points="4 6 10 12 13 9 18 14" />
      <polyline points="14 14 18 14 18 10" />
    </svg>
  )
}

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
  const conditionIcons: Record<string, string> = {
    sunny: "\u2600\uFE0F",
    cloudy: "\u2601\uFE0F",
    rainy: "\uD83C\uDF27\uFE0F",
    snowy: "\u2744\uFE0F",
  }

  return (
    <div
      className="rounded-xl border border-border overflow-hidden my-3 shadow-sm"
      style={{
        background: "linear-gradient(135deg, var(--card) 0%, var(--accent) 100%)",
      }}
    >
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground tracking-widest uppercase">
              {city}
            </p>
            <div className="flex items-baseline mt-2 gap-0.5">
              <span className="text-[48px] font-extralight leading-none tracking-tighter tabular-nums">
                {temp}
              </span>
              <span className="text-lg text-muted-foreground font-light">&deg;F</span>
            </div>
            <p className="text-[13px] text-muted-foreground capitalize mt-1.5 font-medium">
              {condition}
            </p>
          </div>
          <span className="text-[44px] leading-none opacity-90 drop-shadow-sm">
            {conditionIcons[condition.toLowerCase()] ?? "\uD83C\uDF21\uFE0F"}
          </span>
        </div>
      </div>

      {(humidity !== undefined || wind) && (
        <>
          <div className="mx-5 h-px bg-border" />
          <div className="flex gap-6 px-5 py-3 text-xs text-muted-foreground">
            {humidity !== undefined && (
              <span className="flex items-center gap-1.5 font-medium">
                <DropletIcon className="w-3.5 h-3.5 text-blue-400" />
                <span className="tabular-nums">{humidity}%</span>
                <span className="text-muted-foreground/60 font-normal">humidity</span>
              </span>
            )}
            {wind && (
              <span className="flex items-center gap-1.5 font-medium">
                <WindIcon className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{wind}</span>
              </span>
            )}
          </div>
        </>
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

function StatsGrid({ stats }: z.infer<typeof statsGridSchema>) {
  return (
    <div
      className="grid gap-3 my-3"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}
    >
      {stats.map((stat) => {
        const isUp = stat.changeType === "increase"
        return (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm"
          >
            <p className="text-[11px] font-semibold text-muted-foreground tracking-widest uppercase">
              {stat.label}
            </p>
            <p className="text-[28px] font-semibold tracking-tight mt-1 tabular-nums leading-tight">
              {stat.value}
            </p>
            {stat.change && (
              <div className="flex items-center gap-1.5 mt-2">
                <span
                  className="flex items-center justify-center w-5 h-5 rounded-full"
                  style={{
                    background: isUp
                      ? "color-mix(in oklch, var(--success) 15%, transparent)"
                      : "color-mix(in oklch, var(--destructive) 15%, transparent)",
                  }}
                >
                  {isUp
                    ? <TrendUpIcon className="w-3 h-3 text-[var(--success)]" />
                    : <TrendDownIcon className="w-3 h-3 text-destructive" />
                  }
                </span>
                <span
                  className={`text-[12px] font-semibold tabular-nums ${
                    isUp ? "text-[var(--success)]" : "text-destructive"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            )}
          </div>
        )
      })}
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
    <div className="rounded-xl border border-border bg-card overflow-hidden my-3 shadow-sm">
      {caption && (
        <div className="px-5 py-3.5 border-b border-border">
          <h3 className="text-sm font-semibold tracking-tight">{caption}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              className="border-b-2 border-border"
              style={{ background: "var(--muted)" }}
            >
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-[11px] font-bold text-muted-foreground tracking-widest uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-[13px]">
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
                style={i % 2 === 1 ? { background: "var(--muted)", opacity: 0.5 } : undefined}
              >
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={`px-5 py-3.5 ${
                      j === 0 ? "font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {cell}
                  </td>
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
