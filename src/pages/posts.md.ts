import type { APIContext } from 'astro'
import { getCollection } from 'astro:content'
import { byNewest, entryLink, markdownResponse } from '~/utils/siteContent'

export async function GET({ site }: APIContext) {
  const posts = (await getCollection('posts')).sort(byNewest)
  return markdownResponse([
    '# Posts',
    `Every post by Josh Medeski, newest first. Each link is the plain markdown version of the post. The HTML version is at ${new URL('/content?type=writing', site)}.`,
    posts.map((post) => entryLink(site, 'posts', post)).join('\n'),
  ])
}
