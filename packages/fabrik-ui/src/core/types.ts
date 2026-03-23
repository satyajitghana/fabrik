import type { ZodType } from "zod"
import type { ComponentType, ReactNode } from "react"

// ---------------------------------------------------------------------------
// Message & Parts
// ---------------------------------------------------------------------------

export interface FabrikMessage {
  id: string
  role: "user" | "assistant" | "system"
  parts: Part[]
  createdAt: string
}

export type Part =
  | TextPart
  | ComponentPart
  | ThinkingPart
  | StepPart
  | ImagePart
  | AskPart
  | ArtifactPart
  | UiPart

export interface TextPart {
  type: "text"
  text: string
}

export interface ComponentPart {
  type: "component"
  id: string
  name: string
  props: Record<string, unknown>
  status: PartStatus
  children?: ComponentPart[]
}

export interface ThinkingPart {
  type: "thinking"
  id: string
  text: string
  durationMs?: number
  status: PartStatus
}

export interface StepPart {
  type: "step"
  id: string
  title: string
  stepStatus: StepStatus
  durationMs?: number
}

export interface ImagePart {
  type: "image"
  url: string
  alt?: string
}

export interface AskPart {
  type: "ask"
  id: string
  config: AskConfig
  response?: unknown
  status: "pending" | "answered" | "cancelled"
}

export interface ArtifactPart {
  type: "artifact"
  id: string
  title: string
  language: string // "html", "typescript", "python", "markdown", "svg", etc.
  content: string
  status: "streaming" | "done"
}

export interface UiPart {
  type: "ui"
  id: string
  dslText: string
  status: "streaming" | "done"
}

export type PartStatus = "pending" | "streaming" | "done" | "error"
export type StepStatus = "running" | "done" | "failed"

// ---------------------------------------------------------------------------
// Ask / Elicitation
// ---------------------------------------------------------------------------

export type AskConfig =
  | ConfirmAsk
  | ChoiceAsk
  | MultiChoiceAsk
  | TextAsk
  | PermissionAsk

export interface ConfirmAsk {
  type: "confirm"
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
}

export interface ChoiceAsk {
  type: "choice"
  title: string
  message?: string
  options: AskOption[]
}

export interface MultiChoiceAsk {
  type: "multi_choice"
  title: string
  message?: string
  options: AskOption[]
  min?: number
  max?: number
}

export interface TextAsk {
  type: "text"
  title: string
  message?: string
  placeholder?: string
}

export interface PermissionAsk {
  type: "permission"
  title: string
  message: string
  resource: string
}

export interface AskOption {
  value: string
  label: string
  description?: string
}

// ---------------------------------------------------------------------------
// Thread
// ---------------------------------------------------------------------------

export interface FabrikThread {
  id: string
  name?: string
  messages: FabrikMessage[]
  status: ThreadStatus
  createdAt: string
  updatedAt: string
}

export type ThreadStatus = "idle" | "streaming" | "waiting" | "error"

// ---------------------------------------------------------------------------
// Stream Events (wire format uses snake_case type names, JS props are camelCase)
// ---------------------------------------------------------------------------

export type StreamEvent =
  // Lifecycle
  | { type: "start"; runId: string }
  | { type: "done" }
  | { type: "error"; message: string }
  // Text
  | { type: "text"; delta: string }
  // Components (generative UI)
  | { type: "component_start"; id: string; name: string }
  | { type: "component_delta"; id: string; delta: string }
  | { type: "component_done"; id: string; props: Record<string, unknown> }
  // Thinking
  | { type: "thinking_start"; id: string }
  | { type: "thinking_delta"; id: string; delta: string }
  | { type: "thinking_done"; id: string; durationMs: number }
  // Steps (auto-generated from tool calls)
  | { type: "step_start"; id: string; title: string }
  | { type: "step_done"; id: string; stepStatus: StepStatus; durationMs: number }
  // Artifacts
  | { type: "artifact_start"; id: string; title: string; language: string }
  | { type: "artifact_delta"; id: string; delta: string }
  | { type: "artifact_done"; id: string }
  // Fabrik Lang DSL
  | { type: "ui_start"; id: string }
  | { type: "ui_delta"; id: string; delta: string }
  | { type: "ui_done"; id: string }
  // Elicitation
  | { type: "ask"; id: string; config: AskConfig }
  // Internal: raw tool calls (not exposed to developer, used by client)
  | { type: "tool_call_start"; id: string; toolName: string }
  | { type: "tool_call_delta"; id: string; delta: string }
  | { type: "tool_call_done"; id: string; toolName: string; args: Record<string, unknown> }

// ---------------------------------------------------------------------------
// Component Definition
// ---------------------------------------------------------------------------

/** Base component definition — non-generic, used in arrays and registries.
 *  Uses broad types to avoid ComponentType<T> contravariance issues when storing
 *  heterogeneous ComponentDef<T> values in a single array/map. */
export interface ComponentDefBase {
  name: string
  description: string
  schema: ZodType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ComponentType<T> is contravariant; typed defs can't be assigned to a narrow base without `any`
  component: ComponentType<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loading?: ComponentType<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stepTitle?: string | ((args: any) => string)
}

/** Typed component definition — used when defining individual components with specific props */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- {} is intentionally permissive for component variance
export interface ComponentDef<T = {}> {
  name: string
  description: string
  schema: ZodType<T>
  component: ComponentType<T>
  loading?: ComponentType<Partial<T>>
  stepTitle?: string | ((args: T) => string)
}

// ---------------------------------------------------------------------------
// Tool Definition
// ---------------------------------------------------------------------------

export interface ToolDef<In = unknown, Out = unknown> {
  name: string
  description: string
  schema: ZodType<In>
  run: (input: In) => Out | Promise<Out>
  stepTitle?: string | ((args: In) => string)
  render?: (
    input: In,
    context: { result: Promise<Out> }
  ) => ReactNode | AsyncGenerator<ReactNode, ReactNode, void>
}

// ---------------------------------------------------------------------------
// Provider (LLM Adapter)
// ---------------------------------------------------------------------------

export interface Provider {
  name: string
  stream(options: StreamOptions): AsyncIterable<StreamEvent>
}

export interface StreamOptions {
  messages: FabrikMessage[]
  systemPrompt: string
  tools: ToolSpec[]
  model?: string
  signal?: AbortSignal
}

export interface ToolSpec {
  name: string
  description: string
  parameters: Record<string, unknown> // JSON Schema
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export interface Storage {
  loadThreads(): Promise<{ id: string; name?: string; updatedAt: string }[]>
  loadThread(id: string): Promise<FabrikThread | null>
  saveThread(thread: FabrikThread): Promise<void>
  deleteThread(id: string): Promise<void>
}

// ---------------------------------------------------------------------------
// Client State (internal)
// ---------------------------------------------------------------------------

export interface ClientState {
  currentThreadId: string
  threads: Record<string, FabrikThread>
  input: { value: string; files: File[] }
  streaming: { isActive: boolean; runId?: string }
}
