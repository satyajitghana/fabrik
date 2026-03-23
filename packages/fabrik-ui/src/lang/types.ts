// ---------------------------------------------------------------------------
// Token types for the lexer
// ---------------------------------------------------------------------------

export enum T {
  Newline,  // statement separator
  LParen,   // (
  RParen,   // )
  LBrack,   // [
  RBrack,   // ]
  LBrace,   // {
  RBrace,   // }
  Comma,    // ,
  Colon,    // :
  Equals,   // =
  Arrow,    // =>
  True,     // keyword true
  False,    // keyword false
  Null,     // keyword null
  EOF,      // end of input
  Str,      // string literal
  Num,      // number literal
  Ident,    // lowercase identifier (variable reference)
  Type,     // PascalCase identifier (component name)
}

export interface Token {
  t: T
  v?: string | number  // value for Str, Num, Ident, Type
}

// ---------------------------------------------------------------------------
// AST node types
// ---------------------------------------------------------------------------

export type ASTNode =
  | { k: "Comp"; name: string; args: ASTNode[] }
  | { k: "Str"; v: string }
  | { k: "Num"; v: number }
  | { k: "Bool"; v: boolean }
  | { k: "Null" }
  | { k: "Arr"; els: ASTNode[] }
  | { k: "Obj"; entries: [string, ASTNode][] }
  | { k: "Ref"; n: string }
  | { k: "Ph"; n: string }  // placeholder (unresolvable reference)
  | { k: "If"; cond: ASTNode; then: ASTNode; else: ASTNode }
  | { k: "Map"; arr: ASTNode; param: string; body: ASTNode }

// ---------------------------------------------------------------------------
// Parsed output types
// ---------------------------------------------------------------------------

export interface RawStmt {
  id: string
  tokens: Token[]
}

export interface ParamDef {
  name: string
  required: boolean
  defaultValue?: unknown
}

export type ParamMap = Map<string, { params: ParamDef[] }>

export interface ElementNode {
  type: "element"
  typeName: string
  props: Record<string, unknown>
  partial: boolean
}

export interface ParseResult {
  root: ElementNode | null
  meta: {
    incomplete: boolean
    unresolved: string[]
    statementCount: number
    errors: Array<{ component: string; path: string; message: string }>
  }
}
