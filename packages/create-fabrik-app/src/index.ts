import { Command } from "commander"
import prompts from "prompts"
import chalk from "chalk"
import { mkdirSync, writeFileSync, existsSync } from "fs"
import { join } from "path"

export interface CreateOptions {
  projectName?: string
  template?: string
  provider?: string
}

const TEMPLATES = ["chat", "copilot", "widget", "minimal"] as const
type Template = (typeof TEMPLATES)[number]

const PROVIDERS = ["openai", "anthropic", "google", "none"] as const
type Provider = (typeof PROVIDERS)[number]

export async function createApp(options: CreateOptions = {}) {
  console.log(chalk.bold("\n  create-fabrik-app\n"))

  let projectName = options.projectName
  let template = options.template as Template | undefined
  let provider = options.provider as Provider | undefined

  // Ask project name if not provided
  if (!projectName) {
    const answer = await prompts({
      type: "text",
      name: "projectName",
      message: "Project name:",
      initial: "my-fabrik-app",
    })
    projectName = answer.projectName
    if (!projectName) {
      console.log(chalk.red("\n  Cancelled.\n"))
      process.exit(1)
    }
  }

  // Ask template
  if (!template) {
    const answer = await prompts({
      type: "select",
      name: "template",
      message: "Select a template:",
      choices: [
        { title: "Chat", description: "Full chat UI with message list and input", value: "chat" },
        { title: "Copilot", description: "Side-panel copilot assistant", value: "copilot" },
        { title: "Widget", description: "Embeddable chat widget", value: "widget" },
        { title: "Minimal", description: "Bare bones with <Fabrik> + useChat()", value: "minimal" },
      ],
      initial: 0,
    })
    template = answer.template
    if (!template) {
      console.log(chalk.red("\n  Cancelled.\n"))
      process.exit(1)
    }
  }

  // Ask provider
  if (!provider) {
    const answer = await prompts({
      type: "select",
      name: "provider",
      message: "LLM provider:",
      choices: [
        { title: "OpenAI", value: "openai" },
        { title: "Anthropic", value: "anthropic" },
        { title: "Google", value: "google" },
        { title: "None (configure later)", value: "none" },
      ],
      initial: 0,
    })
    provider = answer.provider
    if (!provider) {
      console.log(chalk.red("\n  Cancelled.\n"))
      process.exit(1)
    }
  }

  // Create project
  const projectDir = join(process.cwd(), projectName)

  if (existsSync(projectDir)) {
    console.log(chalk.red(`\n  Directory "${projectName}" already exists.\n`))
    process.exit(1)
  }

  console.log(chalk.dim(`\n  Creating ${projectName}...\n`))

  // Create directory structure
  mkdirSync(join(projectDir, "src/app"), { recursive: true })
  mkdirSync(join(projectDir, "src/lib"), { recursive: true })

  // Write package.json
  writeFileSync(
    join(projectDir, "package.json"),
    generatePackageJson(projectName, provider)
  )
  console.log(chalk.green("  +"), "package.json")

  // Write next.config.ts
  writeFileSync(join(projectDir, "next.config.ts"), generateNextConfig())
  console.log(chalk.green("  +"), "next.config.ts")

  // Write tsconfig.json
  writeFileSync(join(projectDir, "tsconfig.json"), generateTsConfig())
  console.log(chalk.green("  +"), "tsconfig.json")

  // Write globals.css
  writeFileSync(join(projectDir, "src/app/globals.css"), generateGlobalsCss())
  console.log(chalk.green("  +"), "src/app/globals.css")

  // Write layout.tsx
  writeFileSync(join(projectDir, "src/app/layout.tsx"), generateLayout(projectName))
  console.log(chalk.green("  +"), "src/app/layout.tsx")

  // Write page.tsx
  writeFileSync(
    join(projectDir, "src/app/page.tsx"),
    generatePage(template)
  )
  console.log(chalk.green("  +"), "src/app/page.tsx")

  // Write .env.local
  writeFileSync(join(projectDir, ".env.local"), generateEnvLocal(provider))
  console.log(chalk.green("  +"), ".env.local")

  // Write API route
  mkdirSync(join(projectDir, "src/app/api/chat"), { recursive: true })
  writeFileSync(
    join(projectDir, "src/app/api/chat/route.ts"),
    generateApiRoute(provider)
  )
  console.log(chalk.green("  +"), "src/app/api/chat/route.ts")

  // For chat template, write additional components
  if (template === "chat") {
    mkdirSync(join(projectDir, "src/components"), { recursive: true })
    writeFileSync(
      join(projectDir, "src/components/chat-panel.tsx"),
      generateChatPanel()
    )
    console.log(chalk.green("  +"), "src/components/chat-panel.tsx")
  }

  // Print next steps
  console.log(chalk.green(`\n  Project "${projectName}" created!\n`))
  console.log("  Next steps:\n")
  console.log(chalk.cyan(`    cd ${projectName}`))
  console.log(chalk.cyan("    pnpm install"))
  if (provider !== "none") {
    console.log(chalk.cyan(`    # Add your ${provider.toUpperCase()} API key to .env.local`))
  }
  console.log(chalk.cyan("    pnpm dev"))
  console.log()
}

