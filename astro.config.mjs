import {
  astroCodeSnippets,
  codeSnippetAutoImport,
} from "./integrations/astro-code-snippets";
import mdx from "@astrojs/mdx";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import AutoImport from "astro-auto-import";
import { defineConfig, squooshImageService } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://joshmedeski.com/",
  integrations: [
    AutoImport({ imports: [codeSnippetAutoImport] }),
    astroCodeSnippets(),
    mdx(),
    sitemap(),
    tailwind(),
    preact(),
  ],
  image: {
    service: squooshImageService(),
  },
});
