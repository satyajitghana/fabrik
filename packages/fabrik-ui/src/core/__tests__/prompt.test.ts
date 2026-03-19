import { describe, it, expect } from "vitest"
import { z } from "zod"
import { generateSystemPrompt } from "../prompt"
import type { ComponentDefBase, ToolDef } from "../types"

const mockComponent = () => null

describe("generateSystemPrompt", () => {
  it("generates prompt with components", () => {
    const components: ComponentDefBase[] = [
      {
        name: "weather_card",
        description: "Shows weather for a city",
        schema: z.object({
          city: z.string().describe("City name"),
          temp: z.number().describe("Temperature"),
        }),
        component: mockComponent,
      },
    ]

    const prompt = generateSystemPrompt({ components, tools: [] })

    expect(prompt).toContain("show_weather_card")
    expect(prompt).toContain("Shows weather for a city")
    expect(prompt).toContain("city")
    expect(prompt).toContain("temp")
    expect(prompt).toContain("Available UI Components")
  })

  it("generates prompt with tools", () => {
    const tools: ToolDef[] = [
      {
        name: "get_weather",
        description: "Fetches weather data",
        schema: z.object({ city: z.string() }),
        run: async () => ({}),
      },
    ]

    const prompt = generateSystemPrompt({ components: [], tools })

    expect(prompt).toContain("get_weather")
    expect(prompt).toContain("Fetches weather data")
    expect(prompt).toContain("Available Tools")
  })

  it("includes user prompt", () => {
    const prompt = generateSystemPrompt({
      components: [],
      tools: [],
      userPrompt: "Be helpful and concise",
    })

    expect(prompt).toContain("Additional Instructions")
    expect(prompt).toContain("Be helpful and concise")
  })

  it("generates empty prompt without components or tools", () => {
    const prompt = generateSystemPrompt({ components: [], tools: [] })
    expect(prompt).toContain("AI assistant")
    expect(prompt).not.toContain("show_")
  })
})
