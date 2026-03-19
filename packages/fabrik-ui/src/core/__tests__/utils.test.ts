import { describe, it, expect } from "vitest"
import {
  generateId,
  formatDuration,
  isComponentTool,
  extractComponentName,
  isElicitationTool,
} from "../utils"

describe("generateId", () => {
  it("returns a non-empty string", () => {
    const id = generateId()
    expect(typeof id).toBe("string")
    expect(id.length).toBeGreaterThan(0)
  })

  it("returns unique IDs on successive calls", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})

describe("formatDuration", () => {
  it("formats sub-second durations as milliseconds", () => {
    expect(formatDuration(0)).toBe("0ms")
    expect(formatDuration(500)).toBe("500ms")
    expect(formatDuration(999)).toBe("999ms")
  })

  it("formats seconds with one decimal place", () => {
    expect(formatDuration(1000)).toBe("1.0s")
    expect(formatDuration(1500)).toBe("1.5s")
    expect(formatDuration(59999)).toBe("60.0s") // edge: just under a minute by seconds rounding
  })

  it("formats durations of 60+ seconds as minutes and seconds", () => {
    expect(formatDuration(60000)).toBe("1m 0s")
    expect(formatDuration(90000)).toBe("1m 30s")
    expect(formatDuration(125000)).toBe("2m 5s")
  })

  it("handles large durations", () => {
    // 10 minutes
    expect(formatDuration(600000)).toBe("10m 0s")
  })
})

describe("isComponentTool", () => {
  it("returns true for names starting with show_ followed by characters", () => {
    expect(isComponentTool("show_weather_card")).toBe(true)
    expect(isComponentTool("show_chart")).toBe(true)
  })

  it("returns false for bare show_ with nothing after it", () => {
    expect(isComponentTool("show_")).toBe(false)
  })

  it("returns false for non-component tool names", () => {
    expect(isComponentTool("get_weather")).toBe(false)
    expect(isComponentTool("weather_show")).toBe(false)
    expect(isComponentTool("")).toBe(false)
  })
})

describe("extractComponentName", () => {
  it("removes the show_ prefix", () => {
    expect(extractComponentName("show_weather_card")).toBe("weather_card")
    expect(extractComponentName("show_chart")).toBe("chart")
  })

  it("returns empty string for show_ alone", () => {
    expect(extractComponentName("show_")).toBe("")
  })
})

describe("isElicitationTool", () => {
  it("returns true for names starting with __fabrik_ask_", () => {
    expect(isElicitationTool("__fabrik_ask_confirm")).toBe(true)
    expect(isElicitationTool("__fabrik_ask_choice")).toBe(true)
    expect(isElicitationTool("__fabrik_ask_text")).toBe(true)
  })

  it("returns false for other names", () => {
    expect(isElicitationTool("get_weather")).toBe(false)
    expect(isElicitationTool("fabrik_ask_confirm")).toBe(false)
    expect(isElicitationTool("__fabrik_ask")).toBe(false)
    expect(isElicitationTool("")).toBe(false)
  })
})
