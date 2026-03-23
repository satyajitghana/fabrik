import type { Provider, StreamEvent, StreamOptions, FabrikMessage } from "@fabrik-sdk/ui"

/**
 * Mock provider that simulates an LLM for the pages demo.
 * Detects the route from the system prompt and yields the appropriate component events.
 */
export function createMockProvider(): Provider {
  return {
    name: "mock",
    async *stream(options: StreamOptions): AsyncIterable<StreamEvent> {
      const prompt = (options.systemPrompt ?? "").toLowerCase()

      await delay(200)

      if (prompt.includes("settings") && prompt.includes("toggle")) {
        yield* settingsResponse()
      } else if (prompt.includes("about") && prompt.includes("company")) {
        yield* aboutResponse()
      } else if (prompt.includes("dashboard") || prompt.includes("metrics")) {
        yield* dashboardResponse()
      } else {
        // Fallback: try to detect from user message
        const lastMessage = getLastUserMessage(options.messages)
        const text = lastMessage.toLowerCase()

        if (text.includes("setting")) {
          yield* settingsResponse()
        } else if (text.includes("about")) {
          yield* aboutResponse()
        } else {
          yield* dashboardResponse()
        }
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Dashboard — stats_grid component
// ---------------------------------------------------------------------------

async function* dashboardResponse(): AsyncIterable<StreamEvent> {
  yield { type: "step_start", id: "s1", title: "Loading dashboard metrics..." }
  await delay(500)
  yield { type: "step_done", id: "s1", stepStatus: "done", durationMs: 500 }

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
}

// ---------------------------------------------------------------------------
// About — info_section component
// ---------------------------------------------------------------------------

async function* aboutResponse(): AsyncIterable<StreamEvent> {
  yield { type: "step_start", id: "s1", title: "Loading company info..." }
  await delay(400)
  yield { type: "step_done", id: "s1", stepStatus: "done", durationMs: 400 }

  yield { type: "component_start", id: "c1", name: "info_section" }
  await delay(50)
  yield {
    type: "component_done",
    id: "c1",
    props: {
      title: "About Fabrik",
      content:
        "Fabrik is a generative UI SDK that lets you build AI-powered interfaces with any LLM. " +
        "Ship production-ready chat, copilot, and page experiences in minutes — not weeks. " +
        "Built with React 19, TypeScript, and a best-in-class component library.",
    },
  }
}

// ---------------------------------------------------------------------------
// Settings — settings_panel component
// ---------------------------------------------------------------------------

async function* settingsResponse(): AsyncIterable<StreamEvent> {
  yield { type: "step_start", id: "s1", title: "Loading settings..." }
  await delay(400)
  yield { type: "step_done", id: "s1", stepStatus: "done", durationMs: 400 }

  yield { type: "component_start", id: "c1", name: "settings_panel" }
  await delay(50)
  yield {
    type: "component_done",
    id: "c1",
    props: {
      settings: [
        { label: "Dark Mode", description: "Use dark theme across the app", enabled: false },
        { label: "Notifications", description: "Receive push notifications for updates", enabled: true },
        { label: "Analytics", description: "Share anonymous usage data to improve the product", enabled: true },
        { label: "Beta Features", description: "Enable experimental features before stable release", enabled: false },
      ],
    },
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
