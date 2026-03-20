import { test } from "@playwright/test"

const BASE = "http://localhost:4100"
const SHOTS = "examples/next-chat/tests/screenshots"

test.describe("next-chat — desktop", () => {
  test("01 - empty state", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.screenshot({ path: `${SHOTS}/01-chat-empty.png`, fullPage: true })
  })

  test("02 - weather elicitation + card", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.fill("textarea", "Show me the weather")
    await page.click("button[aria-label='Send message']")
    await page.waitForSelector("text=Which city", { timeout: 15000 })
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${SHOTS}/02a-elicitation.png`, fullPage: true })
    await page.waitForSelector("text=live weather", { timeout: 15000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `${SHOTS}/02b-weather-card.png`, fullPage: true })
  })

  test("03 - bar chart", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.fill("textarea", "Revenue chart")
    await page.click("button[aria-label='Send message']")
    await page.waitForSelector("text=Quarterly Revenue", { timeout: 15000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `${SHOTS}/03-bar-chart.png`, fullPage: true })
  })

  test("04 - dashboard stats", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.fill("textarea", "Dashboard stats")
    await page.click("button[aria-label='Send message']")
    await page.waitForSelector("text=Total Revenue", { timeout: 15000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `${SHOTS}/04-dashboard-stats.png`, fullPage: true })
  })

  test("05 - data table", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.fill("textarea", "Data table")
    await page.click("button[aria-label='Send message']")
    await page.waitForSelector("text=Team Members", { timeout: 15000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `${SHOTS}/05-data-table.png`, fullPage: true })
  })

  test("E1 - confirm dialog", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.fill("textarea", "Confirm something")
    await page.click("button[aria-label='Send message']")
    await page.waitForSelector("text=Delete conversation", { timeout: 15000 })
    await page.waitForTimeout(800)
    await page.screenshot({ path: `${SHOTS}/E1-confirm-dialog.png`, fullPage: true })
  })

  test("E2 - multi-choice", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.fill("textarea", "Multi choice question")
    await page.click("button[aria-label='Send message']")
    await page.waitForSelector("text=Select your interests", { timeout: 15000 })
    await page.waitForTimeout(800)
    await page.screenshot({ path: `${SHOTS}/E2-multi-choice.png`, fullPage: true })
  })

  test("E3 - text input", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.fill("textarea", "Ask me something")
    await page.click("button[aria-label='Send message']")
    await page.waitForSelector("text=your name", { timeout: 15000 })
    await page.waitForTimeout(800)
    await page.screenshot({ path: `${SHOTS}/E3-text-input.png`, fullPage: true })
  })

  test("E4 - permission", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.fill("textarea", "Permission request")
    await page.click("button[aria-label='Send message']")
    await page.waitForSelector("text=Access Required", { timeout: 15000 })
    await page.waitForTimeout(800)
    await page.screenshot({ path: `${SHOTS}/E4-permission.png`, fullPage: true })
  })

  test("A1 - HTML artifact", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.fill("textarea", "Show me an artifact")
    await page.click("button[aria-label='Send message']")
    await page.waitForTimeout(4000)
    await page.screenshot({ path: `${SHOTS}/A1-artifact-html.png`, fullPage: true })
  })

  test("A2 - code artifact", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.fill("textarea", "Code example")
    await page.click("button[aria-label='Send message']")
    await page.waitForTimeout(4000)
    await page.screenshot({ path: `${SHOTS}/A2-artifact-code.png`, fullPage: true })
  })

  test("D1 - code diff", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.fill("textarea", "Show me a code diff")
    await page.click("button[aria-label='Send message']")
    await page.waitForTimeout(5000)
    await page.screenshot({ path: `${SHOTS}/D1-code-diff.png`, fullPage: true })
  })

  test("F1 - email composer", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.fill("textarea", "Write an email")
    await page.click("button[aria-label='Send message']")
    await page.waitForSelector("text=Q4 Revenue Report", { timeout: 15000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `${SHOTS}/F1-email-composer.png`, fullPage: true })
  })

  test("F2 - stock dashboard", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.fill("textarea", "Show NVIDIA stock data")
    await page.click("button[aria-label='Send message']")
    await page.waitForSelector("text=NVDA", { timeout: 15000 })
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${SHOTS}/F2-stock-dashboard.png`, fullPage: true })
  })
})

test.describe("next-chat — mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test("10 - mobile empty", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.screenshot({ path: `${SHOTS}/10-mobile-empty.png`, fullPage: true })
  })

  test("11 - mobile weather", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.fill("textarea", "Show me the weather")
    await page.click("button[aria-label='Send message']")
    await page.waitForSelector("text=live weather", { timeout: 15000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `${SHOTS}/11-mobile-weather.png`, fullPage: true })
  })

  test("12 - mobile dashboard", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=How can I help you")
    await page.fill("textarea", "Dashboard stats")
    await page.click("button[aria-label='Send message']")
    await page.waitForSelector("text=Total Revenue", { timeout: 15000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `${SHOTS}/12-mobile-dashboard.png`, fullPage: true })
  })
})
