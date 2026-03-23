import type { Provider, ComponentDefBase, ToolDef } from "./types"

// ---------------------------------------------------------------------------
// Agent configuration
// ---------------------------------------------------------------------------

export interface AgentConfig {
  /** Unique agent identifier */
  id: string
  /** Human-readable name */
  name: string
  /** Description of what this agent does (shown to users and other agents) */
  description: string
  /** The provider that powers this agent */
  provider: Provider
  /** Agent-specific tools */
  tools?: ToolDef[]
  /** Agent-specific components */
  components?: ComponentDefBase[]
  /** System prompt for this agent */
  systemPrompt?: string
}

// ---------------------------------------------------------------------------
// AgentRegistry — manages multiple agents
// ---------------------------------------------------------------------------

export class AgentRegistry {
  private agents = new Map<string, AgentConfig>()
  private defaultId: string | null = null

  /** Register an agent */
  register(config: AgentConfig): void {
    this.agents.set(config.id, config)
    if (!this.defaultId) this.defaultId = config.id
  }

  /** Get an agent by ID */
  get(id: string): AgentConfig | undefined {
    return this.agents.get(id)
  }

  /** Get the default agent */
  getDefault(): AgentConfig | undefined {
    return this.defaultId ? this.agents.get(this.defaultId) : undefined
  }

  /** Set the default agent ID */
  setDefault(id: string): void {
    if (!this.agents.has(id)) throw new Error(`Agent '${id}' not registered`)
    this.defaultId = id
  }

  /** List all registered agents */
  list(): AgentConfig[] {
    return [...this.agents.values()]
  }

  /** Check if an agent exists */
  has(id: string): boolean {
    return this.agents.has(id)
  }

  /** Remove an agent */
  remove(id: string): void {
    this.agents.delete(id)
    if (this.defaultId === id) {
      this.defaultId = this.agents.size > 0 ? this.agents.keys().next().value ?? null : null
    }
  }

  /** Get all agent descriptions (for delegation tool) */
  toAgentSpecs(): Array<{ id: string; name: string; description: string }> {
    return this.list().map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
    }))
  }
}
