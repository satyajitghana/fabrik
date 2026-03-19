"use client"

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useMemo } from "react"
import { FabrikClient, type FabrikClientOptions } from "../core/client"
import type { ClientState, ComponentDefBase, Provider, Storage, ToolDef } from "../core/types"
import { RegistryContext } from "./use-registry"

// ---------------------------------------------------------------------------
// Two-context pattern (from A2UI) — actions never trigger re-renders
// ---------------------------------------------------------------------------

type FabrikActions = FabrikClient["actions"]

const ActionsContext = createContext<FabrikActions | null>(null)
const StateContext = createContext<{
  version: number
  getState: () => ClientState
} | null>(null)

// ---------------------------------------------------------------------------
// <Fabrik> provider
// ---------------------------------------------------------------------------

export interface FabrikProps {
  provider: Provider
  children: ReactNode
  components?: ComponentDefBase[]
  tools?: ToolDef[]
  systemPrompt?: string
  theme?: "light" | "dark" | "system"
  storage?: "memory" | "local" | Storage
  ask?: boolean
  autoTitle?: boolean
  maxSteps?: number
  beforeSend?: (text: string) => string | null
  onError?: (error: Error) => void
}

export function Fabrik({
  provider,
  children,
  components,
  tools,
  systemPrompt,
  theme = "system",
  storage = "memory",
  ask,
  autoTitle,
  maxSteps,
  beforeSend,
  onError,
}: FabrikProps) {
  const clientRef = useRef<FabrikClient | null>(null)
  if (!clientRef.current) {
    clientRef.current = new FabrikClient({
      provider,
      components,
      tools,
      systemPrompt,
      storage,
      ask,
      autoTitle,
      maxSteps,
      beforeSend,
      onError,
    })
  }

  const actionsRef = useRef(clientRef.current.actions)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    return clientRef.current!.subscribe(() => setVersion((v) => v + 1))
  }, [])

  // Load persisted threads from storage
  useEffect(() => {
    if (storage !== "memory") {
      void clientRef.current!.loadFromStorage()
    }
  }, [storage])

  // Theme: add/remove dark class
  useEffect(() => {
    if (typeof document === "undefined") return

    const apply = (isDark: boolean) => {
      document.documentElement.classList.toggle("dark", isDark)
    }

    if (theme === "dark") {
      apply(true)
    } else if (theme === "light") {
      apply(false)
    } else {
      // "system"
      const mq = window.matchMedia("(prefers-color-scheme: dark)")
      apply(mq.matches)
      const handler = (e: MediaQueryListEvent) => apply(e.matches)
      mq.addEventListener("change", handler)
      return () => mq.removeEventListener("change", handler)
    }
  }, [theme])

  // Build component registry map for ComponentSlot
  const registryMap = useMemo(() => {
    const map = new Map<string, ComponentDefBase>()
    if (components) {
      for (const comp of components) {
        map.set(comp.name, comp)
      }
    }
    return map
  }, [components])

  return (
    <ActionsContext.Provider value={actionsRef.current}>
      <StateContext.Provider
        value={{ version, getState: clientRef.current.getState }}
      >
        <RegistryContext.Provider value={registryMap}>
          {children}
        </RegistryContext.Provider>
      </StateContext.Provider>
    </ActionsContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Internal hooks to access contexts
// ---------------------------------------------------------------------------

export function useFabrikActions(): FabrikActions {
  const ctx = useContext(ActionsContext)
  if (!ctx) throw new Error("useFabrikActions must be used within <Fabrik>")
  return ctx
}

export function useFabrikState(): ClientState {
  const ctx = useContext(StateContext)
  if (!ctx) throw new Error("useFabrikState must be used within <Fabrik>")
  // Reading version ensures re-render on state change
  void ctx.version
  return ctx.getState()
}
