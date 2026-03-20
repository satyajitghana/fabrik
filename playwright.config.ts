import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: ".",
  testMatch: [
    "examples/*/tests/**/*.spec.ts",
    "apps/*/tests/**/*.spec.ts",
  ],
  timeout: 30000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
  },
})
