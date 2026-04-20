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
import remarkWikiLink from './src/utils/remarkWikiLink'

// https://astro.build/config
export default defineConfig({
  site: 'https://joshmedeski.com/',
  prefetch: true,

  integrations: [
    // NOTE: expressiveCode must be before mdx
    expressiveCode({
      themes: ['github-dark'],
      useDarkModeMediaQuery: false,
    }),
    mdx(),
    pagefind(),
    sitemap(),
    preact(),
  ],

  markdown: {
    remarkPlugins: [remarkDirective, remarkGhRepoDirective, remarkWikiLink],
    rehypePlugins: [rehypeCallouts],
  },

  vite: {
    plugins: [tailwindcss()],
  },
})
