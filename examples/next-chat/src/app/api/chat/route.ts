import { handler } from "@fabrik-sdk/ui/server"
import { createMockProvider } from "@/lib/mock-provider"

// ---------------------------------------------------------------------------
// Production — just one line:
//
//   export const POST = handler({ model: "openai:gpt-4o" })
//
// Reads OPENAI_API_KEY from .env.local automatically.
// Swap to "anthropic:claude-sonnet-4-20250514" or "google:gemini-2.0-flash".
// ---------------------------------------------------------------------------

// Demo mode: uses mock provider (no API key needed)
export const POST = handler({ provider: createMockProvider() })
