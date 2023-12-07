import {
  astroCodeSnippets,
  codeSnippetAutoImport,
} from "./integrations/astro-code-snippets";
import mdx from "@astrojs/mdx";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import AutoImport from "astro-auto-import";
import pagefind from "astro-pagefind";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://joshmedeski.com/",
  integrations: [
    AutoImport({ imports: [codeSnippetAutoImport] }),
    astroCodeSnippets(),
    mdx(),
    pagefind(),
    sitemap(),
    tailwind(),
    preact(),
  ],
  // FIX: Waiting for this to be fixed
  // https://github.com/withastro/astro/issues/9353
  // experimental: {
  //   contentCollectionCache: true,
  // },
});
