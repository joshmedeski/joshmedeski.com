import { SITE_TITLE, SITE_DESCRIPTION } from '../config'
import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'

export async function GET(context: { site: URL }) {
  const posts = await getCollection('posts', ({ data }) => !data.draft)
  posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site ?? import.meta.env.SITE,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/posts/${post.id}/`,
    })),
  })
}
