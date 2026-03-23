import type { ASTNode, ParamMap, ElementNode } from "./types"

// ---------------------------------------------------------------------------
// Convert AST to JSON values, mapping positional args to named props
// ---------------------------------------------------------------------------

interface MapContext {
  paramMap: ParamMap
  errors: Array<{ component: string; path: string; message: string }>
  partial: boolean
}

export function toElementTree(
  node: ASTNode,
  ctx: MapContext,
): unknown {
  switch (node.k) {
    case "Str": return node.v
    case "Num": return node.v
    case "Bool": return node.v
    case "Null": return null
    case "Ph": return null  // placeholder → null

    case "Arr":
      return node.els
        .map(e => toElementTree(e, ctx))
        .filter(v => v !== null) // drop placeholders

    case "Obj": {
      const obj: Record<string, unknown> = {}
      for (const [k, v] of node.entries) {
        const val = toElementTree(v, ctx)
        if (val !== null) obj[k] = val
      }
      return obj
    }

    case "Comp":
      return mapComponent(node.name, node.args, ctx)

    case "If": {
      const cond = toElementTree(node.cond, ctx)
      // Truthy check: anything non-null, non-false, non-empty
      const isTruthy = cond !== null && cond !== false && cond !== 0 && cond !== ""
      return isTruthy
        ? toElementTree(node.then, ctx)
        : toElementTree(node.else, ctx)
    }

    case "Map": {
      const arr = toElementTree(node.arr, ctx)
      if (!Array.isArray(arr)) return null
      return arr.map(item => {
        // Temporarily resolve the param name — we inject it as a Str node
        // This is a simplified approach: the item becomes the value directly
        return toElementTree(node.body, ctx)
      }).filter(v => v !== null)
    }

    case "Ref":
      // Refs should be resolved before mapping; if we see one, it's unresolved
      return null
  }
}

// ---------------------------------------------------------------------------
// Map a component's positional args to named props using ParamMap
// ---------------------------------------------------------------------------

function mapComponent(
  name: string,
  args: ASTNode[],
  ctx: MapContext,
): ElementNode | null {
  const def = ctx.paramMap.get(name)

  if (!def) {
    // Unknown component — pass args as _args
    const props: Record<string, unknown> = {
      _args: args.map(a => toElementTree(a, ctx)),
    }
    return { type: "element", typeName: name, props, partial: ctx.partial }
  }

  const props: Record<string, unknown> = {}
  const { params } = def

  // Map positional args to named params
  for (let i = 0; i < params.length; i++) {
    const param = params[i]!
    if (i < args.length) {
      props[param.name] = toElementTree(args[i]!, ctx)
    } else if (param.defaultValue !== undefined) {
      props[param.name] = param.defaultValue
    }
  }

  // Validate required props
  for (const param of params) {
    if (param.required && !(param.name in props)) {
      ctx.errors.push({
        component: name,
        path: `/${param.name}`,
        message: `Missing required prop '${param.name}'`,
      })
      return null // drop component with missing required props
    }
  }

  return { type: "element", typeName: name, props, partial: ctx.partial }
}

// ---------------------------------------------------------------------------
// Build the full element tree from resolved AST
// ---------------------------------------------------------------------------

export function buildElementTree(
  rootNode: ASTNode,
  paramMap: ParamMap,
  partial: boolean = false,
): { root: ElementNode | null; errors: Array<{ component: string; path: string; message: string }> } {
  const ctx: MapContext = { paramMap, errors: [], partial }
  const result = toElementTree(rootNode, ctx)

  // Root must be an ElementNode
  if (result && typeof result === "object" && "type" in (result as Record<string, unknown>) && (result as ElementNode).type === "element") {
    return { root: result as ElementNode, errors: ctx.errors }
  }

  return { root: null, errors: ctx.errors }
}