function generatePackageJson(name: string, provider: Provider): string {
  const deps: Record<string, string> = {
    next: "^15.3.0",
    react: "^19.1.0",
    "react-dom": "^19.1.0",
    "@fabrik-sdk/ui": "^0.0.1",
    zod: "^3.24.0",
    motion: "^12.0.0",
  }

  if (provider === "openai") {
    deps["ai"] = "^4.3.0"
    deps["@ai-sdk/openai"] = "^1.3.0"
  } else if (provider === "anthropic") {
    deps["ai"] = "^4.3.0"
    deps["@ai-sdk/anthropic"] = "^1.3.0"
  } else if (provider === "google") {
    deps["ai"] = "^4.3.0"
    deps["@ai-sdk/google"] = "^1.3.0"
  } else {
    deps["ai"] = "^4.3.0"
  }

  return JSON.stringify(
    {
      name,
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
      },
      dependencies: deps,
      devDependencies: {
        typescript: "^5.9.3",
        "@types/node": "^22.0.0",
        "@types/react": "^19.1.0",
        "@types/react-dom": "^19.1.0",
        tailwindcss: "^4.0.0",
        "@tailwindcss/postcss": "^4.0.0",
        postcss: "^8.5.0",
      },
    },
    null,
    2
  )
}

function generateNextConfig(): string {
  return `import type { NextConfig } from "next"

const nextConfig: NextConfig = {}

export default nextConfig
`
}

function generateTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2017",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [{ name: "next" }],
        paths: {
          "@/*": ["./src/*"],
        },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    },
    null,
    2
  )
}

function generateGlobalsCss(): string {
  return `@import "tailwindcss";
@import "@fabrik-sdk/ui/styles.css";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: system-ui, -apple-system, sans-serif;
}
`
}

function generateLayout(projectName: string): string {
  return `import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "${projectName}",
  description: "Built with fabrik-ui",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`
}

function generatePage(template: Template): string {
  if (template === "minimal") {
    return `"use client"

import { Fabrik, useChat } from "@fabrik-sdk/ui"

export default function Home() {
  const chat = useChat({ api: "/api/chat" })

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">fabrik-ui minimal</h1>
        <Fabrik chat={chat}>
          <div className="space-y-4">
            {chat.messages.map((msg) => (
              <div key={msg.id} className="p-3 rounded-lg border">
                <p className="text-xs font-medium text-gray-500 mb-1">
                  {msg.role}
                </p>
                <p>{msg.content}</p>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              chat.handleSubmit(e)
            }}
            className="mt-4 flex gap-2"
          >
            <input
              value={chat.input}
              onChange={chat.handleInputChange}
              placeholder="Say something..."
              className="flex-1 rounded-lg border px-4 py-2"
            />
            <button
              type="submit"
              className="rounded-lg bg-black text-white px-4 py-2 hover:bg-gray-800"
            >
              Send
            </button>
          </form>
        </Fabrik>
      </div>
    </main>
  )
}
`
  }

  if (template === "chat") {
    return `"use client"

import { ChatPanel } from "@/components/chat-panel"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3 flex items-center gap-3">
        <h1 className="text-lg font-semibold">fabrik-ui chat</h1>
      </header>
      <ChatPanel />
    </main>
  )
}
`
  }

  if (template === "copilot") {
    return `"use client"

import { Fabrik, useChat } from "@fabrik-sdk/ui"

export default function Home() {
  const chat = useChat({ api: "/api/chat" })

  return (
    <main className="min-h-screen flex">
      {/* Main content area */}
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-4">Your Application</h1>
        <p className="text-gray-600">
          This is your main content area. The copilot panel is on the right.
        </p>
      </div>

      {/* Copilot side panel */}
      <aside className="w-96 border-l flex flex-col h-screen">
        <div className="px-4 py-3 border-b font-medium text-sm">
          Copilot
        </div>
        <Fabrik chat={chat}>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chat.messages.map((msg) => (
              <div
                key={msg.id}
                className={\`p-3 rounded-lg text-sm \${
                  msg.role === "user"
                    ? "bg-blue-50 ml-8"
                    : "bg-gray-50 mr-8"
                }\`}
              >
                {msg.content}
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              chat.handleSubmit(e)
            }}
            className="p-4 border-t flex gap-2"
          >
            <input
              value={chat.input}
              onChange={chat.handleInputChange}
              placeholder="Ask the copilot..."
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-black text-white px-3 py-2 text-sm hover:bg-gray-800"
            >
              Send
            </button>
          </form>
        </Fabrik>
      </aside>
    </main>
  )
}
`
  }

  // widget template
  return `"use client"

import { useState } from "react"
import { Fabrik, useChat } from "@fabrik-sdk/ui"

function ChatWidget() {
  const chat = useChat({ api: "/api/chat" })

  return (
    <div className="w-80 h-96 rounded-2xl shadow-2xl border bg-white flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b font-medium text-sm bg-black text-white rounded-t-2xl">
        Chat Widget
      </div>
      <Fabrik chat={chat}>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {chat.messages.length === 0 && (
            <p className="text-xs text-gray-400 text-center mt-8">
              How can I help you?
            </p>
          )}
          {chat.messages.map((msg) => (
            <div
              key={msg.id}
              className={\`p-2 rounded-lg text-sm \${
                msg.role === "user"
                  ? "bg-blue-50 ml-6 text-right"
                  : "bg-gray-50 mr-6"
              }\`}
            >
              {msg.content}
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            chat.handleSubmit(e)
          }}
          className="p-3 border-t flex gap-2"
        >
          <input
            value={chat.input}
            onChange={chat.handleInputChange}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-black text-white px-3 py-1.5 text-sm hover:bg-gray-800"
          >
            Go
          </button>
        </form>
      </Fabrik>
    </div>
  )
}

export default function Home() {
  const [open, setOpen] = useState(false)

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">fabrik-ui widget</h1>
      <p className="text-gray-600">Click the button in the bottom-right corner to open the chat widget.</p>

      {/* Floating widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {open && <ChatWidget />}
        <button
          onClick={() => setOpen(!open)}
          className="w-14 h-14 rounded-full bg-black text-white shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors text-xl"
        >
          {open ? "X" : "?"}
        </button>
      </div>
    </main>
  )
}
`
}

