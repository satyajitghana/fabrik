import type { ComponentDef, ComponentDefBase, ToolDef, ToolSpec } from "./types"
import { zodToJsonSchema } from "./schema"

// ---------------------------------------------------------------------------
// defineComponent — register a UI component the LLM can render
// ---------------------------------------------------------------------------

export function defineComponent<T>(def: ComponentDef<T>): ComponentDef<T> {
  if (!def.name || !def.description || !def.schema || !def.component) {
    throw new Error(
      `defineComponent: missing required fields. Got: ${JSON.stringify({
        name: def.name,
        description: !!def.description,
        schema: !!def.schema,
        component: !!def.component,
      })}`
    )
  }
  return Object.freeze(def)
}

// ---------------------------------------------------------------------------
// defineTool — register a tool the LLM can call
// ---------------------------------------------------------------------------

export function defineTool<In, Out>(def: ToolDef<In, Out>): ToolDef<In, Out> {
  if (!def.name || !def.description || !def.schema || !def.run) {
    throw new Error(
      `defineTool: missing required fields. Got: ${JSON.stringify({
        name: def.name,
        description: !!def.description,
        schema: !!def.schema,
        run: !!def.run,
      })}`
    )
  }
  return Object.freeze(def)
}

// ---------------------------------------------------------------------------
// createLibrary — combine component defs into a list
// ---------------------------------------------------------------------------

export function createLibrary(defs: ComponentDefBase[]): ComponentDefBase[] {
  const names = new Set<string>()
  for (const def of defs) {
    if (names.has(def.name)) {
      throw new Error(`createLibrary: duplicate component name "${def.name}"`)
    }
    names.add(def.name)
  }
  return [...defs]
}

// ---------------------------------------------------------------------------
// ComponentRegistry — runtime lookup used by the client
// ---------------------------------------------------------------------------

export class ComponentRegistry {
  private components = new Map<string, ComponentDefBase>()

  register(def: ComponentDefBase): void {
    this.components.set(def.name, def)
  }

  get(name: string): ComponentDefBase | undefined {
    return this.components.get(name)
  }

  has(name: string): boolean {
    return this.components.has(name)
  }

  all(): ComponentDefBase[] {
    return [...this.components.values()]
  }

  /** Convert all components into tool specs for the LLM (show_ prefix) */
  toToolSpecs(): ToolSpec[] {
    return this.all().map((def) => ({
      name: `show_${def.name}`,
      description: def.description,
      parameters: zodToJsonSchema(def.schema),
    }))
  }
}

// ---------------------------------------------------------------------------
// ToolRegistry — runtime lookup for tools
// ---------------------------------------------------------------------------

export class ToolRegistry {
  private tools = new Map<string, ToolDef>()

  register(def: ToolDef): void {
    this.tools.set(def.name, def)
  }

  get(name: string): ToolDef | undefined {
    return this.tools.get(name)
  }

  has(name: string): boolean {
    return this.tools.has(name)
  }

  all(): ToolDef[] {
    return [...this.tools.values()]
  }

  toToolSpecs(): ToolSpec[] {
    return this.all().map((def) => ({
      name: def.name,
      description: def.description,
      parameters: zodToJsonSchema(def.schema),
    }))
  }
}
