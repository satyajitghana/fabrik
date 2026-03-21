// @ts-nocheck
import * as __fd_glob_12 from "../content/docs/structure.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/streaming.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/security.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/quickstart.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/providers.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/index.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/generative-ui.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/examples.mdx?collection=docs"
import * as __fd_glob_4 from "../content/docs/elicitations.mdx?collection=docs"
import * as __fd_glob_3 from "../content/docs/components.mdx?collection=docs"
import * as __fd_glob_2 from "../content/docs/artifacts.mdx?collection=docs"
import * as __fd_glob_1 from "../content/docs/api.mdx?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, }, {"api.mdx": __fd_glob_1, "artifacts.mdx": __fd_glob_2, "components.mdx": __fd_glob_3, "elicitations.mdx": __fd_glob_4, "examples.mdx": __fd_glob_5, "generative-ui.mdx": __fd_glob_6, "index.mdx": __fd_glob_7, "providers.mdx": __fd_glob_8, "quickstart.mdx": __fd_glob_9, "security.mdx": __fd_glob_10, "streaming.mdx": __fd_glob_11, "structure.mdx": __fd_glob_12, });