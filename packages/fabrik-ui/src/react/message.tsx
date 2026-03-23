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
  UiPart,
  Part,
} from "../core/types"
import { useRegistry } from "./use-registry"
import { ComponentSlot } from "./component-slot"
import { useFabrikActions } from "./provider"
import { PermissionDialog } from "../chat/permission-dialog"
import { ConfirmDialog } from "../chat/confirm-dialog"
import { ChoicePicker } from "../chat/choice-picker"
import { TextInputDialog } from "../chat/text-input-dialog"
import { FabrikLangRenderer } from "../lang/renderer"
import { createLangLibrary } from "../lang/library"
import { allLangComponents } from "../lang/components"

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
    case "ui":
      return <DefaultUi part={part} />
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
  return (
    <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
      {part.stepStatus === "running" ? (
        <svg className="w-3.5 h-3.5 animate-spin shrink-0" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
          <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ) : part.stepStatus === "done" ? (
        <svg className="w-3.5 h-3.5 text-success shrink-0" viewBox="0 0 16 16" fill="currentColor">
          <path fillRule="evenodd" d="M8 16A8 8 0 108 0a8 8 0 000 16zm3.78-9.72a.75.75 0 00-1.06-1.06L7 8.94 5.28 7.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l4.25-4.25z" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5 text-destructive shrink-0" viewBox="0 0 16 16" fill="currentColor">
          <path fillRule="evenodd" d="M8 16A8 8 0 108 0a8 8 0 000 16zM5.28 5.28a.75.75 0 011.06 0L8 6.94l1.66-1.66a.75.75 0 111.06 1.06L9.06 8l1.66 1.66a.75.75 0 11-1.06 1.06L8 9.06l-1.66 1.66a.75.75 0 01-1.06-1.06L6.94 8 5.28 6.34a.75.75 0 010-1.06z" />
        </svg>
      )}
      <span>{part.title}</span>
      {part.durationMs != null && part.stepStatus !== "running" && (
        <span className="text-[11px] tabular-nums opacity-50">
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
  const actions = useFabrikActions()
  const respond = (value: unknown) => actions.respond(part.id, value)

  if (part.status !== "pending") {
    return <ResolvedAsk part={part} />
  }

  switch (part.config.type) {
    case "permission":
      return (
        <PermissionDialog
          title={part.config.title}
          message={part.config.message}
          resource={part.config.resource}
          onRespond={(granted) => respond(granted ? "allow" : "deny")}
        />
      )
    case "confirm":
      return <ConfirmDialog config={part.config} onRespond={respond} />
    case "choice":
    case "multi_choice":
      return <ChoicePicker config={part.config} onRespond={respond} />
    case "text":
      return (
        <TextInputDialog
          title={part.config.title}
          message={part.config.message}
          placeholder={part.config.placeholder}
          onRespond={(text) => respond(text)}
        />
      )
    default:
      return null
  }
}

/** Shows the original elicitation UI in a resolved (disabled) state with the user's response */
function ResolvedAsk({ part }: { part: AskPart }) {
  const isPositive = part.response === true || part.response === "allow"
  const isNegative = part.response === false || part.response === "deny"

  const responseLabel =
    part.response === true ? "Confirmed"
    : part.response === false ? "Declined"
    : part.response === "allow" ? "Allowed"
    : part.response === "deny" ? "Denied"
    : String(part.response ?? "")

  const statusIcon = isPositive ? (
    <svg className="w-3.5 h-3.5 text-success shrink-0" viewBox="0 0 16 16" fill="currentColor">
      <path fillRule="evenodd" d="M8 16A8 8 0 108 0a8 8 0 000 16zm3.78-9.72a.75.75 0 00-1.06-1.06L7 8.94 5.28 7.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l4.25-4.25z" />
    </svg>
  ) : isNegative ? (
    <svg className="w-3.5 h-3.5 text-destructive shrink-0" viewBox="0 0 16 16" fill="currentColor">
      <path fillRule="evenodd" d="M8 16A8 8 0 108 0a8 8 0 000 16zM5.28 5.28a.75.75 0 011.06 0L8 6.94l1.66-1.66a.75.75 0 111.06 1.06L9.06 8l1.66 1.66a.75.75 0 11-1.06 1.06L8 9.06l-1.66 1.66a.75.75 0 01-1.06-1.06L6.94 8 5.28 6.34a.75.75 0 010-1.06z" />
    </svg>
  ) : null

  switch (part.config.type) {
    case "permission":
      return (
        <div className="rounded-xl border border-border bg-card/50 p-4 my-2 opacity-75">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold">{part.config.title}</p>
              <p className="text-[12px] mt-0.5 text-muted-foreground">{part.config.message}</p>
              <span className="text-[11px] mt-1.5 font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground inline-block">{part.config.resource}</span>
              <div className="flex items-center gap-1.5 mt-3 text-[12px]">
                {statusIcon}
                <span className={isPositive ? "text-success font-medium" : isNegative ? "text-destructive font-medium" : "text-muted-foreground"}>
                  {responseLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      )

    case "confirm":
      return (
        <div className="rounded-xl border border-border bg-card/50 p-4 my-2 opacity-75">
          <p className="text-[13px] font-semibold">{part.config.title}</p>
          <p className="text-[12px] mt-1 text-muted-foreground">{part.config.message}</p>
          <div className="flex items-center gap-1.5 mt-3 text-[12px]">
            {statusIcon}
            <span className={isPositive ? "text-success font-medium" : "text-destructive font-medium"}>
              {responseLabel}
            </span>
          </div>
        </div>
      )

    case "choice":
      return (
        <div className="rounded-xl border border-border bg-card/50 p-4 my-2 opacity-75">
          <p className="text-[13px] font-semibold">{part.config.title}</p>
          {"message" in part.config && part.config.message && (
            <p className="text-[12px] mt-1 text-muted-foreground">{part.config.message}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {part.config.options.map((opt) => (
              <span
                key={opt.value}
                className={`rounded-full border px-3 py-1.5 text-[12px] ${
                  opt.value === part.response
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-muted-foreground/50"
                }`}
              >
                {opt.value === part.response && statusIcon}
                {opt.label}
              </span>
            ))}
          </div>
        </div>
      )

    case "text":
      return (
        <div className="rounded-xl border border-border bg-card/50 p-4 my-2 opacity-75">
          <p className="text-[13px] font-semibold">{part.config.title}</p>
          <div className="flex items-center gap-1.5 mt-2 text-[13px]">
            {statusIcon}
            <span className="text-foreground">{String(part.response ?? "")}</span>
          </div>
        </div>
      )

    default:
      return (
        <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground py-1">
          {statusIcon}
          <span>{responseLabel}</span>
        </div>
      )
  }
}

// Default Fabrik Lang library (created once, shared across all UiPart renders)
const defaultLangLibrary = createLangLibrary(allLangComponents)

function DefaultUi({ part }: { part: UiPart }) {
  return (
    <div className="my-2">
      <FabrikLangRenderer
        text={part.dslText}
        library={defaultLangLibrary}
        isStreaming={part.status === "streaming"}
      />
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
