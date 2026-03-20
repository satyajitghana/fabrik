import { test } from "@playwright/test"

const BASE = "http://localhost:4400"
const SHOTS = "examples/custom-agent/tests/screenshots"

test.describe("custom-agent", () => {
  test("40 - agent empty", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${SHOTS}/40-agent-empty.png`, fullPage: false })
  })

  test("41 - agent response", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForTimeout(1500)
    const textarea = page.locator("textarea").first()
    if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await textarea.fill("Plan a trip to Tokyo")
      await textarea.press("Enter")
      await page.waitForTimeout(5000)
    }
    await page.screenshot({ path: `${SHOTS}/41-agent-response.png`, fullPage: true })
  })

  test("42 - agent mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(BASE)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${SHOTS}/42-agent-mobile.png`, fullPage: false })
  })
})
