"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { PiFeatherDuotone, PiListBold, PiXBold } from "react-icons/pi"

const sections = [
  {
    title: "Getting Started",
    items: [
      { label: "Introduction", href: "/docs" },
      { label: "Quickstart", href: "/docs/quickstart" },
      { label: "Project Structure", href: "/docs/structure" },
    ],
  },
  {
    title: "Guide",
    items: [
      { label: "Providers", href: "/docs/providers" },
      { label: "Components", href: "/docs/components" },
      { label: "Generative UI", href: "/docs/generative-ui" },
      { label: "Elicitations", href: "/docs/elicitations" },
      { label: "Artifacts & Diffs", href: "/docs/artifacts" },
      { label: "Streaming", href: "/docs/streaming" },
    ],
  },
  {
    title: "Reference",
    items: [
      { label: "API Reference", href: "/docs/api" },
      { label: "Examples", href: "/docs/examples" },
      { label: "Security", href: "/docs/security" },
    ],
  },
]

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-2">
            {section.title}
          </h3>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={`block px-2 py-1.5 text-[13px] rounded-md transition-colors ${
                      isActive
                        ? "text-foreground bg-muted font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export default function DocsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-dvh bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center">
                <PiFeatherDuotone className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold tracking-tight">Fabrik UI</span>
            </Link>
            <span className="text-xs text-muted-foreground font-mono">/docs</span>
          </div>
          <div className="flex items-center gap-4 text-[13px]">
            <Link href="/" className="hidden sm:block text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/playground" className="hidden sm:block text-muted-foreground hover:text-foreground transition-colors">
              Playground
            </Link>
            <a
              href="https://github.com"
              className="hidden sm:block text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <button
              className="lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close sidebar" : "Open sidebar"}
            >
              {mobileOpen ? <PiXBold className="w-5 h-5" /> : <PiListBold className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-border py-8 px-4 sticky top-14 h-[calc(100dvh-3.5rem)] overflow-y-auto">
          <SidebarContent pathname={pathname} />
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="fixed inset-y-14 left-0 z-50 w-72 bg-background border-r border-border py-6 px-4 overflow-y-auto lg:hidden">
              <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </aside>
          </>
        )}

        {/* Content */}
        <main className="flex-1 min-w-0 px-6 lg:px-12 py-10 max-w-3xl">
          {children}
        </main>
      </div>
    </div>
  )
}
