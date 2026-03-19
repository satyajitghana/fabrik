import type { Provider, StreamOptions, StreamEvent } from "../core/types"

/**
 * Creates a client-side Provider that proxies requests to a remote server
 * endpoint (created with `handler`) via fetch + SSE streaming.
 */
export function server(options: { url: string }): Provider {
  const { url } = options

  return {
    name: "server",

    async *stream(streamOptions: StreamOptions): AsyncIterable<StreamEvent> {
      const { messages, tools, systemPrompt, signal } = streamOptions

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, tools, systemPrompt }),
        signal,
      })

      if (!response.ok) {
        let errorMessage: string
        try {
          const errorBody = await response.json()
          errorMessage = errorBody.error ?? response.statusText
        } catch {
          errorMessage = response.statusText || `HTTP ${response.status}`
        }
        yield { type: "error", message: errorMessage } satisfies StreamEvent
        return
      }

      const body = response.body
      if (!body) {
        yield { type: "error", message: "Empty response body" } satisfies StreamEvent
        return
      }

      const reader = body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            break
          }

          buffer += decoder.decode(value, { stream: true })

          // Process complete SSE messages from the buffer.
          // Each message is delimited by a double newline.
          const parts = buffer.split("\n\n")
          // The last element is either an incomplete chunk or empty string.
          buffer = parts.pop()!

          for (const part of parts) {
            const trimmed = part.trim()
            if (!trimmed) {
              continue
            }

            // SSE lines may include multiple `data:` fields; we only expect one per event.
            const dataPrefix = "data: "
            if (!trimmed.startsWith(dataPrefix)) {
              continue
            }

            const jsonStr = trimmed.slice(dataPrefix.length)

            let event: StreamEvent
            try {
              event = JSON.parse(jsonStr) as StreamEvent
            } catch {
              // Malformed JSON — skip this event.
              continue
            }

            yield event
          }
        }

        // Process any remaining data in the buffer after the stream ends.
        if (buffer.trim()) {
          const remaining = buffer.trim()
          const dataPrefix = "data: "
          if (remaining.startsWith(dataPrefix)) {
            const jsonStr = remaining.slice(dataPrefix.length)
            try {
              const event = JSON.parse(jsonStr) as StreamEvent
              yield event
            } catch {
              // Malformed trailing data; ignore.
            }
          }
        }
      } catch (err: unknown) {
        if (signal?.aborted) {
          // Client aborted; stop silently.
          return
        }
        const message =
          err instanceof Error ? err.message : "Stream reading failed"
        yield { type: "error", message } satisfies StreamEvent
      } finally {
        reader.releaseLock()
      }
    },
  }
}
