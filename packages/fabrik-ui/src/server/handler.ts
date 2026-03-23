import type { Provider, FabrikMessage, ToolSpec, StreamEvent } from "../core/types"

interface HandlerRequestBody {
  messages: FabrikMessage[]
  tools?: ToolSpec[]
  systemPrompt?: string
}

/**
 * Creates a Next.js-compatible API route handler that streams LLM responses
 * as server-sent events.
 *
 * @example
 * ```ts
 * import { openai } from "@fabrik-sdk/ui/openai"
 * import { handler } from "@fabrik-sdk/ui/server"
 *
 * export const POST = handler({ provider: openai({ model: "gpt-4o" }) })
 * ```
 */
export function handler(options: {
  provider: Provider
}): (req: Request) => Promise<Response> {
  const { provider } = options

  return async (req: Request): Promise<Response> => {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      })
    }

    let body: HandlerRequestBody
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { messages, tools, systemPrompt } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'messages' field" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    const signal = req.signal

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        const send = (event: StreamEvent) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
          } catch {
            // Controller already closed; ignore.
          }
        }

        try {
          const iterable = provider.stream({
            messages,
            tools: tools ?? [],
            systemPrompt: systemPrompt ?? "",
            signal,
          })

          for await (const event of iterable) {
            if (signal?.aborted) {
              break
            }
            send(event)
          }
        } catch (err: unknown) {
          if (signal?.aborted) {
            // Client disconnected; nothing more to send.
          } else {
            const message =
              err instanceof Error ? err.message : "Internal server error"
            send({ type: "error", message })
          }
        } finally {
          try {
            controller.close()
          } catch {
            // Already closed.
          }
        }
      },
    })

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  }
}
