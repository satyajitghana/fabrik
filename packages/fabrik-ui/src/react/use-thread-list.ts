"use client"

import { useMemo } from "react"
import { useFabrikActions, useFabrikState } from "./provider"

export function useThreadList() {
  const actions = useFabrikActions()
  const state = useFabrikState()

  const threads = useMemo(
    () =>
      Object.values(state.threads)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((t) => ({ id: t.id, name: t.name, updatedAt: t.updatedAt })),
    [state.threads]
  )

  return {
    threads,
    currentId: state.currentThreadId,
    switchTo: actions.switchThread,
    create: actions.newThread,
    remove: actions.deleteThread,
  }
}
