import { test } from "@playwright/test"

const BASE = "http://localhost:4500"
const SHOTS = "examples/local-model/tests/screenshots"

test.describe("local-model", () => {
  test("50 - local empty", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${SHOTS}/50-local-empty.png`, fullPage: false })
  })

  test("51 - local chat", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForTimeout(1500)
    const textarea = page.locator("textarea").first()
    if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await textarea.fill("Hello")
      await textarea.press("Enter")
      await page.waitForTimeout(3000)
    }
    await page.screenshot({ path: `${SHOTS}/51-local-chat.png`, fullPage: false })
  })

  test("52 - local weather", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForTimeout(1500)
    const textarea = page.locator("textarea").first()
    if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await textarea.fill("Show weather")
      await textarea.press("Enter")
      await page.waitForTimeout(4000)
    }
    await page.screenshot({ path: `${SHOTS}/52-local-weather.png`, fullPage: true })
  })
})