function generateEnvLocal(provider: Provider): string {
  if (provider === "openai") {
    return `# Add your OpenAI API key here
OPENAI_API_KEY=sk-...
`
  }
  if (provider === "anthropic") {
    return `# Add your Anthropic API key here
ANTHROPIC_API_KEY=sk-ant-...
`
  }
  if (provider === "google") {
    return `# Add your Google AI API key here
GOOGLE_GENERATIVE_AI_API_KEY=...
`
  }
  return `# Add your LLM provider API key here
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# GOOGLE_GENERATIVE_AI_API_KEY=...
`
}

function generateApiRoute(provider: Provider): string {
  if (provider === "openai") {
    return `import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

export const runtime = "edge"

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: openai("gpt-4o"),
    messages,
  })

  return result.toDataStreamResponse()
}
`
  }

  if (provider === "anthropic") {
    return `import { anthropic } from "@ai-sdk/anthropic"
import { streamText } from "ai"

export const runtime = "edge"

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    messages,
  })

  return result.toDataStreamResponse()
}
`
  }

  if (provider === "google") {
    return `import { google } from "@ai-sdk/google"
import { streamText } from "ai"

export const runtime = "edge"

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: google("gemini-2.0-flash"),
    messages,
  })

  return result.toDataStreamResponse()
}
`
  }

  return `import { streamText } from "ai"

export const runtime = "edge"

export async function POST(req: Request) {
  const { messages } = await req.json()

  // TODO: Configure your LLM provider
  // import { openai } from "@ai-sdk/openai"
  // const result = streamText({ model: openai("gpt-4o"), messages })

  return new Response("Configure an LLM provider in src/app/api/chat/route.ts", {
    status: 501,
  })
}
`
}

function generateChatPanel(): string {
  return `"use client"

import { Fabrik, useChat } from "@fabrik-sdk/ui"

export function ChatPanel() {
  const chat = useChat({ api: "/api/chat" })

  return (
    <Fabrik chat={chat}>
      <div className="flex-1 flex flex-col h-[calc(100vh-57px)]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chat.messages.length === 0 && (
            <div className="text-center text-gray-400 mt-20">
              <p className="text-lg">Welcome to fabrik-ui chat</p>
              <p className="text-sm mt-1">Send a message to get started.</p>
            </div>
          )}
          {chat.messages.map((msg) => (
            <div
              key={msg.id}
              className={\`flex \${msg.role === "user" ? "justify-end" : "justify-start"}\`}
            >
              <div
                className={\`max-w-[70%] rounded-2xl px-4 py-3 \${
                  msg.role === "user"
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-900"
                }\`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {chat.isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <p className="text-sm text-gray-400">Thinking...</p>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              chat.handleSubmit(e)
            }}
            className="flex gap-3 max-w-3xl mx-auto"
          >
            <input
              value={chat.input}
              onChange={chat.handleInputChange}
              placeholder="Type a message..."
              className="flex-1 rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
            <button
              type="submit"
              disabled={chat.isLoading || !chat.input.trim()}
              className="rounded-xl bg-black text-white px-6 py-3 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </Fabrik>
  )
}
`
}

// --- CLI entry point ---

const program = new Command()

program
  .name("create-fabrik-app")
  .description("Scaffold a new fabrik-ui application")
  .version("0.0.1")
  .argument("[project-name]", "Name of the project")
  .option("-t, --template <template>", "Template: chat, copilot, widget, minimal")
  .option("-p, --provider <provider>", "LLM provider: openai, anthropic, google, none")
  .action(async (projectName: string | undefined, opts: { template?: string; provider?: string }) => {
    await createApp({
      projectName,
      template: opts.template,
      provider: opts.provider,
    })
  })

program.parse()
