// https://astro.build/config
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import partytown from "@astrojs/partytown";

export default defineConfig({
  site: "https://joshmedeski.com",
  integrations: [mdx(), sitemap(), tailwind(), partytown()],
});
