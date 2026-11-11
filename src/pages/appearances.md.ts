import type { APIContext } from 'astro'
import { getCollection } from 'astro:content'
import { appearanceLink, byNewest, markdownResponse } from '~/utils/siteContent'

export async function GET({ site }: APIContext) {
  const appearances = (await getCollection('appearances')).sort(byNewest)
  return markdownResponse([
    '# Appearances',
    `Podcasts, interviews, and articles featuring Josh Medeski on other sites, newest first. Each link goes to the original. The HTML version is at ${new URL('/content?type=appearance', site)}.`,
    appearances.map((entry) => appearanceLink(site, entry)).join('\n'),
  ])
}
