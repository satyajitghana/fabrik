import { T, type Token, type ASTNode, type RawStmt } from "./types"

// ---------------------------------------------------------------------------
// Statement splitter: tokenStream → RawStmt[]
// Splits at depth-0 newlines. Newlines inside brackets are ignored.
// ---------------------------------------------------------------------------

export function splitStatements(tokens: Token[]): RawStmt[] {
  const stmts: RawStmt[] = []
  let i = 0

  // Skip leading newlines
  while (i < tokens.length && tokens[i]!.t === T.Newline) i++

  while (i < tokens.length && tokens[i]!.t !== T.EOF) {
    // Expect: Ident/Type = expr
    const idTok = tokens[i]!
    if (idTok.t !== T.Ident && idTok.t !== T.Type) {
      // Skip to next newline
      while (i < tokens.length && tokens[i]!.t !== T.Newline && tokens[i]!.t !== T.EOF) i++
      if (i < tokens.length && tokens[i]!.t === T.Newline) i++
      continue
    }

    const id = idTok.v as string
    i++

    // Expect =
    if (i >= tokens.length || tokens[i]!.t !== T.Equals) {
      while (i < tokens.length && tokens[i]!.t !== T.Newline && tokens[i]!.t !== T.EOF) i++
      if (i < tokens.length && tokens[i]!.t === T.Newline) i++
      continue
    }
    i++ // skip =

    // Collect expression tokens until depth-0 newline or EOF
    const exprTokens: Token[] = []
    let depth = 0
    while (i < tokens.length) {
      const t = tokens[i]!
      if (t.t === T.EOF) break
      if (t.t === T.Newline && depth === 0) { i++; break }
      if (t.t === T.LParen || t.t === T.LBrack || t.t === T.LBrace) depth++
      if (t.t === T.RParen || t.t === T.RBrack || t.t === T.RBrace) depth = Math.max(0, depth - 1)
      if (t.t !== T.Newline) exprTokens.push(t)
      i++
    }

    if (exprTokens.length > 0) {
      stmts.push({ id, tokens: exprTokens })
    }

    // Skip newlines between statements
    while (i < tokens.length && tokens[i]!.t === T.Newline) i++
  }

  return stmts
}

// ---------------------------------------------------------------------------
// Expression parser: Token[] → ASTNode
// Recursive descent with support for if(), map(), components, arrays, objects
// ---------------------------------------------------------------------------

export function parseExpr(tokens: Token[], pos: { i: number }): ASTNode {
  const tok = tokens[pos.i]
  if (!tok) return { k: "Null" }

  switch (tok.t) {
    case T.Str:
      pos.i++
      return { k: "Str", v: tok.v as string }

    case T.Num:
      pos.i++
      return { k: "Num", v: tok.v as number }

    case T.True:
      pos.i++
      return { k: "Bool", v: true }

    case T.False:
      pos.i++
      return { k: "Bool", v: false }

    case T.Null:
      pos.i++
      return { k: "Null" }

    case T.LBrack:
      return parseArray(tokens, pos)

    case T.LBrace:
      return parseObject(tokens, pos)

    case T.Type: {
      // PascalCase — check if followed by ( for component call
      if (pos.i + 1 < tokens.length && tokens[pos.i + 1]!.t === T.LParen) {
        return parseComponent(tokens, pos)
      }
      // Otherwise it's a reference
      pos.i++
      return { k: "Ref", n: tok.v as string }
    }

    case T.Ident: {
      const name = tok.v as string

      // Special built-in: if(cond, then, else)
      if (name === "if" && pos.i + 1 < tokens.length && tokens[pos.i + 1]!.t === T.LParen) {
        return parseIf(tokens, pos)
      }

      // Special built-in: map(arr, (param) => body)
      if (name === "map" && pos.i + 1 < tokens.length && tokens[pos.i + 1]!.t === T.LParen) {
        return parseMap(tokens, pos)
      }

      // Regular reference
      pos.i++
      return { k: "Ref", n: name }
    }

    default:
      pos.i++
      return { k: "Null" }
  }
}

// ---------------------------------------------------------------------------
// Component: TypeName(arg1, arg2, ...)
// ---------------------------------------------------------------------------

