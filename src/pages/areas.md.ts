import type { APIContext } from 'astro'
import { getCollection } from 'astro:content'
import { areaLinks, markdownResponse } from '~/utils/siteContent'

export async function GET({ site }: APIContext) {
  return markdownResponse([
    '# Areas',
    `The topics Josh Medeski writes and makes things about. Each link is a markdown overview of everything in that area: posts, videos, guides, projects, uses, and appearances. The HTML version is at ${new URL('/areas/', site)}.`,
    areaLinks(site, await getCollection('areas')).join('\n'),
  ])
}
