"use client"

import { useCallback, useMemo } from "react"
import { useFabrikActions, useFabrikState } from "./provider"
import type { FabrikMessage } from "../core/types"

export interface UseChatReturn {
  messages: FabrikMessage[]
  isLoading: boolean
  status: "idle" | "streaming" | "waiting" | "error"
  error: Error | null

  input: {
    value: string
    set: (value: string) => void
    files: File[]
    addFile: (file: File) => void
    removeFile: (index: number) => void
    clearFiles: () => void
  }

  send: () => void
  cancel: () => void
  retry: () => void
  respond: (askId: string, value: unknown) => void

  threadId: string
  newThread: () => void
  switchThread: (id: string) => void
}

export function useChat(): UseChatReturn {
  const actions = useFabrikActions()
  const state = useFabrikState()

  const thread = state.threads[state.currentThreadId]
  const messages = thread?.messages ?? []
  const threadStatus = thread?.status ?? "idle"
  const isLoading = threadStatus === "streaming" || threadStatus === "waiting"

  const send = useCallback(() => {
    const text = state.input.value.trim()
    if (!text) return
    actions.run(text, state.input.files.length > 0 ? state.input.files : undefined)
  }, [actions, state.input])

  const input = useMemo(
    () => ({
      value: state.input.value,
      set: actions.setInput,
      files: state.input.files,
      addFile: actions.addFile,
      removeFile: actions.removeFile,
      clearFiles: actions.clearFiles,
    }),
    [state.input, actions]
  )

  return {
    messages,
    isLoading,
    status: threadStatus,
    error: null, // TODO: track errors in state

    input,

    send,
    cancel: actions.cancel,
    retry: actions.retry,
    respond: actions.respond,

    threadId: state.currentThreadId,
    newThread: actions.newThread,
    switchThread: actions.switchThread,
  }
}
