import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
// https://docs.astro.build/en/guides/deploy/netlify/
export default defineConfig({
  site: "https://joshmedeski.com",
  integrations: [mdx(), sitemap(), tailwind()],
});

