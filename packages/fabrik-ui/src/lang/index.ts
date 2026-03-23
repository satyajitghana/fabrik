// Fabrik Lang — DSL parser, renderer, and component library

// Parser
export { tokenize, autoClose } from "./lexer"
export { splitStatements, parseExpr, parseTokens } from "./parser"
export { resolveNode, resolveAll } from "./resolver"
export { toElementTree, buildElementTree } from "./mapper"
export { createStreamParser, parse } from "./stream-parser"

// Library + Components
export { defineLangComponent, createLangLibrary } from "./library"
export type { LangComponentDef, LangLibrary } from "./library"
export { allLangComponents } from "./components"

// Renderer
export { FabrikLangRenderer } from "./renderer"
export type { FabrikLangRendererProps } from "./renderer"

// Types
export { T } from "./types"
export type {
  ASTNode,
  Token,
  RawStmt,
  ParamDef,
  ParamMap,
  ElementNode,
  ParseResult,
} from "./types"
