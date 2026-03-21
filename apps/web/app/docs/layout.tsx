import "fumadocs-ui/style.css"
import "./docs.css"
import { source } from "@/lib/source"
import { DocsLayout } from "fumadocs-ui/layouts/docs"
import { RootProvider } from "fumadocs-ui/provider/base"
import type { ReactNode } from "react"

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootProvider theme={{ enabled: false }}>
      <DocsLayout
        tree={source.pageTree}
        nav={{
          title: (
            <>
              <svg width="24" height="24" viewBox="0 0 128 128" className="shrink-0">
                <rect width="128" height="128" rx="28" fill="#0d9488"/>
                <g transform="translate(24,24) scale(0.3125)">
                  <path d="M215.8,119.6l-69.26,70.06a8,8,0,0,1-5.65,2.34H64.2V115.31a8,8,0,0,1,2.34-5.65L112.2,64.52V144l24-24Z" opacity="0.3" fill="white"/>
                  <path d="M221.28,34.75a64,64,0,0,0-90.49,0L60.69,104A15.9,15.9,0,0,0,56,115.31v73.38L26.34,218.34a8,8,0,0,0,11.32,11.32L67.32,200H140.7A15.92,15.92,0,0,0,152,195.32l0,0,69.23-70a64,64,0,0,0,0-90.57ZM142.07,46.06A48,48,0,0,1,211.79,112H155.33l34.35-34.34a8,8,0,0,0-11.32-11.32L120,124.69V67.87ZM72,115.35l32-31.67v57l-32,32ZM140.7,184H83.32l56-56h56.74Z" fill="white"/>
                </g>
              </svg>
              <span className="font-semibold">Fabrik UI</span>
            </>
          ),
          url: "/",
        }}
        links={[
          {
            type: "icon",
            url: "https://github.com",
            label: "GitHub",
            text: "GitHub",
            icon: (
              <svg
                role="img"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-5"
              >
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            ),
            external: true,
          },
        ]}
      >
        {children}
      </DocsLayout>
    </RootProvider>
  )
}
