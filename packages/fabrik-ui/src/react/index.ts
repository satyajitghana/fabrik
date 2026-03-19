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

// Pages — re-export for convenience
export { FabrikPages, defineRoute } from "../pages"
export type { FabrikPagesProps, RouteConfig, RouteContext, CacheConfig } from "../pages"
