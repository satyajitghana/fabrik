import { test } from "@playwright/test"

const BASE = "http://localhost:4200"
const SHOTS = "examples/next-widget/tests/screenshots"

test.describe("next-widget", () => {
  test("20 - widget hero", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${SHOTS}/20-widget-hero.png`, fullPage: false })
  })

  test("21 - widget full page", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${SHOTS}/21-widget-full.png`, fullPage: true })
  })

  test("22 - widget FAB visible", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${SHOTS}/22-widget-fab.png`, fullPage: false })
  })

  test("23 - widget FAB opened", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForTimeout(2000)
    const fab = page.locator("button[aria-label='Open chat']")
    if (await fab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fab.click()
      await page.waitForTimeout(1000)
    }
    await page.screenshot({ path: `${SHOTS}/23-widget-fab-open.png`, fullPage: false })
  })

  test("24 - widget mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(BASE)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${SHOTS}/24-widget-mobile.png`, fullPage: true })
  })
})
