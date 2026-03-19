import { describe, it, expect, vi, beforeEach } from "vitest"
import type { StreamEvent, StreamOptions, FabrikMessage } from "../../core/types"

// ---------------------------------------------------------------------------
// Mock the @anthropic-ai/sdk module
// ---------------------------------------------------------------------------

const mockStream = vi.fn()

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = {
        stream: mockStream,
      }
    },
  }
})

// Import after mock is set up
import { anthropic } from "../anthropic"

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

/** Create a fake async iterable from an array of Anthropic stream events. */
async function* fakeStream(events: any[]): AsyncIterable<any> {
  for (const event of events) {
    yield event
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("anthropic()", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("creates a provider with name 'anthropic'", () => {
    const provider = anthropic({ apiKey: "test-key" })
    expect(provider.name).toBe("anthropic")
  })

  it("uses the default model when none is specified", async () => {
    mockStream.mockReturnValue(fakeStream([{ type: "message_stop" }]))

    const provider = anthropic({ apiKey: "test-key" })
    const events: StreamEvent[] = []
    for await (const e of provider.stream(defaultOpts())) {
      events.push(e)
    }

    expect(mockStream).toHaveBeenCalledWith(
      expect.objectContaining({ model: "claude-sonnet-4-20250514" }),
    )
  })

  it("uses the model from options when provided", async () => {
    mockStream.mockReturnValue(fakeStream([{ type: "message_stop" }]))

    const provider = anthropic({ apiKey: "test-key", model: "claude-opus-4-20250514" })
    const events: StreamEvent[] = []
    for await (const e of provider.stream(defaultOpts())) {
      events.push(e)
    }

    expect(mockStream).toHaveBeenCalledWith(
      expect.objectContaining({ model: "claude-opus-4-20250514" }),
    )
  })

  it("overrides default model with streamOptions.model", async () => {
    mockStream.mockReturnValue(fakeStream([{ type: "message_stop" }]))

    const provider = anthropic({ apiKey: "test-key", model: "claude-opus-4-20250514" })
    const events: StreamEvent[] = []
    for await (const e of provider.stream(defaultOpts({ model: "claude-haiku-4-20250514" }))) {
      events.push(e)
    }

    expect(mockStream).toHaveBeenCalledWith(
      expect.objectContaining({ model: "claude-haiku-4-20250514" }),
    )
  })

  it("emits start and done events for a minimal stream", async () => {
    mockStream.mockReturnValue(fakeStream([{ type: "message_stop" }]))

    const provider = anthropic({ apiKey: "test-key" })
    const events: StreamEvent[] = []
    for await (const e of provider.stream(defaultOpts())) {
      events.push(e)
    }

    expect(events[0]!.type).toBe("start")
    expect(events[0]).toHaveProperty("runId")
    expect(events[events.length - 1]!.type).toBe("done")
  })

  it("maps text content_block_delta to text events", async () => {
    mockStream.mockReturnValue(
      fakeStream([
        {
          type: "content_block_start",
          index: 0,
          content_block: { type: "text", text: "" },
        },
        {
          type: "content_block_delta",
          index: 0,
          delta: { type: "text_delta", text: "Hello " },
        },
        {
          type: "content_block_delta",
          index: 0,
          delta: { type: "text_delta", text: "world!" },
        },
        { type: "content_block_stop", index: 0 },
        { type: "message_stop" },
      ]),
    )

    const provider = anthropic({ apiKey: "test-key" })
    const events: StreamEvent[] = []
    for await (const e of provider.stream(defaultOpts())) {
      events.push(e)
    }

    const textEvents = events.filter((e) => e.type === "text")
    expect(textEvents).toHaveLength(2)
    expect((textEvents[0] as any).delta).toBe("Hello ")
    expect((textEvents[1] as any).delta).toBe("world!")
  })

  it("maps thinking blocks to thinking events with duration", async () => {
    mockStream.mockReturnValue(
      fakeStream([
        {
          type: "content_block_start",
          index: 0,
          content_block: { type: "thinking", thinking: "" },
        },
        {
          type: "content_block_delta",
          index: 0,
          delta: { type: "thinking_delta", thinking: "Let me think..." },
        },
        { type: "content_block_stop", index: 0 },
        { type: "message_stop" },
      ]),
    )

    const provider = anthropic({ apiKey: "test-key" })
    const events: StreamEvent[] = []
    for await (const e of provider.stream(defaultOpts())) {
      events.push(e)
    }

    const thinkingStart = events.find((e) => e.type === "thinking_start")
    const thinkingDelta = events.find((e) => e.type === "thinking_delta")
    const thinkingDone = events.find((e) => e.type === "thinking_done")

    expect(thinkingStart).toBeDefined()
    expect(thinkingStart).toHaveProperty("id")

    expect(thinkingDelta).toBeDefined()
    expect((thinkingDelta as any).delta).toBe("Let me think...")

    expect(thinkingDone).toBeDefined()
    expect((thinkingDone as any).durationMs).toBeGreaterThanOrEqual(0)

    // All thinking events should share the same id
    expect((thinkingStart as any).id).toBe((thinkingDelta as any).id)
    expect((thinkingStart as any).id).toBe((thinkingDone as any).id)
  })

  it("maps tool_use blocks to tool_call events", async () => {
    mockStream.mockReturnValue(
      fakeStream([
        {
          type: "content_block_start",
          index: 0,
          content_block: {
            type: "tool_use",
            id: "tool-call-1",
            name: "get_weather",
          },
        },
        {
          type: "content_block_delta",
          index: 0,
          delta: { type: "input_json_delta", partial_json: '{"city":' },
        },
        {
          type: "content_block_delta",
          index: 0,
          delta: { type: "input_json_delta", partial_json: '"Paris"}' },
        },
        { type: "content_block_stop", index: 0 },
        { type: "message_stop" },
      ]),
    )

    const provider = anthropic({ apiKey: "test-key" })
    const events: StreamEvent[] = []
    for await (const e of provider.stream(defaultOpts())) {
      events.push(e)
    }

    const toolStart = events.find((e) => e.type === "tool_call_start")
    const toolDeltas = events.filter((e) => e.type === "tool_call_delta")

    expect(toolStart).toBeDefined()
    expect((toolStart as any).id).toBe("tool-call-1")
    expect((toolStart as any).toolName).toBe("get_weather")

    expect(toolDeltas).toHaveLength(2)
    expect((toolDeltas[0] as any).delta).toBe('{"city":')
    expect((toolDeltas[1] as any).delta).toBe('"Paris"}')
  })

  it("emits an error event when stream creation throws", async () => {
    mockStream.mockImplementation(() => {
      throw new Error("API key invalid")
    })

    const provider = anthropic({ apiKey: "bad-key" })
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
        type: "content_block_start",
        index: 0,
        content_block: { type: "text", text: "" },
      }
      throw new Error("Connection lost")
    }

    mockStream.mockReturnValue(failingStream())

    const provider = anthropic({ apiKey: "test-key" })
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

  it("passes system prompt via system param, not in messages", async () => {
    mockStream.mockReturnValue(fakeStream([{ type: "message_stop" }]))

    const provider = anthropic({ apiKey: "test-key" })
    for await (const _ of provider.stream(defaultOpts())) {
      // consume
    }

    const callArgs = mockStream.mock.calls[0]![0]
    expect(callArgs.system).toBe("You are helpful")
    // Messages should not contain a system role
    for (const msg of callArgs.messages) {
      expect(msg.role).not.toBe("system")
    }
  })

  it("omits system param when systemPrompt is empty", async () => {
    mockStream.mockReturnValue(fakeStream([{ type: "message_stop" }]))

    const provider = anthropic({ apiKey: "test-key" })
    for await (const _ of provider.stream(defaultOpts({ systemPrompt: "" }))) {
      // consume
    }

    const callArgs = mockStream.mock.calls[0]![0]
    expect(callArgs).not.toHaveProperty("system")
  })

  it("converts FabrikMessage[] to Anthropic format correctly", async () => {
    mockStream.mockReturnValue(fakeStream([{ type: "message_stop" }]))

    const messages: FabrikMessage[] = [
      makeMessage("system", "System instructions"),
      makeMessage("user", "Hi there"),
      makeMessage("assistant", "Hello!"),
      makeMessage("user", "How are you?"),
    ]

    const provider = anthropic({ apiKey: "test-key" })
    for await (const _ of provider.stream(
      defaultOpts({ messages, systemPrompt: "System instructions" }),
    )) {
      // consume
    }

    const callArgs = mockStream.mock.calls[0]![0]
    // System messages should be excluded from messages array
    expect(callArgs.messages).toHaveLength(3)
    expect(callArgs.messages[0]).toEqual({
      role: "user",
      content: "Hi there",
    })
    expect(callArgs.messages[1]).toEqual({
      role: "assistant",
      content: "Hello!",
    })
    expect(callArgs.messages[2]).toEqual({
      role: "user",
      content: "How are you?",
    })
  })

  it("converts ToolSpec[] to Anthropic tool format", async () => {
    mockStream.mockReturnValue(fakeStream([{ type: "message_stop" }]))

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

    const provider = anthropic({ apiKey: "test-key" })
    for await (const _ of provider.stream(defaultOpts({ tools }))) {
      // consume
    }

    const callArgs = mockStream.mock.calls[0]![0]
    expect(callArgs.tools).toEqual([
      {
        name: "get_weather",
        description: "Get current weather",
        input_schema: {
          type: "object",
          properties: { city: { type: "string" } },
          required: ["city"],
        },
      },
      {
        name: "search",
        description: "Search the web",
        input_schema: {
          type: "object",
          properties: { query: { type: "string" } },
        },
      },
    ])
  })

  it("omits tools param when tools array is empty", async () => {
    mockStream.mockReturnValue(fakeStream([{ type: "message_stop" }]))

    const provider = anthropic({ apiKey: "test-key" })
    for await (const _ of provider.stream(defaultOpts({ tools: [] }))) {
      // consume
    }

    const callArgs = mockStream.mock.calls[0]![0]
    expect(callArgs).not.toHaveProperty("tools")
  })

  it("handles multiple content blocks in a single stream", async () => {
    mockStream.mockReturnValue(
      fakeStream([
        // Thinking block
        {
          type: "content_block_start",
          index: 0,
          content_block: { type: "thinking", thinking: "" },
        },
        {
          type: "content_block_delta",
          index: 0,
          delta: { type: "thinking_delta", thinking: "Hmm..." },
        },
        { type: "content_block_stop", index: 0 },
        // Text block
        {
          type: "content_block_start",
          index: 1,
          content_block: { type: "text", text: "" },
        },
        {
          type: "content_block_delta",
          index: 1,
          delta: { type: "text_delta", text: "Here is my answer." },
        },
        { type: "content_block_stop", index: 1 },
        { type: "message_stop" },
      ]),
    )

    const provider = anthropic({ apiKey: "test-key" })
    const events: StreamEvent[] = []
    for await (const e of provider.stream(defaultOpts())) {
      events.push(e)
    }

    const types = events.map((e) => e.type)
    expect(types).toContain("thinking_start")
    expect(types).toContain("thinking_delta")
    expect(types).toContain("thinking_done")
    expect(types).toContain("text")
    expect(types).toContain("done")
  })
})
