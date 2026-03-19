import { describe, it, expect } from "vitest"
import { z } from "zod"
import { zodToJsonSchema } from "../schema"

describe("zodToJsonSchema", () => {
  it("converts ZodString to { type: 'string' }", () => {
    const schema = z.object({ name: z.string() })
    const result = zodToJsonSchema(schema)

    expect(result).toEqual({
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    })
  })

  it("converts ZodNumber to { type: 'number' }", () => {
    const schema = z.object({ age: z.number() })
    const result = zodToJsonSchema(schema)

    expect(result.properties).toEqual({ age: { type: "number" } })
    expect(result.required).toEqual(["age"])
  })

  it("converts ZodBoolean to { type: 'boolean' }", () => {
    const schema = z.object({ active: z.boolean() })
    const result = zodToJsonSchema(schema)

    expect(result.properties).toEqual({ active: { type: "boolean" } })
  })

  it("converts ZodEnum to { type: 'string', enum: [...] }", () => {
    const schema = z.object({
      status: z.enum(["active", "inactive", "pending"]),
    })
    const result = zodToJsonSchema(schema)

    expect((result.properties as any).status).toEqual({
      type: "string",
      enum: ["active", "inactive", "pending"],
    })
  })

  it("converts ZodArray of objects", () => {
    const schema = z.object({
      items: z.array(z.object({ id: z.number(), label: z.string() })),
    })
    const result = zodToJsonSchema(schema)

    expect((result.properties as any).items).toEqual({
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "number" },
          label: { type: "string" },
        },
        required: ["id", "label"],
      },
    })
  })

  it("excludes optional fields from required array", () => {
    const schema = z.object({
      name: z.string(),
      nickname: z.string().optional(),
    })
    const result = zodToJsonSchema(schema)

    expect(result.required).toEqual(["name"])
    expect(result.properties).toHaveProperty("nickname")
  })

  it("converts nested objects", () => {
    const schema = z.object({
      address: z.object({
        street: z.string(),
        zip: z.string(),
      }),
    })
    const result = zodToJsonSchema(schema)

    expect((result.properties as any).address).toEqual({
      type: "object",
      properties: {
        street: { type: "string" },
        zip: { type: "string" },
      },
      required: ["street", "zip"],
    })
  })

  it("includes .describe() as description field", () => {
    const schema = z.object({
      city: z.string().describe("The name of the city"),
    })
    const result = zodToJsonSchema(schema)

    expect((result.properties as any).city).toEqual({
      type: "string",
      description: "The name of the city",
    })
  })

  it("converts ZodRecord to additionalProperties", () => {
    const schema = z.object({
      metadata: z.record(z.string()),
    })
    const result = zodToJsonSchema(schema)

    expect((result.properties as any).metadata).toEqual({
      type: "object",
      additionalProperties: { type: "string" },
    })
  })

  it("falls back to { type: 'object' } for non-def schema", () => {
    // Simulate a schema without _def
    const fakeSchema = {} as any
    const result = zodToJsonSchema(fakeSchema)
    expect(result).toEqual({ type: "object" })
  })

  it("handles ZodDefault by adding default value", () => {
    const schema = z.object({
      count: z.number().default(5),
    })
    const result = zodToJsonSchema(schema)

    expect((result.properties as any).count).toEqual({
      type: "number",
      default: 5,
    })
  })

  it("handles ZodNullable with anyOf", () => {
    const schema = z.object({
      label: z.string().nullable(),
    })
    const result = zodToJsonSchema(schema)

    expect((result.properties as any).label).toEqual({
      anyOf: [{ type: "string" }, { type: "null" }],
    })
  })
})
