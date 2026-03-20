import type {
  ClientState,
  ComponentDefBase,
  FabrikThread,
  Provider,
  Storage,
  ToolDef,
} from "./types"
import { ComponentRegistry, ToolRegistry } from "./registry"
import { createInitialState, reduce, type StateAction } from "./reducer"
import { FabrikStream, ElicitationQueue } from "./stream"
import { createStorage, MemoryStorage } from "./storage"
import { generateSystemPrompt } from "./prompt"
import { generateId } from "./utils"

// ---------------------------------------------------------------------------
// FabrikClient — the core engine
// ---------------------------------------------------------------------------

export interface FabrikClientOptions {
  provider: Provider
  components?: ComponentDefBase[]
  tools?: ToolDef[]
  systemPrompt?: string
  storage?: "memory" | "local" | Storage
  ask?: boolean
  autoTitle?: boolean
  maxSteps?: number
  beforeSend?: (text: string) => string | null
  onError?: (error: Error) => void
}

export class FabrikClient {
  private state: ClientState
  private listeners = new Set<() => void>()
  private pendingNotification = false

  private provider: Provider
  private componentRegistry = new ComponentRegistry()
  private toolRegistry = new ToolRegistry()
  private elicitationQueue = new ElicitationQueue()
  private storage: Storage
  private systemPromptPrefix: string
  private askEnabled: boolean
  private autoTitle: boolean
  private maxSteps: number
  private beforeSend?: (text: string) => string | null
  private onErrorCallback?: (error: Error) => void

  private activeStream: FabrikStream | null = null

  constructor(options: FabrikClientOptions) {
    this.provider = options.provider
    this.storage = createStorage(options.storage ?? "memory")
    this.systemPromptPrefix = options.systemPrompt ?? ""
    this.askEnabled = options.ask !== false
    this.autoTitle = options.autoTitle !== false
    this.maxSteps = options.maxSteps ?? 10
    this.beforeSend = options.beforeSend
    this.onErrorCallback = options.onError

    // Register components
    if (options.components) {
      for (const comp of options.components) {
        this.componentRegistry.register(comp)
      }
    }

    // Register tools
    if (options.tools) {
      for (const tool of options.tools) {
        this.toolRegistry.register(tool)
      }
    }

    // Initial state
    this.state = createInitialState()
  }

  // -------------------------------------------------------------------------
  // State access (useSyncExternalStore compatible)
  // -------------------------------------------------------------------------

  getState = (): ClientState => {
    return this.state
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // -------------------------------------------------------------------------
  // Actions (stable references for the two-context pattern)
  // -------------------------------------------------------------------------

  readonly actions = {
    run: (message: string, files?: File[]): FabrikStream => {
      return this.run(message, files)
    },
    cancel: (): void => {
      this.activeStream?.abort()
      this.activeStream = null
    },
    retry: (): void => {
      const thread = this.currentThread()
      if (!thread) return
      const lastUserMsg = [...thread.messages]
        .reverse()
        .find((m) => m.role === "user")
      if (!lastUserMsg) return

      const text = lastUserMsg.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as { text: string }).text)
        .join("")

      // Remove last assistant message if exists
      const lastIdx = thread.messages.length - 1
      if (thread.messages[lastIdx]?.role === "assistant") {
        thread.messages.pop()
      }

      this.run(text)
    },
    respond: (askId: string, value: unknown): void => {
      this.elicitationQueue.respond(askId, value)
      this.dispatch({
        type: "RESPOND_ASK",
        threadId: this.state.currentThreadId,
        askId,
        response: value,
      })
    },
    newThread: (): string => {
      const id = generateId()
      this.dispatch({ type: "INIT_THREAD", threadId: id })
      return id
    },
    switchThread: (id: string): void => {
      this.dispatch({ type: "SET_CURRENT_THREAD", threadId: id })
    },
    deleteThread: (id: string): void => {
      this.dispatch({ type: "DELETE_THREAD", threadId: id })
      void this.storage.deleteThread(id)
    },
    setInput: (value: string): void => {
      this.dispatch({ type: "SET_INPUT", value })
    },
    addFile: (file: File): void => {
      this.dispatch({ type: "ADD_FILE", file })
    },
    removeFile: (index: number): void => {
      this.dispatch({ type: "REMOVE_FILE", index })
    },
    clearFiles: (): void => {
      this.dispatch({ type: "CLEAR_FILES" })
    },
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  private run(message: string, _files?: File[]): FabrikStream {
    // Apply beforeSend hook
    if (this.beforeSend) {
      const result = this.beforeSend(message)
      if (result === null) {
        throw new Error("Message rejected by beforeSend hook")
      }
      message = result
    }

    const threadId = this.state.currentThreadId

    // Add user message to state
    this.dispatch({ type: "ADD_USER_MESSAGE", threadId, text: message })

    // Build system prompt
    const systemPrompt = generateSystemPrompt({
      components: this.componentRegistry.all(),
      tools: this.toolRegistry.all(),
      userPrompt: this.systemPromptPrefix || undefined,
    })

    // Get current messages
    const thread = this.state.threads[threadId]
    const messages = thread ? [...thread.messages] : []

    // Create and start the stream
    const stream = new FabrikStream({
      provider: this.provider,
      threadId,
      messages,
      systemPrompt,
      componentRegistry: this.componentRegistry,
      toolRegistry: this.toolRegistry,
      elicitationQueue: this.elicitationQueue,
      dispatch: (action) => this.dispatch(action),
      maxSteps: this.maxSteps,
    })

    this.activeStream = stream

    // Auto-save thread and auto-title after completion
    void stream.thread
      .then(() => {
        const thread = this.state.threads[threadId]
        if (thread) {
          void this.storage.saveThread(thread)
        }
      })
      .catch((err) => {
        this.onErrorCallback?.(err)
      })

    // Clear input after sending
    this.dispatch({ type: "SET_INPUT", value: "" })
    this.dispatch({ type: "CLEAR_FILES" })

    return stream
  }

  private currentThread(): FabrikThread | undefined {
    return this.state.threads[this.state.currentThreadId]
  }

  private dispatch(action: StateAction): void {
    this.state = reduce(this.state, action)
    this.notifyListeners()
  }

  private notifyListeners(): void {
    if (!this.pendingNotification) {
      this.pendingNotification = true
      queueMicrotask(() => {
        this.pendingNotification = false
        for (const listener of this.listeners) {
          listener()
        }
      })
    }
  }

  // -------------------------------------------------------------------------
  // Storage: load threads on init
  // -------------------------------------------------------------------------

  async loadFromStorage(): Promise<void> {
    const threadList = await this.storage.loadThreads()
    for (const { id } of threadList) {
      const thread = await this.storage.loadThread(id)
      if (thread) {
        this.dispatch({ type: "LOAD_THREAD", thread })
      }
    }
    // Switch to most recent thread if available
    if (threadList.length > 0) {
      this.dispatch({ type: "SET_CURRENT_THREAD", threadId: threadList[0]!.id })
    }
  }
}
