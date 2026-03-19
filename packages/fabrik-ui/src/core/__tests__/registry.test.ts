import { describe, it, expect } from "vitest"
import { z } from "zod"
import { defineComponent, defineTool, createLibrary } from "../registry"
import { ComponentRegistry, ToolRegistry } from "../registry"

const mockComponent = () => null

describe("defineComponent", () => {
  it("creates a frozen component definition", () => {
    const comp = defineComponent({
      name: "test_card",
      description: "A test card",
      schema: z.object({ title: z.string() }),
      component: mockComponent,
    })

    expect(comp.name).toBe("test_card")
    expect(comp.description).toBe("A test card")
    expect(Object.isFrozen(comp)).toBe(true)
  })

  it("throws on missing fields", () => {
    expect(() =>
      defineComponent({
        name: "",
        description: "test",
        schema: z.object({}),
        component: mockComponent,
      })
    ).toThrow("missing required fields")
  })
})

describe("defineTool", () => {
  it("creates a frozen tool definition", () => {
    const tool = defineTool({
      name: "get_weather",
      description: "Fetches weather",
      schema: z.object({ city: z.string() }),
      run: async () => ({ temp: 72 }),
    })

    expect(tool.name).toBe("get_weather")
    expect(Object.isFrozen(tool)).toBe(true)
  })
})

describe("createLibrary", () => {
  it("returns a list of components", () => {
    const lib = createLibrary([
      defineComponent({
        name: "card_a",
        description: "Card A",
        schema: z.object({}),
        component: mockComponent,
      }),
      defineComponent({
        name: "card_b",
        description: "Card B",
        schema: z.object({}),
        component: mockComponent,
      }),
    ])

    expect(lib).toHaveLength(2)
  })

  it("throws on duplicate names", () => {
    const comp = defineComponent({
      name: "card",
      description: "Card",
      schema: z.object({}),
      component: mockComponent,
    })
    expect(() => createLibrary([comp, comp])).toThrow("duplicate component name")
  })
})

describe("ComponentRegistry", () => {
  it("registers and retrieves components", () => {
    const reg = new ComponentRegistry()
    const comp = defineComponent({
      name: "test",
      description: "Test",
      schema: z.object({ x: z.number() }),
      component: mockComponent,
    })

    reg.register(comp)
    expect(reg.has("test")).toBe(true)
    expect(reg.get("test")).toBe(comp)
    expect(reg.all()).toHaveLength(1)
  })

  it("converts to tool specs with show_ prefix", () => {
    const reg = new ComponentRegistry()
    reg.register(
      defineComponent({
        name: "weather_card",
        description: "Shows weather",
        schema: z.object({ city: z.string() }),
        component: mockComponent,
      })
    )

    const specs = reg.toToolSpecs()
    expect(specs).toHaveLength(1)
    expect(specs[0]!.name).toBe("show_weather_card")
    expect(specs[0]!.description).toBe("Shows weather")
    expect(specs[0]!.parameters).toHaveProperty("type", "object")
  })
})

describe("ToolRegistry", () => {
  it("registers and retrieves tools", () => {
    const reg = new ToolRegistry()
    const tool = defineTool({
      name: "get_data",
      description: "Gets data",
      schema: z.object({}),
      run: async () => ({}),
    })

    reg.register(tool)
    expect(reg.has("get_data")).toBe(true)
    expect(reg.get("get_data")).toBe(tool)
  })
})
