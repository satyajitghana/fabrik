import { defineConfig } from "tsup"
import { cpSync, mkdirSync } from "fs"

const shared = {
  format: ["cjs", "esm"] as const,
  dts: true,
  outDir: "dist",
  external: ["react", "react-dom", "zod", "motion", "openai", "@anthropic-ai/sdk", "@google/genai"],
}

export default defineConfig([
  {
    ...shared,
    entry: { "core/index": "src/core/index.ts" },
    clean: true,
    onSuccess: async () => {
      // Copy CSS files to dist
      mkdirSync("dist/themes", { recursive: true })
      cpSync("src/themes/styles.css", "dist/styles.css")
      cpSync("src/themes/neutral.css", "dist/themes/neutral.css")
      cpSync("src/themes/blue.css", "dist/themes/blue.css")
    },
  },
  {
    ...shared,
    entry: { "react/index": "src/react/index.ts" },
  },
  {
    ...shared,
    entry: {
      "adapters/openai": "src/adapters/openai.ts",
      "adapters/anthropic": "src/adapters/anthropic.ts",
      "adapters/google": "src/adapters/google.ts",
      "adapters/custom": "src/adapters/custom.ts",
      "adapters/ai-sdk": "src/adapters/ai-sdk.ts",
      "adapters/index": "src/adapters/index.ts",
    },
  },
  {
    ...shared,
    entry: { "server/index": "src/server/index.ts" },
  },
  {
    ...shared,
    entry: { "testing/index": "src/testing/index.ts" },
  },
  {
    ...shared,
    entry: { "ui/index": "src/ui/index.ts" },
  },
  {
    ...shared,
    entry: { "pages/index": "src/pages/index.ts" },
  },
])
