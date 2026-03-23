import type { ReactNode } from "react"
import type { ZodObject, ZodRawShape } from "zod"
import { toJSONSchema } from "zod"
import type { ParamMap, ParamDef } from "./types"

// ---------------------------------------------------------------------------
// Component definition for Fabrik Lang
// ---------------------------------------------------------------------------

export interface LangComponentDef {
  name: string
  description: string
  schema: ZodObject<ZodRawShape>
  component: (ctx: { props: Record<string, unknown>; renderNode: (value: unknown) => ReactNode }) => ReactNode
}

export function defineLangComponent(def: LangComponentDef): LangComponentDef {
  return Object.freeze(def)
}

// ---------------------------------------------------------------------------
// Library: collection of components + utilities
// ---------------------------------------------------------------------------

export interface LangLibrary {
  components: Map<string, LangComponentDef>
  paramMap: ParamMap
  prompt: () => string
}

export function createLangLibrary(components: LangComponentDef[]): LangLibrary {
  const compMap = new Map<string, LangComponentDef>()
  const paramMap: ParamMap = new Map()

  for (const comp of components) {
    compMap.set(comp.name, comp)

    // Build ParamDef from Zod schema field order
    const jsonSchema = toJSONSchema(comp.schema) as {
      properties?: Record<string, { default?: unknown }>
      required?: string[]
    }
    const properties = jsonSchema.properties ?? {}
    const required = new Set(jsonSchema.required ?? [])

    const params: ParamDef[] = Object.keys(properties).map(name => ({
      name,
      required: required.has(name),
      defaultValue: properties[name]?.default,
    }))

    paramMap.set(comp.name, { params })
  }

  return {
    components: compMap,
    paramMap,
    prompt: () => generatePrompt(components, paramMap),
  }
}

// ---------------------------------------------------------------------------
// System prompt generation
// ---------------------------------------------------------------------------

function generatePrompt(components: LangComponentDef[], paramMap: ParamMap): string {
  const lines: string[] = []

  lines.push("## Fabrik Lang Syntax")
  lines.push("")
  lines.push("Output a declarative UI using Fabrik Lang. Each line defines a variable:")
  lines.push("  identifier = Expression")
  lines.push("")
  lines.push("Rules:")
  lines.push("- `root` is the entry point (required)")
  lines.push("- PascalCase identifiers are components: Card(...), TextContent(...)")
  lines.push("- lowercase identifiers are variable references")
  lines.push("- Arguments are positional (order matters, match the signature below)")
  lines.push("- Strings: \"text\", Numbers: 42, Bools: true/false, Arrays: [a, b], Objects: {k: v}")
  lines.push("- References can be used before they're defined (hoisting)")
  lines.push("- if(condition, thenExpr, elseExpr) for conditional rendering")
  lines.push("- map(array, (item) => Expression) for iteration")
  lines.push("- // comments are ignored")
  lines.push("")
  lines.push("## Streaming Tips")
  lines.push("- Define root first so the UI shell appears immediately")
  lines.push("- Put data-heavy content (charts, tables) last")
  lines.push("- Every variable must be referenced from root (unreferenced = dropped)")
  lines.push("")
  lines.push("## Available Components")
  lines.push("")

  for (const comp of components) {
    const def = paramMap.get(comp.name)
    if (!def) continue

    const sig = def.params.map(p => {
      const opt = p.required ? "" : "?"
      return `${p.name}${opt}`
    }).join(", ")

    lines.push(`${comp.name}(${sig}) — ${comp.description}`)
  }

  return lines.join("\n")
}
