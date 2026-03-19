import { describe, it, expect } from "vitest"
import { createInitialState, reduce } from "../reducer"
import type { StreamEvent } from "../types"

describe("reducer", () => {
  it("creates initial state with a thread", () => {
    const state = createInitialState("thread-1")
    expect(state.currentThreadId).toBe("thread-1")
    expect(state.threads["thread-1"]).toBeDefined()
    expect(state.threads["thread-1"]!.messages).toEqual([])
    expect(state.threads["thread-1"]!.status).toBe("idle")
  })

  it("adds a user message", () => {
    let state = createInitialState("t1")
    state = reduce(state, {
      type: "ADD_USER_MESSAGE",
      threadId: "t1",
      text: "Hello world",
    })

    const thread = state.threads["t1"]!
    expect(thread.messages).toHaveLength(1)
    expect(thread.messages[0]!.role).toBe("user")
    expect(thread.messages[0]!.parts[0]!.type).toBe("text")
    expect((thread.messages[0]!.parts[0] as any).text).toBe("Hello world")
  })

  it("processes stream start event", () => {
    let state = createInitialState("t1")
    state = reduce(state, {
      type: "STREAM_EVENT",
      threadId: "t1",
      event: { type: "start", runId: "run-1" },
    })

    expect(state.streaming.isActive).toBe(true)
    expect(state.threads["t1"]!.status).toBe("streaming")
    expect(state.threads["t1"]!.messages).toHaveLength(1)
    expect(state.threads["t1"]!.messages[0]!.role).toBe("assistant")
  })

  it("accumulates text deltas", () => {
    let state = createInitialState("t1")
    state = reduce(state, {
      type: "STREAM_EVENT",
      threadId: "t1",
      event: { type: "start", runId: "r1" },
    })
    state = reduce(state, {
      type: "STREAM_EVENT",
      threadId: "t1",
      event: { type: "text", delta: "Hello " },
    })
    state = reduce(state, {
      type: "STREAM_EVENT",
      threadId: "t1",
      event: { type: "text", delta: "world!" },
    })

    const msg = state.threads["t1"]!.messages[0]!
    expect(msg.parts).toHaveLength(1)
    expect(msg.parts[0]!.type).toBe("text")
    expect((msg.parts[0] as any).text).toBe("Hello world!")
  })

  it("handles component lifecycle", () => {
    let state = createInitialState("t1")
    state = reduce(state, {
      type: "STREAM_EVENT",
      threadId: "t1",
      event: { type: "start", runId: "r1" },
    })
    state = reduce(state, {
      type: "STREAM_EVENT",
      threadId: "t1",
      event: { type: "component_start", id: "c1", name: "weather_card" },
    })

    let msg = state.threads["t1"]!.messages[0]!
    expect(msg.parts).toHaveLength(1)
    expect(msg.parts[0]!.type).toBe("component")
    expect((msg.parts[0] as any).status).toBe("pending")

    state = reduce(state, {
      type: "STREAM_EVENT",
      threadId: "t1",
      event: { type: "component_done", id: "c1", props: { city: "SF", temp: 68 } },
    })

    msg = state.threads["t1"]!.messages[0]!
    expect((msg.parts[0] as any).status).toBe("done")
    expect((msg.parts[0] as any).props.city).toBe("SF")
  })

  it("handles thinking lifecycle", () => {
    let state = createInitialState("t1")
    state = reduce(state, {
      type: "STREAM_EVENT",
      threadId: "t1",
      event: { type: "start", runId: "r1" },
    })
    state = reduce(state, {
      type: "STREAM_EVENT",
      threadId: "t1",
      event: { type: "thinking_start", id: "th1" },
    })
    state = reduce(state, {
      type: "STREAM_EVENT",
      threadId: "t1",
      event: { type: "thinking_delta", id: "th1", delta: "Analyzing..." },
    })
    state = reduce(state, {
      type: "STREAM_EVENT",
      threadId: "t1",
      event: { type: "thinking_done", id: "th1", durationMs: 1500 },
    })

    const msg = state.threads["t1"]!.messages[0]!
    expect(msg.parts).toHaveLength(1)
    expect(msg.parts[0]!.type).toBe("thinking")
    expect((msg.parts[0] as any).text).toBe("Analyzing...")
    expect((msg.parts[0] as any).durationMs).toBe(1500)
    expect((msg.parts[0] as any).status).toBe("done")
  })

  it("handles step lifecycle", () => {
    let state = createInitialState("t1")
    state = reduce(state, {
      type: "STREAM_EVENT",
      threadId: "t1",
      event: { type: "start", runId: "r1" },
    })
    state = reduce(state, {
      type: "STREAM_EVENT",
      threadId: "t1",
      event: { type: "step_start", id: "s1", title: "Fetching data..." },
    })
    state = reduce(state, {
      type: "STREAM_EVENT",
      threadId: "t1",
      event: { type: "step_done", id: "s1", stepStatus: "done", durationMs: 800 },
    })

    const msg = state.threads["t1"]!.messages[0]!
    expect(msg.parts).toHaveLength(1)
    expect(msg.parts[0]!.type).toBe("step")
    expect((msg.parts[0] as any).title).toBe("Fetching data...")
    expect((msg.parts[0] as any).stepStatus).toBe("done")
    expect((msg.parts[0] as any).durationMs).toBe(800)
  })

  it("handles done event", () => {
    let state = createInitialState("t1")
    state = reduce(state, {
      type: "STREAM_EVENT",
      threadId: "t1",
      event: { type: "start", runId: "r1" },
    })
    state = reduce(state, {
      type: "STREAM_EVENT",
      threadId: "t1",
      event: { type: "done" },
    })

    expect(state.streaming.isActive).toBe(false)
    expect(state.threads["t1"]!.status).toBe("idle")
  })

  it("handles error event", () => {
    let state = createInitialState("t1")
    state = reduce(state, {
      type: "STREAM_EVENT",
      threadId: "t1",
      event: { type: "start", runId: "r1" },
    })
    state = reduce(state, {
      type: "STREAM_EVENT",
      threadId: "t1",
      event: { type: "error", message: "Something went wrong" },
    })

    expect(state.streaming.isActive).toBe(false)
    expect(state.threads["t1"]!.status).toBe("error")
  })

  it("manages input state", () => {
    let state = createInitialState("t1")
    state = reduce(state, { type: "SET_INPUT", value: "Hello" })
    expect(state.input.value).toBe("Hello")

    state = reduce(state, { type: "SET_INPUT", value: "" })
    expect(state.input.value).toBe("")
  })

  it("manages threads", () => {
    let state = createInitialState("t1")
    state = reduce(state, { type: "INIT_THREAD", threadId: "t2" })
    expect(state.threads["t2"]).toBeDefined()
    expect(state.currentThreadId).toBe("t2")

    state = reduce(state, { type: "SET_CURRENT_THREAD", threadId: "t1" })
    expect(state.currentThreadId).toBe("t1")

    state = reduce(state, { type: "DELETE_THREAD", threadId: "t2" })
    expect(state.threads["t2"]).toBeUndefined()
  })
})
