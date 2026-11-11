import type { APIContext } from 'astro'
import {
  byNewest,
  entryLink,
  getPublished,
  markdownResponse,
} from '~/utils/siteContent'

export async function GET({ site }: APIContext) {
  const guides = (await getPublished('guides')).sort(byNewest)
  return markdownResponse([
    '# Guides',
    `Multi-part guides by Josh Medeski. Each link is the plain markdown version of the guide. The HTML version is at ${new URL('/guides/', site)}.`,
    guides.map((guide) => entryLink(site, 'guides', guide)).join('\n'),
  ])
}
