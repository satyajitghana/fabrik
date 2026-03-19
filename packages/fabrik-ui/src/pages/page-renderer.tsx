"use client"

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { FabrikClient } from "../core/client"
import type { ComponentDefBase, Provider, ToolDef, FabrikMessage, Part, ComponentPart } from "../core/types"
import type { RouteConfig, RouteContext } from "./types"
import { resolvePrompt } from "./router"

// ---------------------------------------------------------------------------
// PageRenderer — streams an AI-generated page from a prompt
// ---------------------------------------------------------------------------

export interface PageRendererProps {
  route: RouteConfig
  context: RouteContext
  provider: Provider
  /** Optional cached HTML to show immediately */
  cachedHtml?: string
  /** Called when the page finishes rendering, with the serialised output */
  onComplete?: (html: string) => void
}

interface RenderedPart {
  key: string
  node: ReactNode
}

export function PageRenderer({
  route,
  context,
  provider,
  cachedHtml,
  onComplete,
}: PageRendererProps) {
  const [parts, setParts] = useState<RenderedPart[]>([])
  const [isStreaming, setIsStreaming] = useState(!cachedHtml)
  const [error, setError] = useState<string | null>(null)
  const clientRef = useRef<FabrikClient | null>(null)
  const hasRun = useRef(false)

  // Build a component registry map for rendering
  const componentMap = useRef(
    new Map<string, ComponentDefBase>(
      route.components.map((c) => [c.name, c]),
    ),
  ).current

  useEffect(() => {
    // Skip if we have cached content or already ran
    if (cachedHtml || hasRun.current) return
    hasRun.current = true

    const prompt = resolvePrompt(route, context)

    // Create a dedicated client for this page render
    const client = new FabrikClient({
      provider,
      components: route.components,
      tools: route.tools,
      systemPrompt: prompt,
    })
    clientRef.current = client

    // Listen for state changes to extract rendered parts
    const unsubscribe = client.subscribe(() => {
      const state = client.getState()
      const thread = state.threads[state.currentThreadId]
      if (!thread) return

      const rendered: RenderedPart[] = []
      for (const message of thread.messages) {
        if (message.role !== "assistant") continue
        for (const part of message.parts) {
          if (part.type === "component") {
            const compPart = part as ComponentPart
            const def = componentMap.get(compPart.name)
            if (def) {
              const Component = compPart.status === "streaming" || compPart.status === "pending"
                ? def.loading ?? def.component
                : def.component
              rendered.push({
                key: compPart.id,
                node: <Component {...compPart.props} />,
              })
            }
          } else if (part.type === "text") {
            rendered.push({
              key: `text-${rendered.length}`,
              node: <div className="fabrik-page-text">{'text' in part ? (part as { text: string }).text : ''}</div>,
            })
          }
        }
      }
      setParts(rendered)

      // Check if streaming is done
      if (thread.status === "idle" && rendered.length > 0) {
        setIsStreaming(false)
        // Serialize for cache: collect component names + props
        const serialized = JSON.stringify(
          thread.messages
            .filter((m) => m.role === "assistant")
            .flatMap((m) => m.parts),
        )
        onComplete?.(serialized)
      } else if (thread.status === "error") {
        setIsStreaming(false)
        setError("Failed to generate page")
      }
    })

    // Kick off the generation — send a trigger message
    const triggerMessage = `Render the page now. Follow the system prompt instructions exactly.`
    client.actions.run(triggerMessage)

    return () => {
      unsubscribe()
      client.actions.cancel()
    }
  }, [cachedHtml, provider, route, context, onComplete, componentMap])

  // -------------------------------------------------------------------------
  // Render cached content (parts from serialized cache)
  // -------------------------------------------------------------------------

  if (cachedHtml) {
    return <CachedPage html={cachedHtml} componentMap={componentMap} />
  }

  // -------------------------------------------------------------------------
  // Streaming / live render
  // -------------------------------------------------------------------------

  if (error) {
    return (
      <div className="fabrik-page-error" role="alert">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="fabrik-page" data-streaming={isStreaming}>
      {parts.length === 0 && isStreaming && (
        <div className="fabrik-page-loading">
          <div className="fabrik-page-skeleton" />
          <div className="fabrik-page-skeleton" />
          <div className="fabrik-page-skeleton" />
        </div>
      )}
      {parts.map((p) => (
        <div key={p.key} className="fabrik-page-part">
          {p.node}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CachedPage — rehydrate a cached page from serialized parts
// ---------------------------------------------------------------------------

function CachedPage({
  html,
  componentMap,
}: {
  html: string
  componentMap: Map<string, ComponentDefBase>
}) {
  const [parts, setParts] = useState<RenderedPart[]>([])

  useEffect(() => {
    try {
      const parsed: Part[] = JSON.parse(html)
      const rendered: RenderedPart[] = []

      for (const part of parsed) {
        if (part.type === "component") {
          const compPart = part as ComponentPart
          const def = componentMap.get(compPart.name)
          if (def) {
            rendered.push({
              key: compPart.id,
              node: <def.component {...compPart.props} />,
            })
          }
        } else if (part.type === "text") {
          rendered.push({
            key: `text-${rendered.length}`,
            node: <div className="fabrik-page-text">{'text' in part ? (part as { text: string }).text : ''}</div>,
          })
        }
      }

      setParts(rendered)
    } catch {
      // If parse fails, render nothing
      setParts([])
    }
  }, [html, componentMap])

  return (
    <div className="fabrik-page" data-cached="true">
      {parts.map((p) => (
        <div key={p.key} className="fabrik-page-part">
          {p.node}
        </div>
      ))}
    </div>
  )
}
