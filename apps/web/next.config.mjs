import { createMDX } from "fumadocs-mdx/next"

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: ["@workspace/ui", "@fabrik-sdk/ui"],
  serverExternalPackages: ["@google/genai"],
}

export default withMDX(config)
