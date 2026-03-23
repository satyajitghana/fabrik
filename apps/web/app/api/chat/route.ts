import { aiSdk } from "@fabrik-sdk/ui/ai-sdk"
import { handler } from "@fabrik-sdk/ui/server"
import { google } from "@ai-sdk/google"

export const POST = handler({
  provider: aiSdk({ model: google("gemini-3-flash-preview") }),
})
