import type { FabrikThread, Storage } from "./types"

// ---------------------------------------------------------------------------
// In-memory storage (default — lost on refresh)
// ---------------------------------------------------------------------------

export class MemoryStorage implements Storage {
  private threads = new Map<string, FabrikThread>()

  async loadThreads() {
    return [...this.threads.values()]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((t) => ({ id: t.id, name: t.name, updatedAt: t.updatedAt }))
  }

  async loadThread(id: string) {
    return this.threads.get(id) ?? null
  }

  async saveThread(thread: FabrikThread) {
    this.threads.set(thread.id, structuredClone(thread))
  }

  async deleteThread(id: string) {
    this.threads.delete(id)
  }
}

// ---------------------------------------------------------------------------
// LocalStorage adapter (persists across refreshes)
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = "fabrik_"

export class LocalStorage implements Storage {
  private prefix: string

  constructor(prefix = STORAGE_PREFIX) {
    this.prefix = prefix
  }

  async loadThreads() {
    const threads: { id: string; name?: string; updatedAt: string }[] = []
    const indexKey = `${this.prefix}index`

    try {
      const index = JSON.parse(localStorage.getItem(indexKey) ?? "[]")
      return index as typeof threads
    } catch {
      return []
    }
  }

  async loadThread(id: string) {
    try {
      const data = localStorage.getItem(`${this.prefix}thread_${id}`)
      return data ? (JSON.parse(data) as FabrikThread) : null
    } catch {
      return null
    }
  }

  async saveThread(thread: FabrikThread) {
    localStorage.setItem(
      `${this.prefix}thread_${thread.id}`,
      JSON.stringify(thread)
    )
    await this.updateIndex(thread)
  }

  async deleteThread(id: string) {
    localStorage.removeItem(`${this.prefix}thread_${id}`)
    await this.removeFromIndex(id)
  }

  private async updateIndex(thread: FabrikThread) {
    const indexKey = `${this.prefix}index`
    let index: { id: string; name?: string; updatedAt: string }[] = []
    try {
      index = JSON.parse(localStorage.getItem(indexKey) ?? "[]")
    } catch {
      index = []
    }

    const existing = index.findIndex((t) => t.id === thread.id)
    const entry = { id: thread.id, name: thread.name, updatedAt: thread.updatedAt }

    if (existing >= 0) {
      index[existing] = entry
    } else {
      index.unshift(entry)
    }

    // Sort by updatedAt descending
    index.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    localStorage.setItem(indexKey, JSON.stringify(index))
  }

  private async removeFromIndex(id: string) {
    const indexKey = `${this.prefix}index`
    try {
      const index = JSON.parse(localStorage.getItem(indexKey) ?? "[]") as { id: string; name?: string; updatedAt: string }[]
      localStorage.setItem(
        indexKey,
        JSON.stringify(index.filter((t) => t.id !== id))
      )
    } catch {
      // ignore
    }
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createStorage(
  config: "memory" | "local" | Storage
): Storage {
  if (config === "memory") return new MemoryStorage()
  if (config === "local") return new LocalStorage()
  return config
}
