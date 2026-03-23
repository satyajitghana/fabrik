"use client"

import { type ReactNode, useMemo, useRef, Fragment } from "react"
import { createStreamParser } from "./stream-parser"
import type { LangLibrary } from "./library"
import type { ElementNode, ParamMap } from "./types"

// ---------------------------------------------------------------------------
// FabrikLangRenderer — renders streaming DSL text as React components
// ---------------------------------------------------------------------------

export interface FabrikLangRendererProps {
  /** The DSL text (grows as it streams) */
  text: string
  /** The component library */
  library: LangLibrary
  /** Whether the text is still streaming */
  isStreaming?: boolean
}

export function FabrikLangRenderer({ text, library, isStreaming }: FabrikLangRendererProps) {
  const parserRef = useRef(createStreamParser(library.paramMap))

  // Re-parse on every text change
  const result = useMemo(() => {
    // Reset parser and replay full text (simpler than tracking deltas)
    const parser = createStreamParser(library.paramMap)
    parserRef.current = parser
    return parser.push(text)
  }, [text, library.paramMap])

  if (!result.root) {
    if (isStreaming) {
      return (
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground py-2">
          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
            <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>Generating UI...</span>
        </div>
      )
    }
    return null
  }

  return <RenderElement node={result.root} library={library} />
}

// ---------------------------------------------------------------------------
// Recursive element renderer
// ---------------------------------------------------------------------------

function RenderElement({ node, library }: { node: ElementNode; library: LangLibrary }) {
  const comp = library.components.get(node.typeName)

  if (!comp) {
    // Unknown component — render children if present or show type name
    if (node.props.children) {
      return <>{renderNode(node.props.children, library)}</>
    }
    return <div className="text-xs text-muted-foreground">[{node.typeName}]</div>
  }

  // Create renderNode function for this component
  const rn = (value: unknown): ReactNode => renderNode(value, library)

  return <>{comp.component({ props: node.props, renderNode: rn })}</>
}

// ---------------------------------------------------------------------------
// renderNode — renders any value (primitive, array, element)
// ---------------------------------------------------------------------------

function renderNode(value: unknown, library: LangLibrary): ReactNode {
  if (value == null) return null
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  if (typeof value === "boolean") return value ? "true" : null

  if (Array.isArray(value)) {
    return (
      <>
        {value.map((item, i) => (
          <Fragment key={i}>{renderNode(item, library)}</Fragment>
        ))}
      </>
    )
  }

  // ElementNode
  if (typeof value === "object" && "type" in value && (value as ElementNode).type === "element") {
    return <RenderElement node={value as ElementNode} library={library} />
  }

  // Plain object — render as JSON for debugging
  if (typeof value === "object") {
    return <span className="text-xs font-mono text-muted-foreground">{JSON.stringify(value)}</span>
  }

  return null
}
