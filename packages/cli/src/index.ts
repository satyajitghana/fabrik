import { Command } from "commander"
import { init } from "./init.js"
import { add } from "./add.js"
import { create } from "./create.js"
import { diff } from "./diff.js"

const program = new Command()

program
  .name("fabrik")
  .description("CLI for fabrik-ui — Generative UI SDK")
  .version("0.0.1")

program
  .command("init")
  .description("Initialize fabrik-ui in your project")
  .option("-d, --defaults", "Use default configuration", false)
  .action(init)

program
  .command("add [components...]")
  .description("Add components to your project (shadcn-style)")
  .option("--all", "Add all available components")
  .option("--overwrite", "Overwrite existing files")
  .option("-c, --cwd <path>", "Working directory")
  .action(add)

program
  .command("create [project-name]")
  .description("Scaffold a new fabrik-ui application")
  .option("-t, --template <template>", "Template: chat, copilot, widget, minimal")
  .option("-p, --provider <provider>", "LLM provider: openai, anthropic, google, none")
  .action(create)

program
  .command("diff [component]")
  .description("Show what changed in a component since it was installed")
  .option("-c, --cwd <path>", "Working directory")
  .action(diff)

program.parse()
