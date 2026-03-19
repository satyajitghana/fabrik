import type { ComponentDefBase, ToolDef, ToolSpec } from "./types"
import { zodToJsonSchema } from "./schema"

/**
 * Generate the system prompt that tells the LLM about available components and tools.
 */
export function generateSystemPrompt(options: {
  components: ComponentDefBase[]
  tools: ToolDef[]
  userPrompt?: string
}): string {
  const { components, tools, userPrompt } = options
  const sections: string[] = []

  sections.push(
    "You are an AI assistant that can render rich UI components and call tools."
  )

  // Components section
  if (components.length > 0) {
    sections.push("")
    sections.push("## Available UI Components")
    sections.push("")
    sections.push(
      'You can render UI by calling tools prefixed with "show_". Each renders a visual component the user will see.'
    )

    for (const comp of components) {
      sections.push("")
      sections.push(`### show_${comp.name}`)
      sections.push(comp.description)
      const params = describeSchema(zodToJsonSchema(comp.schema))
      if (params) {
        sections.push("Parameters:")
        sections.push(params)
      }
    }
  }

  // Tools section
  if (tools.length > 0) {
    sections.push("")
    sections.push("## Available Tools")
    sections.push("")
    sections.push(
      "These tools fetch data or perform actions. They don't render UI directly."
    )

    for (const tool of tools) {
      sections.push("")
      sections.push(`### ${tool.name}`)
      sections.push(tool.description)
      const params = describeSchema(zodToJsonSchema(tool.schema))
      if (params) {
        sections.push("Parameters:")
        sections.push(params)
      }
    }
  }

  // Guidelines
  sections.push("")
  sections.push("## Guidelines")
  sections.push("")
  sections.push(
    "- Use layout components (grid, stack, section) to organize multiple components side by side."
  )
  sections.push(
    "- Use stat_card for KPIs, charts for trends, table for data lists."
  )
  sections.push("- Prefer clean, minimal layouts with clear hierarchy.")
  sections.push(
    "- When showing multiple metrics, use a grid of stat_cards."
  )
  sections.push(
    "- Always call data-fetching tools before rendering components that need that data."
  )
  sections.push(
    "- You can mix text and components in a single response."
  )

  // User prompt
  if (userPrompt) {
    sections.push("")
    sections.push("## Additional Instructions")
    sections.push("")
    sections.push(userPrompt)
  }

  return sections.join("\n")
}

/**
 * Convert a JSON Schema object into human-readable parameter descriptions.
 */
function describeSchema(
  schema: Record<string, unknown>,
  indent = ""
): string {
  if (schema.type !== "object" || !schema.properties) return ""

  interface JsonSchemaProp {
    type?: string
    description?: string
    enum?: string[]
    items?: JsonSchemaProp & { properties?: Record<string, JsonSchemaProp> }
    properties?: Record<string, JsonSchemaProp>
    [key: string]: unknown
  }
  const props = schema.properties as Record<string, JsonSchemaProp>
  const required = new Set((schema.required as string[]) || [])
  const lines: string[] = []

  for (const [key, prop] of Object.entries(props)) {
    const type = prop.enum
      ? prop.enum.map((v: string) => `"${v}"`).join(" | ")
      : prop.type === "array"
        ? `${prop.items?.type || "any"}[]`
        : prop.type || "any"

    const req = required.has(key) ? "required" : "optional"
    const desc = prop.description ? `: ${prop.description}` : ""
    lines.push(`${indent}- ${key} (${type}, ${req})${desc}`)

    // Recurse into nested objects
    if (prop.type === "object" && prop.properties) {
      lines.push(describeSchema(prop, indent + "  "))
    }

    // Describe array item shape
    if (prop.type === "array" && prop.items?.type === "object" && prop.items.properties) {
      lines.push(`${indent}  Each item:`)
      lines.push(describeSchema(prop.items, indent + "    "))
    }
  }

  return lines.join("\n")
}
