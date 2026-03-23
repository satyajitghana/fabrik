import type { Provider, StreamEvent, StreamOptions, FabrikMessage } from "@fabrik-sdk/ui"

interface OpenMeteoCurrentWeather {
  temperature_2m: number
  relative_humidity_2m: number
  wind_speed_10m: number
  precipitation: number
  weather_code: number
  apparent_temperature: number
}

interface OpenMeteoResponse {
  current: OpenMeteoCurrentWeather
}

/**
 * Mock provider that simulates an LLM with real weather data from Open-Meteo.
 * Demonstrates: animated steps, live API calls, elicitation (choice, permission).
 */
export function createMockProvider(): Provider {
  return {
    name: "mock",
    async *stream(options: StreamOptions): AsyncIterable<StreamEvent> {
      const lastMessage = getLastUserMessage(options.messages)
      const text = lastMessage.toLowerCase()

      await delay(200)

      if (text.includes("weather")) {
        yield* weatherResponse()
      } else if (text.includes("chart") || text.includes("graph") || text.includes("revenue")) {
        yield* chartResponse()
      } else if (text.includes("stat") || text.includes("dashboard") || text.includes("metric")) {
        yield* dashboardResponse()
      } else if (text.includes("table") || text.includes("data") || text.includes("list")) {
        yield* tableResponse()
      } else if (text.includes("think")) {
        yield* thinkingResponse()
      } else {
        yield* defaultResponse(lastMessage)
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Weather — LIVE data from Open-Meteo + elicitation
// ---------------------------------------------------------------------------

const CITIES: Record<string, { lat: number; lon: number }> = {
  "San Francisco": { lat: 37.7749, lon: -122.4194 },
  "New York": { lat: 40.7128, lon: -74.0060 },
  "London": { lat: 51.5074, lon: -0.1278 },
  "Tokyo": { lat: 35.6762, lon: 139.6503 },
  "Mumbai": { lat: 19.076, lon: 72.8777 },
}

async function* weatherResponse(): AsyncIterable<StreamEvent> {
  // Step 1: Ask user which city
  yield {
    type: "ask",
    id: "ask_city",
    config: {
      type: "choice" as const,
      title: "Which city would you like weather for?",
      options: Object.keys(CITIES).map(c => ({ value: c, label: c })),
    },
  }

  // Note: In a real app, FabrikStream would pause here and wait for the user
  // response via the elicitation queue. In the mock, we simulate by defaulting
  // to San Francisco after the ask is yielded.
  // The actual pause/resume happens in the FabrikClient stream processor.

  // For the demo, we'll continue with SF data after a delay
  await delay(100)

  const city = "San Francisco"
  const coords = CITIES[city]!

  // Step 2: Fetch live weather
  yield { type: "step_start", id: "s1", title: "Connecting to Open-Meteo API..." }
  await delay(400)
  yield { type: "step_done", id: "s1", stepStatus: "done", durationMs: 400 }

  yield { type: "step_start", id: "s2", title: `Fetching weather for ${city}...` }

  let weatherData: OpenMeteoResponse
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code,apparent_temperature&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch`
    )
    weatherData = await res.json()
  } catch {
    // Fallback if API is unreachable
    weatherData = {
      current: {
        temperature_2m: 68, relative_humidity_2m: 65,
        wind_speed_10m: 4.3, precipitation: 0, weather_code: 0,
        apparent_temperature: 72,
      },
    }
  }

  yield { type: "step_done", id: "s2", stepStatus: "done", durationMs: 600 }

  yield { type: "step_start", id: "s3", title: "Processing weather data..." }
  await delay(300)
  yield { type: "step_done", id: "s3", stepStatus: "done", durationMs: 300 }

  await delay(150)

  const c = weatherData.current
  const condition = wmoToCondition(c.weather_code)
  const conditionText = WMO_CODES[c.weather_code] ?? "clear"

  // Render weather card with LIVE data
  yield { type: "component_start", id: "c1", name: "weather_card" }
  await delay(50)
  yield {
    type: "component_done",
    id: "c1",
    props: {
      city,
      temp: Math.round(c.temperature_2m),
      condition,
      humidity: c.relative_humidity_2m,
      wind: `${c.wind_speed_10m.toFixed(1)} mph`,
    },
  }

  await delay(150)
  yield* streamText(
    `Here's the live weather for ${city}! ` +
    `It's currently ${conditionText} with a temperature of ${Math.round(c.temperature_2m)}°F ` +
    `(feels like ${Math.round(c.apparent_temperature)}°F). ` +
    `Humidity is ${c.relative_humidity_2m}% with winds at ${c.wind_speed_10m.toFixed(1)} mph.`
  )

  // Offer to show forecast
  await delay(300)
  yield* streamText("\n\nWould you like to see the 5-day forecast?")
  yield {
    type: "ask",
    id: "ask_forecast",
    config: {
      type: "choice" as const,
      title: "Show 5-day forecast?",
      options: [
        { value: "yes", label: "Yes, show forecast" },
        { value: "no", label: "No thanks" },
      ],
    },
  }
}

// ---------------------------------------------------------------------------
// Chart — with steps
// ---------------------------------------------------------------------------

async function* chartResponse(): AsyncIterable<StreamEvent> {
  yield { type: "step_start", id: "s1", title: "Querying revenue database..." }
  await delay(700)
  yield { type: "step_done", id: "s1", stepStatus: "done", durationMs: 700 }

  yield { type: "step_start", id: "s2", title: "Aggregating quarterly data..." }
  await delay(500)
  yield { type: "step_done", id: "s2", stepStatus: "done", durationMs: 500 }

  await delay(200)
  yield* streamText("Here's the quarterly revenue data:\n")
  await delay(100)

  yield { type: "component_start", id: "c1", name: "bar_chart" }
  await delay(50)
  yield {
    type: "component_done",
    id: "c1",
    props: {
      title: "Quarterly Revenue",
      data: [
        { label: "Q1 2024", value: 1200000 },
        { label: "Q2 2024", value: 1450000 },
        { label: "Q3 2024", value: 1680000 },
        { label: "Q4 2024", value: 1920000 },
      ],
    },
  }

  await delay(150)
  yield* streamText("Revenue has been growing steadily, with Q4 showing a 14% increase over Q3.")
}

// ---------------------------------------------------------------------------
// Dashboard — with steps
// ---------------------------------------------------------------------------

async function* dashboardResponse(): AsyncIterable<StreamEvent> {
  yield { type: "step_start", id: "s1", title: "Connecting to analytics..." }
  await delay(500)
  yield { type: "step_done", id: "s1", stepStatus: "done", durationMs: 500 }

  yield { type: "step_start", id: "s2", title: "Computing KPI metrics..." }
  await delay(600)
  yield { type: "step_done", id: "s2", stepStatus: "done", durationMs: 600 }

  yield { type: "step_start", id: "s3", title: "Calculating trend data..." }
  await delay(400)
  yield { type: "step_done", id: "s3", stepStatus: "done", durationMs: 400 }

  await delay(200)
  yield* streamText("Here's your dashboard overview:\n")
  await delay(100)

  yield { type: "component_start", id: "c1", name: "stats_grid" }
  await delay(50)
  yield {
    type: "component_done",
    id: "c1",
    props: {
      stats: [
        { label: "Total Revenue", value: "$1.92M", change: "+14.3%", changeType: "increase" },
        { label: "Active Users", value: "12,847", change: "+8.2%", changeType: "increase" },
        { label: "Conversion Rate", value: "3.24%", change: "-0.5%", changeType: "decrease" },
        { label: "Avg Order Value", value: "$149", change: "+2.1%", changeType: "increase" },
      ],
      columns: 2,
    },
  }

  await delay(150)
  yield* streamText("All metrics are trending positively except conversion rate, which dipped slightly this quarter.")
}

// ---------------------------------------------------------------------------
// Table — with steps
// ---------------------------------------------------------------------------

async function* tableResponse(): AsyncIterable<StreamEvent> {
  yield { type: "step_start", id: "s1", title: "Querying database..." }
  await delay(500)
  yield { type: "step_done", id: "s1", stepStatus: "done", durationMs: 500 }

  yield { type: "step_start", id: "s2", title: "Formatting results..." }
  await delay(300)
  yield { type: "step_done", id: "s2", stepStatus: "done", durationMs: 300 }

  await delay(200)

  yield { type: "component_start", id: "c1", name: "table" }
  await delay(50)
  yield {
    type: "component_done",
    id: "c1",
    props: {
      headers: ["Name", "Email", "Role", "Status"],
      rows: [
        ["Alice Johnson", "alice@example.com", "Engineer", "Active"],
        ["Bob Smith", "bob@example.com", "Designer", "Active"],
        ["Carol Williams", "carol@example.com", "PM", "Away"],
        ["David Brown", "david@example.com", "Engineer", "Active"],
        ["Eve Davis", "eve@example.com", "Marketing", "Inactive"],
      ],
      caption: "Team Members",
    },
  }

  await delay(150)
  yield* streamText("Here's the team data. 3 out of 5 members are currently active.")
}

// ---------------------------------------------------------------------------
// Thinking
// ---------------------------------------------------------------------------

async function* thinkingResponse(): AsyncIterable<StreamEvent> {
  yield { type: "thinking_start", id: "t1" }
  const thoughts = [
    "Let me consider this carefully...\n",
    "First, I need to understand the question.\n",
    "The user wants to see the thinking process.\n",
    "I should demonstrate animated reasoning steps.\n",
  ]
  for (const t of thoughts) {
    await delay(350)
    yield { type: "thinking_delta", id: "t1", delta: t }
  }
  await delay(200)
  yield { type: "thinking_done", id: "t1", durationMs: 1600 }

  await delay(200)
  yield* streamText("I've thought about it carefully! The thinking process is visible and collapsible, similar to how Claude shows its reasoning.")
}

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

async function* defaultResponse(userMessage: string): AsyncIterable<StreamEvent> {
  yield* streamText(
    `I received your message: "${userMessage}"\n\n` +
    "Try asking me about:\n" +
    "**Weather** — Live data from Open-Meteo with city selection\n" +
    "**Charts** or **Revenue** — Recharts bar chart\n" +
    "**Stats** or **Dashboard** — KPI stat cards\n" +
    "**Table** or **Data** — Data table\n" +
    "**Think** — Thinking animation"
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function* streamText(text: string): AsyncIterable<StreamEvent> {
  const words = text.split(" ")
  for (let i = 0; i < words.length; i++) {
    yield { type: "text", delta: (i === 0 ? "" : " ") + words[i]! }
    await delay(25)
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

function getLastUserMessage(messages: FabrikMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]!
    if (msg.role === "user") {
      return msg.parts.filter(p => p.type === "text").map(p => 'text' in p ? (p as { text: string }).text : '').join(" ")
    }
  }
  return ""
}

// WMO Weather codes
const WMO_CODES: Record<number, string> = {
  0: "clear sky", 1: "mainly clear", 2: "partly cloudy", 3: "overcast",
  45: "foggy", 48: "rime fog",
  51: "light drizzle", 53: "moderate drizzle", 55: "dense drizzle",
  61: "slight rain", 63: "moderate rain", 65: "heavy rain",
  71: "slight snow", 73: "moderate snow", 75: "heavy snow",
  80: "slight showers", 81: "moderate showers", 82: "violent showers",
  95: "thunderstorm", 96: "thunderstorm with hail", 99: "severe thunderstorm",
}

function wmoToCondition(code: number): string {
  if (code <= 1) return "sunny"
  if (code <= 3) return "cloudy"
  if (code <= 48) return "cloudy"
  if (code <= 65 || (code >= 80 && code <= 82)) return "rainy"
  if (code >= 71 && code <= 75) return "snowy"
  return "cloudy"
}
