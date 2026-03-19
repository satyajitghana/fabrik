import { describe, it, expect, vi, beforeEach } from "vitest"
import type { StreamEvent, StreamOptions, FabrikMessage } from "../../core/types"

// ---------------------------------------------------------------------------
// Mock the @google/genai module
// ---------------------------------------------------------------------------

const mockGenerateContentStream = vi.fn()

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      models = {
        generateContentStream: mockGenerateContentStream,
      }
    },
  }
})

// Import after mock is set up
import { google } from "../google"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

/** Create a fake async iterable from an array of Google stream chunks. */
async function* fakeStream(chunks: any[]): AsyncIterable<any> {
  for (const chunk of chunks) {
    yield chunk
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("google()", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("creates a provider with name 'google'", () => {
    const provider = google({ apiKey: "test-key" })
    expect(provider.name).toBe("google")
  })

  it("uses the default model when none is specified", async () => {
    mockGenerateContentStream.mockResolvedValue(fakeStream([]))

    const provider = google({ apiKey: "test-key" })
    const events: StreamEvent[] = []
    for await (const e of provider.stream(defaultOpts())) {
      events.push(e)
    }

    expect(mockGenerateContentStream).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gemini-2.0-flash" }),
    )
  })

  it("uses the model from options when provided", async () => {
    mockGenerateContentStream.mockResolvedValue(fakeStream([]))

    const provider = google({ apiKey: "test-key", model: "gemini-2.5-pro" })
    const events: StreamEvent[] = []
    for await (const e of provider.stream(defaultOpts())) {
      events.push(e)
    }

    expect(mockGenerateContentStream).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gemini-2.5-pro" }),
    )
  })

  it("overrides default model with streamOptions.model", async () => {
    mockGenerateContentStream.mockResolvedValue(fakeStream([]))

    const provider = google({ apiKey: "test-key", model: "gemini-2.5-pro" })
    const events: StreamEvent[] = []
    for await (const e of provider.stream(
      defaultOpts({ model: "gemini-2.0-flash-lite" }),
    )) {
      events.push(e)
    }

    expect(mockGenerateContentStream).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gemini-2.0-flash-lite" }),
    )
  })

  it("emits start and done events for a minimal stream", async () => {
    mockGenerateContentStream.mockResolvedValue(fakeStream([]))

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
    mockGenerateContentStream.mockResolvedValue(
      fakeStream([
        {
          candidates: [
            {
              content: {
                parts: [{ text: "Hello " }],
              },
            },
          ],
        },
        {
          candidates: [
            {
              content: {
                parts: [{ text: "world!" }],
              },
            },
          ],
        },
      ]),
    )

    const provider = google({ apiKey: "test-key" })
    const events: StreamEvent[] = []
    for await (const e of provider.stream(defaultOpts())) {
      events.push(e)
    }

    const textEvents = events.filter((e) => e.type === "text")
    expect(textEvents).toHaveLength(2)
    expect((textEvents[0] as any).delta).toBe("Hello ")
    expect((textEvents[1] as any).delta).toBe("world!")
  })

  it("maps functionCall to tool_call_start and tool_call_done events", async () => {
    mockGenerateContentStream.mockResolvedValue(
      fakeStream([
        {
          candidates: [
            {
              content: {
                parts: [
                  {
                    functionCall: {
                      name: "get_weather",
                      args: { city: "Paris" },
                    },
                  },
                ],
              },
            },
          ],
        },
      ]),
    )

    const provider = google({ apiKey: "test-key" })
    const events: StreamEvent[] = []
    for await (const e of provider.stream(defaultOpts())) {
      events.push(e)
    }

    const toolStart = events.find((e) => e.type === "tool_call_start")
    const toolDone = events.find((e) => e.type === "tool_call_done")

    expect(toolStart).toBeDefined()
    expect((toolStart as any).toolName).toBe("get_weather")

    expect(toolDone).toBeDefined()
    expect((toolDone as any).toolName).toBe("get_weather")
    expect((toolDone as any).args).toEqual({ city: "Paris" })

    // Both should share the same id
    expect((toolStart as any).id).toBe((toolDone as any).id)
  })

  it("emits an error event when stream creation throws", async () => {
    mockGenerateContentStream.mockRejectedValue(new Error("API key invalid"))

    const provider = google({ apiKey: "bad-key" })
    const events: StreamEvent[] = []
    for await (const e of provider.stream(defaultOpts())) {
      events.push(e)
    }

    const errorEvent = events.find((e) => e.type === "error")
    expect(errorEvent).toBeDefined()
    expect((errorEvent as any).message).toBe("API key invalid")
  })

  it("emits an error event when the stream itself throws", async () => {
    async function* failingStream(): AsyncIterable<any> {
      yield {
        candidates: [
          { content: { parts: [{ text: "Partial" }] } },
        ],
      }
      throw new Error("Connection lost")
    }

    mockGenerateContentStream.mockResolvedValue(failingStream())

    const provider = google({ apiKey: "test-key" })
    const events: StreamEvent[] = []
    for await (const e of provider.stream(defaultOpts())) {
      events.push(e)
    }

    const errorEvent = events.find((e) => e.type === "error")
    expect(errorEvent).toBeDefined()
    expect((errorEvent as any).message).toBe("Connection lost")
    // Should not emit 'done' after an error
    expect(events[events.length - 1]!.type).toBe("error")
  })

  it("passes system prompt via config.systemInstruction", async () => {
    mockGenerateContentStream.mockResolvedValue(fakeStream([]))

    const provider = google({ apiKey: "test-key" })
    for await (const _ of provider.stream(defaultOpts())) {
      // consume
    }

    const callArgs = mockGenerateContentStream.mock.calls[0]![0]
    expect(callArgs.config).toEqual({ systemInstruction: "You are helpful" })
  })

  it("omits systemInstruction when systemPrompt is empty", async () => {
    mockGenerateContentStream.mockResolvedValue(fakeStream([]))

    const provider = google({ apiKey: "test-key" })
    for await (const _ of provider.stream(defaultOpts({ systemPrompt: "" }))) {
      // consume
    }

    const callArgs = mockGenerateContentStream.mock.calls[0]![0]
    expect(callArgs).not.toHaveProperty("config")
  })

  it("converts FabrikMessage[] to Google format correctly", async () => {
    mockGenerateContentStream.mockResolvedValue(fakeStream([]))

    const messages: FabrikMessage[] = [
      makeMessage("system", "System instructions"),
      makeMessage("user", "Hi there"),
      makeMessage("assistant", "Hello!"),
      makeMessage("user", "How are you?"),
    ]

    const provider = google({ apiKey: "test-key" })
    for await (const _ of provider.stream(
      defaultOpts({ messages, systemPrompt: "System instructions" }),
    )) {
      // consume
    }

    const callArgs = mockGenerateContentStream.mock.calls[0]![0]
    // System messages should be excluded from contents array
    expect(callArgs.contents).toHaveLength(3)
    expect(callArgs.contents[0]).toEqual({
      role: "user",
      parts: [{ text: "Hi there" }],
    })
    expect(callArgs.contents[1]).toEqual({
      role: "model",
      parts: [{ text: "Hello!" }],
    })
    expect(callArgs.contents[2]).toEqual({
      role: "user",
      parts: [{ text: "How are you?" }],
    })
  })

  it("converts ToolSpec[] to Google tool format", async () => {
    mockGenerateContentStream.mockResolvedValue(fakeStream([]))

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
      {
        name: "search",
        description: "Search the web",
        parameters: {
          type: "object",
          properties: { query: { type: "string" } },
        },
      },
    ]

    const provider = google({ apiKey: "test-key" })
    for await (const _ of provider.stream(defaultOpts({ tools }))) {
      // consume
    }

    const callArgs = mockGenerateContentStream.mock.calls[0]![0]
    expect(callArgs.tools).toEqual([
      {
        functionDeclarations: [
          {
            name: "get_weather",
            description: "Get current weather",
            parameters: {
              type: "object",
              properties: { city: { type: "string" } },
              required: ["city"],
            },
          },
          {
            name: "search",
            description: "Search the web",
            parameters: {
              type: "object",
              properties: { query: { type: "string" } },
            },
          },
        ],
      },
    ])
  })

  it("omits tools param when tools array is empty", async () => {
    mockGenerateContentStream.mockResolvedValue(fakeStream([]))

    const provider = google({ apiKey: "test-key" })
    for await (const _ of provider.stream(defaultOpts({ tools: [] }))) {
      // consume
    }

    const callArgs = mockGenerateContentStream.mock.calls[0]![0]
    expect(callArgs).not.toHaveProperty("tools")
  })

  it("skips chunks with no candidates", async () => {
    mockGenerateContentStream.mockResolvedValue(
      fakeStream([
        { candidates: [] },
        { candidates: null },
        {
          candidates: [
            { content: { parts: [{ text: "Hello" }] } },
          ],
        },
      ]),
    )

    const provider = google({ apiKey: "test-key" })
    const events: StreamEvent[] = []
    for await (const e of provider.stream(defaultOpts())) {
      events.push(e)
    }

    const textEvents = events.filter((e) => e.type === "text")
    expect(textEvents).toHaveLength(1)
    expect((textEvents[0] as any).delta).toBe("Hello")
  })

  it("handles mixed text and function call parts in a single chunk", async () => {
    mockGenerateContentStream.mockResolvedValue(
      fakeStream([
        {
          candidates: [
            {
              content: {
                parts: [
                  { text: "Let me check that." },
                  {
                    functionCall: {
                      name: "search",
                      args: { query: "weather" },
                    },
                  },
                ],
              },
            },
          ],
        },
      ]),
    )

    const provider = google({ apiKey: "test-key" })
    const events: StreamEvent[] = []
    for await (const e of provider.stream(defaultOpts())) {
      events.push(e)
    }

    const textEvents = events.filter((e) => e.type === "text")
    const toolStartEvents = events.filter((e) => e.type === "tool_call_start")
    const toolDoneEvents = events.filter((e) => e.type === "tool_call_done")

    expect(textEvents).toHaveLength(1)
    expect(toolStartEvents).toHaveLength(1)
    expect(toolDoneEvents).toHaveLength(1)
  })
})
