import type {
  AskConfig,
  FabrikMessage,
  FabrikThread,
  Provider,
  StreamEvent,
  StreamOptions,
  ToolSpec,
} from "./types"
import type { ComponentRegistry, ToolRegistry } from "./registry"
import type { StateAction } from "./reducer"
import { generateId, isComponentTool, isElicitationTool, extractComponentName } from "./utils"

// ---------------------------------------------------------------------------
// EventQueue — bridges async iterable with push-based event production
// ---------------------------------------------------------------------------

export class EventQueue<T> {
  private queue: T[] = []
  private resolve: ((value: IteratorResult<T>) => void) | null = null
  private done = false
  private error: Error | null = null

  push(event: T): void {
    if (this.done) return
    if (this.resolve) {
      const r = this.resolve
      this.resolve = null
      r({ value: event, done: false })
    } else {
      this.queue.push(event)
    }
  }

  end(): void {
    this.done = true
    if (this.resolve) {
      const r = this.resolve
      this.resolve = null
      r({ value: undefined as unknown as T, done: true as const })
    }
  }

  fail(err: Error): void {
    this.error = err
    this.done = true
    if (this.resolve) {
      const r = this.resolve
      this.resolve = null
      r({ value: undefined as unknown as T, done: true as const })
    }
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    return {
      next: () => {
        if (this.error) return Promise.reject(this.error)
        if (this.queue.length > 0) {
          return Promise.resolve({ value: this.queue.shift()!, done: false })
        }
        if (this.done) {
          return Promise.resolve({ value: undefined as unknown as T, done: true as const })
        }
        return new Promise((resolve) => {
          this.resolve = resolve
        })
      },
      return: () => {
        this.done = true
        return Promise.resolve({ value: undefined as unknown as T, done: true as const })
      },
      [Symbol.asyncIterator]() {
        return this
      },
    }
  }
}

// ---------------------------------------------------------------------------
// ElicitationQueue — pauses the stream until user responds to an ask
// ---------------------------------------------------------------------------

export class ElicitationQueue {
  private waiters = new Map<string, (response: unknown) => void>()

  wait(askId: string): Promise<unknown> {
    return new Promise((resolve) => {
      this.waiters.set(askId, resolve)
    })
  }

  respond(askId: string, response: unknown): void {
    const waiter = this.waiters.get(askId)
    if (waiter) {
      this.waiters.delete(askId)
      waiter(response)
    }
  }
}

// ---------------------------------------------------------------------------
// FabrikStream — streaming run that processes events from the provider
// ---------------------------------------------------------------------------

export interface FabrikStreamOptions {
  provider: Provider
  threadId: string
  messages: FabrikMessage[]
  systemPrompt: string
  componentRegistry: ComponentRegistry
  toolRegistry: ToolRegistry
  elicitationQueue: ElicitationQueue
  dispatch: (action: StateAction) => void
  signal?: AbortSignal
  maxSteps?: number
}

export class FabrikStream implements AsyncIterable<StreamEvent> {
  readonly thread: Promise<FabrikThread>
  private eventQueue = new EventQueue<StreamEvent>()
  private abortController: AbortController
  private resolveThread!: (thread: FabrikThread) => void
  private rejectThread!: (error: Error) => void

  constructor(private options: FabrikStreamOptions) {
    this.abortController = new AbortController()

    // Link external signal
    if (options.signal) {
      options.signal.addEventListener("abort", () => this.abort())
    }

    this.thread = new Promise((resolve, reject) => {
      this.resolveThread = resolve
      this.rejectThread = reject
    })

    // Fire-and-forget the processing loop
    void this.processLoop()
  }

