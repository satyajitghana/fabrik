import { type ZodType, toJSONSchema } from "zod"

/**
 * Convert a Zod schema to JSON Schema for the LLM tool definition.
 * Uses Zod 4's built-in toJSONSchema() for accurate conversion.
 */
export function zodToJsonSchema(schema: ZodType): Record<string, unknown> {
  try {
    const jsonSchema = toJSONSchema(schema) as Record<string, unknown>
    stripInternals(jsonSchema)
    return jsonSchema
  } catch {
    return { type: "object" }
  }
}

/** Remove $schema and additionalProperties recursively — LLM providers don't need them */
function stripInternals(obj: Record<string, unknown>): void {
  delete obj.$schema
  delete obj.additionalProperties

  if (obj.properties && typeof obj.properties === "object") {
    for (const val of Object.values(obj.properties as Record<string, unknown>)) {
      if (val && typeof val === "object") stripInternals(val as Record<string, unknown>)
    }
  }
  if (obj.items && typeof obj.items === "object") {
    stripInternals(obj.items as Record<string, unknown>)
  }
  if (Array.isArray(obj.anyOf)) {
    for (const item of obj.anyOf) {
      if (item && typeof item === "object") stripInternals(item as Record<string, unknown>)
    }
  }
}
