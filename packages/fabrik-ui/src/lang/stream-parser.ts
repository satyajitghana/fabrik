import type { ASTNode, ParseResult, ParamMap, RawStmt } from "./types"
import { autoClose, tokenize } from "./lexer"
import { splitStatements, parseTokens } from "./parser"
import { resolveNode } from "./resolver"
import { buildElementTree } from "./mapper"

// ---------------------------------------------------------------------------
// Streaming parser: accumulates text chunks, re-parses incrementally
// ---------------------------------------------------------------------------

export interface StreamParser {
  /** Push a new text chunk. Returns the updated parse result. */
  push(chunk: string): ParseResult
  /** Get the current parse result without pushing new text. */
  getResult(): ParseResult
}

export function createStreamParser(paramMap: ParamMap): StreamParser {
  let buffer = ""
  let completedEnd = 0
  const completedSyms = new Map<string, ASTNode>()
  let lastResult: ParseResult = {
    root: null,
    meta: { incomplete: true, unresolved: [], statementCount: 0, errors: [] },
  }

  function scanNewCompleted(): number {
    // Find complete statements (depth-0 newlines) starting from completedEnd
    let i = completedEnd
    let depth = 0
    let inStr = false
    let lastStmtEnd = completedEnd

    while (i < buffer.length) {
      const ch = buffer[i]!
      if (ch === "\\" && inStr) { i += 2; continue }
      if (ch === '"') { inStr = !inStr; i++; continue }
      if (inStr) { i++; continue }

      if (ch === "(" || ch === "[" || ch === "{") depth++
      if (ch === ")" || ch === "]" || ch === "}") depth = Math.max(0, depth - 1)

      if (ch === "\n" && depth === 0) {
        // Everything from lastStmtEnd to here is a complete line
        const line = buffer.slice(lastStmtEnd, i).trim()
        if (line.length > 0) {
          // Parse this single statement
          const tokens = tokenize(line)
          const stmts = splitStatements(tokens)
          for (const stmt of stmts) {
            const ast = parseTokens(stmt.tokens)
            completedSyms.set(stmt.id, ast)
          }
        }
        lastStmtEnd = i + 1
      }
      i++
    }

    completedEnd = lastStmtEnd
    return lastStmtEnd
  }

  function buildResult(): ParseResult {
    // Merge completed symbols with pending (incomplete) text
    const pendingText = buffer.slice(completedEnd).trim()
    const allSyms = new Map(completedSyms)

    let wasIncomplete = false
    if (pendingText.length > 0) {
      // Auto-close the pending text to make it parseable
      const { text: closed, wasIncomplete: incomplete } = autoClose(pendingText)
      wasIncomplete = incomplete

      const tokens = tokenize(closed)
      const stmts = splitStatements(tokens)
      for (const stmt of stmts) {
        const ast = parseTokens(stmt.tokens)
        allSyms.set(stmt.id, ast)
      }
    }

    // Resolve references from root
    const rootNode = allSyms.get("root")
    if (!rootNode) {
      return {
        root: null,
        meta: {
          incomplete: true,
          unresolved: [],
          statementCount: allSyms.size,
          errors: [],
        },
      }
    }

    const unresolved = new Set<string>()
    const resolvedRoot = resolveNode(rootNode, allSyms, new Set(), unresolved)

    // Build element tree with positional-to-named mapping
    const { root, errors } = buildElementTree(resolvedRoot, paramMap, wasIncomplete)

    return {
      root,
      meta: {
        incomplete: wasIncomplete,
        unresolved: [...unresolved],
        statementCount: allSyms.size,
        errors,
      },
    }
  }

  return {
    push(chunk: string): ParseResult {
      buffer += chunk
      scanNewCompleted()
      lastResult = buildResult()
      return lastResult
    },

    getResult(): ParseResult {
      return lastResult
    },
  }
}

// ---------------------------------------------------------------------------
// One-shot parser (non-streaming)
// ---------------------------------------------------------------------------

export function parse(input: string, paramMap: ParamMap): ParseResult {
  const { text, wasIncomplete } = autoClose(input)
  const tokens = tokenize(text)
  const stmts = splitStatements(tokens)

  // Build symbol table
  const symbols = new Map<string, ASTNode>()
  for (const stmt of stmts) {
    symbols.set(stmt.id, parseTokens(stmt.tokens))
  }

  // Resolve from root
  const rootNode = symbols.get("root")
  if (!rootNode) {
    return {
      root: null,
      meta: { incomplete: wasIncomplete, unresolved: [], statementCount: symbols.size, errors: [] },
    }
  }

  const unresolved = new Set<string>()
  const resolved = resolveNode(rootNode, symbols, new Set(), unresolved)
  const { root, errors } = buildElementTree(resolved, paramMap, wasIncomplete)

  return {
    root,
    meta: {
      incomplete: wasIncomplete,
      unresolved: [...unresolved],
      statementCount: symbols.size,
      errors,
    },
  }
}
