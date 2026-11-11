import type { APIContext } from 'astro'
import {
  getPublished,
  isoDate,
  markdownLink,
  markdownResponse,
  markdownSection,
} from '~/utils/siteContent'
import { pageviewsFromRecord, rankPosts } from '~/utils/fathom'
import { rankVideos, viewsFromRecord } from '~/utils/youtube'
import pageviewSnapshot from '~/data/pageviews.json'
import youtubeSnapshot from '~/data/youtube-views.json'

export async function GET({ site }: APIContext) {
  const posts = await getPublished('posts')
  const videos = rankVideos(posts, viewsFromRecord(youtubeSnapshot.views))
  const pages = rankPosts(
    posts,
    pageviewsFromRecord(pageviewSnapshot.pageviews),
  )
  const link = (post: (typeof posts)[number], count: number, unit: string) =>
    markdownLink(
      site,
      `/posts/${post.id}.md`,
      post.data.title,
      `${count.toLocaleString('en-US')} ${unit}`,
    )

  return markdownResponse([
    '# Stats',
    `Josh Medeski's most popular content, ranked. The HTML version is at ${new URL('/stats/', site)}.`,
    markdownSection(
      `Ranked videos (lifetime YouTube views, updated ${isoDate(new Date(youtubeSnapshot.fetchedAt))})`,
      videos.map(({ post, views }) => link(post, views, 'views')),
    ),
    markdownSection(
      `Ranked posts (pageviews since ${isoDate(new Date(pageviewSnapshot.since))}, updated ${isoDate(new Date(pageviewSnapshot.fetchedAt))})`,
      pages.map(({ post, pageviews }) => link(post, pageviews, 'pageviews')),
    ),
  ])
}
