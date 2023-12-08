import mdx from "@astrojs/mdx";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import expressiveCode from "astro-expressive-code";
import pagefind from "astro-pagefind";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://joshmedeski.com/",
  prefetch: true,
  integrations: [
    // NOTE: expressiveCode must be before mdx
    expressiveCode(),
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
