import { describe, it, expect } from "vitest"
import { EventQueue, ElicitationQueue } from "../stream"

// ---------------------------------------------------------------------------
// EventQueue
// ---------------------------------------------------------------------------

describe("EventQueue", () => {
  it("yields events pushed before iteration", async () => {
    const queue = new EventQueue<string>()
    queue.push("a")
    queue.push("b")
    queue.end()

    const results: string[] = []
    for await (const item of queue) {
      results.push(item)
    }
    expect(results).toEqual(["a", "b"])
  })

  it("yields events pushed after iteration starts", async () => {
    const queue = new EventQueue<number>()

    const collected: number[] = []
    const consumer = (async () => {
      for await (const item of queue) {
        collected.push(item)
      }
    })()

    // Push events asynchronously
    queue.push(1)
    queue.push(2)
    queue.push(3)
    queue.end()

    await consumer
    expect(collected).toEqual([1, 2, 3])
  })

  it("end() signals the iterator is done", async () => {
    const queue = new EventQueue<string>()

    const consumer = (async () => {
      const results: string[] = []
      for await (const item of queue) {
        results.push(item)
      }
      return results
    })()

    queue.push("x")
    queue.end()

    const results = await consumer
    expect(results).toEqual(["x"])
  })

  it("fail() signals the iterator as done", async () => {
    const queue = new EventQueue<string>()
    const iter = queue[Symbol.asyncIterator]()

    // Start waiting for next value
    const pending = iter.next()

    // Fail signals done (not rejection — error is stored internally)
    queue.fail(new Error("test failure"))

    const result = await pending
    expect(result.done).toBe(true)
  })

  it("ignores pushes after end()", async () => {
    const queue = new EventQueue<string>()
    queue.push("a")
    queue.end()
    queue.push("b") // should be ignored

    const results: string[] = []
    for await (const item of queue) {
      results.push(item)
    }
    expect(results).toEqual(["a"])
  })

  it("supports interleaved push and consume", async () => {
    const queue = new EventQueue<number>()
    const results: number[] = []

    const consumer = (async () => {
      for await (const item of queue) {
        results.push(item)
      }
    })()

    // Push one at a time with microtask breaks
    for (let i = 0; i < 5; i++) {
      queue.push(i)
      await Promise.resolve()
    }
    queue.end()

    await consumer
    expect(results).toEqual([0, 1, 2, 3, 4])
  })

  it("return() on the iterator signals done", async () => {
    const queue = new EventQueue<string>()

    const iter = queue[Symbol.asyncIterator]()

    // return() should resolve with done: true
    const returned = await iter.return!()
    expect(returned.done).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// ElicitationQueue
// ---------------------------------------------------------------------------

describe("ElicitationQueue", () => {
  it("wait() returns a promise that resolves when respond() is called", async () => {
    const eq = new ElicitationQueue()

    const promise = eq.wait("ask-1")
    eq.respond("ask-1", { confirmed: true })

    const result = await promise
    expect(result).toEqual({ confirmed: true })
  })

  it("handles multiple concurrent waits independently", async () => {
    const eq = new ElicitationQueue()

    const p1 = eq.wait("ask-1")
    const p2 = eq.wait("ask-2")

    eq.respond("ask-2", "second")
    eq.respond("ask-1", "first")

    expect(await p1).toBe("first")
    expect(await p2).toBe("second")
  })

  it("respond() is a no-op for unknown askId", () => {
    const eq = new ElicitationQueue()
    // Should not throw
    eq.respond("nonexistent", "value")
  })

  it("cleans up waiter after responding", async () => {
    const eq = new ElicitationQueue()

    const p1 = eq.wait("ask-1")
    eq.respond("ask-1", "answer1")
    await p1

    // A second respond to the same ID should be a no-op
    // (won't resolve anything because the waiter was already cleaned up)
    eq.respond("ask-1", "answer2")

    // Waiting again creates a new independent promise
    const p2 = eq.wait("ask-1")
    eq.respond("ask-1", "answer3")
    expect(await p2).toBe("answer3")
  })

  it("can resolve with any value type", async () => {
    const eq = new ElicitationQueue()

    const p1 = eq.wait("a")
    eq.respond("a", 42)
    expect(await p1).toBe(42)

    const p2 = eq.wait("b")
    eq.respond("b", null)
    expect(await p2).toBeNull()

    const p3 = eq.wait("c")
    eq.respond("c", ["x", "y"])
    expect(await p3).toEqual(["x", "y"])
  })
})
