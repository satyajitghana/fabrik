import { z } from "zod"
import { defineComponent } from "../core/registry"

const schema = z.object({
  title: z.string().describe("Card heading"),
  description: z.string().optional().describe("Card subtitle or description"),
  content: z.string().describe("Main body content"),
  footer: z.string().optional().describe("Footer text"),
})

// Note: The actual React component is provided by the consumer (from shadcn/ui or custom).
// This defineComponent creates the schema + metadata that the LLM uses to generate props.
// The component field uses a simple div renderer as a default.
function CardRenderer(props: z.infer<typeof schema>) {
  // This is a server-safe placeholder. In practice, consumers use their own shadcn Card.
  return null
}

export const card = defineComponent({
  name: "card",
  description: "A card container for displaying grouped information with a title, optional description, body content, and footer.",
  schema,
  component: CardRenderer,
})
