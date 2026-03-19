import { describe, it, expect } from "vitest"
import { z } from "zod"
import { defineRoute, matchRoute, resolvePrompt } from "../router"
import type { RouteConfig } from "../types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockComponent = () => null

const minimalComponent = {
  name: "card",
  description: "A card",
  schema: z.object({ title: z.string() }),
  component: mockComponent,
}

function makeRoute(overrides: Partial<RouteConfig> = {}): RouteConfig {
  return {
    path: "/test",
    prompt: "Test prompt",
    components: [minimalComponent],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// defineRoute
// ---------------------------------------------------------------------------

describe("defineRoute", () => {
  it("returns a frozen route config for valid input", () => {
    const route = defineRoute(makeRoute())
    expect(route.path).toBe("/test")
    expect(route.prompt).toBe("Test prompt")
    expect(Object.isFrozen(route)).toBe(true)
  })

  it("throws when path is empty", () => {
    expect(() => defineRoute(makeRoute({ path: "" }))).toThrow(
      'Route path must start with "/"',
    )
  })

  it("throws when path does not start with /", () => {
    expect(() => defineRoute(makeRoute({ path: "no-slash" }))).toThrow(
      'Route path must start with "/"',
    )
  })

  it("throws when prompt is missing", () => {
    expect(() => defineRoute(makeRoute({ prompt: "" }))).toThrow(
      'must have a prompt',
    )
  })

  it("throws when components array is empty", () => {
    expect(() => defineRoute(makeRoute({ components: [] }))).toThrow(
      "must have at least one component",
    )
  })

  it("preserves optional fields (tools, cache, middleware)", () => {
    const mw = (ctx: any) => ctx
    const route = defineRoute(
      makeRoute({
        tools: [{ name: "get_data", description: "Fetch data", schema: z.object({}), run: async () => ({}) }],
        cache: { ttl: 60 },
        middleware: mw,
      }),
    )
    expect(route.tools).toHaveLength(1)
    expect(route.cache).toEqual({ ttl: 60 })
    expect(route.middleware).toBe(mw)
  })
})

// ---------------------------------------------------------------------------
// matchRoute — exact paths
// ---------------------------------------------------------------------------

describe("matchRoute — exact paths", () => {
  const routes = [
    makeRoute({ path: "/" }),
    makeRoute({ path: "/dashboard" }),
    makeRoute({ path: "/about" }),
  ]

  it("matches / exactly", () => {
    const result = matchRoute("/", routes)
    expect(result).not.toBeNull()
    expect(result!.route.path).toBe("/")
  })

  it("matches /dashboard", () => {
    const result = matchRoute("/dashboard", routes)
    expect(result).not.toBeNull()
    expect(result!.route.path).toBe("/dashboard")
  })

  it("matches /dashboard with trailing slash", () => {
    const result = matchRoute("/dashboard/", routes)
    expect(result).not.toBeNull()
    expect(result!.route.path).toBe("/dashboard")
  })

  it("returns empty params and searchParams for static route", () => {
    const result = matchRoute("/about", routes)
    expect(result).not.toBeNull()
    expect(result!.context.params).toEqual({})
    expect(result!.context.searchParams).toEqual({})
  })

  it("returns the first matching route when multiple could match", () => {
    const dupes = [
      makeRoute({ path: "/x", prompt: "first" }),
      makeRoute({ path: "/x", prompt: "second" }),
    ]
    const result = matchRoute("/x", dupes)
    expect(result!.route.prompt).toBe("first")
  })
})

// ---------------------------------------------------------------------------
// matchRoute — param extraction
// ---------------------------------------------------------------------------

describe("matchRoute — param extraction", () => {
  const routes = [
    makeRoute({ path: "/customers/:id" }),
    makeRoute({ path: "/customers/:id/orders/:orderId" }),
  ]

  it("extracts a single :param", () => {
    const result = matchRoute("/customers/42", routes)
    expect(result).not.toBeNull()
    expect(result!.context.params).toEqual({ id: "42" })
  })

  it("extracts multiple :params", () => {
    const result = matchRoute("/customers/42/orders/99", routes)
    expect(result).not.toBeNull()
    expect(result!.context.params).toEqual({ id: "42", orderId: "99" })
  })

  it("decodes URI-encoded param values", () => {
    const result = matchRoute("/customers/hello%20world", routes)
    expect(result).not.toBeNull()
    expect(result!.context.params).toEqual({ id: "hello world" })
  })
})

// ---------------------------------------------------------------------------
// matchRoute — searchParams extraction
// ---------------------------------------------------------------------------

describe("matchRoute — searchParams extraction", () => {
  const routes = [makeRoute({ path: "/search" })]

  it("extracts query string params", () => {
    const result = matchRoute("/search?q=hello&page=2", routes)
    expect(result).not.toBeNull()
    expect(result!.context.searchParams).toEqual({ q: "hello", page: "2" })
  })

  it("handles URI-encoded search params", () => {
    const result = matchRoute("/search?q=hello%20world", routes)
    expect(result).not.toBeNull()
    expect(result!.context.searchParams).toEqual({ q: "hello world" })
  })

  it("handles keys with no value", () => {
    const result = matchRoute("/search?debug", routes)
    expect(result).not.toBeNull()
    expect(result!.context.searchParams).toEqual({ debug: "" })
  })

  it("combines params and searchParams", () => {
    const paramRoutes = [makeRoute({ path: "/items/:id" })]
    const result = matchRoute("/items/5?expand=true", paramRoutes)
    expect(result).not.toBeNull()
    expect(result!.context.params).toEqual({ id: "5" })
    expect(result!.context.searchParams).toEqual({ expand: "true" })
  })
})

// ---------------------------------------------------------------------------
// matchRoute — non-matching paths
// ---------------------------------------------------------------------------

describe("matchRoute — non-matching paths", () => {
  const routes = [
    makeRoute({ path: "/dashboard" }),
    makeRoute({ path: "/customers/:id" }),
  ]

  it("returns null for completely unknown path", () => {
    expect(matchRoute("/unknown", routes)).toBeNull()
  })

  it("returns null for partial match", () => {
    expect(matchRoute("/dash", routes)).toBeNull()
  })

  it("returns null for extra path segments", () => {
    expect(matchRoute("/dashboard/extra", routes)).toBeNull()
  })

  it("returns null for empty routes array", () => {
    expect(matchRoute("/anything", [])).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// matchRoute — middleware
// ---------------------------------------------------------------------------

describe("matchRoute — middleware", () => {
  it("passes through context from middleware", () => {
    const routes = [
      makeRoute({
        path: "/protected",
        middleware: (ctx) => ({ ...ctx, user: { role: "admin" } }),
      }),
    ]
    const result = matchRoute("/protected", routes)
    expect(result).not.toBeNull()
    expect(result!.context.user).toEqual({ role: "admin" })
  })

  it("blocks route when middleware returns null", () => {
    const routes = [
      makeRoute({
        path: "/protected",
        middleware: () => null,
      }),
    ]
    const result = matchRoute("/protected", routes)
    expect(result).toBeNull()
  })

  it("falls through to next route when middleware blocks first match", () => {
    const routes = [
      makeRoute({
        path: "/page",
        prompt: "blocked",
        middleware: () => null,
      }),
      makeRoute({
        path: "/page",
        prompt: "allowed",
      }),
    ]
    const result = matchRoute("/page", routes)
    expect(result).not.toBeNull()
    expect(result!.route.prompt).toBe("allowed")
  })
})

// ---------------------------------------------------------------------------
// matchRoute — extra context (user, preferences)
// ---------------------------------------------------------------------------

describe("matchRoute — extra context", () => {
  it("passes user and preferences to context", () => {
    const routes = [makeRoute({ path: "/" })]
    const result = matchRoute("/", routes, {
      user: { id: "u1", name: "Alice" },
      preferences: { theme: "dark" },
    })
    expect(result).not.toBeNull()
    expect(result!.context.user).toEqual({ id: "u1", name: "Alice" })
    expect(result!.context.preferences).toEqual({ theme: "dark" })
  })
})

// ---------------------------------------------------------------------------
// resolvePrompt
// ---------------------------------------------------------------------------

describe("resolvePrompt", () => {
  it("returns a static string prompt as-is", () => {
    const route = makeRoute({ prompt: "Show the dashboard" })
    const context = { params: {}, searchParams: {} }
    expect(resolvePrompt(route, context)).toBe("Show the dashboard")
  })

  it("calls a function prompt with context", () => {
    const route = makeRoute({
      prompt: (ctx) => `Show details for customer ${ctx.params.id}`,
    })
    const context = { params: { id: "42" }, searchParams: {} }
    expect(resolvePrompt(route, context)).toBe("Show details for customer 42")
  })

  it("passes searchParams to function prompt", () => {
    const route = makeRoute({
      prompt: (ctx) => `Search: ${ctx.searchParams.q ?? "all"}`,
    })
    const context = { params: {}, searchParams: { q: "hello" } }
    expect(resolvePrompt(route, context)).toBe("Search: hello")
  })

  it("passes user and preferences to function prompt", () => {
    const route = makeRoute({
      prompt: (ctx) => `Welcome ${ctx.user?.name ?? "guest"}, theme: ${ctx.preferences?.theme ?? "light"}`,
    })
    const context = {
      params: {},
      searchParams: {},
      user: { name: "Alice" },
      preferences: { theme: "dark" },
    }
    expect(resolvePrompt(route, context)).toBe("Welcome Alice, theme: dark")
  })
})
