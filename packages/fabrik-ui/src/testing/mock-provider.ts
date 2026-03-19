import type { Provider, StreamEvent, StreamOptions } from "../core/types"

/** Create a Provider that emits predefined events */
export function mockProvider(
  events: StreamEvent[],
  options?: { delayMs?: number }
): Provider {
  const delayMs = options?.delayMs ?? 0

  return {
    name: "mock",
    async *stream(_options: StreamOptions): AsyncIterable<StreamEvent> {
      for (const event of events) {
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
        yield event
      }
    },
  }
}

/** Create a Provider that calls a function for each run */
export function mockProviderWithFn(
  fn: (options: StreamOptions) => StreamEvent[]
): Provider {
  return {
    name: "mock",
    async *stream(options: StreamOptions): AsyncIterable<StreamEvent> {
      const events = fn(options)
      for (const event of events) {
        yield event
      }
    },
  }
}
