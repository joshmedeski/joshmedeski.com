# Ranked Videos Page — Design

**Date:** 2026-07-20
**Status:** Approved (pending spec review)

## Goal

Add a page that lists blog posts that have an associated YouTube video, ranked by
lifetime YouTube view count (most-viewed first), using the YouTube Data API v3.
Mirrors the existing `/posts/ranked` page, which ranks posts by Fathom pageviews.

## Decisions

| Decision      | Choice                                                            |
| ------------- | ----------------------------------------------------------------- |
| Data source   | YouTube Data API v3 (`videos?part=statistics`)                    |
| Metric        | `statistics.viewCount` (lifetime views per video)                 |
| What's ranked | Posts with a `youtubeUrl` frontmatter field (~35 posts)           |
| Route         | `/videos/ranked`                                                  |
| Row links to  | The post page (`/posts/<id>`), not YouTube                        |
| Data delivery | Committed snapshot + manual refresh script (mirrors ranked posts) |
| Nav link      | No — reachable by URL only                                        |

There is no separate "videos" content collection. A "video" is any post whose
frontmatter includes a `youtubeUrl` (an embed URL like
`https://www.youtube.com/embed/<id>?si=...`).

## Architecture

Static Astro site (SSG). The YouTube API token is used **only** by the refresh
script (`scripts/refresh-videos.ts`), never at build time and never on the
client. The build reads a committed JSON snapshot. This mirrors the ranked-posts
pipeline (`scripts/refresh-stats.ts` → `src/data/pageviews.json`).

### Components

1. **`src/utils/youtube.ts`** (new) — data access + pure logic, analog of
   `fathom.ts`.
   - `extractVideoId(youtubeUrl: string): string | null` — pulls the 11-char
     video ID from `/embed/<id>` URLs, ignoring `?si=`, `?t=`, and other query
     params.
   - `fetchVideoViews(token, ids: string[]): Promise<Map<string, number>>` —
     calls YouTube Data API v3 `videos?part=statistics&id=<comma-joined>`.
     Chunks IDs into batches of 50 (API max). Parses `statistics.viewCount`
     (a string) to an integer. Throws on missing token or non-2xx response so
     the refresh script fails loudly rather than writing an empty snapshot.
   - `viewsFromRecord(record: Record<string, number>): Map<string, number>` —
     rebuild the `videoId → views` map from the committed snapshot.
   - `rankVideos(posts, viewsByVideoId): RankedVideo[]` — pure function.
     - Filters to posts that have a `youtubeUrl` with an extractable ID.
     - Maps each to its view count (default `0`).
     - Sorts by views descending; ties fall back to `pubDate` descending, for
       deterministic ordering (matches `rankPosts`).
   - Types:
     - `RankedVideo = { post: CollectionEntry<'posts'>, views: number }`
     - `VideoViewsSnapshot = { fetchedAt: string; views: Record<string, number> }`

2. **`scripts/refresh-videos.ts`** (new) + `refresh:videos` npm script —
   analog of `scripts/refresh-stats.ts`.
   - Loads all posts, collects the ones with a `youtubeUrl`, extracts video IDs.
   - Calls `fetchVideoViews(process.env.YOUTUBE_API_KEY, ids)`.
   - Refuses to write an empty snapshot (throws if the map is empty).
   - Writes `src/data/youtube-views.json`, entries sorted views-descending so
     the committed file is diff-friendly.
   - Astro's content collection APIs aren't available to a standalone node
     script, so the script globs `content/posts/**/*.{md,mdx}` and reads the
     `youtubeUrl:` value from each file's frontmatter with a small regex (the
     only field it needs), then runs each through `extractVideoId`. No new
     dependency required.

3. **`src/data/youtube-views.json`** (new, committed) — the snapshot:
   `{ "fetchedAt": "...", "views": { "<videoId>": 12345, ... } }`.

4. **`src/components/RankedVideos.astro`** (new) — presentation, near-identical
   to `RankedPosts.astro`. Numbered horizontal bar chart with thumbnail, title,
   and formatted view count. Each row links to `/posts/<post.id>` with
   `data-astro-prefetch`. Bar width is `views / maxViews`. View count uses
   `Intl.NumberFormat('en-US')` and an `aria-label` of `"<n> views"`.

5. **`src/pages/videos/ranked.astro`** (new) — the page.
   - Loads `posts` collection (drafts only in DEV, matching `posts/ranked.astro`).
   - Loads the snapshot, builds the map via `viewsFromRecord`, calls `rankVideos`.
   - Renders `Layout` + `Wrapper` + `PageTitle` ("Ranked Videos") + `RankedVideos`.
   - Subtitle: `Lifetime YouTube views · Updated {date}` (no "since" clause —
     YouTube `viewCount` has no start-date window like Fathom).

### YouTube Data API v3

```
GET https://www.googleapis.com/youtube/v3/videos
  part=statistics
  id=<id1>,<id2>,...   (up to 50 per request)
  key=<YOUTUBE_API_KEY>
```

Response: `{ "items": [{ "id": "<id>", "statistics": { "viewCount": "12345", ... } }, ...] }`
(numeric values are strings). Videos that are private/deleted simply won't appear
in `items`; those posts fall back to `0` views.

### Data flow

```
scripts/refresh-videos.ts  (manual, needs YOUTUBE_API_KEY)
  ├─ read posts with youtubeUrl → extractVideoId → ids[]
  ├─ fetchVideoViews(token, ids) ── YouTube API → Map<videoId, views>
  └─ write src/data/youtube-views.json (sorted desc)

astro build
  └─ videos/ranked.astro
       ├─ getCollection('posts')            ── published posts
       ├─ viewsFromRecord(snapshot.views)   ── Map<videoId, views>
       ├─ rankVideos(posts, map)            ── filter to videos, sort desc
       └─ <RankedVideos posts={ranked} />   ── static HTML
```

## Error handling

- **Missing `YOUTUBE_API_KEY`** (refresh script): throw, no snapshot written.
- **Non-2xx / parse error** (refresh script): throw, no snapshot written.
- **Build time**: reads the committed snapshot; never calls the API, never fails
  over analytics. A video absent from the snapshot shows `0` views.

## Environment

- `YOUTUBE_API_KEY` — a YouTube Data API v3 key from the Google Cloud console.
  - Used only by `scripts/refresh-videos.ts` (`node --env-file=.env`).
  - Added to `.env` locally. Not needed by the Netlify build.

## Testing

Vitest unit tests for `src/utils/youtube.ts`:

- `extractVideoId`: handles plain `/embed/<id>`, `?si=` and `?t=1m10s` query
  params, and returns `null` for malformed input.
- `rankVideos` (pure): filters out posts without a `youtubeUrl`; sorts by views
  desc; posts missing from the map get `0` and fall back to pubDate order.

## Out of scope (YAGNI)

- Live/on-demand refresh (manual script only, like ranked posts).
- Likes/comments metrics, watch time, per-video time ranges.
- Nav link, pagination.
- A dedicated videos content collection.
