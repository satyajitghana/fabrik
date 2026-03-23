import { T, type Token } from "./types"

// ---------------------------------------------------------------------------
// Auto-close: add missing closing delimiters for streaming resilience
// ---------------------------------------------------------------------------

export function autoClose(text: string): { text: string; wasIncomplete: boolean } {
  const stack: string[] = []
  let inStr = false
  let escape = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    if (escape) { escape = false; continue }
    if (ch === "\\") { escape = true; continue }
    if (ch === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (ch === "(") stack.push(")")
    else if (ch === "[") stack.push("]")
    else if (ch === "{") stack.push("}")
    else if (ch === ")" || ch === "]" || ch === "}") stack.pop()
  }

  if (inStr) {
    text += '"'
    // Re-check brackets after closing string
    return autoClose(text)
  }

  if (stack.length === 0) return { text, wasIncomplete: false }
  return { text: text + stack.reverse().join(""), wasIncomplete: true }
}

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

const KEYWORDS: Record<string, T> = {
  true: T.True,
  false: T.False,
  null: T.Null,
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const len = input.length

  while (i < len) {
    const ch = input[i]!

    // Skip horizontal whitespace (spaces, tabs, CR) but NOT newlines
    if (ch === " " || ch === "\t" || ch === "\r") { i++; continue }

    // Newline — significant at depth 0
    if (ch === "\n") { tokens.push({ t: T.Newline }); i++; continue }

    // Single-character tokens
    if (ch === "(") { tokens.push({ t: T.LParen }); i++; continue }
    if (ch === ")") { tokens.push({ t: T.RParen }); i++; continue }
    if (ch === "[") { tokens.push({ t: T.LBrack }); i++; continue }
    if (ch === "]") { tokens.push({ t: T.RBrack }); i++; continue }
    if (ch === "{") { tokens.push({ t: T.LBrace }); i++; continue }
    if (ch === "}") { tokens.push({ t: T.RBrace }); i++; continue }
    if (ch === ",") { tokens.push({ t: T.Comma }); i++; continue }
    if (ch === ":") { tokens.push({ t: T.Colon }); i++; continue }

    // => arrow
    if (ch === "=" && i + 1 < len && input[i + 1] === ">") {
      tokens.push({ t: T.Arrow }); i += 2; continue
    }

    // = equals
    if (ch === "=") { tokens.push({ t: T.Equals }); i++; continue }

    // String literal
    if (ch === '"') {
      let end = i + 1
      while (end < len) {
        if (input[end] === "\\" && end + 1 < len) { end += 2; continue }
        if (input[end] === '"') { end++; break }
        end++
      }
      const raw = input.slice(i, end)
      let value: string
      try {
        value = JSON.parse(raw) as string
      } catch {
        // Fallback: strip quotes
        value = raw.slice(1, raw.endsWith('"') ? -1 : undefined)
      }
      tokens.push({ t: T.Str, v: value })
      i = end
      continue
    }

    // Number literal (including negative)
    if (ch === "-" || (ch >= "0" && ch <= "9")) {
      let end = i
      if (input[end] === "-") end++
      while (end < len && input[end]! >= "0" && input[end]! <= "9") end++
      if (end < len && input[end] === ".") {
        end++
        while (end < len && input[end]! >= "0" && input[end]! <= "9") end++
      }
      if (end < len && (input[end] === "e" || input[end] === "E")) {
        end++
        if (end < len && (input[end] === "+" || input[end] === "-")) end++
        while (end < len && input[end]! >= "0" && input[end]! <= "9") end++
      }
      const numStr = input.slice(i, end)
      const num = Number(numStr)
      if (!isNaN(num)) {
        tokens.push({ t: T.Num, v: num })
        i = end
        continue
      }
      // If number parsing fails, skip character
      i++
      continue
    }

    // Identifiers and keywords
    if ((ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_") {
      let end = i + 1
      while (end < len) {
        const c = input[end]!
        if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || (c >= "0" && c <= "9") || c === "_") {
          end++
        } else break
      }
      const word = input.slice(i, end)

      // Check keywords
      if (word in KEYWORDS) {
        tokens.push({ t: KEYWORDS[word]! })
        i = end
        continue
      }

      // PascalCase → component type, lowercase → identifier/reference
      const isPascal = ch >= "A" && ch <= "Z"
      tokens.push({ t: isPascal ? T.Type : T.Ident, v: word })
      i = end
      continue
    }

    // Comment: // until end of line
    if (ch === "/" && i + 1 < len && input[i + 1] === "/") {
      while (i < len && input[i] !== "\n") i++
      continue
    }

    // Unknown character — skip
    i++
  }

  tokens.push({ t: T.EOF })
  return tokens
}
