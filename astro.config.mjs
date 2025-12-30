import mdx from '@astrojs/mdx'
import preact from '@astrojs/preact'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import expressiveCode from 'astro-expressive-code'
import pagefind from 'astro-pagefind'
import { defineConfig } from 'astro/config'

import react from '@astrojs/react'

// https://astro.build/config
export default defineConfig({
  site: 'https://joshmedeski.com/',
  prefetch: true,

  integrations: [
    // NOTE: expressiveCode must be before mdx
    expressiveCode(),
    mdx(),
    pagefind(),
    sitemap(),
    preact({
      include: ['**/*.tsx', '**/*.ts'],
      exclude: ['**/r3f/*.tsx'],
    }),
    react({
      include: ['**/r3f/*.tsx'],
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
})
