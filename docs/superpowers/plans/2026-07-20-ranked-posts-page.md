# Ranked Posts Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public `/posts/ranked` page listing all published blog posts ranked by lifetime Fathom pageviews (most-viewed first), with view counts shown.

**Architecture:** Static Astro (SSG). At build time, `src/utils/fathom.ts` fetches per-pathname pageviews from the Fathom Aggregation API (token used server-side only) and a pure `rankPosts` function joins that data to the `posts` collection by `/posts/<id>` and sorts descending. `src/pages/posts/ranked.astro` renders the result via a new `RankedPosts.astro` component. Missing token or fetch failure degrades gracefully (empty view data, pubDate fallback) so builds never break.

**Tech Stack:** Astro 5, TypeScript, Tailwind v4, Vitest + MSW (already configured globally via `setupTests.ts` → `mocks/index.cjs`).

## Global Constraints

- TypeScript, ES module syntax, functional style (no classes).
- Fathom base URL: `https://api.usefathom.com/v1`; site ID `entity_id=VLMOLRDQ`.
- API token env var: `FATHOM_API_KEY`, read via `import.meta.env.FATHOM_API_KEY`. Never exposed to the client.
- Drafts excluded unless `import.meta.env.DEV` (match `src/pages/posts.astro`).
- Post URLs are `/posts/<post.id>`.
- Tests live at `src/**/*.test.ts` and run with `pnpm test` (vitest). MSW `server` is imported from `../../mocks/index.cjs`; add handlers with `server.use(...)`.
- Path alias `~/*` → `src/*` is available but existing pages use relative imports; match the file being edited.

## File Structure

- Create: `src/utils/fathom.ts` — `getPageviewsByPathname()` (fetch) + `rankPosts()` (pure) + `RankedPost` type.
- Create: `src/utils/fathom.test.ts` — unit tests for both.
- Create: `src/components/RankedPosts.astro` — ordered list presentation.
- Create: `src/pages/posts/ranked.astro` — the page.
- Modify: `README.md` — document the `FATHOM_API_KEY` env var.

---

### Task 1: `rankPosts` pure function

**Files:**

- Create: `src/utils/fathom.ts`
- Test: `src/utils/fathom.test.ts`

**Interfaces:**

- Consumes: `CollectionEntry<'posts'>` from `astro:content` (uses only `post.id` and `post.data.pubDate: Date`).
- Produces:
  - `type RankedPost = { post: CollectionEntry<'posts'>; pageviews: number }`
  - `rankPosts(posts: CollectionEntry<'posts'>[], viewsByPathname: Map<string, number>): RankedPost[]`
    — attaches pageviews (looked up at `/posts/<post.id>`, default `0`), sorts by pageviews desc, ties broken by `pubDate` desc.

- [ ] **Step 1: Write the failing test**

Create `src/utils/fathom.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { rankPosts } from './fathom'

type TestPost = { id: string; data: { pubDate: Date } }

const post = (id: string, pubDate: string): TestPost => ({
  id,
  data: { pubDate: new Date(pubDate) },
})

describe('rankPosts', () => {
  it('sorts posts by pageviews descending', () => {
    const posts = [
      post('low', '2020-01-01'),
      post('high', '2020-01-02'),
      post('mid', '2020-01-03'),
    ] as any
    const views = new Map([
      ['/posts/low', 10],
      ['/posts/high', 100],
      ['/posts/mid', 50],
    ])
    const ranked = rankPosts(posts, views)
    expect(ranked.map((r) => r.post.id)).toEqual(['high', 'mid', 'low'])
    expect(ranked.map((r) => r.pageviews)).toEqual([100, 50, 10])
  })

  it('defaults missing posts to 0 views and falls back to pubDate desc', () => {
    const posts = [
      post('older-nodata', '2020-01-01'),
      post('newer-nodata', '2020-06-01'),
      post('hasviews', '2019-01-01'),
    ] as any
    const views = new Map([['/posts/hasviews', 5]])
    const ranked = rankPosts(posts, views)
    expect(ranked.map((r) => r.post.id)).toEqual([
      'hasviews',
      'newer-nodata',
      'older-nodata',
    ])
    expect(ranked.map((r) => r.pageviews)).toEqual([5, 0, 0])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/utils/fathom.test.ts`
Expected: FAIL — cannot resolve `./fathom` / `rankPosts is not a function`.

- [ ] **Step 3: Write minimal implementation**

Create `src/utils/fathom.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/utils/fathom.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/fathom.ts src/utils/fathom.test.ts
git commit -m "feat: add rankPosts ranking helper"
```

---

### Task 2: `getPageviewsByPathname` Fathom fetch

**Files:**

- Modify: `src/utils/fathom.ts`
- Test: `src/utils/fathom.test.ts`

**Interfaces:**

- Produces: `getPageviewsByPathname(): Promise<Map<string, number>>` — GETs the Fathom aggregations endpoint, parses string counts to ints. Returns empty `Map` when `FATHOM_API_KEY` is unset or the request fails/returns non-2xx.

- [ ] **Step 1: Write the failing test**

Append to `src/utils/fathom.test.ts` (add imports at top: `import { server } from '../../mocks/index.cjs'` and `import { http, HttpResponse } from 'msw'` and `vi` from `vitest`):

