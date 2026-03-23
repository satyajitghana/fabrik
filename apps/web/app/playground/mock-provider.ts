import type { Provider, StreamEvent, StreamOptions, FabrikMessage } from "@fabrik-sdk/ui"

export function createPlaygroundProvider(): Provider {
  return {
    name: "playground",
    async *stream(options: StreamOptions): AsyncIterable<StreamEvent> {
      const text = getLastUserMessage(options.messages).toLowerCase()
      await delay(200)

      if (text.includes("weather")) {
        yield { type: "step_start", id: "s1", title: "Fetching weather..." }
        await delay(500)
        yield { type: "step_done", id: "s1", stepStatus: "done", durationMs: 500 }
        yield { type: "component_start", id: "c1", name: "weather_card" }
        yield { type: "component_done", id: "c1", props: { city: "San Francisco", temp: 72, condition: "sunny", humidity: 55 } }
        await delay(100)
        yield* streamWords("Here's the weather! Try asking for a **chart** or **dashboard** next.")
      } else if (text.includes("chart") || text.includes("revenue")) {
        yield { type: "step_start", id: "s1", title: "Loading chart data..." }
        await delay(400)
        yield { type: "step_done", id: "s1", stepStatus: "done", durationMs: 400 }
        yield { type: "component_start", id: "c1", name: "bar_chart" }
        yield { type: "component_done", id: "c1", props: { title: "Revenue", data: [{ label: "Q1", value: 1200000 }, { label: "Q2", value: 1500000 }, { label: "Q3", value: 1700000 }, { label: "Q4", value: 1900000 }] } }
        await delay(100)
        yield* streamWords("Revenue is trending up! Try **weather** or **dashboard**.")
      } else if (text.includes("dashboard") || text.includes("stat")) {
        yield { type: "step_start", id: "s1", title: "Computing metrics..." }
        await delay(400)
        yield { type: "step_done", id: "s1", stepStatus: "done", durationMs: 400 }
        yield { type: "component_start", id: "c1", name: "stats_grid" }
        yield { type: "component_done", id: "c1", props: { stats: [{ label: "Revenue", value: "$1.9M", change: "+14%", changeType: "increase" }, { label: "Users", value: "12.8K", change: "+8%", changeType: "increase" }], columns: 2 } }
        await delay(100)
        yield* streamWords("Dashboard metrics loaded!")
      } else {
        yield* streamWords("Welcome to the Fabrik UI playground! Try:\n**weather** — renders a live weather card\n**chart** — shows a revenue bar chart\n**dashboard** — displays KPI stats")
      }
    },
  }
}

async function* streamWords(text: string): AsyncIterable<StreamEvent> {
  for (const word of text.split(" ")) {
    yield { type: "text", delta: word + " " }
    await delay(20)
  }
}

function delay(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)) }

function getLastUserMessage(messages: FabrikMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]!
    if (msg.role === "user") return msg.parts.filter(p => p.type === "text").map(p => 'text' in p ? (p as { text: string }).text : '').join(" ")
  }
  return ""
}
