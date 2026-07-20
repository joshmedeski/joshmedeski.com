import type { CollectionEntry } from 'astro:content'

export type RankedVideo = {
  post: CollectionEntry<'posts'>
  views: number
}

/** Shape of the committed `src/data/youtube-views.json` snapshot. */
export type VideoViewsSnapshot = {
  fetchedAt: string
  views: Record<string, number>
}

// YouTube video IDs are 11 chars of [A-Za-z0-9_-]. Pull it out of the
// `/embed/<id>` path, ignoring any `?si=`/`?t=` query string.
export function extractVideoId(youtubeUrl: string): string | null {
  const match = youtubeUrl.match(/\/embed\/([A-Za-z0-9_-]{11})(?:[?&/]|$)/)
  return match ? match[1] : null
}

// Rebuild the videoId->views Map from a committed snapshot record.
export function viewsFromRecord(
  record: Record<string, number>,
): Map<string, number> {
  return new Map(Object.entries(record))
}

// Keep only posts that have a resolvable YouTube video, attach view counts,
// and sort by views desc (tie-break newest-first), matching rankPosts.
export function rankVideos(
  posts: CollectionEntry<'posts'>[],
  viewsByVideoId: Map<string, number>,
): RankedVideo[] {
  return posts
    .flatMap((post) => {
      const url = post.data.youtubeUrl
      const id = url ? extractVideoId(url) : null
      if (!id) return []
      return [{ post, views: viewsByVideoId.get(id) ?? 0 }]
    })
    .sort((a, b) => {
      if (b.views !== a.views) return b.views - a.views
      return b.post.data.pubDate.getTime() - a.post.data.pubDate.getTime()
    })
}
