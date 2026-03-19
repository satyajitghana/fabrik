/**
 * Pre-built component libraries for fabrik-ui.
 *
 * These are schema definitions that tell the LLM what components are available.
 * The actual React components must be provided by the consumer (from shadcn/ui or custom).
 *
 * Usage:
 *   import { chatSchemas, dashboardSchemas } from "@fabrik/ui/ui"
 *   // Then wrap with your own React components:
 *   const myLibrary = chatSchemas.map(s => defineComponent({ ...s, component: MyComponent }))
 *
 * Or use the helper:
 *   import { createChatLibrary } from "@fabrik/ui/ui"
 *   const library = createChatLibrary({ Card: MyCard, CodeBlock: MyCodeBlock, ... })
 */

import { z } from "zod"
import type { ComponentDefBase } from "../core/types"

// ---------------------------------------------------------------------------
// Schema definitions (LLM-facing metadata, no React components)
// ---------------------------------------------------------------------------

export const schemas = {
  // Data Display
  card: {
    name: "card",
    description: "A card container for displaying grouped information with title, description, content, and optional footer.",
    schema: z.object({
      title: z.string().describe("Card heading"),
      description: z.string().optional().describe("Subtitle text"),
      content: z.string().describe("Main body content"),
      footer: z.string().optional().describe("Footer text"),
    }),
  },
  table: {
    name: "table",
    description: "A data table with column headers and rows of data.",
    schema: z.object({
      headers: z.array(z.string()).describe("Column header labels"),
      rows: z.array(z.array(z.string())).describe("Table rows, each an array of cell values"),
      caption: z.string().optional().describe("Table caption/title"),
    }),
  },
  code_block: {
    name: "code_block",
    description: "A syntax-highlighted code block with optional filename and language.",
    schema: z.object({
      code: z.string().describe("The source code to display"),
      language: z.string().optional().describe("Programming language for highlighting"),
      filename: z.string().optional().describe("Optional filename header"),
    }),
  },
  markdown_view: {
    name: "markdown_view",
    description: "Renders rich markdown content with formatting, links, and code blocks.",
    schema: z.object({
      content: z.string().describe("Markdown text to render"),
    }),
  },
  image_view: {
    name: "image_view",
    description: "Displays an image with optional caption.",
    schema: z.object({
      src: z.string().describe("Image URL"),
      alt: z.string().optional().describe("Alt text for accessibility"),
      caption: z.string().optional().describe("Caption below the image"),
    }),
  },
  alert: {
    name: "alert",
    description: "An alert/callout box for important messages. Variants: info, warning, error, success.",
    schema: z.object({
      title: z.string().optional().describe("Alert title"),
      content: z.string().describe("Alert message"),
      variant: z.enum(["info", "warning", "error", "success"]).describe("Visual style"),
    }),
  },
  badge: {
    name: "badge",
    description: "A small status badge/tag.",
    schema: z.object({
      text: z.string().describe("Badge text"),
      variant: z.enum(["default", "secondary", "destructive", "outline"]).optional().describe("Visual style"),
    }),
  },

  // Dashboard
  stat_card: {
    name: "stat_card",
    description: "A KPI stat card showing a metric label, value, and optional trend change.",
    schema: z.object({
      label: z.string().describe("Metric label"),
      value: z.string().describe("Metric value"),
      change: z.string().optional().describe("Change amount, e.g. '+14.3%'"),
      changeType: z.enum(["increase", "decrease"]).optional().describe("Whether the change is positive or negative"),
    }),
  },
  stats_grid: {
    name: "stats_grid",
    description: "A grid of KPI stat cards showing multiple metrics side by side.",
    schema: z.object({
      stats: z.array(z.object({
        label: z.string(),
        value: z.string(),
        change: z.string().optional(),
        changeType: z.enum(["increase", "decrease"]).optional(),
      })).describe("Array of stat entries"),
      columns: z.number().optional().describe("Number of grid columns (2, 3, or 4)"),
    }),
  },
  progress_bar: {
    name: "progress_bar",
    description: "A horizontal progress bar showing completion percentage.",
    schema: z.object({
      label: z.string().describe("Progress label"),
      value: z.number().describe("Current value"),
      max: z.number().optional().describe("Maximum value (default 100)"),
    }),
  },
  metric_list: {
    name: "metric_list",
    description: "A vertical list of label-value metric pairs.",
    schema: z.object({
      items: z.array(z.object({
        label: z.string(),
        value: z.string(),
        description: z.string().optional(),
      })).describe("Metric items"),
    }),
  },
  timeline: {
    name: "timeline",
    description: "A vertical timeline of events.",
    schema: z.object({
      events: z.array(z.object({
        title: z.string(),
        description: z.string().optional(),
        time: z.string(),
        status: z.enum(["completed", "active", "pending"]).optional(),
      })).describe("Timeline events"),
    }),
  },

  // Charts
  bar_chart: {
    name: "bar_chart",
    description: "A horizontal bar chart showing labeled data points.",
    schema: z.object({
      title: z.string().optional().describe("Chart title"),
      data: z.array(z.object({
        label: z.string().describe("Data point label"),
        value: z.number().describe("Data point value"),
      })).describe("Chart data points"),
    }),
  },
  line_chart: {
    name: "line_chart",
    description: "A line chart showing trends over time.",
    schema: z.object({
      title: z.string().optional(),
      data: z.array(z.object({ label: z.string(), value: z.number() })),
    }),
  },
  pie_chart: {
    name: "pie_chart",
    description: "A pie/donut chart showing proportions.",
    schema: z.object({
      title: z.string().optional(),
      data: z.array(z.object({ label: z.string(), value: z.number() })),
      donut: z.boolean().optional().describe("Show as donut chart"),
    }),
  },

  // Layout
  tabs: {
    name: "tabs",
    description: "A tabbed container with labeled sections.",
    schema: z.object({
      tabs: z.array(z.object({
        label: z.string().describe("Tab label"),
        content: z.string().describe("Tab content"),
      })).describe("Tab definitions"),
    }),
  },
  accordion: {
    name: "accordion",
    description: "Collapsible accordion sections.",
    schema: z.object({
      items: z.array(z.object({
        title: z.string(),
        content: z.string(),
      })).describe("Accordion items"),
    }),
  },
  divider: {
    name: "divider",
    description: "A horizontal divider/separator line.",
    schema: z.object({
      label: z.string().optional().describe("Optional label on the divider"),
    }),
  },

  // Navigation
  breadcrumb: {
    name: "breadcrumb",
    description: "A breadcrumb navigation trail.",
    schema: z.object({
      items: z.array(z.object({
        label: z.string(),
        href: z.string().optional(),
      })).describe("Breadcrumb items from root to current"),
    }),
  },

  // Forms
  form: {
    name: "form",
    description: "A dynamic form with multiple fields that the user can fill out.",
    schema: z.object({
      fields: z.array(z.object({
        name: z.string(),
        label: z.string(),
        type: z.enum(["text", "number", "email", "textarea", "select", "checkbox"]).describe("Field type"),
        placeholder: z.string().optional(),
        required: z.boolean().optional(),
        options: z.array(z.object({ value: z.string(), label: z.string() })).optional().describe("Options for select fields"),
      })).describe("Form fields"),
      submitLabel: z.string().optional().describe("Submit button text"),
    }),
  },
} as const

