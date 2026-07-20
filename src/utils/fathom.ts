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

/** Start of the lifetime window reported on the ranked page. */
export const FATHOM_DATA_SINCE = new Date('2018-01-01T00:00:00Z')

/** Shape of the committed `src/data/pageviews.json` snapshot. */
export type PageviewsSnapshot = {
  since: string
  fetchedAt: string
  pageviews: Record<string, number>
}

type FathomAggregationRow = { pathname: string; pageviews: string }

// Serialized in UTC from the machine's clock (toISOString); a few hours of
// timezone skew in date_to is immaterial when totaling lifetime pageviews.
function fathomTimestamp(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

// Rebuild the pathname->pageviews Map from a committed snapshot record.
export function pageviewsFromRecord(
  record: Record<string, number>,
): Map<string, number> {
  return new Map(Object.entries(record))
}

// Fetch lifetime pageviews grouped by pathname from Fathom. Throws on a missing
// token or bad response so the refresh script fails loudly rather than writing
// an empty snapshot. Not used at build time — the build reads the committed
// snapshot; this runs only from `scripts/refresh-stats.ts`.
export async function fetchPageviews(
  token: string | undefined,
): Promise<Map<string, number>> {
  if (!token) throw new Error('FATHOM_API_KEY is required to fetch pageviews')

  const params = new URLSearchParams({
    entity: 'pageview',
    entity_id: FATHOM_SITE_ID,
    aggregates: 'pageviews',
    field_grouping: 'pathname',
    sort_by: 'pageviews:desc',
    limit: '1000',
    date_from: fathomTimestamp(FATHOM_DATA_SINCE),
    date_to: fathomTimestamp(new Date()),
  })

  const res = await fetch(`${FATHOM_AGGREGATIONS_URL}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error(`Fathom aggregations request failed: ${res.status}`)
  }

  const rows = (await res.json()) as FathomAggregationRow[]
  return new Map(
    rows.map((row) => {
      // Normalize away a trailing slash so keys match rankPosts' `/posts/<id>`
      // lookup — Astro's directory build format serves posts at `/posts/<id>/`.
      const key = row.pathname.replace(/\/+$/, '') || '/'
      return [key, parseInt(row.pageviews, 10) || 0]
    }),
  )
}
