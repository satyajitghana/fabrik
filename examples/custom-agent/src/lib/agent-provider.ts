import { custom } from "@fabrik/ui/custom"
import type { StreamEvent } from "@fabrik/ui"

/**
 * A custom agent provider that simulates a multi-step reasoning process,
 * similar to what you'd build with LangChain, CrewAI, or any agent framework.
 *
 * The agent follows a plan → search → analyze → respond pattern, emitting
 * step events so the UI can show progress to the user.
 */
export const agentProvider = custom({
  name: "custom-agent",
  stream: async function* (options): AsyncIterable<StreamEvent> {
    const runId = Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
    const lastMessage = options.messages[options.messages.length - 1]
    const userText = lastMessage?.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as { type: "text"; text: string }).text)
      .join("")

    yield { type: "start", runId }

    // Step 1: Planning
    const s1 = "s1-" + runId
    yield { type: "step_start", id: s1, title: "Planning response strategy..." }
    await delay(800)
    yield { type: "step_done", id: s1, stepStatus: "done", durationMs: 800 }

    // Step 2: Searching knowledge base
    const s2 = "s2-" + runId
    yield { type: "step_start", id: s2, title: "Searching knowledge base..." }
    await delay(1200)
    yield { type: "step_done", id: s2, stepStatus: "done", durationMs: 1200 }

    // Step 3: Analyzing results
    const s3 = "s3-" + runId
    yield { type: "step_start", id: s3, title: "Analyzing search results..." }
    await delay(900)
    yield { type: "step_done", id: s3, stepStatus: "done", durationMs: 900 }

    // Step 4: Generating response
    const s4 = "s4-" + runId
    yield { type: "step_start", id: s4, title: "Composing final answer..." }
    await delay(400)
    yield { type: "step_done", id: s4, stepStatus: "done", durationMs: 400 }

    // Stream the text response word-by-word
    const response = generateResponse(userText)
    const words = response.split(" ")
    for (const word of words) {
      yield { type: "text", delta: word + " " }
      await delay(30 + Math.random() * 40)
    }

    yield { type: "done" }
  },
})

function generateResponse(userText: string): string {
  const lower = userText.toLowerCase()

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hello! I'm a custom multi-step agent built with fabrik-ui. I plan my responses by searching a knowledge base, analyzing what I find, and composing a thoughtful answer. Ask me anything and watch the reasoning steps appear in real-time."
  }

  if (lower.includes("weather")) {
    return "After searching my knowledge base, I found that providing real-time weather requires an external API integration. However, as a demonstration of the custom agent pattern, I can tell you that this multi-step process could easily be extended to call a weather API during the 'search' step, parse the results during 'analysis', and present a formatted forecast here."
  }

  if (lower.includes("how") && lower.includes("work")) {
    return "Great question! This agent works in four steps: First, I plan my response strategy based on your query. Then, I search a simulated knowledge base for relevant information. Next, I analyze the search results to extract the most useful details. Finally, I compose this response and stream it to you word-by-word. Each step emits events that fabrik-ui renders as progress indicators in the chat."
  }

  if (lower.includes("langchain") || lower.includes("agent")) {
    return "This example demonstrates how you'd integrate any agent framework with fabrik-ui. The custom() adapter accepts an async generator that yields StreamEvents. In a real application, you'd replace the simulated delays with actual LangChain chains, tool calls, or any async agent logic. The step events let you surface intermediate reasoning to the user, making the agent's thought process transparent."
  }

  return `I processed your message through my four-stage pipeline: planning, searching, analyzing, and composing. Here's what I found relevant to "${userText}": This is a simulated response from the custom agent provider. In a production setup, each step would perform real work — calling APIs, querying databases, or running inference — and the fabrik-ui stream events would keep the user informed throughout the process.`
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
