import mdx from '@astrojs/mdx'
import preact from '@astrojs/preact'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import expressiveCode from 'astro-expressive-code'
import pagefind from 'astro-pagefind'
import { defineConfig } from 'astro/config'

import remarkDirective from 'remark-directive'
import wikiLinkPlugin from '@portaljs/remark-wiki-link'
import rehypeCallouts from 'rehype-callouts'

import remarkGhRepoDirective from './src/utils/remarkGhRepoDirective'
import {
  resolveAttachment,
  resolveWikiPage,
  slugifyWiki,
} from './src/utils/wikiLinkIndex'

const IMAGE_EXT = /\.(png|jpe?g|gif|svg|webp|avif)$/i

function urlResolver(name) {
  if (IMAGE_EXT.test(name)) {
    const att = resolveAttachment(name)
    if (att) return att.url
  }
  const page = resolveWikiPage(name)
  if (page) return page.url
  return `#broken-${slugifyWiki(name)}`
}

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
    preact(),
  ],

  markdown: {
    remarkPlugins: [
      remarkDirective,
      remarkGhRepoDirective,
      [
        wikiLinkPlugin,
        {
          aliasDivider: '|',
          urlResolver,
          className: 'internal-link',
          newClassName: 'broken-link',
        },
      ],
    ],
    rehypePlugins: [rehypeCallouts],
  },

  vite: {
    plugins: [tailwindcss()],
  },
})