// ---------------------------------------------------------------------------
// Schema name lists for library presets
// ---------------------------------------------------------------------------

export const chatSchemaNames = ["card", "code_block", "markdown_view", "image_view", "alert", "badge"] as const
export const dashboardSchemaNames = ["stat_card", "stats_grid", "bar_chart", "line_chart", "pie_chart", "table", "progress_bar", "metric_list", "tabs"] as const
export const allSchemaNames = Object.keys(schemas) as (keyof typeof schemas)[]

// ---------------------------------------------------------------------------
// Helper to create libraries from schemas + user-provided components
// ---------------------------------------------------------------------------

type SchemaName = keyof typeof schemas

/**
 * Create a component library by mapping schema names to React components.
 *
 * @example
 * ```tsx
 * import { createComponentLibrary, chatSchemaNames } from "@fabrik/ui/ui"
 * import { Card, CodeBlock, ... } from "./my-components"
 *
 * const library = createComponentLibrary(chatSchemaNames, {
 *   card: Card,
 *   code_block: CodeBlock,
 *   // ...
 * })
 * ```
 */
export function createComponentLibrary(
  names: readonly SchemaName[],
  components: Partial<Record<SchemaName, React.ComponentType<Record<string, unknown>>>>
): ComponentDefBase[] {
  return names
    .filter(name => components[name])
    .map(name => ({
      ...schemas[name],
      component: components[name]!,
    })) as ComponentDefBase[]
}
