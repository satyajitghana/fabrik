"use client"

import { useState } from "react"
import { defineComponent } from "@fabrik-sdk/ui"
import { z } from "zod"

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const weatherSchema = z.object({
  city: z.string(),
  condition: z.string(),
  country: z.string().optional(),
  tempC: z.number().optional(),
  tempF: z.number().optional(),
  feelsLikeC: z.number().optional(),
  feelsLikeF: z.number().optional(),
  // Legacy single-unit fields (for backward compat with LLM responses)
  temp: z.number().optional(),
  feelsLike: z.number().optional(),
  humidity: z.number().optional(),
  windKmh: z.string().optional(),
  windMph: z.string().optional(),
  wind: z.string().optional(),
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
// Props
// ---------------------------------------------------------------------------

type WeatherCardProps = z.infer<typeof weatherSchema>
type BarChartProps = z.infer<typeof barChartSchema>
type StatsGridProps = z.infer<typeof statsGridSchema>

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function WeatherCard(props: WeatherCardProps) {
  const { city, condition, country, humidity } = props
  const [unit, setUnit] = useState<"C" | "F">("C")

  const icons: Record<string, string> = {
    sunny: "\u2600\uFE0F", cloudy: "\u2601\uFE0F", rainy: "\uD83C\uDF27\uFE0F",
    snowy: "\u2744\uFE0F", clear: "\u2600\uFE0F", overcast: "\u2601\uFE0F",
    foggy: "\uD83C\uDF2B\uFE0F", stormy: "\u26C8\uFE0F",
  }

  // Support both dual-unit (tempC/tempF) and legacy single-unit (temp) fields
  const tempC = props.tempC ?? (props.temp != null ? Math.round((props.temp - 32) * 5 / 9) : null)
  const tempF = props.tempF ?? props.temp ?? null
  const feelsC = props.feelsLikeC ?? (props.feelsLike != null ? Math.round((props.feelsLike - 32) * 5 / 9) : null)
  const feelsF = props.feelsLikeF ?? props.feelsLike ?? null
  const wind = unit === "C" ? (props.windKmh ?? props.wind) : (props.windMph ?? props.wind)

  const temp = unit === "C" ? tempC : tempF
  const feels = unit === "C" ? feelsC : feelsF

  return (
    <div className="rounded-xl border border-border bg-card p-4 my-2">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          {city}{country ? `, ${country}` : ""}
        </p>
        <button
          onClick={() => setUnit(u => u === "C" ? "F" : "C")}
          className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-ring transition-colors"
          aria-label={`Switch to ${unit === "C" ? "Fahrenheit" : "Celsius"}`}
        >
          &deg;{unit === "C" ? "C" : "F"}
        </button>
      </div>
      <div className="flex items-baseline gap-0.5 mt-1">
        <span className="text-[40px] font-light tabular-nums">{temp ?? "--"}</span>
        <span className="text-sm text-muted-foreground">&deg;{unit}</span>
        <span className="ml-auto text-2xl">{icons[condition] ?? "\uD83C\uDF21\uFE0F"}</span>
      </div>
      <p className="text-xs text-muted-foreground capitalize">{condition}</p>
      {feels != null && (
        <p className="text-[11px] text-muted-foreground/60 mt-0.5">Feels like {feels}&deg;{unit}</p>
      )}
      <div className="flex gap-4 mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground/60">
        {humidity != null && <span>{"\uD83D\uDCA7"} {humidity}%</span>}
        {wind && <span>{"\uD83D\uDCA8"} {wind}</span>}
      </div>
    </div>
  )
}

function BarChartComp({ title, data }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value))
  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"]
  return (
    <div className="rounded-xl border border-border bg-card p-4 my-2">
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

function StatsGridComp({ stats }: StatsGridProps) {
  return (
    <div className="grid gap-2 my-2" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(140px, 1fr))` }}>
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
          <p className="text-lg font-semibold mt-0.5 tabular-nums">{s.value}</p>
          {s.change && <p className={`text-xs ${s.changeType === "increase" ? "text-success" : "text-destructive"}`}>{s.change}</p>}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stock card
// ---------------------------------------------------------------------------

const stockSchema = z.object({
  symbol: z.string(),
  name: z.string().optional(),
  price: z.number(),
  change: z.number().optional(),
  changePercent: z.number().optional(),
  volume: z.string().optional(),
  marketCap: z.string().optional(),
})

type StockCardProps = z.infer<typeof stockSchema>

function StockCard({ symbol, name, price, change, changePercent, volume, marketCap }: StockCardProps) {
  const isUp = (change ?? 0) >= 0
  return (
    <div className="rounded-xl border border-border bg-card p-4 my-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold">{symbol}</p>
          {name && <p className="text-[11px] text-muted-foreground">{name}</p>}
        </div>
        <div className="text-right">
          <p className="text-2xl font-light tabular-nums">${price.toFixed(2)}</p>
          {change != null && changePercent != null && (
            <p className={`text-[12px] font-medium tabular-nums ${isUp ? "text-success" : "text-destructive"}`}>
              {isUp ? "+" : ""}{change.toFixed(2)} ({isUp ? "+" : ""}{changePercent.toFixed(2)}%)
            </p>
          )}
        </div>
      </div>
      {(volume || marketCap) && (
        <div className="flex gap-4 mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground/60">
          {volume && <span>Vol: {volume}</span>}
          {marketCap && <span>Cap: {marketCap}</span>}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Search results
// ---------------------------------------------------------------------------

const searchResultsSchema = z.object({
  query: z.string(),
  results: z.array(z.object({
    title: z.string(),
    snippet: z.string(),
    url: z.string().optional(),
  })),
  message: z.string().optional(),
})

type SearchResultsProps = z.infer<typeof searchResultsSchema>

function SearchResults({ query, results, message }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 my-2 text-[13px] text-muted-foreground">
        {message ?? `No results found for "${query}"`}
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-border bg-card divide-y divide-border my-2">
      <div className="px-4 py-2.5 flex items-center gap-2">
        <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <span className="text-[11px] text-muted-foreground">Results for &ldquo;{query}&rdquo;</span>
      </div>
      {results.map((r, i) => (
        <div key={i} className="px-4 py-3">
          {r.url ? (
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-primary hover:underline">
              {r.title}
            </a>
          ) : (
            <p className="text-[13px] font-medium">{r.title}</p>
          )}
          <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{r.snippet}</p>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component definitions
// ---------------------------------------------------------------------------

export const weatherCard = defineComponent({
  name: "weather_card",
  description: "Shows current weather with C/F toggle, condition emoji, humidity, wind. Pass fields from get_weather: city, tempC, tempF, feelsLikeC, feelsLikeF, condition, humidity, windKmh, windMph, country.",
  schema: weatherSchema,
  component: WeatherCard,
})
export const barChart = defineComponent({ name: "bar_chart", description: "Bar chart with labeled bars. Pass title and data array of { label, value }.", schema: barChartSchema, component: BarChartComp })
export const statsGrid = defineComponent({ name: "stats_grid", description: "Grid of stat cards. Pass stats array of { label, value, change, changeType }.", schema: statsGridSchema, component: StatsGridComp })
export const stockCard = defineComponent({
  name: "stock_card",
  description: "Shows stock price with daily change, volume, market cap. Pass fields from get_stock_price: symbol, name, price, change, changePercent, volume, marketCap.",
  schema: stockSchema,
  component: StockCard,
})
export const searchResults = defineComponent({
  name: "search_results",
  description: "Displays web search results as a list with titles, snippets, and links. Pass fields from web_search: query, results array of { title, snippet, url }.",
  schema: searchResultsSchema,
  component: SearchResults,
})

export const playgroundLibrary = [weatherCard, barChart, statsGrid, stockCard, searchResults]
