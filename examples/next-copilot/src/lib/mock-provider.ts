import type { Provider, StreamEvent, StreamOptions, FabrikMessage } from "@fabrik/ui"

/**
 * Copilot-specific mock provider that responds to questions about the document content.
 * Simulates an AI assistant that can summarize, explain code, and answer context-aware questions.
 */
export function createCopilotProvider(): Provider {
  return {
    name: "copilot-mock",
    async *stream(options: StreamOptions): AsyncIterable<StreamEvent> {
      const lastMessage = getLastUserMessage(options.messages)
      const text = lastMessage.toLowerCase()

      await delay(200)

      if (text.includes("summarize") || text.includes("summary") || text.includes("tldr")) {
        yield* summarizeResponse()
      } else if (text.includes("code") || text.includes("snippet") || text.includes("example") || text.includes("useeffect") || text.includes("hook")) {
        yield* codeExplainResponse()
      } else if (text.includes("heading") || text.includes("outline") || text.includes("structure") || text.includes("toc")) {
        yield* outlineResponse()
      } else if (text.includes("improve") || text.includes("suggest") || text.includes("feedback") || text.includes("review")) {
        yield* suggestionsResponse()
      } else if (text.includes("key") || text.includes("takeaway") || text.includes("point") || text.includes("important")) {
        yield* keyTakeawaysResponse()
      } else {
        yield* defaultResponse()
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Summarize
// ---------------------------------------------------------------------------

async function* summarizeResponse(): AsyncIterable<StreamEvent> {
  yield { type: "step_start", id: "s1", title: "Reading document content..." }
  await delay(400)
  yield { type: "step_done", id: "s1", stepStatus: "done", durationMs: 400 }

  yield { type: "step_start", id: "s2", title: "Generating summary..." }
  await delay(600)
  yield { type: "step_done", id: "s2", stepStatus: "done", durationMs: 600 }

  await delay(150)
  yield* streamText(
    "Here's a summary of the document:\n\n" +
    "This article covers **building AI-powered applications** with a focus on practical patterns and architecture. " +
    "The key sections are:\n\n" +
    "1. **Streaming Architecture** — How to handle real-time token delivery from LLMs using async iterators and server-sent events.\n\n" +
    "2. **Component-Driven AI** — The concept of letting the AI decide which UI components to render, moving beyond plain text responses.\n\n" +
    "3. **State Management** — Patterns for managing conversation state, optimistic updates, and reconciliation with server state.\n\n" +
    "The article argues that the best AI interfaces blur the line between chat and traditional UI, " +
    "letting the model orchestrate rich, interactive experiences rather than just generating text."
  )
}

// ---------------------------------------------------------------------------
// Code Explanation
// ---------------------------------------------------------------------------

async function* codeExplainResponse(): AsyncIterable<StreamEvent> {
  yield { type: "step_start", id: "s1", title: "Analyzing code blocks..." }
  await delay(500)
  yield { type: "step_done", id: "s1", stepStatus: "done", durationMs: 500 }

  await delay(150)
  yield* streamText(
    "The document contains a code example showing a **custom React hook** for streaming AI responses. Let me break it down:\n\n" +
    "**`useStream` hook:**\n" +
    "- Uses `useRef` to hold an `AbortController` so the stream can be cancelled\n" +
    "- Calls an async generator function that yields `StreamEvent` objects\n" +
    "- Each event updates the local state via `useReducer` — this keeps re-renders minimal\n" +
    "- The `text` event type appends deltas to the current message\n" +
    "- The `component_done` event renders a registered React component with validated props\n\n" +
    "**Why async generators?**\n" +
    "The `async function*` pattern is ideal here because it naturally models a sequence of values arriving over time. " +
    "Each `yield` pushes one event, and the consumer processes them one by one. " +
    "This is simpler than managing callback chains or complex observable patterns.\n\n" +
    "The `for await...of` loop on the consumer side handles backpressure automatically."
  )
}

// ---------------------------------------------------------------------------
// Outline / Structure
// ---------------------------------------------------------------------------

async function* outlineResponse(): AsyncIterable<StreamEvent> {
  yield { type: "step_start", id: "s1", title: "Parsing document structure..." }
  await delay(350)
  yield { type: "step_done", id: "s1", stepStatus: "done", durationMs: 350 }

  await delay(150)
  yield* streamText(
    "Here's the document outline:\n\n" +
    "**Building with AI: Patterns for the Next Generation of Interfaces**\n\n" +
    "1. Introduction\n" +
    "2. The Streaming Paradigm\n" +
    "   - Server-Sent Events vs WebSockets\n" +
    "   - Async Iterators in Practice\n" +
    "3. Beyond Text: Component-Driven AI\n" +
    "   - Defining a Component Registry\n" +
    "   - Schema Validation with Zod\n" +
    "   - Rendering Pipeline\n" +
    "4. State Management Patterns\n" +
    "   - Optimistic Updates\n" +
    "   - Reconciliation\n" +
    "   - Error Boundaries\n" +
    "5. Putting It Together (Code Example)\n" +
    "6. Conclusion\n\n" +
    "The document is well-structured with a logical progression from concepts to implementation."
  )
}

// ---------------------------------------------------------------------------
// Suggestions / Review
// ---------------------------------------------------------------------------

async function* suggestionsResponse(): AsyncIterable<StreamEvent> {
  yield { type: "step_start", id: "s1", title: "Reviewing document..." }
  await delay(500)
  yield { type: "step_done", id: "s1", stepStatus: "done", durationMs: 500 }

  yield { type: "step_start", id: "s2", title: "Generating suggestions..." }
  await delay(400)
  yield { type: "step_done", id: "s2", stepStatus: "done", durationMs: 400 }

  await delay(150)
  yield* streamText(
    "Here are some suggestions to improve the document:\n\n" +
    "**Content:**\n" +
    "- The introduction could include a brief mention of the target audience (frontend devs familiar with React)\n" +
    "- Consider adding a \"Prerequisites\" section listing required knowledge\n" +
    "- The code example in Section 5 would benefit from inline comments explaining each step\n\n" +
    "**Structure:**\n" +
    "- Section 2 and 3 could be reordered — introducing the component concept first gives context for why streaming matters\n" +
    "- A diagram showing the data flow (LLM -> Stream -> Reducer -> UI) would greatly help comprehension\n\n" +
    "**Style:**\n" +
    "- Some paragraphs run long — consider breaking the paragraph in Section 4 about reconciliation into two\n" +
    "- The tone shifts between casual and technical; picking one voice would improve consistency\n" +
    "- Add alt text to the code blocks for accessibility"
  )
}

// ---------------------------------------------------------------------------
// Key Takeaways
// ---------------------------------------------------------------------------

async function* keyTakeawaysResponse(): AsyncIterable<StreamEvent> {
  yield { type: "step_start", id: "s1", title: "Extracting key points..." }
  await delay(450)
  yield { type: "step_done", id: "s1", stepStatus: "done", durationMs: 450 }

  await delay(150)
  yield* streamText(
    "Here are the key takeaways from this document:\n\n" +
    "**1. AI interfaces should be generative, not templated**\n" +
    "Instead of hardcoding every possible UI state, let the model decide which components to render based on context.\n\n" +
    "**2. Streaming is essential for perceived performance**\n" +
    "Users expect immediate feedback. Token-by-token streaming with progressive UI rendering creates a responsive feel even when generation takes seconds.\n\n" +
    "**3. Type safety bridges the AI-UI gap**\n" +
    "Using Zod schemas to validate component props before rendering prevents runtime errors from malformed model outputs.\n\n" +
    "**4. Async iterators are the right abstraction**\n" +
    "They naturally model the stream-of-events pattern, support backpressure, and compose cleanly with React's rendering model.\n\n" +
    "**5. State management needs special care**\n" +
    "AI conversations introduce unique challenges: messages can be modified mid-stream, components can arrive out of order, and errors need graceful degradation."
  )
}

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

async function* defaultResponse(): AsyncIterable<StreamEvent> {
  yield* streamText(
    "I'm your document copilot. I can help you understand and work with the article content.\n\n" +
    "Try asking me:\n\n" +
    "- **\"Summarize this\"** — Get a concise overview of the document\n" +
    "- **\"Explain the code\"** — Break down the code examples\n" +
    "- **\"Show the outline\"** — See the document structure\n" +
    "- **\"Suggest improvements\"** — Get feedback on the writing\n" +
    "- **\"Key takeaways\"** — Extract the most important points"
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function* streamText(text: string): AsyncIterable<StreamEvent> {
  const words = text.split(" ")
  for (let i = 0; i < words.length; i++) {
    yield { type: "text", delta: (i === 0 ? "" : " ") + words[i]! }
    await delay(20)
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
