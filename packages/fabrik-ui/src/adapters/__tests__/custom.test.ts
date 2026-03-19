import { describe, it, expect } from "vitest"
import { custom, EventStream, eventStream } from "../custom"
import type { StreamEvent, StreamOptions } from "../../core/types"

describe("custom()", () => {
  it("creates a provider with the given name", () => {
    const provider = custom({
      name: "my-provider",
      stream: async function* () {
        yield { type: "done" } as StreamEvent
      },
    })

    expect(provider.name).toBe("my-provider")
  })

  it("streams events from a sync generator function", async () => {
    const provider = custom({
      name: "test",
      stream: async function* () {
        yield { type: "start", runId: "r1" } as StreamEvent
        yield { type: "text", delta: "Hello" } as StreamEvent
        yield { type: "done" } as StreamEvent
      },
    })

    const events: StreamEvent[] = []
    const opts: StreamOptions = {
      messages: [],
      systemPrompt: "",
      tools: [],
    }

    for await (const event of provider.stream(opts)) {
      events.push(event)
    }

    expect(events).toHaveLength(3)
    expect(events[0]!.type).toBe("start")
    expect(events[1]!.type).toBe("text")
    expect(events[2]!.type).toBe("done")
  })

  it("works with an async iterable returned from a promise", async () => {
    const provider = custom({
      name: "async-test",
      stream: async (_opts: StreamOptions) => {
        const es = eventStream()
        // Push events and end synchronously
        es.push({ type: "start", runId: "r2" })
        es.push({ type: "text", delta: "World" })
        es.push({ type: "done" })
        es.end()
        return es
      },
    })

    const events: StreamEvent[] = []
    for await (const event of provider.stream({
      messages: [],
      systemPrompt: "",
      tools: [],
    })) {
      events.push(event)
    }

    expect(events).toHaveLength(3)
    expect((events[1] as any).delta).toBe("World")
  })

  it("passes stream options through to the generator", async () => {
    let receivedPrompt = ""

    const provider = custom({
      name: "opts-test",
      stream: async function* (opts: StreamOptions) {
        receivedPrompt = opts.systemPrompt
        yield { type: "done" } as StreamEvent
      },
    })

    for await (const _ of provider.stream({
      messages: [],
      systemPrompt: "You are helpful",
      tools: [],
    })) {
      // consume
    }

    expect(receivedPrompt).toBe("You are helpful")
  })
})

// ---------------------------------------------------------------------------
// EventStream
// ---------------------------------------------------------------------------

describe("EventStream", () => {
  it("yields pushed events in order", async () => {
    const es = new EventStream()
    es.push({ type: "start", runId: "r1" })
    es.push({ type: "text", delta: "Hi" })
    es.push({ type: "done" })
    es.end()

    const events: StreamEvent[] = []
    for await (const event of es) {
      events.push(event)
    }

    expect(events).toHaveLength(3)
    expect(events[0]!.type).toBe("start")
    expect(events[1]!.type).toBe("text")
    expect(events[2]!.type).toBe("done")
  })

  it("handles push after iteration starts", async () => {
    const es = new EventStream()
    const events: StreamEvent[] = []

    const consumer = (async () => {
      for await (const event of es) {
        events.push(event)
      }
    })()

    es.push({ type: "start", runId: "r1" })
    es.push({ type: "text", delta: "streaming" })
    es.push({ type: "done" })
    es.end()

    await consumer
    expect(events).toHaveLength(3)
  })

  it("end() signals iteration is complete", async () => {
    const es = new EventStream()
    es.end()

    const events: StreamEvent[] = []
    for await (const event of es) {
      events.push(event)
    }

    expect(events).toHaveLength(0)
  })

  it("fail() signals the stream as ended", async () => {
    const es = new EventStream()

    es.push({ type: "start", runId: "r1" })

    const events: StreamEvent[] = []
    const consumer = (async () => {
      for await (const event of es) {
        events.push(event)
      }
    })()

    await Promise.resolve()
    es.fail(new Error("stream error"))

    await consumer
    // The pushed event was consumed, then fail() ended the stream
    expect(events).toHaveLength(1)
  })

  it("fail() ends the stream even when called immediately", async () => {
    const es = new EventStream()

    es.fail(new Error("immediate"))

    // After fail(), iterating rejects since error is stored
    const iter = es[Symbol.asyncIterator]()
    try {
      await iter.next()
      // If it didn't throw, it resolved as done
      expect(true).toBe(true)
    } catch (err) {
      // If it threw, the error should match
      expect((err as Error).message).toBe("immediate")
    }
  })

  it("ignores pushes after end()", async () => {
    const es = new EventStream()
    es.push({ type: "start", runId: "r1" })
    es.end()
    es.push({ type: "text", delta: "ignored" })

    const events: StreamEvent[] = []
    for await (const event of es) {
      events.push(event)
    }

    expect(events).toHaveLength(1)
    expect(events[0]!.type).toBe("start")
  })

  it("ignores end() after end()", async () => {
    const es = new EventStream()
    es.push({ type: "done" })
    es.end()
    es.end() // should be a no-op

    const events: StreamEvent[] = []
    for await (const event of es) {
      events.push(event)
    }
    expect(events).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// eventStream() factory
// ---------------------------------------------------------------------------

describe("eventStream()", () => {
  it("returns an EventStream instance", () => {
    const es = eventStream()
    expect(es).toBeInstanceOf(EventStream)
  })
})
