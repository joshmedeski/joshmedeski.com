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

const FATHOM_SITE_ID = 'VLMOLRDQ'
const FATHOM_AGGREGATIONS_URL = 'https://api.usefathom.com/v1/aggregations'

type FathomAggregationRow = { pathname: string; pageviews: string }

function fathomTimestamp(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

export async function getPageviewsByPathname(): Promise<Map<string, number>> {
  const token = import.meta.env.FATHOM_API_KEY
  if (!token) {
    console.warn('[fathom] FATHOM_API_KEY not set — skipping pageview fetch')
    return new Map()
  }

  const params = new URLSearchParams({
    entity: 'pageview',
    entity_id: FATHOM_SITE_ID,
    aggregates: 'pageviews',
    field_grouping: 'pathname',
    sort_by: 'pageviews:desc',
    limit: '1000',
    date_from: '2018-01-01 00:00:00',
    date_to: fathomTimestamp(new Date()),
  })

  try {
    const res = await fetch(`${FATHOM_AGGREGATIONS_URL}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      console.warn(`[fathom] aggregations request failed: ${res.status}`)
      return new Map()
    }
    const rows = (await res.json()) as FathomAggregationRow[]
    return new Map(
      rows.map((row) => [row.pathname, parseInt(row.pageviews, 10) || 0]),
    )
  } catch (error) {
    console.warn('[fathom] aggregations request errored:', error)
    return new Map()
  }
}
