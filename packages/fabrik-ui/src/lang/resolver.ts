import type { ASTNode } from "./types"

// ---------------------------------------------------------------------------
// Reference resolution: resolve Ref nodes using a symbol table
// ---------------------------------------------------------------------------

export function resolveNode(
  node: ASTNode,
  symbols: Map<string, ASTNode>,
  visited: Set<string> = new Set(),
  unresolved: Set<string> = new Set(),
): ASTNode {
  switch (node.k) {
    case "Ref": {
      // Cycle detection
      if (visited.has(node.n)) return { k: "Ph", n: node.n }

      const target = symbols.get(node.n)
      if (!target) {
        unresolved.add(node.n)
        return { k: "Ph", n: node.n }
      }

      visited.add(node.n)
      const resolved = resolveNode(target, symbols, visited, unresolved)
      visited.delete(node.n)
      return resolved
    }

    case "Comp":
      return {
        k: "Comp",
        name: node.name,
        args: node.args.map(a => resolveNode(a, symbols, visited, unresolved)),
      }

    case "Arr":
      return {
        k: "Arr",
        els: node.els.map(e => resolveNode(e, symbols, visited, unresolved)),
      }

    case "Obj":
      return {
        k: "Obj",
        entries: node.entries.map(([k, v]) => [k, resolveNode(v, symbols, visited, unresolved)] as [string, ASTNode]),
      }

    case "If":
      return {
        k: "If",
        cond: resolveNode(node.cond, symbols, visited, unresolved),
        then: resolveNode(node.then, symbols, visited, unresolved),
        else: resolveNode(node.else, symbols, visited, unresolved),
      }

    case "Map":
      return {
        k: "Map",
        arr: resolveNode(node.arr, symbols, visited, unresolved),
        param: node.param,
        body: resolveNode(node.body, symbols, visited, unresolved),
      }

    // Primitives pass through
    case "Str":
    case "Num":
    case "Bool":
    case "Null":
    case "Ph":
      return node
  }
}

// ---------------------------------------------------------------------------
// Build symbol table and resolve all references from root
// ---------------------------------------------------------------------------

export function resolveAll(
  statements: Map<string, ASTNode>,
): { resolved: Map<string, ASTNode>; unresolved: string[] } {
  const unresolved = new Set<string>()
  const resolved = new Map<string, ASTNode>()

  for (const [id, node] of statements) {
    resolved.set(id, resolveNode(node, statements, new Set(), unresolved))
  }

  return { resolved, unresolved: [...unresolved] }
}
