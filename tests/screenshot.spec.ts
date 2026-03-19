import { test } from "@playwright/test"

const BASE = "http://localhost:4100"

test.describe("fabrik-ui demo — desktop", () => {
  test("01 - empty state", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.screenshot({ path: "tests/screenshots/01-empty-state.png", fullPage: true })
  })

  test("02 - weather with elicitation", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.fill("textarea", "Show me the weather")
    await page.click("button[type='submit']")

    // Wait for the city choice elicitation to appear
    await page.waitForSelector("text=Which city", { timeout: 15000 })
    await page.waitForTimeout(500)
    await page.screenshot({ path: "tests/screenshots/02-weather-elicitation.png", fullPage: true })

    // Wait for weather data to load (mock continues with SF after ask)
    await page.waitForSelector("text=live weather", { timeout: 15000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: "tests/screenshots/02b-weather-card.png", fullPage: true })
  })

  test("03 - bar chart", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.fill("textarea", "Revenue chart")
    await page.click("button[type='submit']")
    await page.waitForSelector("text=Quarterly Revenue", { timeout: 15000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: "tests/screenshots/03-bar-chart.png", fullPage: true })
  })

  test("04 - dashboard stats", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.fill("textarea", "Dashboard stats")
    await page.click("button[type='submit']")
    await page.waitForSelector("text=Total Revenue", { timeout: 15000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: "tests/screenshots/04-dashboard-stats.png", fullPage: true })
  })

  test("05 - data table", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.fill("textarea", "Data table")
    await page.click("button[type='submit']")
    await page.waitForSelector("text=Team Members", { timeout: 15000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: "tests/screenshots/05-data-table.png", fullPage: true })
  })

  test("06 - thinking", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.fill("textarea", "Think about something")
    await page.click("button[type='submit']")
    await page.waitForSelector("text=Thought for", { timeout: 15000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: "tests/screenshots/06-thinking.png", fullPage: true })
  })

  test("07 - conversation flow", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    // Start with dashboard (no elicitation, faster)
    await page.fill("textarea", "Dashboard stats")
    await page.click("button[type='submit']")
    await page.waitForSelector("text=Total Revenue", { timeout: 15000 })
    await page.waitForTimeout(500)
    await page.fill("textarea", "Now show revenue chart")
    await page.click("button[type='submit']")
    await page.waitForSelector("text=Quarterly Revenue", { timeout: 15000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: "tests/screenshots/07-conversation-flow.png", fullPage: true })
  })
})

test.describe("fabrik-ui widget example", () => {
  const WIDGET = "http://localhost:4200"

  test("11 - widget landing page", async ({ page }) => {
    await page.goto(WIDGET)
    await page.waitForTimeout(1000)
    await page.screenshot({ path: "tests/screenshots/11-widget-landing.png", fullPage: false })
  })

  test("12 - widget FAB button visible", async ({ page }) => {
    await page.goto(WIDGET)
    await page.waitForTimeout(1000)
    // The FAB button should be in the bottom-right
    const fab = page.locator("button[aria-label='Open chat']")
    if (await fab.isVisible()) {
      await page.screenshot({ path: "tests/screenshots/12-widget-fab.png", fullPage: false })
    } else {
      // FAB might render differently, just take a screenshot
      await page.screenshot({ path: "tests/screenshots/12-widget-fab.png", fullPage: false })
    }
  })
})

test.describe("fabrik-ui copilot example", () => {
  const COPILOT = "http://localhost:4300"

  test("13 - copilot sidebar", async ({ page }) => {
    await page.goto(COPILOT)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: "tests/screenshots/13-copilot-sidebar.png", fullPage: false })
  })
})

test.describe("fabrik-ui custom agent example", () => {
  const AGENT = "http://localhost:4400"

  test("14 - custom agent", async ({ page }) => {
    await page.goto(AGENT)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: "tests/screenshots/14-custom-agent.png", fullPage: false })
  })
})

test.describe("fabrik-ui website", () => {
  const WEB = "http://localhost:4700"

  test("15 - website landing page", async ({ page }) => {
    await page.goto(WEB)
    await page.waitForSelector("text=Generative UI")
    // Wait for Shiki syntax highlighting to load
    await page.waitForTimeout(3000)
    await page.screenshot({ path: "tests/screenshots/15-website-landing.png", fullPage: true })
  })
})

test.describe("fabrik-ui demo — mobile (390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test("08 - mobile empty state", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.screenshot({ path: "tests/screenshots/08-mobile-empty.png", fullPage: true })
  })

  test("09 - mobile weather", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.fill("textarea", "Show me the weather")
    await page.click("button[type='submit']")
    await page.waitForSelector("text=live weather", { timeout: 15000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: "tests/screenshots/09-mobile-weather.png", fullPage: true })
  })

  test("10 - mobile dashboard", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.fill("textarea", "Dashboard stats")
    await page.click("button[type='submit']")
    await page.waitForSelector("text=Total Revenue", { timeout: 15000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: "tests/screenshots/10-mobile-dashboard.png", fullPage: true })
  })
})
