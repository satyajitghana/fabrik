import type { Provider, StreamEvent, StreamOptions, FabrikMessage } from "@fabrik/ui"

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

      if (text.includes("code diff") || text.includes("show diff") || text.includes("diff")) {
        yield* codeDiffResponse()
      } else if (text.includes("weather")) {
        yield* weatherResponse()
      } else if (text.includes("chart") || text.includes("graph") || text.includes("revenue")) {
        yield* chartResponse()
      } else if (text.includes("stock") || text.includes("nvidia") || text.includes("nvda") || text.includes("apple") || text.includes("aapl")) {
        yield* stockResponse()
      } else if (text.includes("stat") || text.includes("dashboard") || text.includes("metric")) {
        yield* dashboardResponse()
      } else if (text.includes("table") || text.includes("data") || text.includes("list")) {
        yield* tableResponse()
      } else if (text.includes("artifact") || text.includes("show html")) {
        yield* artifactHtmlResponse()
      } else if (text.includes("code example")) {
        yield* artifactCodeResponse()
      } else if (text.includes("think")) {
        yield* thinkingResponse()
      } else if (text.includes("confirm")) {
        yield* confirmResponse()
      } else if (text.includes("multi") && text.includes("choice")) {
        yield* multiChoiceResponse()
      } else if (text.includes("ask me")) {
        yield* textInputResponse()
      } else if (text.includes("permission")) {
        yield* permissionResponse()
      } else if (text.includes("email") || text.includes("compose")) {
        yield* emailResponse()
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
// Artifact — HTML
// ---------------------------------------------------------------------------

async function* artifactHtmlResponse(): AsyncIterable<StreamEvent> {
  yield* streamText("Here's a generated HTML artifact:\n\n")
  await delay(200)

  const htmlContent = `<div style="font-family: system-ui; padding: 20px; background: linear-gradient(135deg, #0d9488, #14b8a6); color: white; border-radius: 12px; text-align: center;">
  <h1>Hello from Fabrik!</h1>
  <p>This HTML was generated by the AI and rendered as an artifact.</p>
</div>`

  yield { type: "artifact_start", id: "art1", title: "Hello Fabrik", language: "html" }

  // Stream the content in chunks for realistic effect
  const chunks = htmlContent.match(/.{1,40}/g) ?? []
  for (const chunk of chunks) {
    await delay(30)
    yield { type: "artifact_delta", id: "art1", delta: chunk }
  }
  await delay(100)
  yield { type: "artifact_done", id: "art1" }

  await delay(150)
  yield* streamText("The HTML artifact above renders in a sandboxed iframe. You can copy the raw content using the copy button.")
}

// ---------------------------------------------------------------------------
// Artifact — TypeScript code
// ---------------------------------------------------------------------------

async function* artifactCodeResponse(): AsyncIterable<StreamEvent> {
  yield* streamText("Here's a TypeScript code artifact:\n\n")
  await delay(200)

  const tsContent = `import { createMockProvider } from "@fabrik/ui"

interface User {
  id: string
  name: string
  email: string
}

async function fetchUsers(): Promise<User[]> {
  const response = await fetch("/api/users")
  if (!response.ok) {
    throw new Error(\`Failed to fetch: \${response.status}\`)
  }
  return response.json()
}

// Usage
const users = await fetchUsers()
console.log(\`Found \${users.length} users\`)`

  yield { type: "artifact_start", id: "art2", title: "User API Client", language: "typescript" }

  // Stream the content in chunks
  const chunks = tsContent.match(/.{1,50}/g) ?? []
  for (const chunk of chunks) {
    await delay(25)
    yield { type: "artifact_delta", id: "art2", delta: chunk }
  }
  await delay(100)
  yield { type: "artifact_done", id: "art2" }

  await delay(150)
  yield* streamText("The TypeScript code above shows a typed API client. You can copy the code using the copy button in the header.")
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
// Confirm — elicitation
// ---------------------------------------------------------------------------

async function* confirmResponse(): AsyncIterable<StreamEvent> {
  yield* streamText("I need to confirm something with you before proceeding.\n\n")
  await delay(200)

  yield {
    type: "ask",
    id: "ask_confirm",
    config: {
      type: "confirm" as const,
      title: "Delete conversation?",
      message: "This will permanently remove all messages. This action cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Keep",
    },
  }

  // In a real app, FabrikClient pauses here and resumes with the user response.
  // For the mock demo, we wait long enough for the UI to be visible.
  await delay(30000)
}

// ---------------------------------------------------------------------------
// Multi-choice — elicitation
// ---------------------------------------------------------------------------

async function* multiChoiceResponse(): AsyncIterable<StreamEvent> {
  yield* streamText("Let me learn a bit about your interests.\n\n")
  await delay(200)

  yield {
    type: "ask",
    id: "ask_multi_choice",
    config: {
      type: "multi_choice" as const,
      title: "Select your interests",
      message: "Choose all that apply:",
      options: [
        { value: "ai", label: "AI & Machine Learning", description: "Neural nets, LLMs, computer vision" },
        { value: "web", label: "Web Development", description: "React, Next.js, TypeScript" },
        { value: "mobile", label: "Mobile Apps", description: "iOS, Android, React Native" },
        { value: "devops", label: "DevOps & Cloud", description: "AWS, Docker, Kubernetes" },
      ],
      min: 1,
      max: 3,
    },
  }

  // Pause so the UI shows the interactive elements
  await delay(30000)
}

// ---------------------------------------------------------------------------
// Text input — elicitation
// ---------------------------------------------------------------------------

async function* textInputResponse(): AsyncIterable<StreamEvent> {
  yield* streamText("I'd like to personalize your experience.\n\n")
  await delay(200)

  yield {
    type: "ask",
    id: "ask_text",
    config: {
      type: "text" as const,
      title: "What's your name?",
      message: "We'll use this to personalize your experience.",
      placeholder: "Enter your name...",
    },
  }

  // Pause so the UI shows the interactive elements
  await delay(30000)
}

// ---------------------------------------------------------------------------
// Permission — elicitation
// ---------------------------------------------------------------------------

async function* permissionResponse(): AsyncIterable<StreamEvent> {
  yield* streamText("To proceed, I need access to an external service.\n\n")
  await delay(200)

  yield {
    type: "ask",
    id: "ask_permission",
    config: {
      type: "permission" as const,
      title: "Access Required",
      message: "The AI needs access to your calendar to schedule meetings.",
      resource: "Google Calendar API",
    },
  }

  // Pause so the UI shows the interactive elements
  await delay(30000)
}

// ---------------------------------------------------------------------------
// Email Composer
// ---------------------------------------------------------------------------

async function* emailResponse(): AsyncIterable<StreamEvent> {
  yield { type: "step_start", id: "s1", title: "Composing email..." }
  await delay(600)
  yield { type: "step_done", id: "s1", stepStatus: "done", durationMs: 600 }
  await delay(200)
  yield* streamText("Here's the draft email:\n\n")
  await delay(100)
  yield { type: "component_start", id: "c1", name: "email_composer" }
  await delay(50)
  yield {
    type: "component_done",
    id: "c1",
    props: {
      to: "team@acme.com",
      subject: "Q4 Revenue Report — Action Required",
      body: "Hi team,\n\nPlease find the Q4 revenue report. Key highlights:\n\n• Total revenue: $1.92M (+14.3% QoQ)\n• Active users grew to 12,847\n• Average order value increased to $149\n\nWe need to address the slight dip in conversion rate (3.24%, down 0.5%). I'd like to schedule a meeting this week to discuss optimization strategies.\n\nBest regards,\nAI Assistant",
    },
  }
  await delay(150)
  yield* streamText("I've drafted the email. You can copy it or click Send.")
}

// ---------------------------------------------------------------------------
// Stock Dashboard — NVIDIA
// ---------------------------------------------------------------------------

async function* stockResponse(): AsyncIterable<StreamEvent> {
  yield { type: "step_start", id: "s1", title: "Fetching market data..." }
  await delay(600)
  yield { type: "step_done", id: "s1", stepStatus: "done", durationMs: 600 }

  yield { type: "step_start", id: "s2", title: "Analyzing price trends..." }
  await delay(500)
  yield { type: "step_done", id: "s2", stepStatus: "done", durationMs: 500 }

  await delay(200)
  yield* streamText("Here's the latest market data for NVIDIA:\n")
  await delay(100)

  const priceHistory = [
    { date: "Feb 19", price: 115.42 },
    { date: "Feb 20", price: 116.78 },
    { date: "Feb 21", price: 114.93 },
    { date: "Feb 24", price: 117.25 },
    { date: "Feb 25", price: 118.56 },
    { date: "Feb 26", price: 116.34 },
    { date: "Feb 27", price: 119.72 },
    { date: "Feb 28", price: 121.08 },
    { date: "Mar 3", price: 120.45 },
    { date: "Mar 4", price: 118.91 },
    { date: "Mar 5", price: 119.83 },
    { date: "Mar 6", price: 122.14 },
    { date: "Mar 7", price: 123.67 },
    { date: "Mar 10", price: 121.52 },
    { date: "Mar 11", price: 120.18 },
    { date: "Mar 12", price: 122.95 },
    { date: "Mar 13", price: 125.31 },
    { date: "Mar 14", price: 126.88 },
    { date: "Mar 15", price: 124.47 },
    { date: "Mar 16", price: 125.73 },
    { date: "Mar 17", price: 127.92 },
    { date: "Mar 18", price: 126.15 },
    { date: "Mar 19", price: 128.64 },
    { date: "Mar 20", price: 129.38 },
    { date: "Mar 21", price: 127.81 },
    { date: "Mar 24", price: 130.12 },
    { date: "Mar 25", price: 128.95 },
    { date: "Mar 26", price: 131.47 },
    { date: "Mar 27", price: 129.76 },
    { date: "Mar 28", price: 131.28 },
  ]

  yield { type: "component_start", id: "c1", name: "stock_dashboard" }
  await delay(50)
  yield {
    type: "component_done",
    id: "c1",
    props: {
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      price: 131.28,
      change: 3.47,
      changePercent: 2.71,
      priceHistory,
      stats: [
        { label: "Market Cap", value: "$3.21T" },
        { label: "P/E Ratio", value: "54.2" },
        { label: "52-Wk High", value: "$153.13" },
        { label: "52-Wk Low", value: "$66.25" },
        { label: "Volume", value: "287M" },
        { label: "Div Yield", value: "0.03%" },
      ],
      news: [
        { time: "2h ago", title: "NVIDIA announces next-gen Blackwell Ultra GPUs at GTC 2026, targeting AI inference workloads" },
        { time: "5h ago", title: "Wall Street raises NVDA price targets after strong data center revenue guidance" },
        { time: "1d ago", title: "NVIDIA partners with major cloud providers to expand AI-as-a-Service offerings" },
      ],
      fundamentals: [
        { quarter: "Q4 2024", revenue: "$39.3B", earnings: "$0.89", margin: "73.0%" },
        { quarter: "Q3 2024", revenue: "$35.1B", earnings: "$0.78", margin: "74.1%" },
        { quarter: "Q2 2024", revenue: "$30.0B", earnings: "$0.67", margin: "75.3%" },
        { quarter: "Q1 2024", revenue: "$26.0B", earnings: "$0.60", margin: "78.4%" },
      ],
    },
  }

  await delay(150)
  yield* streamText(
    "NVIDIA (NVDA) is trading at **$131.28**, up **+$3.47 (+2.71%)** today. " +
    "The stock has shown a strong upward trend over the past month, recovering from the $115 range to current levels. " +
    "With a market cap of $3.21T and a P/E ratio of 54.2, NVIDIA remains one of the most valuable companies globally, " +
    "driven by continued demand for AI and data center GPUs."
  )
}

// ---------------------------------------------------------------------------
// Code Diff — shows a function refactored from callbacks to async/await
// ---------------------------------------------------------------------------

async function* codeDiffResponse(): AsyncIterable<StreamEvent> {
  yield { type: "step_start", id: "s1", title: "Analyzing code changes..." }
  await delay(500)
  yield { type: "step_done", id: "s1", stepStatus: "done", durationMs: 500 }

  yield { type: "step_start", id: "s2", title: "Computing diff..." }
  await delay(400)
  yield { type: "step_done", id: "s2", stepStatus: "done", durationMs: 400 }

  await delay(200)
  yield* streamText("Here's the proposed refactor — converting callback-based code to async/await:\n\n")
  await delay(100)

  const original = [
    "import { readFile, writeFile } from \"fs\";",
    "",
    "function processData(inputPath: string, outputPath: string) {",
    "  readFile(inputPath, \"utf-8\", (err, data) => {",
    "    if (err) {",
    "      console.error(\"Read failed:\", err);",
    "      return;",
    "    }",
    "",
    "    const parsed = JSON.parse(data);",
    "    const result = parsed.items.map((item: { name: string }) => {",
    "      return item.name.toUpperCase();",
    "    });",
    "",
    "    const output = JSON.stringify(result, null, 2);",
    "",
    "    writeFile(outputPath, output, (writeErr) => {",
    "      if (writeErr) {",
    "        console.error(\"Write failed:\", writeErr);",
    "        return;",
    "      }",
    "      console.log(\"Done! Wrote\", result.length, \"items.\");",
    "    });",
    "  });",
    "}",
  ].join("\n")

  const modified = [
    "import { readFile, writeFile } from \"fs/promises\";",
    "",
    "interface DataItem {",
    "  name: string;",
    "}",
    "",
    "interface DataFile {",
    "  items: DataItem[];",
    "}",
    "",
    "async function processData(inputPath: string, outputPath: string): Promise<void> {",
    "  const data = await readFile(inputPath, \"utf-8\");",
    "  const parsed: DataFile = JSON.parse(data);",
    "",
    "  const result = parsed.items.map((item) => item.name.toUpperCase());",
    "  const output = JSON.stringify(result, null, 2);",
    "",
    "  await writeFile(outputPath, output);",
    "  console.log(\"Done! Wrote\", result.length, \"items.\");",
    "}",
  ].join("\n")

  yield { type: "component_start", id: "c1", name: "show_code_diff" }
  await delay(50)
  yield {
    type: "component_done",
    id: "c1",
    props: {
      filename: "src/utils/process-data.ts",
      language: "TypeScript",
      original,
      modified,
    },
  }

  await delay(150)
  yield* streamText(
    "The refactored version replaces nested callbacks with `async/await`, adds proper TypeScript interfaces, " +
    "and uses the `fs/promises` API for cleaner error handling. " +
    "Click **Accept** to apply or **Reject** to discard."
  )
}

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

async function* defaultResponse(userMessage: string): AsyncIterable<StreamEvent> {
  yield* streamText(
    `I received your message: "${userMessage}"\n\n` +
    "Try asking me about:\n" +
    "**Code diff** — Code diff viewer with accept/reject\n" +
    "**Weather** — Live data from Open-Meteo with city selection\n" +
    "**Charts** or **Revenue** — Recharts bar chart\n" +
    "**Stats** or **Dashboard** — KPI stat cards\n" +
    "**Table** or **Data** — Data table\n" +
    "**Artifact** or **Show HTML** — HTML artifact rendered in iframe\n" +
    "**Code example** — TypeScript code artifact\n" +
    "**Think** — Thinking animation\n" +
    "**Confirm something** — Confirm dialog elicitation\n" +
    "**Multi choice** — Multi-select elicitation\n" +
    "**Ask me** — Text input elicitation\n" +
    "**Permission** — Permission request elicitation\n" +
    "**Email** or **Compose** — Email composer component\n" +
    "**Stock** or **NVIDIA** — Stock dashboard with price chart"
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
