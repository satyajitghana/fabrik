import { describe, it, expect, vi, beforeEach } from "vitest"
import { MemoryStorage, LocalStorage, createStorage } from "../storage"
import type { FabrikThread } from "../types"

function makeThread(id: string, updatedAt?: string): FabrikThread {
  return {
    id,
    name: `Thread ${id}`,
    messages: [],
    status: "idle",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: updatedAt ?? "2025-01-01T00:00:00.000Z",
  }
}

// ---------------------------------------------------------------------------
// MemoryStorage
// ---------------------------------------------------------------------------

describe("MemoryStorage", () => {
  it("saves and loads a thread", async () => {
    const storage = new MemoryStorage()
    const thread = makeThread("t1")

    await storage.saveThread(thread)
    const loaded = await storage.loadThread("t1")

    expect(loaded).toEqual(thread)
  })

  it("returns null for nonexistent thread", async () => {
    const storage = new MemoryStorage()
    const loaded = await storage.loadThread("nonexistent")
    expect(loaded).toBeNull()
  })

  it("deletes a thread", async () => {
    const storage = new MemoryStorage()
    await storage.saveThread(makeThread("t1"))
    await storage.deleteThread("t1")

    const loaded = await storage.loadThread("t1")
    expect(loaded).toBeNull()
  })

  it("loadThreads returns sorted list (most recent first)", async () => {
    const storage = new MemoryStorage()
    await storage.saveThread(makeThread("old", "2025-01-01T00:00:00.000Z"))
    await storage.saveThread(makeThread("new", "2025-06-01T00:00:00.000Z"))
    await storage.saveThread(makeThread("mid", "2025-03-01T00:00:00.000Z"))

    const list = await storage.loadThreads()
    expect(list.map((t) => t.id)).toEqual(["new", "mid", "old"])
  })

  it("loadThreads returns id, name, and updatedAt only", async () => {
    const storage = new MemoryStorage()
    await storage.saveThread(makeThread("t1"))

    const list = await storage.loadThreads()
    expect(list).toHaveLength(1)
    expect(list[0]).toEqual({
      id: "t1",
      name: "Thread t1",
      updatedAt: "2025-01-01T00:00:00.000Z",
    })
  })

  it("saveThread clones the thread (no reference sharing)", async () => {
    const storage = new MemoryStorage()
    const thread = makeThread("t1")
    await storage.saveThread(thread)

    thread.name = "mutated"
    const loaded = await storage.loadThread("t1")
    expect(loaded!.name).toBe("Thread t1")
  })
})

// ---------------------------------------------------------------------------
// LocalStorage
// ---------------------------------------------------------------------------

describe("LocalStorage", () => {
  let store: Record<string, string>

  beforeEach(() => {
    store = {}
    const mockLocalStorage = {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key]
      }),
    }
    vi.stubGlobal("localStorage", mockLocalStorage)
  })

  it("saves and loads a thread", async () => {
    const storage = new LocalStorage()
    const thread = makeThread("t1")

    await storage.saveThread(thread)
    const loaded = await storage.loadThread("t1")

    expect(loaded).toEqual(thread)
  })

  it("returns null for nonexistent thread", async () => {
    const storage = new LocalStorage()
    const loaded = await storage.loadThread("nonexistent")
    expect(loaded).toBeNull()
  })

  it("deletes a thread and removes from index", async () => {
    const storage = new LocalStorage()
    await storage.saveThread(makeThread("t1"))
    await storage.deleteThread("t1")

    const loaded = await storage.loadThread("t1")
    expect(loaded).toBeNull()

    const list = await storage.loadThreads()
    expect(list).toHaveLength(0)
  })

  it("loadThreads returns index from localStorage", async () => {
    const storage = new LocalStorage()
    await storage.saveThread(makeThread("t1", "2025-06-01T00:00:00.000Z"))
    await storage.saveThread(makeThread("t2", "2025-01-01T00:00:00.000Z"))

    const list = await storage.loadThreads()
    expect(list).toHaveLength(2)
    expect(list[0]!.id).toBe("t1")
    expect(list[1]!.id).toBe("t2")
  })

  it("uses custom prefix", async () => {
    const storage = new LocalStorage("myapp_")
    const thread = makeThread("t1")
    await storage.saveThread(thread)

    expect(store["myapp_thread_t1"]).toBeDefined()
    expect(store["myapp_index"]).toBeDefined()
  })

  it("handles corrupted index gracefully", async () => {
    store["fabrik_index"] = "not-valid-json"
    const storage = new LocalStorage()

    const list = await storage.loadThreads()
    expect(list).toEqual([])
  })

  it("handles corrupted thread data gracefully", async () => {
    store["fabrik_thread_t1"] = "not-valid-json"
    const storage = new LocalStorage()

    const loaded = await storage.loadThread("t1")
    expect(loaded).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// createStorage factory
// ---------------------------------------------------------------------------

describe("createStorage", () => {
  it("returns MemoryStorage for 'memory'", () => {
    const storage = createStorage("memory")
    expect(storage).toBeInstanceOf(MemoryStorage)
  })

  it("returns LocalStorage for 'local'", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
    const storage = createStorage("local")
    expect(storage).toBeInstanceOf(LocalStorage)
  })

  it("returns custom storage object as-is", () => {
    const custom = {
      loadThreads: async () => [],
      loadThread: async () => null,
      saveThread: async () => {},
      deleteThread: async () => {},
    }
    const storage = createStorage(custom)
    expect(storage).toBe(custom)
  })
})
