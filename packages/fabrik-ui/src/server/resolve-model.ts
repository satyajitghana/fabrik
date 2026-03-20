import type { Provider } from "../core/types"

/**
 * Known provider prefixes and their env var names.
 */
const PROVIDER_CONFIG: Record<string, { envVar: string; defaultModel: string }> = {
  openai: { envVar: "OPENAI_API_KEY", defaultModel: "gpt-4o" },
  anthropic: { envVar: "ANTHROPIC_API_KEY", defaultModel: "claude-sonnet-4-20250514" },
  google: { envVar: "GOOGLE_AI_API_KEY", defaultModel: "gemini-2.0-flash" },
}

/**
 * Resolves a model string like "openai:gpt-4o" into a Fabrik Provider instance.
 * Reads API keys from environment variables automatically.
 * Uses dynamic import to avoid pulling in unused provider SDKs.
 */
export async function resolveModel(modelString: string): Promise<Provider> {
  const colonIndex = modelString.indexOf(":")
  const providerName = colonIndex >= 0 ? modelString.slice(0, colonIndex) : modelString
  const modelName = colonIndex >= 0 ? modelString.slice(colonIndex + 1) : undefined

  const config = PROVIDER_CONFIG[providerName]
  if (!config) {
    throw new Error(
      `Unknown provider "${providerName}". Supported: ${Object.keys(PROVIDER_CONFIG).join(", ")}. ` +
      `Format: "provider:model" (e.g., "openai:gpt-4o").`
    )
  }

  const model = modelName ?? config.defaultModel

  switch (providerName) {
    case "openai": {
      const { openai } = await import("../adapters/openai")
      return openai({ model })
    }
    case "anthropic": {
      const { anthropic } = await import("../adapters/anthropic")
      return anthropic({ model })
    }
    case "google": {
      const { google } = await import("../adapters/google")
      return google({ model })
    }
    default:
      throw new Error(`Provider "${providerName}" has no built-in adapter.`)
  }
}
