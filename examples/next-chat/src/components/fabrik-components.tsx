"use client"

import { useState } from "react"
import { defineComponent } from "@fabrik-sdk/ui"
import { CodeDiff } from "@fabrik-sdk/ui/chat"
import { z } from "zod"
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell
} from "recharts"

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
// Chart color palette — references CSS custom properties with hex fallbacks
// ---------------------------------------------------------------------------

const CHART_HEX = [
  "var(--chart-1, #2a9d8f)",
  "var(--chart-2, #3b82c4)",
  "var(--chart-3, #6366b0)",
  "var(--chart-4, #4ead6a)",
  "var(--chart-5, #9668c4)",
]

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
// Bar Chart — Recharts with design-system tokens
// ---------------------------------------------------------------------------

const barChartSchema = z.object({
  title: z.string().optional(),
  data: z.array(z.object({ label: z.string(), value: z.number() })),
})

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: { label: string } }>
}

function ChartTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  const value = item.value
  const formatted =
    value >= 1e6 ? `$${(value / 1e6).toFixed(2)}M` :
    value >= 1e3 ? `$${(value / 1e3).toFixed(1)}K` :
    `${value}`

  return (
    <div
      className="rounded-lg border border-border shadow-lg px-3.5 py-2.5"
      style={{ background: "var(--card)" }}
    >
      <p className="text-[11px] text-muted-foreground font-medium mb-0.5">
        {item.payload.label}
      </p>
      <p className="text-sm font-semibold tabular-nums">{formatted}</p>
    </div>
  )
}

