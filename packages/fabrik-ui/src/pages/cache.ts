import type { CacheConfig, CacheEntry, RouteContext } from "./types"

// ---------------------------------------------------------------------------
// PageCache — simple in-memory TTL cache with stale-while-revalidate
// ---------------------------------------------------------------------------

export class PageCache {
  private store = new Map<string, CacheEntry>()

  // -------------------------------------------------------------------------
  // Key generation
  // -------------------------------------------------------------------------

  buildKey(path: string, context: RouteContext, config?: CacheConfig): string {
    if (config?.key) {
      return config.key(context)
    }

    // Default key: path + sorted params + sorted searchParams
    const paramStr = Object.keys(context.params).length > 0
      ? `:${Object.entries(context.params)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}=${v}`)
          .join("&")}`
      : ""

    const searchStr = Object.keys(context.searchParams).length > 0
      ? `?${Object.entries(context.searchParams)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}=${v}`)
          .join("&")}`
      : ""

    return `${path}${paramStr}${searchStr}`
  }

  // -------------------------------------------------------------------------
  // Read
  // -------------------------------------------------------------------------

  get(key: string): { html: string; stale: boolean } | null {
    const entry = this.store.get(key)
    if (!entry) return null

    const age = (Date.now() - entry.createdAt) / 1000
    const expired = age > entry.ttl

    if (expired && !entry.staleWhileRevalidate) {
      // Hard-expired — remove and return miss
      this.store.delete(key)
      return null
    }

    if (expired && entry.staleWhileRevalidate) {
      // Stale but usable — caller should revalidate in background
      return { html: entry.html, stale: true }
    }

    // Fresh
    return { html: entry.html, stale: false }
  }

  // -------------------------------------------------------------------------
  // Write
  // -------------------------------------------------------------------------

  set(key: string, html: string, config: CacheConfig): void {
    this.store.set(key, {
      html,
      createdAt: Date.now(),
      ttl: config.ttl,
      staleWhileRevalidate: config.staleWhileRevalidate ?? false,
    })
  }

  // -------------------------------------------------------------------------
  // Invalidation
  // -------------------------------------------------------------------------

  delete(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  /** Remove all expired entries (including stale ones) */
  prune(): void {
    const now = Date.now()
    for (const [key, entry] of this.store) {
      const age = (now - entry.createdAt) / 1000
      // Allow 2x TTL for stale entries, then evict
      const maxAge = entry.staleWhileRevalidate ? entry.ttl * 2 : entry.ttl
      if (age > maxAge) {
        this.store.delete(key)
      }
    }
  }

  get size(): number {
    return this.store.size
  }
}