  abort(): void {
    this.abortController.abort()
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<StreamEvent> {
    return this.eventQueue[Symbol.asyncIterator]()
  }

  // -------------------------------------------------------------------------
  // Main processing loop
  // -------------------------------------------------------------------------

  private async processLoop(): Promise<void> {
    const {
      provider,
      threadId,
      systemPrompt,
      componentRegistry,
      toolRegistry,
      elicitationQueue,
      dispatch,
      maxSteps = 10,
    } = this.options

    let messages = [...this.options.messages]
    let steps = 0

    try {
      const runId = generateId()
      this.emit({ type: "start", runId })
      dispatch({ type: "STREAM_EVENT", threadId, event: { type: "start", runId } })

      while (steps < maxSteps) {
        steps++

        // Build tool specs: components + tools + elicitation
        const toolSpecs: ToolSpec[] = [
          ...componentRegistry.toToolSpecs(),
          ...toolRegistry.toToolSpecs(),
        ]

        // Stream from provider
        const pendingToolCalls = new Map<
          string,
          { name: string; argsJson: string }
        >()

        const providerStream = provider.stream({
          messages,
          systemPrompt,
          tools: toolSpecs,
          signal: this.abortController.signal,
        })

        for await (const event of providerStream) {
          // Translate tool_call events into component/step/ask events
          if (event.type === "tool_call_start") {
            const { id, toolName } = event
            pendingToolCalls.set(id, { name: toolName, argsJson: "" })

            if (isComponentTool(toolName)) {
              const compName = extractComponentName(toolName)
              const translated: StreamEvent = { type: "component_start", id, name: compName }
              this.emit(translated)
              dispatch({ type: "STREAM_EVENT", threadId, event: translated })
            }
            continue
          }

          if (event.type === "tool_call_delta") {
            const tc = pendingToolCalls.get(event.id)
            if (tc) tc.argsJson += event.delta

            if (tc && isComponentTool(tc.name)) {
              const translated: StreamEvent = { type: "component_delta", id: event.id, delta: event.delta }
              this.emit(translated)
              dispatch({ type: "STREAM_EVENT", threadId, event: translated })
            }
            continue
          }

          if (event.type === "tool_call_done") {
            const tc = pendingToolCalls.get(event.id)
            if (tc) tc.argsJson = JSON.stringify(event.args)

            if (tc && isComponentTool(tc.name)) {
              const translated: StreamEvent = { type: "component_done", id: event.id, props: event.args }
              this.emit(translated)
              dispatch({ type: "STREAM_EVENT", threadId, event: translated })
            }
            continue
          }

          // Pass through all other events directly
          this.emit(event)
          dispatch({ type: "STREAM_EVENT", threadId, event })
        }

        // If no tool calls were made, we're done
        if (pendingToolCalls.size === 0) break

        // Process tool calls: execute tools, handle elicitation
        let hasNonComponentCalls = false

        for (const [callId, { name, argsJson }] of pendingToolCalls) {
          // Component tools — already handled via translated events above
          if (isComponentTool(name)) continue

          hasNonComponentCalls = true
          const args = JSON.parse(argsJson)

          // Elicitation tools — pause and wait for user response
          if (isElicitationTool(name)) {
            const askEvent: StreamEvent = {
              type: "ask",
              id: callId,
              config: args as AskConfig,
            }
            this.emit(askEvent)
            dispatch({ type: "STREAM_EVENT", threadId, event: askEvent })

            const response = await elicitationQueue.wait(callId)
            dispatch({ type: "RESPOND_ASK", threadId, askId: callId, response })

            // Add tool result to messages for continuation
            messages = addToolResult(messages, callId, response)
            continue
          }

          // Regular tools — execute and add result
          const tool = toolRegistry.get(name)
          if (!tool) {
            messages = addToolResult(messages, callId, { error: `Unknown tool: ${name}` })
            continue
          }

          const stepTitle =
            typeof tool.stepTitle === "function"
              ? tool.stepTitle(args)
              : tool.stepTitle ?? `Calling ${name}`

          const stepStartEvent: StreamEvent = { type: "step_start", id: callId, title: stepTitle }
          this.emit(stepStartEvent)
          dispatch({ type: "STREAM_EVENT", threadId, event: stepStartEvent })

          const start = Date.now()
          try {
            const result = await tool.run(args)
            const durationMs = Date.now() - start
            const stepDoneEvent: StreamEvent = { type: "step_done", id: callId, stepStatus: "done", durationMs }
            this.emit(stepDoneEvent)
            dispatch({ type: "STREAM_EVENT", threadId, event: stepDoneEvent })
            messages = addToolResult(messages, callId, result)
          } catch (err) {
            const durationMs = Date.now() - start
            const stepDoneEvent: StreamEvent = { type: "step_done", id: callId, stepStatus: "failed", durationMs }
            this.emit(stepDoneEvent)
            dispatch({ type: "STREAM_EVENT", threadId, event: stepDoneEvent })
            messages = addToolResult(messages, callId, { error: (err as Error).message })
          }
        }

        // If only component calls were made (no regular tools), we're done
        if (!hasNonComponentCalls) break
      }

      // Done
      const doneEvent: StreamEvent = { type: "done" }
      this.emit(doneEvent)
      dispatch({ type: "STREAM_EVENT", threadId, event: doneEvent })
      this.eventQueue.end()

      // Resolve the thread promise
      // (The actual thread data will be in the state — we return a placeholder)
      this.resolveThread({
        id: threadId,
        messages,
        status: "idle",
        createdAt: "",
        updatedAt: new Date().toISOString(),
      })
    } catch (err) {
      const errorEvent: StreamEvent = { type: "error", message: (err as Error).message }
      this.emit(errorEvent)
      dispatch({ type: "STREAM_EVENT", threadId, event: errorEvent })
      this.eventQueue.fail(err as Error)
      this.rejectThread(err as Error)
    }
  }

  private emit(event: StreamEvent): void {
    this.eventQueue.push(event)
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Add a tool result to the message list (for multi-turn tool calling) */
function addToolResult(
  messages: FabrikMessage[],
  toolCallId: string,
  result: unknown
): FabrikMessage[] {
  return [
    ...messages,
    {
      id: generateId(),
      role: "system" as const,
      parts: [
        {
          type: "text" as const,
          text: `Tool result for ${toolCallId}: ${JSON.stringify(result)}`,
        },
      ],
      createdAt: new Date().toISOString(),
    },
  ]
}
