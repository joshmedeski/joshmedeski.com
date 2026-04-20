import { SITE_TITLE, SITE_DESCRIPTION } from '../config'
import rss from '@astrojs/rss'
import { getCollection, render } from 'astro:content'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'

export async function GET(context: { site: URL }) {
  const container = await AstroContainer.create()
  const posts = await getCollection('posts', ({ data }) => !data.draft)
  posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())

  const site = context.site ?? new URL(import.meta.env.SITE)

  const items = await Promise.all(
    posts.map(async (post) => {
      const { Content } = await render(post)
      let content: string | undefined
      try {
        content = await container.renderToString(Content)
      } catch {
        content = undefined
      }
      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: `/posts/${post.id}/`,
        categories: [post.data.category.id],
        content,
      }
    }),
  )

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site,
    items,
  })
}
