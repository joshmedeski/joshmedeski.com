import mdx from '@astrojs/mdx'
import preact from '@astrojs/preact'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import expressiveCode from 'astro-expressive-code'
import pagefind from 'astro-pagefind'
import { defineConfig } from 'astro/config'

import remarkDirective from 'remark-directive'
import rehypeCallouts from 'rehype-callouts'

import remarkGhRepoDirective from './src/utils/remarkGhRepoDirective'

// https://astro.build/config
export default defineConfig({
  site: 'https://joshmedeski.com/',
  prefetch: true,
  cacheDir: './.astro-cache',

  integrations: [
    // NOTE: expressiveCode must be before mdx
    expressiveCode(),
    mdx(),
    pagefind(),
    sitemap(),
    preact(),
  ],

  markdown: {
    remarkPlugins: [remarkDirective, remarkGhRepoDirective],
    rehypePlugins: [rehypeCallouts],
  },

  vite: {
    plugins: [tailwindcss()],
  },
})
