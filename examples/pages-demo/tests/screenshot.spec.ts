import { test } from "@playwright/test"

const BASE = "http://localhost:4600"
const SHOTS = "examples/pages-demo/tests/screenshots"

test.describe("fabrik-store", () => {
  test("60 - store home", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${SHOTS}/60-store-home.png`, fullPage: false })
  })

  test("61 - store full page", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${SHOTS}/61-store-full.png`, fullPage: true })
  })

  test("62 - store shop page", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForTimeout(1500)
    const shopTab = page.locator("button", { hasText: "Shop" })
    if (await shopTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await shopTab.click()
      await page.waitForTimeout(500)
    }
    await page.screenshot({ path: `${SHOTS}/62-store-shop.png`, fullPage: true })
  })

  test("63 - store cart", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForTimeout(1500)
    // Add a product
    const addBtn = page.locator("button", { hasText: "Add to Cart" }).first()
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click()
      await page.waitForTimeout(300)
      const cartTab = page.locator("header button", { hasText: /Cart/ }).first()
      await cartTab.click()
      await page.waitForTimeout(500)
    }
    await page.screenshot({ path: `${SHOTS}/63-store-cart.png`, fullPage: true })
  })

  test("64 - store mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(BASE)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${SHOTS}/64-store-mobile.png`, fullPage: true })
  })
})
