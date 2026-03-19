"use client"

import { type ReactNode } from "react"
import type { ComponentPart, ComponentDefBase } from "../core/types"

// ---------------------------------------------------------------------------
// ComponentSlot — renders a registered component by name from the registry
// ---------------------------------------------------------------------------

export interface ComponentSlotProps {
  part: ComponentPart
  registry: Map<string, ComponentDefBase>
  fallback?: ReactNode
}

export function ComponentSlot({ part, registry, fallback }: ComponentSlotProps) {
  const def = registry.get(part.name)

  if (!def) {
    return fallback ?? (
      <div className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
        Unknown component: {part.name}
      </div>
    )
  }

  // Skeleton while pending
  if (part.status === "pending") {
    if (def.loading) {
      const Loading = def.loading
      return <Loading {...part.props} />
    }
    return (
      <div className="animate-pulse space-y-2 rounded-md bg-muted p-4">
        <div className="h-4 w-2/5 rounded bg-muted-foreground/20" />
        <div className="h-3 w-full rounded bg-muted-foreground/20" />
        <div className="h-3 w-4/5 rounded bg-muted-foreground/20" />
      </div>
    )
  }

  // Loading component while streaming
  if (part.status === "streaming" && def.loading) {
    const Loading = def.loading
    return <Loading {...part.props} />
  }

  // Resolve nested children if present
  const resolvedProps = { ...part.props }
  if (Array.isArray(resolvedProps.children)) {
    resolvedProps.children = (resolvedProps.children as { component: string; props: Record<string, unknown> }[]).map(
      (child: { component: string; props: Record<string, unknown> }, i: number) => {
        const childDef = registry.get(child.component)
        if (!childDef) return null
        const ChildComponent = childDef.component
        return <ChildComponent key={i} {...child.props} />
      }
    )
  }

  // Render the actual component
  const Component = def.component

  return (
    <ComponentErrorBoundary name={part.name}>
      <Component {...resolvedProps} />
    </ComponentErrorBoundary>
  )
}

// ---------------------------------------------------------------------------
// Error boundary for individual components
// ---------------------------------------------------------------------------

import { Component as ReactComponent } from "react"

interface ErrorBoundaryProps {
  name: string
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

class ComponentErrorBoundary extends ReactComponent<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <p className="font-medium">Component "{this.props.name}" failed to render</p>
          <p className="mt-1 text-xs opacity-70">{this.state.error.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}
