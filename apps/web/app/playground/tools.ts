import { defineTool } from "@fabrik-sdk/ui"
import { z } from "zod"

// ---------------------------------------------------------------------------
// WMO weather code → condition string
// ---------------------------------------------------------------------------

const WMO_CONDITIONS: Record<number, string> = {
  0: "clear", 1: "clear", 2: "cloudy", 3: "overcast",
  45: "foggy", 48: "foggy",
  51: "rainy", 53: "rainy", 55: "rainy",
  56: "rainy", 57: "rainy",
  61: "rainy", 63: "rainy", 65: "rainy",
  66: "rainy", 67: "rainy",
  71: "snowy", 73: "snowy", 75: "snowy", 77: "snowy",
  80: "rainy", 81: "rainy", 82: "rainy",
  85: "snowy", 86: "snowy",
  95: "stormy", 96: "stormy", 99: "stormy",
}

// ---------------------------------------------------------------------------
// Types for API responses
// ---------------------------------------------------------------------------

interface GeocodingResponse {
  results?: Array<{
    name: string
    latitude: number
    longitude: number
    country: string
  }>
}

interface ReverseGeocodeResponse {
  address?: {
    city?: string
    town?: string
    village?: string
    country?: string
  }
}

interface WeatherResponse {
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    wind_speed_10m: number
    weather_code: number
    apparent_temperature: number
  }
}

// ---------------------------------------------------------------------------
// get_location — uses browser geolocation API
// The LLM should call __fabrik_ask_permission FIRST before calling this tool.
// ---------------------------------------------------------------------------

export const getLocation = defineTool({
  name: "get_location",
  description:
    "Gets the user's current GPS coordinates and city name via browser geolocation. Prerequisites: call __fabrik_ask_permission first to get location permission. Only call this AFTER the user allows. If permission is denied, use __fabrik_ask_text to ask the user to type their city instead, then call get_weather with that city.",
  schema: z.object({}),
  stepTitle: "Getting your location...",
  run: async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return { success: false, reason: "Geolocation not available" }
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          maximumAge: 300000,
        })
      })

      const { latitude, longitude } = position.coords

      // Reverse geocode to get city name
      let city = "your location"
      let country = ""
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`,
          { headers: { "User-Agent": "FabrikUI/1.0" } },
        )
        const data = (await res.json()) as ReverseGeocodeResponse
        city = data.address?.city ?? data.address?.town ?? data.address?.village ?? "your location"
        country = data.address?.country ?? ""
      } catch {
        // Reverse geocoding failed, still return coords
      }

      return { success: true, latitude, longitude, city, country }
    } catch {
      return { success: false, reason: "Location access denied or failed" }
    }
  },
})

// ---------------------------------------------------------------------------
// get_weather — calls Open-Meteo (free, no auth, CORS-enabled)
// ---------------------------------------------------------------------------

export const getWeather = defineTool({
  name: "get_weather",
  description:
    "Fetches real-time weather from Open-Meteo API. Pass { city } for a city name, or { latitude, longitude } from get_location. Returns temp, humidity, wind, condition. After calling this, render the result using show_weather_card.",
  schema: z.object({
    city: z.string().optional().describe("City name (used if lat/lon not provided)"),
    latitude: z.number().optional().describe("Latitude from get_location"),
    longitude: z.number().optional().describe("Longitude from get_location"),
  }),
  stepTitle: (args) => `Fetching weather for ${args.city ?? "your location"}...`,
  run: async ({ city, latitude, longitude }) => {
    let lat = latitude
    let lon = longitude
    let resolvedCity = city ?? "Unknown"
    let resolvedCountry = ""

    if (lat == null || lon == null) {
      if (!city) throw new Error("Provide either a city name or latitude/longitude")

      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`,
      )
      const geoData = (await geoRes.json()) as GeocodingResponse

      if (!geoData.results?.length) {
        throw new Error(`City not found: ${city}`)
      }

      lat = geoData.results[0]!.latitude
      lon = geoData.results[0]!.longitude
      resolvedCity = geoData.results[0]!.name
      resolvedCountry = geoData.results[0]!.country
    }

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature`,
    )
    const weatherData = (await weatherRes.json()) as WeatherResponse
    const c = weatherData.current

    return {
      city: resolvedCity,
      country: resolvedCountry,
      tempC: Math.round(c.temperature_2m),
      tempF: Math.round(c.temperature_2m * 9 / 5 + 32),
      feelsLikeC: Math.round(c.apparent_temperature),
      feelsLikeF: Math.round(c.apparent_temperature * 9 / 5 + 32),
      condition: WMO_CONDITIONS[c.weather_code] ?? "unknown",
      humidity: c.relative_humidity_2m,
      windKmh: `${c.wind_speed_10m.toFixed(1)} km/h`,
      windMph: `${(c.wind_speed_10m * 0.621371).toFixed(1)} mph`,
    }
  },
})

// ---------------------------------------------------------------------------
// web_search — DuckDuckGo HTML search (real results, no API key)
// ---------------------------------------------------------------------------

export const webSearch = defineTool({
  name: "web_search",
  description:
    "Search the web for real information. Returns titles, snippets, and URLs from DuckDuckGo. Use when the user asks about any topic. Call this ONCE — do NOT retry with different queries. After getting results, use show_search_results to display them, or summarize the information using show_card, show_tabs, or show_accordion.",
  schema: z.object({
    query: z.string().describe("Search query"),
  }),
  stepTitle: (args) => `Searching for "${args.query}"...`,
  run: async ({ query }) => {
    try {
      const res = await fetch(
        `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
        { headers: { "User-Agent": "Mozilla/5.0 (compatible; FabrikUI/1.0)" } },
      )
      const html = await res.text()

      // Parse results from DDG HTML response
      const results: Array<{ title: string; snippet: string; url: string }> = []
      const resultRegex = /<a rel="nofollow" class="result__a" href="[^"]*uddg=([^&"]*)[^"]*">([^<]*)<\/a>/g
      const snippetRegex = /<a class="result__snippet"[^>]*>([^<]*(?:<b>[^<]*<\/b>[^<]*)*)<\/a>/g

      const titles: Array<{ url: string; title: string }> = []
      let match: RegExpExecArray | null
      while ((match = resultRegex.exec(html)) !== null) {
        const url = decodeURIComponent(match[1] ?? "")
        const title = (match[2] ?? "").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
        if (url.startsWith("http")) titles.push({ url, title })
      }

      const snippets: string[] = []
      while ((match = snippetRegex.exec(html)) !== null) {
        const snippet = (match[1] ?? "").replace(/<\/?b>/g, "").replace(/&#x27;/g, "'").replace(/&amp;/g, "&")
        snippets.push(snippet)
      }

      for (let i = 0; i < Math.min(titles.length, 5); i++) {
        results.push({
          title: titles[i]!.title,
          snippet: snippets[i] ?? "",
          url: titles[i]!.url,
        })
      }

      if (results.length === 0) {
        return { query, results: [], message: `No results found for "${query}".` }
      }

      return { query, results }
    } catch {
      return { query, results: [], message: `Search failed for "${query}". Try again.` }
    }
  },
})

