import { describe, it, expect } from "vitest"
import { tokenize, autoClose } from "../lexer"
import { splitStatements, parseTokens } from "../parser"
import { resolveNode } from "../resolver"
import { buildElementTree } from "../mapper"
import { parse, createStreamParser } from "../stream-parser"
import { T, type ParamMap } from "../types"

// ---------------------------------------------------------------------------
// Helper: simple paramMap for testing
// ---------------------------------------------------------------------------

const testParamMap: ParamMap = new Map([
  ["TextContent", { params: [
    { name: "text", required: true },
    { name: "size", required: false },
  ]}],
  ["Card", { params: [
    { name: "children", required: true },
    { name: "variant", required: false },
  ]}],
  ["Stack", { params: [
    { name: "children", required: true },
    { name: "direction", required: false },
    { name: "gap", required: false },
  ]}],
  ["Badge", { params: [
    { name: "text", required: true },
    { name: "variant", required: false },
  ]}],
  ["Callout", { params: [
    { name: "variant", required: true },
    { name: "title", required: true },
    { name: "description", required: true },
  ]}],
])

// ---------------------------------------------------------------------------
// Lexer tests
// ---------------------------------------------------------------------------

describe("lexer", () => {
  it("tokenizes a simple assignment", () => {
    const tokens = tokenize('root = TextContent("hello")')
    expect(tokens.length).toBeGreaterThan(3)
  })

  it("tokenizes strings with escapes", () => {
    const tokens = tokenize('"hello \\"world\\""')
    const strToken = tokens.find(t => t.t === T.Str)
    expect(strToken?.v).toBe('hello "world"')
  })

  it("tokenizes numbers", () => {
    const tokens = tokenize("42 -3.14 1e5")
    const nums = tokens.filter(t => t.t === T.Num)
    expect(nums).toHaveLength(3)
    expect(nums[0]?.v).toBe(42)
    expect(nums[1]?.v).toBe(-3.14)
    expect(nums[2]?.v).toBe(1e5)
  })

  it("distinguishes PascalCase (Type) from lowercase (Ident)", () => {
    const tokens = tokenize("Card myRef")
    expect(tokens[0]?.t).toBe(T.Type)
    expect(tokens[1]?.t).toBe(T.Ident)
  })

  it("tokenizes => arrow", () => {
    const tokens = tokenize("(x) => y")
    const arrow = tokens.find(t => t.t === 10) // T.Arrow
    expect(arrow).toBeDefined()
  })

  it("skips comments", () => {
    const tokens = tokenize('root = TextContent("hi") // comment')
    const strs = tokens.filter(t => t.t === T.Str)
    expect(strs).toHaveLength(1)
    expect(strs[0]?.v).toBe("hi")
  })
})

// ---------------------------------------------------------------------------
// Auto-close tests
// ---------------------------------------------------------------------------

