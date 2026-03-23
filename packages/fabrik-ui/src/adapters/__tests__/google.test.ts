import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import type { StreamEvent, StreamOptions, FabrikMessage } from "../../core/types"
import { google } from "../google"

// ---------------------------------------------------------------------------
// Mock fetch — the Google adapter uses raw REST API
// ---------------------------------------------------------------------------

const originalFetch = globalThis.fetch

function makeMessage(
  role: "user" | "assistant" | "system",
  text: string,
): FabrikMessage {
  return {
    id: "msg-1",
    role,
    parts: [{ type: "text", text }],
    createdAt: new Date().toISOString(),
  }
}

function defaultOpts(overrides: Partial<StreamOptions> = {}): StreamOptions {
  return {
    messages: [makeMessage("user", "Hello")],
    systemPrompt: "You are helpful",
    tools: [],
    ...overrides,
  }
}

/** Create a mock SSE response from Google-format chunks */
function mockSSE(chunks: Record<string, unknown>[]): string {
  return chunks.map(c => `data: ${JSON.stringify(c)}\r\n\r\n`).join("")
}

function mockFetchResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/event-stream" },
  })
}

let fetchSpy: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchSpy = vi.fn()
  globalThis.fetch = fetchSpy
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("google()", () => {
  it("creates a provider with name 'google'", () => {
    const provider = google({ apiKey: "test-key" })
    expect(provider.name).toBe("google")
  })

  it("uses the default model in the URL", async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse(mockSSE([])))

    const provider = google({ apiKey: "test-key" })
    for await (const _ of provider.stream(defaultOpts())) { /* consume */ }

    const url = fetchSpy.mock.calls[0][0] as string
    expect(url).toContain("gemini-2.0-flash")
  })

  it("uses the model from options", async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse(mockSSE([])))

    const provider = google({ apiKey: "test-key", model: "gemini-3-flash-preview" })
    for await (const _ of provider.stream(defaultOpts())) { /* consume */ }

    const url = fetchSpy.mock.calls[0][0] as string
    expect(url).toContain("gemini-3-flash-preview")
  })

  it("overrides default model with streamOptions.model", async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse(mockSSE([])))

    const provider = google({ apiKey: "test-key", model: "gemini-3-flash-preview" })
    for await (const _ of provider.stream(defaultOpts({ model: "gemini-2.0-flash-lite" }))) { /* consume */ }

    const url = fetchSpy.mock.calls[0][0] as string
    expect(url).toContain("gemini-2.0-flash-lite")
  })

  it("emits start and done events for a minimal stream", async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse(mockSSE([])))

    const provider = google({ apiKey: "test-key" })
    const events: StreamEvent[] = []
    for await (const e of provider.stream(defaultOpts())) {
      events.push(e)
    }

    expect(events[0]!.type).toBe("start")
    expect(events[0]).toHaveProperty("runId")
    expect(events[events.length - 1]!.type).toBe("done")
  })

  it("maps text chunks to text events", async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse(mockSSE([
      { candidates: [{ content: { parts: [{ text: "Hello " }] } }] },
      { candidates: [{ content: { parts: [{ text: "world!" }] } }] },
    ])))

    const provider = google({ apiKey: "test-key" })
    const events: StreamEvent[] = []
    for await (const e of provider.stream(defaultOpts())) {
      events.push(e)
    }

    const textEvents = events.filter(e => e.type === "text")
    expect(textEvents).toHaveLength(2)
    expect((textEvents[0] as { delta: string }).delta).toBe("Hello ")
    expect((textEvents[1] as { delta: string }).delta).toBe("world!")
  })

  it("maps functionCall to tool_call_start and tool_call_done events", async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse(mockSSE([
      { candidates: [{ content: { parts: [{ functionCall: { name: "get_weather", args: { city: "Paris" }, id: "call-1" } }] } }] },
    ])))

    const provider = google({ apiKey: "test-key" })
    const events: StreamEvent[] = []
    for await (const e of provider.stream(defaultOpts())) {
      events.push(e)
    }

    const toolStart = events.find(e => e.type === "tool_call_start") as { id: string; toolName: string }
    const toolDone = events.find(e => e.type === "tool_call_done") as { id: string; toolName: string; args: Record<string, unknown> }

    expect(toolStart).toBeDefined()
    expect(toolStart.toolName).toBe("get_weather")
    expect(toolDone).toBeDefined()
    expect(toolDone.toolName).toBe("get_weather")
    expect(toolDone.args).toEqual({ city: "Paris" })
    expect(toolStart.id).toBe(toolDone.id)
  })

  it("emits an error event when fetch fails", async () => {
    fetchSpy.mockRejectedValue(new Error("Network error"))

    const provider = google({ apiKey: "test-key" })
    const events: StreamEvent[] = []
    for await (const e of provider.stream(defaultOpts())) {
      events.push(e)
    }

    const errorEvent = events.find(e => e.type === "error") as { message: string }
    expect(errorEvent).toBeDefined()
    expect(errorEvent.message).toBe("Network error")
  })

  it("emits an error event for non-200 responses", async () => {
    fetchSpy.mockResolvedValue(new Response(
      JSON.stringify({ error: { message: "Invalid API key" } }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    ))

    const provider = google({ apiKey: "bad-key" })
    const events: StreamEvent[] = []
    for await (const e of provider.stream(defaultOpts())) {
      events.push(e)
    }

    const errorEvent = events.find(e => e.type === "error") as { message: string }
    expect(errorEvent).toBeDefined()
    expect(errorEvent.message).toContain("Invalid API key")
  })

  it("passes system prompt via systemInstruction", async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse(mockSSE([])))

    const provider = google({ apiKey: "test-key" })
    for await (const _ of provider.stream(defaultOpts())) { /* consume */ }

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string)
    expect(body.systemInstruction).toEqual({ parts: [{ text: "You are helpful" }] })
  })

  it("omits systemInstruction when systemPrompt is empty", async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse(mockSSE([])))

    const provider = google({ apiKey: "test-key" })
    for await (const _ of provider.stream(defaultOpts({ systemPrompt: "" }))) { /* consume */ }

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string)
    expect(body).not.toHaveProperty("systemInstruction")
  })

  it("converts FabrikMessage[] to Google format correctly", async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse(mockSSE([])))

    const messages: FabrikMessage[] = [
      makeMessage("system", "System instructions"),
      makeMessage("user", "Hi there"),
      makeMessage("assistant", "Hello!"),
      makeMessage("user", "How are you?"),
    ]

    const provider = google({ apiKey: "test-key" })
    for await (const _ of provider.stream(defaultOpts({ messages }))) { /* consume */ }

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string)
    expect(body.contents).toHaveLength(3)
    expect(body.contents[0]).toEqual({ role: "user", parts: [{ text: "Hi there" }] })
    expect(body.contents[1]).toEqual({ role: "model", parts: [{ text: "Hello!" }] })
    expect(body.contents[2]).toEqual({ role: "user", parts: [{ text: "How are you?" }] })
  })

  it("converts ToolSpec[] to Google tool format with uppercase types", async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse(mockSSE([])))

    const tools = [
      {
        name: "get_weather",
        description: "Get current weather",
        parameters: {
          type: "object",
          properties: { city: { type: "string" } },
          required: ["city"],
        },
      },
    ]

    const provider = google({ apiKey: "test-key" })
    for await (const _ of provider.stream(defaultOpts({ tools }))) { /* consume */ }

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string)
    expect(body.tools[0].functionDeclarations[0].name).toBe("get_weather")
    expect(body.tools[0].functionDeclarations[0].parameters.type).toBe("OBJECT")
    expect(body.tools[0].functionDeclarations[0].parameters.properties.city.type).toBe("STRING")
    expect(body.toolConfig).toEqual({ functionCallingConfig: { mode: "AUTO" } })
  })

  it("omits tools when tools array is empty", async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse(mockSSE([])))

    const provider = google({ apiKey: "test-key" })
    for await (const _ of provider.stream(defaultOpts({ tools: [] }))) { /* consume */ }

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string)
    expect(body).not.toHaveProperty("tools")
    expect(body).not.toHaveProperty("toolConfig")
  })

  it("skips chunks with no candidates", async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse(mockSSE([
      { candidates: [] },
      { candidates: [{ content: { parts: [{ text: "Hello" }] } }] },
    ])))

    const provider = google({ apiKey: "test-key" })
    const events: StreamEvent[] = []
    for await (const e of provider.stream(defaultOpts())) {
      events.push(e)
    }

    const textEvents = events.filter(e => e.type === "text")
    expect(textEvents).toHaveLength(1)
    expect((textEvents[0] as { delta: string }).delta).toBe("Hello")
  })

  it("handles mixed text and function call parts in a single chunk", async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse(mockSSE([
      { candidates: [{ content: { parts: [
        { text: "Let me check that." },
        { functionCall: { name: "search", args: { query: "weather" }, id: "c1" } },
      ] } }] },
    ])))

    const provider = google({ apiKey: "test-key" })
    const events: StreamEvent[] = []
    for await (const e of provider.stream(defaultOpts())) {
      events.push(e)
    }

    expect(events.filter(e => e.type === "text")).toHaveLength(1)
    expect(events.filter(e => e.type === "tool_call_start")).toHaveLength(1)
    expect(events.filter(e => e.type === "tool_call_done")).toHaveLength(1)
  })
})
