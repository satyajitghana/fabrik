import { test } from "@playwright/test"

const BASE = "http://localhost:4700"
const SHOTS = "apps/web/tests/screenshots"

test.describe("website", () => {
  test("70 - website hero", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=Generative UI")
    await page.waitForTimeout(4000)
    await page.screenshot({ path: `${SHOTS}/70-website-hero.png`, fullPage: false })
  })

  test("71 - website full", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForSelector("text=Generative UI")
    await page.waitForTimeout(4000)
    await page.screenshot({ path: `${SHOTS}/71-website-full.png`, fullPage: true })
  })

  test("72 - website features", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForTimeout(1000)
    await page.evaluate(() => document.getElementById("features")?.scrollIntoView({ behavior: "instant" }))
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `${SHOTS}/72-website-features.png`, fullPage: false })
  })

  test("73 - website mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(BASE)
    await page.waitForSelector("text=Generative UI")
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${SHOTS}/73-website-mobile.png`, fullPage: false })
  })

  test("74 - website mobile menu", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(BASE)
    await page.waitForSelector("text=Generative UI")
    await page.waitForTimeout(1000)
    const menuBtn = page.locator("button[aria-label='Open menu']")
    if (await menuBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await menuBtn.click()
      await page.waitForTimeout(300)
    }
    await page.screenshot({ path: `${SHOTS}/74-website-mobile-menu.png`, fullPage: false })
  })

  test("75 - playground empty", async ({ page }) => {
    await page.goto(`${BASE}/playground`)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${SHOTS}/75-playground-empty.png`, fullPage: false })
  })

  test("76 - playground weather", async ({ page }) => {
    await page.goto(`${BASE}/playground`)
    await page.waitForTimeout(1500)
    const textarea = page.locator("textarea").first()
    if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await textarea.fill("Show weather")
      await textarea.press("Enter")
      await page.waitForTimeout(3000)
    }
    await page.screenshot({ path: `${SHOTS}/76-playground-weather.png`, fullPage: false })
  })

  test("77 - playground dashboard", async ({ page }) => {
    await page.goto(`${BASE}/playground`)
    await page.waitForTimeout(1500)
    const textarea = page.locator("textarea").first()
    if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await textarea.fill("Dashboard stats")
      await textarea.press("Enter")
      await page.waitForTimeout(3000)
    }
    await page.screenshot({ path: `${SHOTS}/77-playground-dashboard.png`, fullPage: false })
  })
})
