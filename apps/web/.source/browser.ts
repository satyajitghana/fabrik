// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"api.mdx": () => import("../content/docs/api.mdx?collection=docs"), "artifacts.mdx": () => import("../content/docs/artifacts.mdx?collection=docs"), "components.mdx": () => import("../content/docs/components.mdx?collection=docs"), "elicitations.mdx": () => import("../content/docs/elicitations.mdx?collection=docs"), "examples.mdx": () => import("../content/docs/examples.mdx?collection=docs"), "generative-ui.mdx": () => import("../content/docs/generative-ui.mdx?collection=docs"), "index.mdx": () => import("../content/docs/index.mdx?collection=docs"), "providers.mdx": () => import("../content/docs/providers.mdx?collection=docs"), "quickstart.mdx": () => import("../content/docs/quickstart.mdx?collection=docs"), "security.mdx": () => import("../content/docs/security.mdx?collection=docs"), "streaming.mdx": () => import("../content/docs/streaming.mdx?collection=docs"), "structure.mdx": () => import("../content/docs/structure.mdx?collection=docs"), }),
};
export default browserCollections;