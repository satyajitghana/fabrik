import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { PageCache } from "../cache"
import type { CacheConfig, RouteContext } from "../types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContext(overrides: Partial<RouteContext> = {}): RouteContext {
  return {
    params: {},
    searchParams: {},
    ...overrides,
  }
}

function makeConfig(overrides: Partial<CacheConfig> = {}): CacheConfig {
  return {
    ttl: 60,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// PageCache — set / get
// ---------------------------------------------------------------------------

describe("PageCache — set / get", () => {
  let cache: PageCache

  beforeEach(() => {
    cache = new PageCache()
  })

  it("stores and retrieves a cached entry", () => {
    cache.set("key1", "<div>Hello</div>", makeConfig())
    const result = cache.get("key1")
    expect(result).not.toBeNull()
    expect(result!.html).toBe("<div>Hello</div>")
    expect(result!.stale).toBe(false)
  })

  it("returns null for a missing key", () => {
    expect(cache.get("nonexistent")).toBeNull()
  })

  it("overwrites existing entry with same key", () => {
    cache.set("key1", "old", makeConfig())
    cache.set("key1", "new", makeConfig())
    const result = cache.get("key1")
    expect(result!.html).toBe("new")
  })

  it("tracks size correctly", () => {
    expect(cache.size).toBe(0)
    cache.set("a", "1", makeConfig())
    cache.set("b", "2", makeConfig())
    expect(cache.size).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// PageCache — TTL expiration
// ---------------------------------------------------------------------------

describe("PageCache — TTL expiration", () => {
  let cache: PageCache

  beforeEach(() => {
    cache = new PageCache()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns entry before TTL expires", () => {
    cache.set("key1", "content", makeConfig({ ttl: 10 }))
    vi.advanceTimersByTime(5_000) // 5 seconds — within TTL
    const result = cache.get("key1")
    expect(result).not.toBeNull()
    expect(result!.stale).toBe(false)
  })

  it("returns null after TTL expires (no staleWhileRevalidate)", () => {
    cache.set("key1", "content", makeConfig({ ttl: 10, staleWhileRevalidate: false }))
    vi.advanceTimersByTime(11_000) // 11 seconds — past TTL
    const result = cache.get("key1")
    expect(result).toBeNull()
  })

  it("removes expired entry from the store", () => {
    cache.set("key1", "content", makeConfig({ ttl: 5 }))
    vi.advanceTimersByTime(6_000)
    cache.get("key1") // triggers removal
    expect(cache.size).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// PageCache — staleWhileRevalidate
// ---------------------------------------------------------------------------

describe("PageCache — staleWhileRevalidate", () => {
  let cache: PageCache

  beforeEach(() => {
    cache = new PageCache()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns stale content after TTL when staleWhileRevalidate is true", () => {
    cache.set("key1", "stale-content", makeConfig({ ttl: 10, staleWhileRevalidate: true }))
    vi.advanceTimersByTime(15_000) // 15 seconds — past TTL
    const result = cache.get("key1")
    expect(result).not.toBeNull()
    expect(result!.html).toBe("stale-content")
    expect(result!.stale).toBe(true)
  })

  it("returns fresh content before TTL when staleWhileRevalidate is true", () => {
    cache.set("key1", "fresh-content", makeConfig({ ttl: 10, staleWhileRevalidate: true }))
    vi.advanceTimersByTime(5_000)
    const result = cache.get("key1")
    expect(result).not.toBeNull()
    expect(result!.html).toBe("fresh-content")
    expect(result!.stale).toBe(false)
  })

  it("staleWhileRevalidate defaults to false when not specified", () => {
    cache.set("key1", "content", makeConfig({ ttl: 5 }))
    vi.advanceTimersByTime(6_000)
    expect(cache.get("key1")).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// PageCache — delete and clear
// ---------------------------------------------------------------------------

describe("PageCache — delete and clear", () => {
  let cache: PageCache

  beforeEach(() => {
    cache = new PageCache()
  })

  it("deletes a specific entry", () => {
    cache.set("a", "1", makeConfig())
    cache.set("b", "2", makeConfig())
    cache.delete("a")
    expect(cache.get("a")).toBeNull()
    expect(cache.get("b")).not.toBeNull()
    expect(cache.size).toBe(1)
  })

  it("does not throw when deleting a nonexistent key", () => {
    expect(() => cache.delete("nonexistent")).not.toThrow()
  })

  it("clears all entries", () => {
    cache.set("a", "1", makeConfig())
    cache.set("b", "2", makeConfig())
    cache.set("c", "3", makeConfig())
    cache.clear()
    expect(cache.size).toBe(0)
    expect(cache.get("a")).toBeNull()
    expect(cache.get("b")).toBeNull()
    expect(cache.get("c")).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// PageCache — buildKey (custom cache keys)
// ---------------------------------------------------------------------------

describe("PageCache — buildKey (custom cache keys)", () => {
  let cache: PageCache

  beforeEach(() => {
    cache = new PageCache()
  })

  it("generates default key from path only", () => {
    const key = cache.buildKey("/dashboard", makeContext())
    expect(key).toBe("/dashboard")
  })

  it("includes sorted params in default key", () => {
    const key = cache.buildKey(
      "/customers/:id",
      makeContext({ params: { id: "42" } }),
    )
    expect(key).toBe("/customers/:id:id=42")
  })

  it("includes sorted searchParams in default key", () => {
    const key = cache.buildKey(
      "/search",
      makeContext({ searchParams: { q: "hello", page: "2" } }),
    )
    expect(key).toBe("/search?page=2&q=hello")
  })

  it("includes both params and searchParams in default key", () => {
    const key = cache.buildKey(
      "/items/:id",
      makeContext({ params: { id: "5" }, searchParams: { expand: "true" } }),
    )
    expect(key).toBe("/items/:id:id=5?expand=true")
  })

  it("sorts multiple params alphabetically", () => {
    const key = cache.buildKey(
      "/orders/:orderId/items/:itemId",
      makeContext({ params: { orderId: "100", itemId: "7" } }),
    )
    // itemId comes before orderId alphabetically
    expect(key).toBe("/orders/:orderId/items/:itemId:itemId=7&orderId=100")
  })

  it("uses custom key function when provided", () => {
    const config = makeConfig({
      key: (ctx) => `custom-${ctx.params.id}-${ctx.searchParams.lang ?? "en"}`,
    })
    const key = cache.buildKey(
      "/customers/:id",
      makeContext({ params: { id: "42" }, searchParams: { lang: "fr" } }),
      config,
    )
    expect(key).toBe("custom-42-fr")
  })

  it("custom key function receives the full context", () => {
    const config = makeConfig({
      key: (ctx) => JSON.stringify({ p: ctx.params, s: ctx.searchParams }),
    })
    const key = cache.buildKey(
      "/test",
      makeContext({ params: { a: "1" }, searchParams: { b: "2" } }),
      config,
    )
    expect(key).toBe('{"p":{"a":"1"},"s":{"b":"2"}}')
  })

  it("set and get work with buildKey output", () => {
    const context = makeContext({ params: { id: "42" } })
    const config = makeConfig()
    const key = cache.buildKey("/customers/:id", context, config)
    cache.set(key, "<div>Customer 42</div>", config)
    const result = cache.get(key)
    expect(result).not.toBeNull()
    expect(result!.html).toBe("<div>Customer 42</div>")
  })
})

// ---------------------------------------------------------------------------
// PageCache — prune
// ---------------------------------------------------------------------------

describe("PageCache — prune", () => {
  let cache: PageCache

  beforeEach(() => {
    cache = new PageCache()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("removes expired entries without staleWhileRevalidate", () => {
    cache.set("a", "1", makeConfig({ ttl: 5 }))
    cache.set("b", "2", makeConfig({ ttl: 60 }))
    vi.advanceTimersByTime(10_000)
    cache.prune()
    expect(cache.size).toBe(1)
    expect(cache.get("b")).not.toBeNull()
  })

  it("keeps stale entries within 2x TTL", () => {
    cache.set("a", "1", makeConfig({ ttl: 10, staleWhileRevalidate: true }))
    vi.advanceTimersByTime(15_000) // 1.5x TTL — stale but within 2x
    cache.prune()
    expect(cache.size).toBe(1)
  })

  it("removes stale entries beyond 2x TTL", () => {
    cache.set("a", "1", makeConfig({ ttl: 10, staleWhileRevalidate: true }))
    vi.advanceTimersByTime(21_000) // past 2x TTL
    cache.prune()
    expect(cache.size).toBe(0)
  })
})
