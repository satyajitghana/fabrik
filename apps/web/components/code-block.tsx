"use client"

import { useEffect, useState } from "react"
import { codeToHtml } from "shiki"

interface CodeBlockProps {
  code: string
  lang?: string
  filename?: string
}

export function CodeBlock({ code, lang = "tsx", filename }: CodeBlockProps) {
  const [html, setHtml] = useState("")

  useEffect(() => {
    codeToHtml(code.trim(), {
      lang,
      theme: "vitesse-dark",
    }).then(setHtml)
  }, [code, lang])

  return (
    <div
      role="region"
      aria-label={filename ? `Code: ${filename}` : "Code block"}
      className="rounded-xl overflow-hidden border border-white/10 bg-zinc-950"
    >
      {filename && (
        <div className="flex items-center px-4 py-2.5 border-b border-white/10">
          <span className="text-xs text-white/40 font-mono">{filename}</span>
        </div>
      )}
      {html ? (
        <div
          className="p-5 overflow-x-auto text-[13px] leading-[1.7] [&_pre]:!bg-transparent [&_code]:!bg-transparent"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="p-5 text-[13px] leading-[1.7] text-white/50 font-mono">
          {code.trim()}
        </pre>
      )}
    </div>
  )
}
