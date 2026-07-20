import type { CollectionEntry } from 'astro:content'

export type RankedPost = {
  post: CollectionEntry<'posts'>
  pageviews: number
}

export function rankPosts(
  posts: CollectionEntry<'posts'>[],
  viewsByPathname: Map<string, number>,
): RankedPost[] {
  return posts
    .map((post) => ({
      post,
      pageviews: viewsByPathname.get(`/posts/${post.id}`) ?? 0,
    }))
    .sort((a, b) => {
      if (b.pageviews !== a.pageviews) return b.pageviews - a.pageviews
      return b.post.data.pubDate.getTime() - a.post.data.pubDate.getTime()
    })
}
