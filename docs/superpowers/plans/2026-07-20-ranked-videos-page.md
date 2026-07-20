# Ranked Videos Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/videos/ranked` page that ranks posts with a `youtubeUrl` by lifetime YouTube view count, mirroring the existing `/posts/ranked` Fathom pipeline.

**Architecture:** A committed JSON snapshot (`src/data/youtube-views.json`) is read at build time; a manual node script (`scripts/refresh-videos.ts`) fetches `statistics.viewCount` from the YouTube Data API v3 and rewrites the snapshot. Pure ranking/parsing logic lives in `src/utils/youtube.ts` and is unit-tested. Presentation reuses the ranked-posts bar-chart pattern.

**Tech Stack:** Astro 5 (SSG), TypeScript, Vitest + MSW, Tailwind v4, Node 22.

## Global Constraints

- TypeScript, ES modules (`import`/`export`) throughout.
- `YOUTUBE_API_KEY` is used ONLY by `scripts/refresh-videos.ts`, never at build time or on the client.
- The build reads only the committed snapshot; it must never call the YouTube API and never fail over analytics.
- A "video" is a post whose frontmatter has a `youtubeUrl` (embed URL `https://www.youtube.com/embed/<id>?...`). There is no videos content collection.
- Rows link to `/posts/<post.id>`, not to YouTube.
- Follow existing patterns in `src/utils/fathom.ts`, `scripts/refresh-stats.ts`, `src/components/RankedPosts.astro`, `src/pages/posts/ranked.astro`.
- Tests use Vitest + MSW via `server.use(...)`, matching `src/utils/fathom.test.ts`.

---

### Task 1: `youtube.ts` — `extractVideoId` + `rankVideos` + `viewsFromRecord`

**Files:**

- Create: `src/utils/youtube.ts`
- Test: `src/utils/youtube.test.ts`

**Interfaces:**

- Consumes: `CollectionEntry<'posts'>` (has `.id`, `.data.pubDate`, `.data.youtubeUrl?`).
- Produces:
  - `extractVideoId(youtubeUrl: string): string | null`
  - `type RankedVideo = { post: CollectionEntry<'posts'>; views: number }`
  - `type VideoViewsSnapshot = { fetchedAt: string; views: Record<string, number> }`
  - `viewsFromRecord(record: Record<string, number>): Map<string, number>`
  - `rankVideos(posts: CollectionEntry<'posts'>[], viewsByVideoId: Map<string, number>): RankedVideo[]`

- [ ] **Step 1: Write the failing test**

```typescript
// src/utils/youtube.test.ts
import { describe, it, expect } from 'vitest'
import { extractVideoId, rankVideos, viewsFromRecord } from './youtube'

type TestPost = { id: string; data: { pubDate: Date; youtubeUrl?: string } }
const post = (id: string, pubDate: string, youtubeUrl?: string): TestPost => ({
  id,
  data: { pubDate: new Date(pubDate), youtubeUrl },
})
const embed = (id: string) => `https://www.youtube.com/embed/${id}`

describe('extractVideoId', () => {
  it('extracts the id from a plain embed url', () => {
    expect(extractVideoId('https://www.youtube.com/embed/Mu4frtvHPOY')).toBe(
      'Mu4frtvHPOY',
    )
  })
  it('ignores ?si= and ?t= query params', () => {
    expect(
      extractVideoId('https://www.youtube.com/embed/GKQ9rJ12hjc?si=Wn_klpgsSU'),
    ).toBe('GKQ9rJ12hjc')
    expect(
      extractVideoId('https://www.youtube.com/embed/3o0gPmusT0Y?t=1m10s'),
    ).toBe('3o0gPmusT0Y')
  })
  it('returns null for malformed input', () => {
    expect(extractVideoId('not a url')).toBeNull()
    expect(extractVideoId('https://www.youtube.com/watch?v=abc')).toBeNull()
  })
})

describe('viewsFromRecord', () => {
  it('rebuilds a Map from a snapshot record', () => {
    const map = viewsFromRecord({ abc: 1200, def: 30 })
    expect(map.get('abc')).toBe(1200)
    expect(map.size).toBe(2)
  })
})