function parseComponent(tokens: Token[], pos: { i: number }): ASTNode {
  const name = tokens[pos.i]!.v as string
  pos.i++ // skip name
  pos.i++ // skip (

  const args: ASTNode[] = []
  while (pos.i < tokens.length && tokens[pos.i]!.t !== T.RParen && tokens[pos.i]!.t !== T.EOF) {
    args.push(parseExpr(tokens, pos))
    if (pos.i < tokens.length && tokens[pos.i]!.t === T.Comma) pos.i++
  }
  if (pos.i < tokens.length && tokens[pos.i]!.t === T.RParen) pos.i++

  return { k: "Comp", name, args }
}

// ---------------------------------------------------------------------------
// Array: [elem1, elem2, ...]
// ---------------------------------------------------------------------------

function parseArray(tokens: Token[], pos: { i: number }): ASTNode {
  pos.i++ // skip [

  const els: ASTNode[] = []
  while (pos.i < tokens.length && tokens[pos.i]!.t !== T.RBrack && tokens[pos.i]!.t !== T.EOF) {
    els.push(parseExpr(tokens, pos))
    if (pos.i < tokens.length && tokens[pos.i]!.t === T.Comma) pos.i++
  }
  if (pos.i < tokens.length && tokens[pos.i]!.t === T.RBrack) pos.i++

  return { k: "Arr", els }
}

// ---------------------------------------------------------------------------
// Object: {key: value, ...}
// ---------------------------------------------------------------------------

function parseObject(tokens: Token[], pos: { i: number }): ASTNode {
  pos.i++ // skip {

  const entries: [string, ASTNode][] = []
  while (pos.i < tokens.length && tokens[pos.i]!.t !== T.RBrace && tokens[pos.i]!.t !== T.EOF) {
    // Key
    const keyTok = tokens[pos.i]!
    let key: string
    if (keyTok.t === T.Ident || keyTok.t === T.Type) {
      key = keyTok.v as string
    } else if (keyTok.t === T.Str) {
      key = keyTok.v as string
    } else if (keyTok.t === T.Num) {
      key = String(keyTok.v)
    } else break
    pos.i++

    // Colon
    if (pos.i < tokens.length && tokens[pos.i]!.t === T.Colon) pos.i++

    // Value
    const value = parseExpr(tokens, pos)
    entries.push([key, value])

    if (pos.i < tokens.length && tokens[pos.i]!.t === T.Comma) pos.i++
  }
  if (pos.i < tokens.length && tokens[pos.i]!.t === T.RBrace) pos.i++

  return { k: "Obj", entries }
}

// ---------------------------------------------------------------------------
// if(condition, thenExpr, elseExpr) — conditional rendering
// ---------------------------------------------------------------------------

function parseIf(tokens: Token[], pos: { i: number }): ASTNode {
  pos.i++ // skip "if"
  pos.i++ // skip (

  const cond = parseExpr(tokens, pos)
  if (pos.i < tokens.length && tokens[pos.i]!.t === T.Comma) pos.i++

  const then = parseExpr(tokens, pos)
  if (pos.i < tokens.length && tokens[pos.i]!.t === T.Comma) pos.i++

  const elseNode = parseExpr(tokens, pos)
  if (pos.i < tokens.length && tokens[pos.i]!.t === T.RParen) pos.i++

  return { k: "If", cond, then, else: elseNode }
}

// ---------------------------------------------------------------------------
// map(array, (param) => body) — iteration
// ---------------------------------------------------------------------------

function parseMap(tokens: Token[], pos: { i: number }): ASTNode {
  pos.i++ // skip "map"
  pos.i++ // skip (

  const arr = parseExpr(tokens, pos)
  if (pos.i < tokens.length && tokens[pos.i]!.t === T.Comma) pos.i++

  // Parse (param) => body
  let param = "item"
  if (pos.i < tokens.length && tokens[pos.i]!.t === T.LParen) {
    pos.i++ // skip (
    if (pos.i < tokens.length && tokens[pos.i]!.t === T.Ident) {
      param = tokens[pos.i]!.v as string
      pos.i++
    }
    if (pos.i < tokens.length && tokens[pos.i]!.t === T.RParen) pos.i++
  }

  // Skip =>
  if (pos.i < tokens.length && tokens[pos.i]!.t === T.Arrow) pos.i++

  const body = parseExpr(tokens, pos)
  if (pos.i < tokens.length && tokens[pos.i]!.t === T.RParen) pos.i++

  return { k: "Map", arr, param, body }
}

// ---------------------------------------------------------------------------
// Parse a single statement's tokens into an ASTNode
// ---------------------------------------------------------------------------

export function parseTokens(tokens: Token[]): ASTNode {
  if (tokens.length === 0) return { k: "Null" }
  const pos = { i: 0 }
  return parseExpr(tokens, pos)
}