describe("autoClose", () => {
  it("closes unclosed brackets", () => {
    expect(autoClose("Card([title").text).toBe('Card([title])')
    expect(autoClose("Card([title").wasIncomplete).toBe(true)
  })

  it("closes unclosed strings", () => {
    expect(autoClose('"hello').text).toContain('"hello"')
  })

  it("returns unchanged for complete input", () => {
    const result = autoClose('Card([title])')
    expect(result.wasIncomplete).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Statement splitting
// ---------------------------------------------------------------------------

describe("splitStatements", () => {
  it("splits multiple statements", () => {
    const tokens = tokenize('root = Card([title])\ntitle = TextContent("hi")')
    const stmts = splitStatements(tokens)
    expect(stmts).toHaveLength(2)
    expect(stmts[0]?.id).toBe("root")
    expect(stmts[1]?.id).toBe("title")
  })

  it("handles newlines inside brackets", () => {
    const tokens = tokenize('root = Card([\n  title,\n  subtitle\n])')
    const stmts = splitStatements(tokens)
    expect(stmts).toHaveLength(1)
    expect(stmts[0]?.id).toBe("root")
  })
})

// ---------------------------------------------------------------------------
// Expression parsing
// ---------------------------------------------------------------------------

describe("parseTokens", () => {
  it("parses a component call", () => {
    const tokens = tokenize('TextContent("hello", "large")').filter(t => t.t !== T.EOF) // remove EOF
    const ast = parseTokens(tokens)
    expect(ast.k).toBe("Comp")
    if (ast.k === "Comp") {
      expect(ast.name).toBe("TextContent")
      expect(ast.args).toHaveLength(2)
    }
  })

  it("parses an array", () => {
    const tokens = tokenize('["a", "b", "c"]').filter(t => t.t !== T.EOF)
    const ast = parseTokens(tokens)
    expect(ast.k).toBe("Arr")
    if (ast.k === "Arr") expect(ast.els).toHaveLength(3)
  })

  it("parses an object", () => {
    const tokens = tokenize('{name: "Alice", age: 30}').filter(t => t.t !== T.EOF)
    const ast = parseTokens(tokens)
    expect(ast.k).toBe("Obj")
    if (ast.k === "Obj") expect(ast.entries).toHaveLength(2)
  })

  it("parses if(condition, then, else)", () => {
    const tokens = tokenize('if(true, TextContent("yes"), TextContent("no"))').filter(t => t.t !== T.EOF)
    const ast = parseTokens(tokens)
    expect(ast.k).toBe("If")
    if (ast.k === "If") {
      expect(ast.cond.k).toBe("Bool")
      expect(ast.then.k).toBe("Comp")
      expect(ast.else.k).toBe("Comp")
    }
  })

  it("parses map(array, (item) => body)", () => {
    const tokens = tokenize('map(items, (x) => Badge(x))').filter(t => t.t !== T.EOF)
    const ast = parseTokens(tokens)
    expect(ast.k).toBe("Map")
    if (ast.k === "Map") {
      expect(ast.param).toBe("x")
      expect(ast.body.k).toBe("Comp")
    }
  })
})

// ---------------------------------------------------------------------------
// Full parse (one-shot)
// ---------------------------------------------------------------------------

describe("parse", () => {
  it("parses a simple DSL", () => {
    const result = parse('root = TextContent("hello", "large")', testParamMap)
    expect(result.root).not.toBeNull()
    expect(result.root?.typeName).toBe("TextContent")
    expect(result.root?.props.text).toBe("hello")
    expect(result.root?.props.size).toBe("large")
  })

  it("resolves references", () => {
    const dsl = `root = Card([title])
title = TextContent("Hello")`
    const result = parse(dsl, testParamMap)
    expect(result.root?.typeName).toBe("Card")
    const children = result.root?.props.children as unknown[]
    expect(children).toHaveLength(1)
    expect((children[0] as { typeName: string }).typeName).toBe("TextContent")
  })

  it("handles forward references (hoisting)", () => {
    const dsl = `root = Card([title])
title = TextContent("Hoisted")`
    const result = parse(dsl, testParamMap)
    expect(result.root).not.toBeNull()
    const children = result.root?.props.children as unknown[]
    expect((children[0] as { props: { text: string } }).props.text).toBe("Hoisted")
  })

  it("handles conditional rendering", () => {
    const dsl = `root = if(true, TextContent("yes"), TextContent("no"))`
    const result = parse(dsl, testParamMap)
    expect(result.root?.typeName).toBe("TextContent")
    expect(result.root?.props.text).toBe("yes")
  })

  it("handles false conditional", () => {
    const dsl = `root = if(false, TextContent("yes"), TextContent("no"))`
    const result = parse(dsl, testParamMap)
    expect(result.root?.typeName).toBe("TextContent")
    expect(result.root?.props.text).toBe("no")
  })

  it("returns null root when root is not defined", () => {
    const result = parse('title = TextContent("hello")', testParamMap)
    expect(result.root).toBeNull()
  })

  it("reports unresolved references", () => {
    const dsl = `root = Card([missing])`
    const result = parse(dsl, testParamMap)
    expect(result.meta.unresolved).toContain("missing")
  })

  it("handles empty input", () => {
    const result = parse("", testParamMap)
    expect(result.root).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Streaming parser
// ---------------------------------------------------------------------------

describe("createStreamParser", () => {
  it("builds tree incrementally", () => {
    const parser = createStreamParser(testParamMap)

    // First chunk: root defined but title not yet
    let result = parser.push('root = Card([title])\n')
    // title is unresolved, so root's children will have a null
    expect(result.meta.statementCount).toBeGreaterThanOrEqual(1)

    // Second chunk: title defined
    result = parser.push('title = TextContent("Hello")\n')
    expect(result.root?.typeName).toBe("Card")
    const children = result.root?.props.children as unknown[]
    expect(children).toBeDefined()
  })

  it("handles partial input", () => {
    const parser = createStreamParser(testParamMap)
    const result = parser.push('root = Card([TextContent("he')
    // Should auto-close and produce partial result
    expect(result.meta.incomplete).toBe(true)
  })

  it("getResult returns latest", () => {
    const parser = createStreamParser(testParamMap)
    parser.push('root = TextContent("hello")\n')
    const result = parser.getResult()
    expect(result.root?.typeName).toBe("TextContent")
  })
})
