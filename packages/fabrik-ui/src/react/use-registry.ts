"use client"

import { createContext, useContext } from "react"
import type { ComponentDefBase } from "../core/types"

export const RegistryContext = createContext<Map<string, ComponentDefBase>>(new Map())

export function useRegistry(): Map<string, ComponentDefBase> {
  return useContext(RegistryContext)
}
