import mdx from '@astrojs/mdx'
import preact from '@astrojs/preact'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import expressiveCode from 'astro-expressive-code'
import pagefind from 'astro-pagefind'
import { defineConfig } from 'astro/config'
import { satteri } from '@astrojs/markdown-satteri'

import satteriCallouts from 'satteri-callouts'

import ghRepoDirective from './src/utils/ghRepoDirective'

// https://astro.build/config
export default defineConfig({
  site: 'https://joshmedeski.com/',
  prefetch: true,
  cacheDir: './.astro-cache',
  compressHTML: true,

  build: {
    inlineStylesheets: 'auto',
  },

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
    processor: satteri({
      // `::gh-repo{repo="..."}` uses remark-directive syntax, which Sätteri's
      // parser supports natively once this feature is enabled.
      features: { directive: true },
      mdastPlugins: [ghRepoDirective],
      hastPlugins: [satteriCallouts()],
    }),
  },

  vite: {
    plugins: [tailwindcss()],
  },
})
