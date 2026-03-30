import mdx from '@astrojs/mdx'
import preact from '@astrojs/preact'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import expressiveCode from 'astro-expressive-code'
import pagefind from 'astro-pagefind'
import { defineConfig } from 'astro/config'
import remarkGithubAlerts from 'remark-github-alerts'

// https://astro.build/config
export default defineConfig({
  site: 'https://joshmedeski.com/',
  prefetch: true,

  markdown: {
    remarkPlugins: [remarkGithubAlerts],
  },

  integrations: [
    // NOTE: expressiveCode must be before mdx
    expressiveCode(),
    mdx(),
    pagefind(),
    sitemap(),
    preact(),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
})
