import type { RouteConfig, RouteContext } from "./types"

// ---------------------------------------------------------------------------
// defineRoute — validates and freezes a route configuration
// ---------------------------------------------------------------------------

export function defineRoute(config: RouteConfig): RouteConfig {
  if (!config.path || !config.path.startsWith("/")) {
    throw new Error(`Route path must start with "/", got: "${config.path}"`)
  }
  if (!config.prompt) {
    throw new Error(`Route "${config.path}" must have a prompt`)
  }
  if (!config.components || config.components.length === 0) {
    throw new Error(`Route "${config.path}" must have at least one component`)
  }

  return Object.freeze({ ...config })
}

// ---------------------------------------------------------------------------
// Route matching
// ---------------------------------------------------------------------------

interface RouteMatch {
  route: RouteConfig
  context: RouteContext
}

/**
 * Convert a route path pattern into a RegExp.
 *   "/customers/:id"  ->  /^\/customers\/([^/]+)\/?$/
 *   "/dashboard"       ->  /^\/dashboard\/?$/
 */
function pathToRegex(path: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = []

  const regexStr = path
    .split("/")
    .map((segment) => {
      if (segment.startsWith(":")) {
        paramNames.push(segment.slice(1))
        return "([^/]+)"
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    })
    .join("/")

  return {
    regex: new RegExp(`^${regexStr}\\/?$`),
    paramNames,
  }
}

/**
 * Match a URL against a list of route configs.
 * Returns the first match with extracted params and search params.
 */
export function matchRoute(
  url: string,
  routes: RouteConfig[],
  extra?: { user?: Record<string, unknown>; preferences?: Record<string, unknown> },
): RouteMatch | null {
  // Parse the URL to separate path and search params
  let pathname: string
  let search: string

  const qIndex = url.indexOf("?")
  if (qIndex >= 0) {
    pathname = url.slice(0, qIndex)
    search = url.slice(qIndex + 1)
  } else {
    pathname = url
    search = ""
  }

  // Parse search params
  const searchParams: Record<string, string> = {}
  if (search) {
    for (const pair of search.split("&")) {
      const eqIndex = pair.indexOf("=")
      if (eqIndex >= 0) {
        const key = decodeURIComponent(pair.slice(0, eqIndex))
        const value = decodeURIComponent(pair.slice(eqIndex + 1))
        searchParams[key] = value
      } else {
        searchParams[decodeURIComponent(pair)] = ""
      }
    }
  }

  for (const route of routes) {
    const { regex, paramNames } = pathToRegex(route.path)
    const match = pathname.match(regex)

    if (match) {
      const params: Record<string, string> = {}
      for (let i = 0; i < paramNames.length; i++) {
        params[paramNames[i]!] = decodeURIComponent(match[i + 1]!)
      }

      let context: RouteContext = {
        params,
        searchParams,
        user: extra?.user,
        preferences: extra?.preferences,
      }

      // Run middleware if present
      if (route.middleware) {
        const result = route.middleware(context)
        if (result === null) {
          // Middleware blocked this route — skip to next
          continue
        }
        context = result
      }

      return { route, context }
    }
  }

  return null
}

/**
 * Resolve the prompt string for a matched route.
 */
export function resolvePrompt(route: RouteConfig, context: RouteContext): string {
  if (typeof route.prompt === "function") {
    return route.prompt(context)
  }
  return route.prompt
}
