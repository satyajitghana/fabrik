// Public API — import { defineComponent, defineTool, createLibrary } from "@fabrik/ui"

export { defineComponent, defineTool, createLibrary } from "./registry"
export { FabrikClient } from "./client"
export type { FabrikClientOptions } from "./client"
export { generateId, formatDuration } from "./utils"

// Types
export type {
  FabrikMessage,
  FabrikThread,
  Part,
  TextPart,
  ComponentPart,
  ThinkingPart,
  StepPart,
  ImagePart,
  AskPart,
  ArtifactPart,
  PartStatus,
  StepStatus,
  ThreadStatus,
  AskConfig,
  ConfirmAsk,
  ChoiceAsk,
  MultiChoiceAsk,
  TextAsk,
  PermissionAsk,
  AskOption,
  StreamEvent,
  ComponentDef,
  ComponentDefBase,
  ToolDef,
  Provider,
  StreamOptions,
  ToolSpec,
  Storage,
  ClientState,
} from "./types"
