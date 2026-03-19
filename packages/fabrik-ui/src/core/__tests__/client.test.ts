import { describe, it, expect, vi, beforeEach } from "vitest"
import { FabrikClient } from "../client"
import type { Provider, StreamEvent } from "../types"

/**
 * Creates a minimal mock provider that yields a start event followed by
 * a text delta and a done event.
 */
function mockProvider(text = "Hello"): Provider {
  return {
    name: "mock",
    async *stream() {
      yield { type: "start", runId: "run-1" } as StreamEvent
      yield { type: "text", delta: text } as StreamEvent
      yield { type: "done" } as StreamEvent
    },
  }
}

describe("FabrikClient", () => {
  it("creates initial state with a thread", () => {
    const client = new FabrikClient({ provider: mockProvider() })
    const state = client.getState()

    expect(state.currentThreadId).toBeDefined()
    expect(state.threads[state.currentThreadId]).toBeDefined()
    expect(state.threads[state.currentThreadId]!.messages).toEqual([])
    expect(state.threads[state.currentThreadId]!.status).toBe("idle")
    expect(state.input).toEqual({ value: "", files: [] })
    expect(state.streaming.isActive).toBe(false)
  })

  it("subscribe() and getState() work for state observation", async () => {
    const client = new FabrikClient({ provider: mockProvider() })
    const listener = vi.fn()

    const unsub = client.subscribe(listener)
    client.actions.setInput("test")

    // Listener is called via queueMicrotask, so wait a tick
    await Promise.resolve()
    await Promise.resolve()
    expect(listener).toHaveBeenCalled()

    expect(client.getState().input.value).toBe("test")
    unsub()

    // After unsubscribe, listener should not be called again
    listener.mockClear()
    client.actions.setInput("again")
    await Promise.resolve()
    await Promise.resolve()
    expect(listener).not.toHaveBeenCalled()
  })

  it("actions.newThread creates a new thread and switches to it", () => {
    const client = new FabrikClient({ provider: mockProvider() })
    const originalId = client.getState().currentThreadId

    const newId = client.actions.newThread()

    expect(newId).not.toBe(originalId)
    expect(client.getState().currentThreadId).toBe(newId)
    expect(client.getState().threads[newId]).toBeDefined()
    expect(client.getState().threads[newId]!.messages).toEqual([])
  })

  it("actions.switchThread changes the current thread id", () => {
    const client = new FabrikClient({ provider: mockProvider() })
    const firstId = client.getState().currentThreadId

    const secondId = client.actions.newThread()
    expect(client.getState().currentThreadId).toBe(secondId)

    client.actions.switchThread(firstId)
    expect(client.getState().currentThreadId).toBe(firstId)
  })

  it("actions.deleteThread removes the thread from state", () => {
    const client = new FabrikClient({ provider: mockProvider() })
    const firstId = client.getState().currentThreadId
    const secondId = client.actions.newThread()

    client.actions.deleteThread(firstId)

    expect(client.getState().threads[firstId]).toBeUndefined()
    expect(client.getState().threads[secondId]).toBeDefined()
  })

  it("actions.setInput updates the input value", () => {
    const client = new FabrikClient({ provider: mockProvider() })

    client.actions.setInput("Hello world")
    expect(client.getState().input.value).toBe("Hello world")

    client.actions.setInput("")
    expect(client.getState().input.value).toBe("")
  })

  it("actions.addFile and clearFiles manage file list", () => {
    const client = new FabrikClient({ provider: mockProvider() })

    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" })
    const file2 = new File(["content2"], "file2.txt", { type: "text/plain" })

    client.actions.addFile(file1)
    expect(client.getState().input.files).toHaveLength(1)
    expect(client.getState().input.files[0]).toBe(file1)

    client.actions.addFile(file2)
    expect(client.getState().input.files).toHaveLength(2)

    client.actions.clearFiles()
    expect(client.getState().input.files).toHaveLength(0)
  })

  it("actions.run adds a user message and clears input", () => {
    const client = new FabrikClient({ provider: mockProvider() })

    client.actions.setInput("What is the weather?")
    client.actions.run("What is the weather?")

    const state = client.getState()
    const thread = state.threads[state.currentThreadId]!
    const userMessages = thread.messages.filter((m) => m.role === "user")

    expect(userMessages).toHaveLength(1)
    expect(userMessages[0]!.parts[0]).toEqual({
      type: "text",
      text: "What is the weather?",
    })

    // Input should be cleared after run
    expect(state.input.value).toBe("")
  })

  it("beforeSend hook can transform the message", () => {
    const client = new FabrikClient({
      provider: mockProvider(),
      beforeSend: (text) => text.toUpperCase(),
    })

    client.actions.run("hello")

    const state = client.getState()
    const thread = state.threads[state.currentThreadId]!
    const userMsg = thread.messages.find((m) => m.role === "user")!

    expect(userMsg.parts[0]).toEqual({ type: "text", text: "HELLO" })
  })

  it("beforeSend returning null throws and does not add message", () => {
    const client = new FabrikClient({
      provider: mockProvider(),
      beforeSend: () => null,
    })

    expect(() => client.actions.run("test")).toThrow(
      "Message rejected by beforeSend hook"
    )
  })
})