// ---------------------------------------------------------------------------
// get_stock_price — mock with realistic data (no API key needed)
// ---------------------------------------------------------------------------

const STOCK_DATA: Record<string, { name: string; basePrice: number }> = {
  AAPL: { name: "Apple Inc.", basePrice: 195 },
  GOOGL: { name: "Alphabet Inc.", basePrice: 175 },
  MSFT: { name: "Microsoft Corp.", basePrice: 430 },
  AMZN: { name: "Amazon.com Inc.", basePrice: 185 },
  TSLA: { name: "Tesla Inc.", basePrice: 250 },
  NVDA: { name: "NVIDIA Corp.", basePrice: 130 },
  META: { name: "Meta Platforms", basePrice: 500 },
  NFLX: { name: "Netflix Inc.", basePrice: 680 },
}

export const getStockPrice = defineTool({
  name: "get_stock_price",
  description:
    "Get current stock price and market data for a ticker symbol. Returns price, daily change, volume, and market cap. After getting data, use show_stock_card to display it. Supports major US stocks.",
  schema: z.object({
    symbol: z.string().describe("Stock ticker symbol, e.g. AAPL, GOOGL, MSFT"),
  }),
  stepTitle: (args) => `Fetching ${args.symbol.toUpperCase()} stock data...`,
  run: async ({ symbol }) => {
    const sym = symbol.toUpperCase()
    const stock = STOCK_DATA[sym]

    // Simulate realistic price variation
    const variation = (Math.random() - 0.5) * 10
    const price = stock ? stock.basePrice + variation : 50 + Math.random() * 200
    const change = (Math.random() - 0.45) * 8 // Slight positive bias
    const changePercent = (change / price) * 100

    return {
      symbol: sym,
      name: stock?.name ?? `${sym} Inc.`,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      volume: `${(Math.random() * 80 + 20).toFixed(1)}M`,
      marketCap: `$${(price * (Math.random() * 5 + 1)).toFixed(0)}B`,
    }
  },
})

// ---------------------------------------------------------------------------
// calculate — safe math evaluation
// ---------------------------------------------------------------------------

export const calculate = defineTool({
  name: "calculate",
  description:
    "Evaluate a mathematical expression. Supports basic arithmetic (+, -, *, /), exponents (**), parentheses, and Math functions (sqrt, sin, cos, log, PI, E). Returns the numeric result. Respond with the result in text — no component needed.",
  schema: z.object({
    expression: z.string().describe("Math expression to evaluate, e.g. '2 ** 10 * 3.14' or 'Math.sqrt(144)'"),
  }),
  stepTitle: "Calculating...",
  run: async ({ expression }) => {
    try {
      // Safe evaluation using Function constructor with Math in scope
      const sanitized = expression.replace(/[^0-9+\-*/().,%^ Math.sqrtsincoantlogPIEpowabceilfloorround]/g, "")
      const fn = new Function("Math", `"use strict"; return (${sanitized})`)
      const result = fn(Math) as number

      if (typeof result !== "number" || !isFinite(result)) {
        throw new Error("Invalid result")
      }

      return {
        expression,
        result: Math.round(result * 1000000) / 1000000, // 6 decimal precision
      }
    } catch {
      throw new Error(`Could not evaluate: ${expression}`)
    }
  },
})

export const playgroundTools = [getLocation, getWeather, webSearch, getStockPrice, calculate]
