// Public API — import { Fabrik, useChat, Message, Chat, ... } from "@fabrik/ui/react"

export { Fabrik } from "./provider"
export type { FabrikProps } from "./provider"
export { useChat } from "./use-chat"
export type { UseChatReturn } from "./use-chat"
export { useThreadList } from "./use-thread-list"
export { Message } from "./message"
export type { MessageProps } from "./message"
export { ComponentSlot } from "./component-slot"
export { useRegistry, RegistryContext } from "./use-registry"
export { useFabrikActions, useFabrikState } from "./provider"

// Chat surface components
export { Chat } from "../chat/chat"
export type { ChatProps } from "../chat/chat"
export { Fab } from "../chat/fab"
export type { FabProps } from "../chat/fab"

// Chat UI components — re-exported here to share React context with <Fabrik>
export { InputArea } from "../chat/input-area"
export type { InputAreaProps } from "../chat/input-area"
export { ArtifactPanel } from "../chat/artifact-panel"
export type { ArtifactPanelProps } from "../chat/artifact-panel"
export { ConfirmDialog } from "../chat/confirm-dialog"
export { ChoicePicker } from "../chat/choice-picker"
export { TextInputDialog } from "../chat/text-input-dialog"
export { PermissionDialog } from "../chat/permission-dialog"
export { CodeDiff } from "../chat/code-diff"
export type { CodeDiffProps } from "../chat/code-diff"

// Pages — re-export for convenience
export { FabrikPages, defineRoute } from "../pages"
export type { FabrikPagesProps, RouteConfig, RouteContext, CacheConfig } from "../pages"