```ts
import { http, HttpResponse } from 'msw'
import { vi } from 'vitest'
import { getPageviewsByPathname } from './fathom'
// @ts-expect-error - cjs mock module has no types
import { server } from '../../mocks/index.cjs'

const AGG_URL = 'https://api.usefathom.com/v1/aggregations'

describe('getPageviewsByPathname', () => {
  it('parses string counts into a pathname->int map', async () => {
    vi.stubEnv('FATHOM_API_KEY', 'test-token')
    server.use(
      http.get(AGG_URL, () =>
        HttpResponse.json([
          { pathname: '/posts/a', pageviews: '1200' },
          { pathname: '/posts/b', pageviews: '30' },
        ]),
      ),
    )
    const map = await getPageviewsByPathname()
    expect(map.get('/posts/a')).toBe(1200)
    expect(map.get('/posts/b')).toBe(30)
    vi.unstubAllEnvs()
  })

  it('returns an empty map when the token is missing', async () => {
    vi.stubEnv('FATHOM_API_KEY', '')
    const map = await getPageviewsByPathname()
    expect(map.size).toBe(0)
    vi.unstubAllEnvs()
  })

  it('returns an empty map on a failed request', async () => {
    vi.stubEnv('FATHOM_API_KEY', 'test-token')
    server.use(http.get(AGG_URL, () => new HttpResponse(null, { status: 500 })))
    const map = await getPageviewsByPathname()
    expect(map.size).toBe(0)
    vi.unstubAllEnvs()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/utils/fathom.test.ts`
Expected: FAIL — `getPageviewsByPathname is not a function`.

- [ ] **Step 3: Write minimal implementation**

Add to `src/utils/fathom.ts` (keep existing exports):

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/utils/fathom.test.ts`
Expected: PASS (5 tests total).

- [ ] **Step 5: Commit**

```bash
git add src/utils/fathom.ts src/utils/fathom.test.ts
git commit -m "feat: fetch lifetime pageviews from Fathom"
```

---

### Task 3: Ranked page + component + docs

**Files:**

- Create: `src/components/RankedPosts.astro`
- Create: `src/pages/posts/ranked.astro`
- Modify: `README.md`

**Interfaces:**

- Consumes: `rankPosts`, `getPageviewsByPathname`, `RankedPost` from `src/utils/fathom.ts`; `Layout`, `Wrapper`, `PageTitle` components (paths mirror `src/pages/posts.astro`, adjusted one level deeper).

- [ ] **Step 1: Create the presentation component**

Create `src/components/RankedPosts.astro`:

```astro
---
import type { RankedPost } from '../utils/fathom'

interface Props {
  posts: RankedPost[]
}

const { posts } = Astro.props
const format = new Intl.NumberFormat('en-US')
---

<ol class="mb-32 flex flex-col gap-2">
  {
    posts.map(({ post, pageviews }, index) => (
      <li class="flex items-baseline gap-4">
        <span class="tabular-nums text-neutral-500">{index + 1}</span>
        <a class="flex-1 hover:underline" href={`/posts/${post.id}`}>
          {post.data.title}
        </a>
        <span class="tabular-nums text-neutral-500">
          {format.format(pageviews)}
        </span>
      </li>
    ))
  }
</ol>
```

- [ ] **Step 2: Create the page**

Create `src/pages/posts/ranked.astro`:

```astro
---
import { getCollection } from 'astro:content'
import Layout from '../../components/Layout.astro'
import PageTitle from '../../components/PageTitle.astro'
import Wrapper from '../../components/Wrapper.astro'
import RankedPosts from '../../components/RankedPosts.astro'
import { getPageviewsByPathname, rankPosts } from '../../utils/fathom'

const includeDrafts = import.meta.env.DEV
const posts = await getCollection(
  'posts',
  ({ data: { draft } }) => includeDrafts || !draft,
)
const viewsByPathname = await getPageviewsByPathname()
const ranked = rankPosts(posts, viewsByPathname)
---

<Layout title="Ranked Posts">
  <Wrapper>
    <PageTitle>Ranked Posts</PageTitle>
    <RankedPosts posts={ranked} />
  </Wrapper>
</Layout>
```

- [ ] **Step 3: Verify the build succeeds without a token**

Run: `pnpm build`
Expected: build completes; console shows `[fathom] FATHOM_API_KEY not set — skipping pageview fetch`; `dist/posts/ranked/index.html` exists.

Run: `test -f dist/posts/ranked/index.html && echo OK`
Expected: `OK`

- [ ] **Step 4: Document the env var**

Add to `README.md` (append a section):

```markdown
## Environment variables

- `FATHOM_API_KEY` — Fathom Analytics personal API token (create at
  https://app.usefathom.com/api). Used at build time to rank posts by lifetime
  pageviews on `/posts/ranked`. Set it in the Netlify build environment and, for
  local builds, in a `.env` file. Without it the page still builds (view counts
  show `0`).
```

- [ ] **Step 5: Run the full test suite**

Run: `pnpm test`
Expected: PASS (all tests, including the 5 in `fathom.test.ts`).

- [ ] **Step 6: Commit**

```bash
git add src/components/RankedPosts.astro src/pages/posts/ranked.astro README.md
git commit -m "feat: add ranked posts page"
```

---

## Post-implementation (manual, outside this plan)

- Create a Fathom API token and add `FATHOM_API_KEY` to Netlify's build environment variables so production shows real numbers.
