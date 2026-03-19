import type { ZodType } from "zod"

/** Internal Zod _def shape — we access private internals for JSON Schema conversion */
interface ZodDef {
  typeName?: string
  description?: string
  shape?: () => Record<string, { _def: ZodDef }>
  values?: string[]
  type?: { _def: ZodDef }
  innerType?: { _def: ZodDef }
  valueType?: { _def: ZodDef }
  defaultValue?: () => unknown
  [key: string]: unknown
}

/**
 * Convert a Zod schema to JSON Schema for the LLM tool definition.
 * Simplified implementation — handles the common Zod types.
 */
export function zodToJsonSchema(schema: ZodType): Record<string, unknown> {
  // Use Zod's built-in JSON Schema generation if available
  if ("_def" in schema) {
    const def = (schema as unknown as { _def: ZodDef })._def
    return zodDefToJsonSchema(def)
  }
  return { type: "object" }
}

function zodDefToJsonSchema(def: ZodDef): Record<string, unknown> {
  const typeName = def.typeName

  switch (typeName) {
    case "ZodObject": {
      const properties: Record<string, unknown> = {}
      const required: string[] = []

      if (def.shape) {
        for (const [key, value] of Object.entries(def.shape())) {
          const fieldDef = value._def
          properties[key] = zodDefToJsonSchema(fieldDef)

          // Add .describe() value if present
          if (fieldDef.description) {
            ;(properties[key] as Record<string, unknown>).description = fieldDef.description
          }

          // Check if field is required (not optional)
          if (fieldDef.typeName !== "ZodOptional") {
            required.push(key)
          }
        }
      }

      const result: Record<string, unknown> = { type: "object", properties }
      if (required.length > 0) result.required = required
      if (def.description) result.description = def.description
      return result
    }

    case "ZodString": {
      const result: Record<string, unknown> = { type: "string" }
      if (def.description) result.description = def.description
      return result
    }

    case "ZodNumber": {
      const result: Record<string, unknown> = { type: "number" }
      if (def.description) result.description = def.description
      return result
    }

    case "ZodBoolean": {
      const result: Record<string, unknown> = { type: "boolean" }
      if (def.description) result.description = def.description
      return result
    }

    case "ZodEnum": {
      const result: Record<string, unknown> = {
        type: "string",
        enum: def.values,
      }
      if (def.description) result.description = def.description
      return result
    }

    case "ZodArray": {
      const result: Record<string, unknown> = {
        type: "array",
        items: def.type ? zodDefToJsonSchema(def.type._def) : {},
      }
      if (def.description) result.description = def.description
      return result
    }

    case "ZodOptional": {
      return def.innerType ? zodDefToJsonSchema(def.innerType._def) : {}
    }

    case "ZodDefault": {
      const inner = def.innerType ? zodDefToJsonSchema(def.innerType._def) : {}
      if (def.defaultValue) inner.default = def.defaultValue()
      return inner
    }

    case "ZodNullable": {
      const inner = def.innerType ? zodDefToJsonSchema(def.innerType._def) : {}
      return { anyOf: [inner, { type: "null" }] }
    }

    case "ZodRecord": {
      return {
        type: "object",
        additionalProperties: def.valueType ? zodDefToJsonSchema(def.valueType._def) : {},
      }
    }

    case "ZodAny":
      return {}

    default:
      return {}
  }
}
