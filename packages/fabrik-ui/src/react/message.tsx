"use client"

import type { ReactNode } from "react"
import type {
  FabrikMessage,
  TextPart,
  ComponentPart,
  ThinkingPart,
  StepPart,
  ImagePart,
  AskPart,
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
}: {
  part: Part
  renderText?: (part: TextPart) => ReactNode
  renderComponent?: (part: ComponentPart) => ReactNode
  renderThinking?: (part: ThinkingPart) => ReactNode
  renderStep?: (part: StepPart) => ReactNode
  renderImage?: (part: ImagePart) => ReactNode
  renderAsk?: (part: AskPart) => ReactNode
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
    default:
      return null
  }
}

// Default renderers — minimal, functional. Will be replaced by chat/ components.

function DefaultText({ part }: { part: TextPart }) {
  return <p className="whitespace-pre-wrap">{part.text}</p>
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
