import type { APIContext } from 'astro'
import {
  byNewest,
  entryLink,
  getPublished,
  markdownResponse,
} from '~/utils/siteContent'

export async function GET({ site }: APIContext) {
  const posts = (await getPublished('posts')).sort(byNewest)
  return markdownResponse([
    '# Posts',
    `Every post by Josh Medeski, newest first. Each link is the plain markdown version of the post. The HTML version is at ${new URL('/content?type=writing', site)}.`,
    posts.map((post) => entryLink(site, 'posts', post)).join('\n'),
  ])
}
