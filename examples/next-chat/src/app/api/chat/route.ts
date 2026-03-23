import { handler } from "@fabrik-sdk/ui/server"
import { createMockProvider } from "@/lib/mock-provider"

// ---------------------------------------------------------------------------
// Production — use AI SDK with any provider:
//
//   import { aiSdk } from "@fabrik-sdk/ui/ai-sdk"
//   import { google } from "@ai-sdk/google"
//   export const POST = handler({
//     provider: aiSdk({ model: google("gemini-3-flash-preview") })
//   })
//
// Reads GOOGLE_GENERATIVE_AI_API_KEY from .env.local automatically.
// ---------------------------------------------------------------------------

// Demo mode: mock provider (no API key needed)
export const POST = handler({ provider: createMockProvider() })
