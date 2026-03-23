"use client"

import { useState, useEffect } from "react"
import { z } from "zod"
import { defineLangComponent } from "../library"

// ---------------------------------------------------------------------------
// TextContent — text block with size
// ---------------------------------------------------------------------------

export const TextContentDef = defineLangComponent({
  name: "TextContent",
  description: "Text block. size: small/default/large/small-heavy/large-heavy",
  schema: z.object({
    text: z.string(),
    size: z.enum(["small", "default", "large", "small-heavy", "large-heavy"]).optional(),
  }),
  component: ({ props }) => {
    const sizeMap: Record<string, string> = {
      small: "text-[12px] text-muted-foreground",
      default: "text-[13px] leading-relaxed",
      large: "text-lg",
      "small-heavy": "text-[12px] font-semibold text-muted-foreground",
      "large-heavy": "text-2xl font-bold",
    }
    const cls = sizeMap[String(props.size ?? "default")] ?? sizeMap.default
    const text = props.text as string

    // Render basic markdown: **bold**, *italic*, `code`, • bullets, newlines
    const html = text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 rounded bg-muted text-[12px] font-mono">$1</code>')
      .replace(/^[•·]\s*/gm, '<span class="mr-1">•</span>')
      .replace(/\n/g, "<br/>")

    return <p className={cls} dangerouslySetInnerHTML={{ __html: html }} />
  },
})

// ---------------------------------------------------------------------------
// CodeBlock — code with Shiki syntax highlighting
// ---------------------------------------------------------------------------

function ShikiCodeBlock({ language, code }: { language: string; code: string }) {
  const [html, setHtml] = useState("")

  useEffect(() => {
    // Dynamic import Shiki (it's a peer dep, may not be available)
    import("shiki").then(({ codeToHtml }) => {
      codeToHtml(code, { lang: language, theme: "vitesse-dark" })
        .then(setHtml)
        .catch(() => setHtml(""))
    }).catch(() => setHtml(""))
  }, [code, language])

  return (
    <div className="rounded-xl overflow-hidden border border-border my-1">
      <div className="flex items-center px-4 py-2 bg-muted/30 border-b border-border">
        <span className="text-[11px] font-mono text-muted-foreground">{language}</span>
      </div>
      {html ? (
        <div
          className="p-4 overflow-x-auto text-[12px] leading-[1.7] [&_pre]:!bg-transparent [&_code]:!bg-transparent bg-zinc-950"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="p-4 overflow-x-auto text-[12px] leading-[1.7] bg-zinc-950 text-white/80">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}

export const CodeBlockDef = defineLangComponent({
  name: "CodeBlock",
  description: "Code snippet with syntax highlighting. language: javascript/typescript/python/html/css/json/bash/etc.",
  schema: z.object({
    language: z.string(),
    code: z.string(),
  }),
  component: ({ props }) => (
    <ShikiCodeBlock language={props.language as string} code={props.code as string} />
  ),
})

// ---------------------------------------------------------------------------
// Callout — alert/callout with variant
// ---------------------------------------------------------------------------

export const CalloutDef = defineLangComponent({
  name: "Callout",
  description: "Alert callout. variant: info/success/warning/error/neutral",
  schema: z.object({
    variant: z.enum(["info", "success", "warning", "error", "neutral"]),
    title: z.string(),
    description: z.string(),
  }),
  component: ({ props }) => {
    const styles: Record<string, string> = {
      info: "border-primary/30 bg-primary/5",
      success: "border-success/30 bg-success/5",
      warning: "border-yellow-500/30 bg-yellow-500/5",
      error: "border-destructive/30 bg-destructive/5",
      neutral: "border-border",
    }
    const icons: Record<string, string> = {
      info: "\u2139\uFE0F", success: "\u2705", warning: "\u26A0\uFE0F", error: "\u274C", neutral: "\u2139\uFE0F",
    }
    const v = String(props.variant)
    return (
      <div className={`rounded-xl border p-4 my-1 ${styles[v] ?? ""}`}>
        <div className="flex items-start gap-2">
          <span className="text-sm">{icons[v]}</span>
          <div>
            <p className="text-[13px] font-semibold">{props.title as string}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">{props.description as string}</p>
          </div>
        </div>
      </div>
    )
  },
})

// ---------------------------------------------------------------------------
// Separator — divider with optional label
// ---------------------------------------------------------------------------

export const SeparatorDef = defineLangComponent({
  name: "Separator",
  description: "Horizontal divider. Optional label shown centered.",
  schema: z.object({
    orientation: z.enum(["horizontal"]).optional(),
    label: z.string().optional(),
  }),
  component: ({ props }) => {
    if (!props.label) return <hr className="border-border my-3" />
    return (
      <div className="flex items-center gap-3 my-3">
        <div className="flex-1 border-t border-border" />
        <span className="text-[11px] text-muted-foreground">{props.label as string}</span>
        <div className="flex-1 border-t border-border" />
      </div>
    )
  },
})

// ---------------------------------------------------------------------------
// Badge — inline badge
// ---------------------------------------------------------------------------

export const BadgeDef = defineLangComponent({
  name: "Badge",
  description: "Inline badge/tag. variant: default/secondary/outline/success/destructive",
  schema: z.object({
    text: z.string(),
    variant: z.enum(["default", "secondary", "outline", "success", "destructive"]).optional(),
  }),
  component: ({ props }) => {
    const variants: Record<string, string> = {
      default: "bg-primary text-white",
      secondary: "bg-secondary text-secondary-foreground",
      outline: "border border-border text-foreground",
      success: "bg-success/15 text-success",
      destructive: "bg-destructive/15 text-destructive",
    }
    const cls = variants[String(props.variant ?? "default")] ?? variants.default
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${cls}`}>
        {props.text as string}
      </span>
    )
  },
})

// ---------------------------------------------------------------------------
// Image — image display
// ---------------------------------------------------------------------------

export const ImageDef = defineLangComponent({
  name: "Image",
  description: "Image display with src URL and alt text",
  schema: z.object({
    src: z.string(),
    alt: z.string().optional(),
  }),
  component: ({ props }) => (
    <img
      src={props.src as string}
      alt={(props.alt as string) ?? ""}
      className="rounded-lg max-w-full h-auto"
      loading="lazy"
    />
  ),
})
