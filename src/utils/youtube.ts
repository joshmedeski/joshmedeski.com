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

const YOUTUBE_VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos'
const BATCH_SIZE = 50 // YouTube Data API max ids per request

type YouTubeVideosResponse = {
  items?: { id: string; statistics?: { viewCount?: string } }[]
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

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size)
    out.push(items.slice(i, i + size))
  return out
}

// Fetch lifetime view counts for the given video ids from the YouTube Data
// API v3. Throws on a missing key or bad response so the refresh script fails
// loudly rather than writing an empty snapshot. Not used at build time.
export async function fetchVideoViews(
  token: string | undefined,
  ids: string[],
): Promise<Map<string, number>> {
  if (!token)
    throw new Error('YOUTUBE_API_KEY is required to fetch video views')

  const views = new Map<string, number>()
  for (const batch of chunk(ids, BATCH_SIZE)) {
    const params = new URLSearchParams({
      part: 'statistics',
      id: batch.join(','),
      key: token,
    })
    const res = await fetch(`${YOUTUBE_VIDEOS_URL}?${params}`)
    if (!res.ok) {
      throw new Error(`YouTube videos request failed: ${res.status}`)
    }
    const body = (await res.json()) as YouTubeVideosResponse
    for (const item of body.items ?? []) {
      views.set(item.id, parseInt(item.statistics?.viewCount ?? '0', 10) || 0)
    }
  }
  return views
}
