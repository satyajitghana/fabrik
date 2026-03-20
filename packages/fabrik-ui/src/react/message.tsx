"use client"

import { type ReactNode, createElement } from "react"
import type {
  FabrikMessage,
  TextPart,
  ComponentPart,
  ThinkingPart,
  StepPart,
  ImagePart,
  AskPart,
  ArtifactPart,
  Part,
} from "../core/types"
import { useRegistry } from "./use-registry"
import { ComponentSlot } from "./component-slot"

// ---------------------------------------------------------------------------
// <Message> — renders any message with all part types
// ---------------------------------------------------------------------------

export interface MessageProps {
  message: FabrikMessage
  className?: string

  // Optional: override rendering for specific part types
  renderText?: (part: TextPart) => ReactNode
  renderComponent?: (part: ComponentPart) => ReactNode
  renderThinking?: (part: ThinkingPart) => ReactNode
  renderStep?: (part: StepPart) => ReactNode
  renderImage?: (part: ImagePart) => ReactNode
  renderAsk?: (part: AskPart) => ReactNode
  renderArtifact?: (part: ArtifactPart) => ReactNode
}

export function Message({
  message,
  className,
  renderText,
  renderComponent,
  renderThinking,
  renderStep,
  renderImage,
  renderAsk,
  renderArtifact,
}: MessageProps) {
  return (
    <div className={className} data-role={message.role}>
      {message.parts.map((part, i) => (
        <PartRenderer
          key={`${message.id}-${i}`}
          part={part}
          renderText={renderText}
          renderComponent={renderComponent}
          renderThinking={renderThinking}
          renderStep={renderStep}
          renderImage={renderImage}
          renderAsk={renderAsk}
          renderArtifact={renderArtifact}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Default part renderers
// ---------------------------------------------------------------------------

function PartRenderer({
  part,
  renderText,
  renderComponent,
  renderThinking,
  renderStep,
  renderImage,
  renderAsk,
  renderArtifact,
}: {
  part: Part
  renderText?: (part: TextPart) => ReactNode
  renderComponent?: (part: ComponentPart) => ReactNode
  renderThinking?: (part: ThinkingPart) => ReactNode
  renderStep?: (part: StepPart) => ReactNode
  renderImage?: (part: ImagePart) => ReactNode
  renderAsk?: (part: AskPart) => ReactNode
  renderArtifact?: (part: ArtifactPart) => ReactNode
}) {
  switch (part.type) {
    case "text":
      return renderText?.(part) ?? <DefaultText part={part} />
    case "component":
      return renderComponent?.(part) ?? <DefaultComponent part={part} />
    case "thinking":
      return renderThinking?.(part) ?? <DefaultThinking part={part} />
    case "step":
      return renderStep?.(part) ?? <DefaultStep part={part} />
    case "image":
      return renderImage?.(part) ?? <DefaultImage part={part} />
    case "ask":
      return renderAsk?.(part) ?? <DefaultAsk part={part} />
    case "artifact":
      return renderArtifact?.(part) ?? <DefaultArtifact part={part} />
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Basic markdown rendering (no external dependency)
// ---------------------------------------------------------------------------

interface InlineToken {
  type: "text" | "bold" | "italic" | "code" | "link"
  content: string
  href?: string
}

function tokenizeInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = []
  // Regex matches: bold (**), italic (*), inline code (`), and links [text](url)
  const pattern = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    // Push any text before this match
    if (match.index > lastIndex) {
      tokens.push({ type: "text", content: text.slice(lastIndex, match.index) })
    }

    if (match[1]) {
      // Bold: **text**
      tokens.push({ type: "bold", content: match[2]! })
    } else if (match[3]) {
      // Italic: *text*
      tokens.push({ type: "italic", content: match[4]! })
    } else if (match[5]) {
      // Code: `code`
      tokens.push({ type: "code", content: match[6]! })
    } else if (match[7]) {
      // Link: [text](url)
      tokens.push({ type: "link", content: match[8]!, href: match[9]! })
    }

    lastIndex = match.index + match[0].length
  }

  // Push remaining text
  if (lastIndex < text.length) {
    tokens.push({ type: "text", content: text.slice(lastIndex) })
  }

  return tokens
}

function renderInlineTokens(tokens: InlineToken[]): ReactNode[] {
  return tokens.map((token, i) => {
    switch (token.type) {
      case "bold":
        return createElement("strong", { key: i, className: "font-semibold" }, token.content)
      case "italic":
        return createElement("em", { key: i }, token.content)
      case "code":
        return createElement(
          "code",
          {
            key: i,
            className:
              "rounded bg-[var(--muted)] px-1 py-0.5 text-[0.875em] font-mono",
          },
          token.content,
        )
      case "link":
        return createElement(
          "a",
          {
            key: i,
            href: token.href,
            target: "_blank",
            rel: "noopener noreferrer",
            className: "underline underline-offset-2 hover:opacity-80",
          },
          token.content,
        )
      case "text":
      default:
        return token.content
    }
  })
}

function renderMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  // Split by code blocks first
  const codeBlockPattern = /```(\w*)\n?([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = codeBlockPattern.exec(text)) !== null) {
    // Process text before the code block
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index)
      nodes.push(...renderMarkdownLines(before, nodes.length))
    }

    // Render the code block
    const lang = match[1] || ""
    const code = match[2]!
    nodes.push(
      createElement(
        "pre",
        {
          key: `cb-${nodes.length}`,
          className:
            "my-2 overflow-x-auto rounded-lg bg-[var(--muted)] p-3 text-[0.875em]",
        },
        createElement(
          "code",
          {
            className: "font-mono",
            ...(lang ? { "data-language": lang } : {}),
          },
          code,
        ),
      ),
    )

    lastIndex = match.index + match[0].length
  }

  // Process remaining text
  if (lastIndex < text.length) {
    nodes.push(...renderMarkdownLines(text.slice(lastIndex), nodes.length))
  }

  return nodes
}

function renderMarkdownLines(text: string, keyOffset: number): ReactNode[] {
  const lines = text.split("\n")
  const nodes: ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (i > 0) {
      nodes.push(createElement("br", { key: `br-${keyOffset}-${i}` }))
    }
    const tokens = tokenizeInline(line)
    if (tokens.length === 1 && tokens[0]!.type === "text") {
      nodes.push(tokens[0]!.content)
    } else {
      nodes.push(
        createElement(
          "span",
          { key: `ln-${keyOffset}-${i}` },
          ...renderInlineTokens(tokens),
        ),
      )
    }
  }

  return nodes
}

// Default renderers — minimal, functional. Will be replaced by chat/ components.

function DefaultText({ part }: { part: TextPart }) {
  return <p className="whitespace-pre-wrap">{renderMarkdown(part.text)}</p>
}

function DefaultComponent({ part }: { part: ComponentPart }) {
  const registry = useRegistry()
  return <ComponentSlot part={part} registry={registry} />
}

function DefaultThinking({ part }: { part: ThinkingPart }) {
  return (
    <details className="text-sm text-muted-foreground">
      <summary>
        {part.status === "streaming"
          ? "Thinking..."
          : `Thought for ${part.durationMs ? (part.durationMs / 1000).toFixed(1) + "s" : "a moment"}`}
      </summary>
      <p className="mt-1 whitespace-pre-wrap text-xs">{part.text}</p>
    </details>
  )
}

function DefaultStep({ part }: { part: StepPart }) {
  const icon =
    part.stepStatus === "running"
      ? "◌"
      : part.stepStatus === "done"
        ? "✓"
        : "✗"
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>{icon}</span>
      <span>{part.title}</span>
      {part.durationMs != null && part.stepStatus !== "running" && (
        <span className="text-xs opacity-60">
          {(part.durationMs / 1000).toFixed(1)}s
        </span>
      )}
    </div>
  )
}

function DefaultImage({ part }: { part: ImagePart }) {
  return (
    <img
      src={part.url}
      alt={part.alt ?? ""}
      className="max-w-full rounded-md"
      loading="lazy"
    />
  )
}

function DefaultAsk({ part }: { part: AskPart }) {
  if (part.status !== "pending") {
    return (
      <div className="text-sm text-muted-foreground">
        Answered: {JSON.stringify(part.response)}
      </div>
    )
  }
  return (
    <div className="rounded-lg border p-4 text-sm">
      <p className="font-medium">{part.config.title}</p>
      {"message" in part.config && part.config.message && (
        <p className="mt-1 text-muted-foreground">{part.config.message}</p>
      )}
      {"options" in part.config && (
        <div className="mt-2 flex flex-wrap gap-2">
          {part.config.options.map((opt) => (
            <button
              key={opt.value}
              className="rounded-full border px-3 py-1 text-sm hover:bg-accent"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function DefaultArtifact({ part }: { part: ArtifactPart }) {
  return (
    <div className="my-2 rounded-lg border p-4 text-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium">{part.title}</span>
        <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
          {part.language.toUpperCase()}
        </span>
      </div>
      {part.language === "html" ? (
        <iframe
          srcDoc={part.content}
          sandbox="allow-scripts"
          className="w-full rounded border"
          style={{ height: 200 }}
          title={part.title}
        />
      ) : (
        <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
          <code className={`language-${part.language}`}>{part.content}</code>
        </pre>
      )}
    </div>
  )
}
