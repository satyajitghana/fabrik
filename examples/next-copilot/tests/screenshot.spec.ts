import { test } from "@playwright/test"

const BASE = "http://localhost:4300"
const SHOTS = "examples/next-copilot/tests/screenshots"

test.describe("next-copilot", () => {
  test("30 - copilot layout", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${SHOTS}/30-copilot-layout.png`, fullPage: false })
  })

  test("31 - copilot chat", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForTimeout(1500)
    const textarea = page.locator("textarea").first()
    if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await textarea.fill("Summarize this article")
      await textarea.press("Enter")
      await page.waitForTimeout(4000)
    }
    await page.screenshot({ path: `${SHOTS}/31-copilot-chat.png`, fullPage: false })
  })

  test("32 - copilot mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(BASE)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${SHOTS}/32-copilot-mobile.png`, fullPage: false })
  })
})
