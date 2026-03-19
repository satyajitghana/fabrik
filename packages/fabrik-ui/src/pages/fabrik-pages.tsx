"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { Fabrik } from "../react/provider"
import { Fab } from "../chat/fab"
import type { ComponentDefBase, Provider, ToolDef } from "../core/types"
import type { NavItem, RouteConfig, RouteContext } from "./types"
import { matchRoute } from "./router"
import { PageCache } from "./cache"
import { PageRenderer } from "./page-renderer"

// ---------------------------------------------------------------------------
// <FabrikPages> — AI-first page rendering
// ---------------------------------------------------------------------------

export interface FabrikPagesProps {
  /** LLM provider (e.g. openai({ model: "gpt-4o" })) */
  provider: Provider
  /** Route definitions created with defineRoute() */
  routes: RouteConfig[]
  /** Optional navigation items */
  nav?: NavItem[]
  /** Optional user context passed to route matching */
  user?: Record<string, unknown>
  /** Optional user preferences passed to route matching */
  preferences?: Record<string, unknown>
  /** Show Fab chat overlay (default: true) */
  fab?: boolean
  /** Additional components available to the chat overlay */
  components?: ComponentDefBase[]
  /** Additional tools available to the chat overlay */
  tools?: ToolDef[]
  /** Theme */
  theme?: "light" | "dark" | "system"
  /** Fallback content when no route matches */
  notFound?: ReactNode
  /** Wrap matched page content */
  children?: ReactNode
}

export function FabrikPages({
  provider,
  routes,
  nav,
  user,
  preferences,
  fab = true,
  components = [],
  tools = [],
  theme,
  notFound,
  children,
}: FabrikPagesProps) {
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname + window.location.search
    }
    return "/"
  })

  const cacheRef = useRef(new PageCache())

  // Listen for popstate (back/forward) and intercept link clicks
  useEffect(() => {
    if (typeof window === "undefined") return

    const onPopState = () => {
      setCurrentPath(window.location.pathname + window.location.search)
    }

    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  // Navigation function — pushes to history and updates state
  const navigate = useCallback((path: string) => {
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", path)
      setCurrentPath(path)
    }
  }, [])

  // Match current URL against routes
  const match = useMemo(
    () => matchRoute(currentPath, routes, { user, preferences }),
    [currentPath, routes, user, preferences],
  )

  // Collect all components and tools from matched route for the Fabrik provider
  const allComponents = useMemo(() => {
    const merged = [...components]
    if (match) {
      for (const comp of match.route.components) {
        if (!merged.some((c) => c.name === comp.name)) {
          merged.push(comp)
        }
      }
    }
    return merged
  }, [components, match])

  const allTools = useMemo(() => {
    const merged = [...tools]
    if (match?.route.tools) {
      for (const tool of match.route.tools) {
        if (!merged.some((t) => t.name === tool.name)) {
          merged.push(tool)
        }
      }
    }
    return merged
  }, [tools, match])

  // Cache lookup for the matched route
  const cached = useMemo(() => {
    if (!match) return null
    const cacheConfig = match.route.cache
    if (cacheConfig === false || !cacheConfig) return null

    const key = cacheRef.current.buildKey(match.route.path, match.context, cacheConfig)
    return { key, ...cacheRef.current.get(key) }
  }, [match])

  // Handle page render completion — store in cache
  const handleComplete = useCallback(
    (html: string) => {
      if (!match) return
      const cacheConfig = match.route.cache
      if (cacheConfig === false || !cacheConfig) return

      const key = cacheRef.current.buildKey(match.route.path, match.context, cacheConfig)
      cacheRef.current.set(key, html, cacheConfig)
    },
    [match],
  )

  return (
    <Fabrik
      provider={provider}
      components={allComponents}
      tools={allTools}
      theme={theme}
    >
      <div className="fabrik-pages">
        {/* Navigation bar */}
        {nav && nav.length > 0 && (
          <nav className="fabrik-pages-nav" role="navigation">
            <ul className="fabrik-pages-nav-list">
              {nav.map((item) => (
                <li key={item.path}>
                  <button
                    type="button"
                    className={`fabrik-pages-nav-link${
                      currentPath.startsWith(item.path) ? " fabrik-pages-nav-active" : ""
                    }`}
                    onClick={() => navigate(item.path)}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Page content */}
        <main className="fabrik-pages-content">
          {match ? (
            <PageRenderer
              key={match.route.path + JSON.stringify(match.context.params)}
              route={match.route}
              context={match.context}
              provider={provider}
              cachedHtml={cached?.html ?? undefined}
              onComplete={handleComplete}
            />
          ) : notFound ? (
            notFound
          ) : (
            <div className="fabrik-pages-not-found">
              <p>Page not found</p>
            </div>
          )}
        </main>

        {/* Additional children (e.g. footer) */}
        {children}

        {/* Chat overlay */}
        {fab && <Fab />}
      </div>
    </Fabrik>
  )
}
