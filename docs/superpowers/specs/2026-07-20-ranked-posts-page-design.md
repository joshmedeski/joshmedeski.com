# Ranked Posts Page — Design

**Date:** 2026-07-20
**Status:** Approved (pending spec review)

## Goal

Add a page that lists all published blog posts ranked by lifetime pageviews
(most-viewed first), using data from the Fathom Analytics Aggregation API.

## Decisions

| Decision         | Choice                                            |
| ---------------- | ------------------------------------------------- |
| Data fetch       | Build-time (static / SSG)                         |
| Metric           | Pageviews (total loads over all time)             |
| Visibility       | Fully public (indexed, in sitemap)                |
| Route            | `/posts/ranked`                                   |
| Nav link         | No — reachable by URL only                        |
| Show view counts | Yes — formatted (e.g. `12,345`) next to each post |

## Architecture

Static Astro site (no adapter → SSG). The Fathom API token is used **only during
`astro build`** and never reaches the client, so a build-time fetch keeps the
secret safe.

### Components

1. **`src/utils/fathom.ts`** — data access + pure ranking logic.
   - `getPageviewsByPathname(): Promise<Map<string, number>>`
     - Calls the Fathom Aggregation API (see below).
     - Parses `pageviews` strings to integers.
     - Returns a `Map<pathname, pageviews>`.
     - On missing token or fetch failure: logs a warning and returns an empty
       `Map` (build never fails).
   - `rankPosts(posts, viewsByPathname): RankedPost[]` — pure function
     - Maps each post to its pathname `/posts/<post.id>`, looks up pageviews
       (default `0`), and returns posts sorted by pageviews descending.
     - Ties / posts with no data fall back to `pubDate` descending so ordering
       is deterministic.
     - `RankedPost = { post: CollectionEntry<'posts'>, pageviews: number }`

2. **`src/pages/posts/ranked.astro`** — the page.
   - Loads `posts` collection, excluding drafts (drafts included only in DEV,
     matching `src/pages/posts.astro`).
   - Calls `getPageviewsByPathname()` and `rankPosts()`.
   - Renders with `Layout` + `Wrapper` + `PageTitle` (title: "Ranked Posts"),
     matching `posts.astro`. Public (no `noIndex`).

3. **`src/components/RankedPosts.astro`** — presentation.
   - Ordered list. Each row: rank number, post title linking to
     `/posts/<post.id>`, and formatted pageview count
     (`Intl.NumberFormat('en-US').format(pageviews)`).
   - Follows existing component/Tailwind conventions.

### Fathom Aggregation API

```
GET https://api.usefathom.com/v1/aggregations
  entity=pageview
  entity_id=VLMOLRDQ
  aggregates=pageviews
  field_grouping=pathname
  sort_by=pageviews:desc
  limit=1000
  date_from=2018-01-01 00:00:00
  date_to=<current timestamp>
Authorization: Bearer <FATHOM_API_KEY>
```

Response: `[{ "pathname": "/posts/foo", "pageviews": "12345" }, ...]`
(all numeric values are strings).

Site ID `VLMOLRDQ` is the existing Fathom site (see `LayoutHead.astro`).

### Data flow

```
astro build
  └─ ranked.astro
       ├─ getCollection('posts')  ── published posts
       ├─ getPageviewsByPathname() ── Fathom API → Map<pathname, views>
       ├─ rankPosts(posts, map)    ── join on /posts/<id>, sort desc
       └─ <RankedPosts posts={ranked} />  ── static HTML
```

## Path → post mapping

Post pages render at `/posts/<post.id>` (see `src/pages/posts/[...id].astro`).
Fathom pathnames like `/posts/a-pretty-terminal-in-5-minutes` map directly to
`post.id`. Only posts present in the collection are shown; non-post pathnames
(home, `/about`, etc.) are ignored.

## Error handling

- **Missing `FATHOM_API_KEY`** (typical local dev): warn, return empty views map.
  Page still builds; posts fall back to `pubDate` ordering with `0` views shown.
- **Fetch / non-2xx / parse error**: warn, treat as empty views map. Build never
  breaks over analytics.

## Environment

- `FATHOM_API_KEY` — personal API token from https://app.usefathom.com/api.
  - Set in Netlify build environment variables.
  - For local builds, add to `.env` (Astro auto-loads it; server-only var).
  - Read via `import.meta.env.FATHOM_API_KEY`.

## Testing

Vitest unit tests for `src/utils/fathom.ts`:

- `rankPosts` (pure): sorts by pageviews desc; posts without data get `0` and
  fall back to pubDate order; pathname→id mapping is correct.
- `getPageviewsByPathname`: fetch mocked — parses string counts to ints; returns
  empty map when token missing and on fetch failure.

## Out of scope (YAGNI)

- Live/on-demand refresh (build-time only).
- Unique-visits metric.
- Nav link, pagination, per-post time ranges, charts.
