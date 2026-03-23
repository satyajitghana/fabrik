import { existsSync, writeFileSync, readFileSync } from "fs"
import { join } from "path"
import prompts from "prompts"
import chalk from "chalk"

export async function init(options: { defaults?: boolean }) {
  console.log(chalk.bold("\n  fabrik-ui init\n"))

  const cwd = process.cwd()

  // Check if package.json exists
  const pkgPath = join(cwd, "package.json")
  if (!existsSync(pkgPath)) {
    console.log(chalk.red("  No package.json found. Run this from a project root.\n"))
    process.exit(1)
  }

  let config = {
    componentsDir: "components/fabrik",
    cssFile: "src/app/globals.css",
  }

  if (!options.defaults) {
    const answers = await prompts([
      {
        type: "text",
        name: "componentsDir",
        message: "Where should components be installed?",
        initial: "components/fabrik",
      },
      {
        type: "text",
        name: "cssFile",
        message: "Path to your global CSS file?",
        initial: "src/app/globals.css",
      },
    ])
    config = { ...config, ...answers }
  }

  // Write fabrik.config.ts
  const configContent = `import type { FabrikConfig } from "@fabrik/cli"

const config: FabrikConfig = {
  componentsDir: "${config.componentsDir}",
  aliases: {
    components: "@/components/fabrik",
    utils: "@/lib/utils",
  },
  tailwindCss: "${config.cssFile}",
}

export default config
`
  const configPath = join(cwd, "fabrik.config.ts")
  writeFileSync(configPath, configContent)
  console.log(chalk.green("  ✓"), "Created fabrik.config.ts")

  // Add styles import to CSS file
  const cssPath = join(cwd, config.cssFile)
  if (existsSync(cssPath)) {
    let css = readFileSync(cssPath, "utf-8")
    if (!css.includes("@fabrik-sdk/ui/styles.css")) {
      css = `@import "@fabrik-sdk/ui/styles.css";\n${css}`
      writeFileSync(cssPath, css)
      console.log(chalk.green("  ✓"), `Added styles import to ${config.cssFile}`)
    }
  }

  // Create utils.ts if it doesn't exist
  const utilsDir = join(cwd, "src/lib")
  const utilsPath = join(utilsDir, "utils.ts")
  if (!existsSync(utilsPath)) {
    const { mkdirSync } = await import("fs")
    mkdirSync(utilsDir, { recursive: true })
    writeFileSync(
      utilsPath,
      `import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`
    )
    console.log(chalk.green("  ✓"), "Created src/lib/utils.ts")
  }

  console.log(chalk.green("\n  ✓ fabrik-ui initialized!\n"))
  console.log("  Next steps:")
  console.log(chalk.dim("    pnpm add @fabrik-sdk/ui zod motion"))
  console.log(chalk.dim("    fabrik add card code-block table\n"))
}

export interface FabrikConfig {
  componentsDir: string
  aliases: {
    components: string
    utils: string
  }
  tailwindCss: string
}