function BarChartComponent({ title, data }: z.infer<typeof barChartSchema>) {
  const chartHeight = Math.max(280, data.length * 48 + 20)

  return (
    <div className="rounded-xl border border-border bg-card p-5 my-3 shadow-sm">
      {title && (
        <h3 className="text-sm font-semibold mb-5 tracking-tight">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 0, right: 12, top: 4, bottom: 4 }}
        >
          <CartesianGrid
            horizontal={false}
            strokeDasharray="3 3"
            stroke="var(--border)"
            strokeOpacity={0.6}
          />
          <XAxis
            type="number"
            tickFormatter={(v: number) =>
              v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` :
              v >= 1e3 ? `$${(v / 1e3).toFixed(0)}K` :
              `${v}`
            }
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            width={72}
            tickMargin={4}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={Math.max(16, Math.min(32, 180 / data.length))}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_HEX[i % CHART_HEX.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export const barChart = defineComponent({
  name: "bar_chart",
  description: "Displays a bar chart",
  schema: barChartSchema,
  component: BarChartComponent,
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
                  className="px-4 py-2 text-left text-[11px] font-bold text-muted-foreground tracking-widest uppercase"
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
                    className={`px-4 py-2.5 ${
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
// Code Diff
// ---------------------------------------------------------------------------

const codeDiffSchema = z.object({
  filename: z.string(),
  language: z.string().optional(),
  original: z.string(),
  modified: z.string(),
})

function CodeDiffCard({
  filename,
  language,
  original,
  modified,
}: z.infer<typeof codeDiffSchema>) {
  return (
    <CodeDiff
      filename={filename}
      language={language}
      original={original}
      modified={modified}
    />
  )
}

export const codeDiffComponent = defineComponent({
  name: "show_code_diff",
  description: "Shows a code diff with before/after comparison and accept/reject actions",
  schema: codeDiffSchema,
  component: CodeDiffCard,
})

// ---------------------------------------------------------------------------
// Email Composer
// ---------------------------------------------------------------------------

const emailComposerSchema = z.object({
  to: z.string(),
  subject: z.string(),
  body: z.string(),
  cc: z.string().optional(),
  bcc: z.string().optional(),
})

function EmailComposer({ to, subject, body, cc }: z.infer<typeof emailComposerSchema>) {
  const [copied, setCopied] = useState(false)
  const [sent, setSent] = useState(false)

  const fullText = [
    `To: ${to}`,
    cc ? `Cc: ${cc}` : null,
    `Subject: ${subject}`,
    "",
    body,
  ].filter(Boolean).join("\n")

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden my-3 shadow-sm">
      <div className="px-5 pt-4 pb-3 space-y-2 border-b border-border">
        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-muted-foreground font-medium w-14 shrink-0">To</span>
          <span className="text-foreground">{to}</span>
        </div>
        {cc && (
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-muted-foreground font-medium w-14 shrink-0">Cc</span>
            <span className="text-foreground">{cc}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-medium text-[13px] w-14 shrink-0">Subject</span>
          <span className="text-[15px] font-semibold text-foreground">{subject}</span>
        </div>
      </div>
      <div className="px-5 py-4">
        <div className="text-[14px] leading-relaxed text-foreground whitespace-pre-wrap">{body}</div>
      </div>
      <div className="flex items-center gap-2 px-5 py-3 border-t border-border bg-muted/30">
        <button
          onClick={() => { navigator.clipboard.writeText(fullText); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {copied ? "Copied!" : "Copy email"}
        </button>
        <button
          onClick={() => setSent(true)}
          disabled={sent}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            sent ? "bg-[var(--success,#10b981)] text-white" : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {sent ? "Sent!" : "Send"}
        </button>
      </div>
    </div>
  )
}

export const emailComposer = defineComponent({
  name: "email_composer",
  description: "Composes and displays an email with To, Subject, Body, and Send/Copy actions",
  schema: emailComposerSchema,
  component: EmailComposer,
})

// ---------------------------------------------------------------------------
// Stock Dashboard
// ---------------------------------------------------------------------------

const stockDashboardSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  change: z.number(),
  changePercent: z.number(),
  priceHistory: z.array(z.object({ date: z.string(), price: z.number() })),
  stats: z.array(z.object({ label: z.string(), value: z.string() })),
  news: z.array(z.object({ title: z.string(), time: z.string() })).optional(),
  fundamentals: z.array(z.object({
    quarter: z.string(),
    revenue: z.string(),
    earnings: z.string(),
    margin: z.string(),
  })).optional(),
})

interface StockTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: { date: string } }>
}

function StockTooltip({ active, payload }: StockTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div
      className="rounded-lg border border-border shadow-lg px-3 py-2"
      style={{ background: "var(--card)" }}
    >
      <p className="text-[10px] text-muted-foreground">{item.payload.date}</p>
      <p className="text-sm font-semibold tabular-nums">${item.value.toFixed(2)}</p>
    </div>
  )
}

function StockDashboard({ symbol, name, price, change, changePercent, priceHistory, stats, news, fundamentals }: z.infer<typeof stockDashboardSchema>) {
  const isUp = change >= 0
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden my-3 shadow-sm">
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold">{name}</span>
          <span className="text-sm text-muted-foreground font-mono">{symbol}</span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-3xl font-semibold tabular-nums">${price.toFixed(2)}</span>
          <span className={`text-sm font-medium ${isUp ? "text-[var(--success,#10b981)]" : "text-destructive"}`}>
            {isUp ? "+" : ""}{change.toFixed(2)} ({isUp ? "+" : ""}{changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Area Chart */}
      <div className="px-2">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={priceHistory}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isUp ? "var(--success, #10b981)" : "var(--destructive)"} stopOpacity={0.15} />
                <stop offset="100%" stopColor={isUp ? "var(--success, #10b981)" : "var(--destructive)"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
            <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={50} tickFormatter={(v: number) => `$${v}`} />
            <Tooltip content={<StockTooltip />} cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }} />
            <Area type="monotone" dataKey="price" stroke={isUp ? "var(--success, #10b981)" : "var(--destructive)"} fill="url(#priceGrad)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "var(--primary)" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-3 gap-px bg-border mx-5 rounded-lg overflow-hidden my-3">
        {stats.map(s => (
          <div key={s.label} className="bg-card px-3 py-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
            <p className="text-sm font-semibold mt-0.5 tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quarterly Fundamentals */}
      {fundamentals && fundamentals.length > 0 && (
        <div className="border-t border-border px-5 py-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quarterly Fundamentals</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-1.5 text-muted-foreground font-medium">Quarter</th>
                  <th className="text-right py-1.5 text-muted-foreground font-medium">Revenue</th>
                  <th className="text-right py-1.5 text-muted-foreground font-medium">EPS</th>
                  <th className="text-right py-1.5 text-muted-foreground font-medium">Margin</th>
                </tr>
              </thead>
              <tbody>
                {fundamentals.map(f => (
                  <tr key={f.quarter} className="border-b border-border/50">
                    <td className="py-1.5 font-medium">{f.quarter}</td>
                    <td className="py-1.5 text-right tabular-nums">{f.revenue}</td>
                    <td className="py-1.5 text-right tabular-nums">{f.earnings}</td>
                    <td className="py-1.5 text-right tabular-nums">{f.margin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* News */}
      {news && news.length > 0 && (
        <div className="border-t border-border px-5 py-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Recent News</p>
          {news.map((n, i) => (
            <div key={i} className="flex items-start gap-2 py-1.5">
              <span className="text-[10px] text-muted-foreground shrink-0 w-12">{n.time}</span>
              <p className="text-xs text-foreground">{n.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const stockDashboard = defineComponent({
  name: "stock_dashboard",
  description: "Displays a stock dashboard with price chart, key stats, and news",
  schema: stockDashboardSchema,
  component: StockDashboard,
})

// ---------------------------------------------------------------------------
export const demoLibrary = [weatherCard, barChart, statsGrid, table, codeDiffComponent, emailComposer, stockDashboard]
