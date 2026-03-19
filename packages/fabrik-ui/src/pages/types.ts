import type { ComponentDefBase, ToolDef } from "../core/types"

// ---------------------------------------------------------------------------
// Route Context — passed to prompts, middleware, and cache key functions
// ---------------------------------------------------------------------------

export interface RouteContext {
  params: Record<string, string>
  searchParams: Record<string, string>
  user?: Record<string, unknown>
  preferences?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Cache Configuration
// ---------------------------------------------------------------------------

export interface CacheConfig {
  /** Time-to-live in seconds */
  ttl: number
  /** Serve stale content while revalidating in the background */
  staleWhileRevalidate?: boolean
  /** Custom cache key derivation; defaults to path + params + searchParams */
  key?: (context: RouteContext) => string
}

// ---------------------------------------------------------------------------
// Route Configuration
// ---------------------------------------------------------------------------

export interface RouteConfig {
  /** URL pattern — supports :param segments (e.g. "/customers/:id") */
  path: string
  /** Prompt sent to the LLM. Can be a static string or a function of context. */
  prompt: string | ((context: RouteContext) => string)
  /** Components the LLM is allowed to render on this route */
  components: ComponentDefBase[]
  /** Tools the LLM can call to fetch data or perform actions */
  tools?: ToolDef[]
  /** Cache configuration, or `false` to disable caching */
  cache?: CacheConfig | false
  /** Middleware that can transform the context or return null to block access */
  middleware?: (context: RouteContext) => RouteContext | null
}

// ---------------------------------------------------------------------------
// Nav Item — optional navigation links rendered by <FabrikPages>
// ---------------------------------------------------------------------------

export interface NavItem {
  label: string
  path: string
  icon?: string
}

// ---------------------------------------------------------------------------
// Cached Page Entry (internal)
// ---------------------------------------------------------------------------

export interface CacheEntry {
  html: string
  createdAt: number
  ttl: number
  staleWhileRevalidate: boolean
}