describe('rankVideos', () => {
  it('keeps only posts with an extractable youtubeUrl, sorted by views desc', () => {
    const posts = [
      post('low', '2020-01-01', embed('low1234567')),
      post('nopost', '2020-01-02'),
      post('high', '2020-01-03', embed('high123456')),
    ] as any
    const views = new Map([
      ['low1234567', 10],
      ['high123456', 100],
    ])
    const ranked = rankVideos(posts, views)
    expect(ranked.map((r) => r.post.id)).toEqual(['high', 'low'])
    expect(ranked.map((r) => r.views)).toEqual([100, 10])
  })
  it('defaults missing videos to 0 and falls back to pubDate desc', () => {
    const posts = [
      post('older', '2020-01-01', embed('older12345a')),
      post('newer', '2020-06-01', embed('newer12345a')),
      post('has', '2019-01-01', embed('has12345678')),
    ] as any
    const views = new Map([['has12345678', 5]])
    const ranked = rankVideos(posts, views)
    expect(ranked.map((r) => r.post.id)).toEqual(['has', 'newer', 'older'])
    expect(ranked.map((r) => r.views)).toEqual([5, 0, 0])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/utils/youtube.test.ts`
Expected: FAIL — `youtube` module / exports not found.

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/utils/youtube.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/utils/youtube.test.ts`
Expected: PASS (all `extractVideoId`, `viewsFromRecord`, `rankVideos` cases).

- [ ] **Step 5: Commit**

```bash
git add src/utils/youtube.ts src/utils/youtube.test.ts
git commit -m "feat: add youtube video id + ranking utilities"
```

---

### Task 2: `youtube.ts` — `fetchVideoViews` (API client)

**Files:**

- Modify: `src/utils/youtube.ts`
- Test: `src/utils/youtube.test.ts`

**Interfaces:**

- Produces: `fetchVideoViews(token: string | undefined, ids: string[]): Promise<Map<string, number>>` — batches ids into groups of 50, GETs `https://www.googleapis.com/youtube/v3/videos`, parses `items[].statistics.viewCount` (string) to int. Throws on missing token or non-2xx.

- [ ] **Step 1: Write the failing test**

Append to `src/utils/youtube.test.ts`:

```typescript
import { http, HttpResponse } from 'msw'
// @ts-expect-error - cjs mock module has no types
import { server } from '../../mocks/index.cjs'
import { fetchVideoViews } from './youtube'

const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos'

describe('fetchVideoViews', () => {
  it('parses viewCount strings into a videoId->int map', async () => {
    server.use(
      http.get(VIDEOS_URL, () =>
        HttpResponse.json({
          items: [
            { id: 'abc12345678', statistics: { viewCount: '1200' } },
            { id: 'def12345678', statistics: { viewCount: '30' } },
          ],
        }),
      ),
    )
    const map = await fetchVideoViews('test-token', [
      'abc12345678',
      'def12345678',
    ])
    expect(map.get('abc12345678')).toBe(1200)
    expect(map.get('def12345678')).toBe(30)
  })

  it('throws when the token is missing', async () => {
    await expect(fetchVideoViews('', ['abc12345678'])).rejects.toThrow(
      /YOUTUBE_API_KEY/,
    )
  })

  it('throws on a failed request', async () => {
    server.use(
      http.get(VIDEOS_URL, () => new HttpResponse(null, { status: 403 })),
    )
    await expect(
      fetchVideoViews('test-token', ['abc12345678']),
    ).rejects.toThrow(/403/)
  })

  it('returns an empty map when given no ids (no request)', async () => {
    const map = await fetchVideoViews('test-token', [])
    expect(map.size).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/utils/youtube.test.ts`
Expected: FAIL — `fetchVideoViews` is not exported.

- [ ] **Step 3: Write minimal implementation**

Add to `src/utils/youtube.ts`:

```typescript
const YOUTUBE_VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos'
const BATCH_SIZE = 50 // YouTube Data API max ids per request

type YouTubeVideosResponse = {
  items?: { id: string; statistics?: { viewCount?: string } }[]
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/utils/youtube.test.ts`
Expected: PASS (all fetchVideoViews cases + Task 1 cases).

- [ ] **Step 5: Commit**

```bash
git add src/utils/youtube.ts src/utils/youtube.test.ts
git commit -m "feat: fetch youtube view counts from Data API v3"
```

---

### Task 3: Refresh script + `refresh:videos` npm script + initial snapshot

**Files:**

- Create: `scripts/refresh-videos.ts`
- Create: `src/data/youtube-views.json`
- Modify: `package.json` (add `refresh:videos` script)

**Interfaces:**

- Consumes: `fetchVideoViews`, `extractVideoId`, `VideoViewsSnapshot` from `src/utils/youtube.ts`.
- Produces: `src/data/youtube-views.json` matching `VideoViewsSnapshot`.

- [ ] **Step 1: Add the npm script**

In `package.json`, directly after the `"refresh:stats"` line, add:

```json
    "refresh:videos": "node --env-file=.env scripts/refresh-videos.ts",
```

- [ ] **Step 2: Write the refresh script**

```typescript
// scripts/refresh-videos.ts
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  fetchVideoViews,
  extractVideoId,
  type VideoViewsSnapshot,
} from '../src/utils/youtube.ts'

const POSTS_DIR = resolve(import.meta.dirname, '../content/posts')
const OUT = resolve(import.meta.dirname, '../src/data/youtube-views.json')

// Pull `youtubeUrl: '...'` out of a post's frontmatter without a YAML parser —
// it's the only field the refresh script needs.
function readYoutubeUrl(source: string): string | null {
  const match = source.match(/^youtubeUrl:\s*['"]?([^'"\n]+)['"]?\s*$/m)
  return match ? match[1].trim() : null
}

async function collectVideoIds(): Promise<string[]> {
  const files = (await readdir(POSTS_DIR)).filter((f) => /\.(md|mdx)$/.test(f))
  const ids: string[] = []
  for (const file of files) {
    const source = await readFile(resolve(POSTS_DIR, file), 'utf8')
    const url = readYoutubeUrl(source)
    const id = url ? extractVideoId(url) : null
    if (id) ids.push(id)
  }
  return ids
}

async function main() {
  const ids = await collectVideoIds()
  const views = await fetchVideoViews(process.env.YOUTUBE_API_KEY, ids)

  if (views.size === 0) {
    throw new Error('YouTube returned no views — refusing to write snapshot')
  }

  const sorted = [...views.entries()].sort((a, b) => b[1] - a[1])
  const snapshot: VideoViewsSnapshot = {
    fetchedAt: new Date().toISOString(),
    views: Object.fromEntries(sorted),
  }

  await writeFile(OUT, JSON.stringify(snapshot, null, 2) + '\n')
  console.log(
    `Wrote ${views.size} videos to src/data/youtube-views.json (fetched ${snapshot.fetchedAt})`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
```

- [ ] **Step 3: Create a placeholder snapshot so the build has data**

The page (Task 5) imports this JSON, so it must exist before the build. Create `src/data/youtube-views.json` with an empty-but-valid snapshot:

```json
{
  "fetchedAt": "1970-01-01T00:00:00.000Z",
  "views": {}
}
```

- [ ] **Step 4: Run the refresh script to populate real data (requires the key)**

Run: `pnpm refresh:videos`
Expected (with a valid `YOUTUBE_API_KEY` in `.env`): `Wrote <n> videos to src/data/youtube-views.json`, and the JSON now holds real counts sorted desc.
If the key is not available in this environment, leave the placeholder snapshot from Step 3 in place — the build still works (all videos show 0) and the snapshot can be refreshed later. Note this in the commit if so.

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/refresh-videos.ts src/data/youtube-views.json
git commit -m "feat: add youtube views refresh script and snapshot"
```

---

### Task 4: `RankedVideos.astro` presentation component

**Files:**

- Create: `src/components/RankedVideos.astro`

**Interfaces:**

- Consumes: `RankedVideo[]` from `src/utils/youtube.ts`.
- Produces: `<RankedVideos posts={RankedVideo[]} />`.

- [ ] **Step 1: Create the component**

Mirror `RankedPosts.astro`, swapping `pageviews` → `views` and keeping post-page links:

```astro
---
import { Image } from 'astro:assets'
import type { RankedVideo } from '../utils/youtube'

interface Props {
  posts: RankedVideo[]
}

const { posts } = Astro.props
const format = new Intl.NumberFormat('en-US')
const maxViews = Math.max(0, ...posts.map(({ views }) => views))
---

<ol class="mb-32 flex flex-col gap-1">
  {
    posts.map(({ post, views }, index) => {
      const width = maxViews > 0 ? (views / maxViews) * 100 : 0
      const thumbnail = post.data.thumbnail ?? post.data.heroImage
      return (
        <li>
          <a
            href={`/posts/${post.id}`}
            data-astro-prefetch
            class="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-white/[0.06] sm:gap-4"
          >
            <span class="w-6 shrink-0 text-right text-sm tabular-nums text-neutral-500">
              {index + 1}
            </span>
            <Image
              src={thumbnail}
              alt=""
              width={192}
              height={108}
              class="aspect-video w-20 shrink-0 rounded-md bg-black object-cover outline outline-1 -outline-offset-1 outline-black/10 sm:w-24 dark:outline-white/10"
            />
            <div class="min-w-0 flex-1">
              <span class="block truncate text-pretty font-medium group-hover:underline">
                {post.data.title}
              </span>
              <div class="mt-1.5 flex items-center gap-3">
                <div class="relative h-3 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    class="absolute inset-y-0 left-0 rounded-full bg-primary-500"
                    style={`width: ${width}%`}
                    aria-hidden="true"
                  />
                </div>
                <span
                  class="w-16 shrink-0 text-right text-sm tabular-nums text-neutral-500"
                  aria-label={`${format.format(views)} views`}
                >
                  {format.format(views)}
                </span>
              </div>
            </div>
          </a>
        </li>
      )
    })
  }
</ol>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/RankedVideos.astro
git commit -m "feat: add RankedVideos bar-chart component"
```

---

### Task 5: `/videos/ranked` page + full build verification

**Files:**

- Create: `src/pages/videos/ranked.astro`

**Interfaces:**

- Consumes: `viewsFromRecord`, `rankVideos` from `src/utils/youtube.ts`; `RankedVideos` component; `src/data/youtube-views.json`.

- [ ] **Step 1: Create the page**

Mirror `src/pages/posts/ranked.astro`, dropping the "since" clause:

```astro
---
import { getCollection } from 'astro:content'
import Layout from '../../components/Layout.astro'
import PageTitle from '../../components/PageTitle.astro'
import Wrapper from '../../components/Wrapper.astro'
import RankedVideos from '../../components/RankedVideos.astro'
import { viewsFromRecord, rankVideos } from '../../utils/youtube'
import snapshot from '../../data/youtube-views.json'

const includeDrafts = import.meta.env.DEV
const posts = await getCollection(
  'posts',
  ({ data: { draft } }) => includeDrafts || !draft,
)
const viewsByVideoId = viewsFromRecord(snapshot.views)
const ranked = rankVideos(posts, viewsByVideoId)

const dateFormat = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})
const updated = dateFormat.format(new Date(snapshot.fetchedAt))
---

<Layout title="Ranked Videos">
  <Wrapper>
    <PageTitle>Ranked Videos</PageTitle>
    <p class="-mt-8 mb-12 text-center text-sm text-neutral-500">
      Lifetime YouTube views · Updated {updated}
    </p>
    <RankedVideos posts={ranked} />
  </Wrapper>
</Layout>
```

- [ ] **Step 2: Type-check / sync the content types**

Run: `pnpm sync`
Expected: completes without error (regenerates `astro:content` types so `youtubeUrl` is known on the posts collection).

- [ ] **Step 3: Verify the page builds**

Run: `pnpm build`
Expected: build succeeds and emits `dist/videos/ranked/index.html`.

- [ ] **Step 4: Confirm the rendered page**

Run: `test -f dist/videos/ranked/index.html && echo OK`
Expected: `OK`. (If the snapshot has real data, spot-check that the page lists videos ordered by view count.)

- [ ] **Step 5: Run the full test suite**

Run: `pnpm exec vitest run`
Expected: PASS, including `src/utils/youtube.test.ts`.

- [ ] **Step 6: Commit**

```bash
git add src/pages/videos/ranked.astro
git commit -m "feat: add ranked videos page"
```

---

## Notes for the implementer

- **Snapshot ordering doesn't matter for correctness** — `rankVideos` re-sorts at build time; the script sorts only to keep the committed file diff-friendly.
- **`youtubeUrl` is already in the posts schema** (`src/content.config.ts`), so no schema change is needed. `pnpm sync` (Task 5, Step 2) makes the type visible to `rankVideos`.
- **MSW server** is shared via `mocks/index.cjs` and already wired into `setupTests.ts`; just `server.use(...)` per test as the Fathom tests do.
- **If `YOUTUBE_API_KEY` is unavailable**, the placeholder snapshot keeps everything working (all videos rank at 0, newest-first); refresh later with `pnpm refresh:videos`.
