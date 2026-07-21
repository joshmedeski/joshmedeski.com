# Areas Taxonomy — Design Spec

**Date:** 2026-07-20
**Status:** Approved (design), pending spec review

## Summary

Replace the site's `categories` feature with a site-wide, two-level **areas**
taxonomy modeled on the `Areas` structure in the author's Obsidian
second-brain vault (parent → child, e.g. AI → Claude Code). Areas span all
content types (posts and uses now; projects/guides/videos later), a piece of
content can belong to **many** areas, and area definitions are authored on the
site (not synced from the vault).

This unifies the two overlapping taxonomies that exist today:

- `categories` — 6 hand-styled buckets; every **post** references exactly one.
- `areas` — minimal (`title` + `slug`), used only by **uses** (3 entries).

## Goals

- Drop the category feature entirely.
- Introduce a hierarchical (two-level) areas taxonomy used across content types.
- Make adding a new area a one-file, zero-code operation so the taxonomy can
  grow with the author's interests (3D printing, AI, Obsidian, etc.).
- Improve discoverability: an areas directory, per-area hub pages that
  aggregate all content, area badges on cards, and a homepage "explore by area"
  section.

## Non-goals

- Syncing area definitions from the Obsidian vault (designed to be
  sync-compatible later, but out of scope now).
- Areas deeper than two levels.
- Multiple parents per area (graph); a sub-area has exactly one parent.
- Extending the taxonomy to projects/guides/wallpapers/videos in this build
  (schema and hub pages are built to accept them later).

## Decisions (from brainstorming)

| Decision        | Choice                                                              |
| --------------- | ------------------------------------------------------------------- |
| Scope           | Site-wide taxonomy across content types                             |
| Cardinality     | Many areas per content item (array)                                 |
| Source of truth | Authored on the site (vault-shaped, sync-compatible later)          |
| Hierarchy       | Two levels only (top-level areas + one layer of sub-areas)          |
| Styling         | Top-level areas styled (color/cover); sub-areas plain               |
| Discoverability | Areas directory + area hub pages + area badges + homepage section   |
| Migration       | Author a fresh area set, then an assisted tagging pass over content |
| Post color      | `areas[0]` (primary) → its top-level ancestor's `themeColor`        |

## Data model

### `areas` collection

Site-authored files in `content/areas/<slug>.md`.

```ts
areas: defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './content/areas' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      icon: z.string().optional(), // emoji, e.g. "🤖"
      parent: reference('areas').optional(), // set → sub-area; absent → top-level
      themeColor: z.string().optional(), // top-level only, Tailwind bg class
      cover: image().optional(), // top-level only, hub hero
      description: z.string().optional(),
    }),
})
```

- **Top-level area** = no `parent`; carries `themeColor` and optional `cover`
  (the "styled" ones) plus `icon`.
- **Sub-area** = has `parent` pointing at a top-level area; plain (`title` +
  optional `icon`).
- **Two-level guard:** a build-time check (util + test) enforces that any area
  named as a `parent` has no `parent` of its own. A violation fails the build.
- Icons are **emoji strings** (matching the vault), not imported SVG
  components — this is what makes adding an area code-free.
- The markdown body renders on the area's hub page.
- No `order` field: directory and listings sort **alphabetically by title**.

### Content schema changes

```ts
// posts
areas: z.array(reference('areas')).min(1) // was: category: reference('categories')

// uses
areas: z.array(reference('areas')).min(1) // was: area: reference('areas')
```

- Convention: **`areas[0]` is the primary** area (drives styling color). No
  separate `primaryArea` field.
- The existing minimal `areas` entries (audio, hardware, keyboards) are
  re-authored into the new shape.

### Removed

- `categories` collection: schema in `content.config.ts`, the 6 content files
  in `content/categories/`, and `utils/categories.ts` + `utils/categories.test.ts`.

## Pages & routes

- **`/areas`** (replaces `src/pages/categories/index.astro`): grid of top-level
  area cards (icon + `themeColor`/`cover`), each with its sub-areas listed as
  plain links beneath and a content count.
- **`/areas/[...id]`** (replaces `src/pages/categories/[...id].astro`): an area
  **hub** aggregating all content tagged with the area — posts + uses,
  extensible to more types. A **top-level area rolls up content from its
  sub-areas**. Sub-area pages show a breadcrumb back to the parent. Hero styled
  from the area's own `themeColor`/`cover`, or its top-level ancestor's.
- **`/categories`** and **`/categories/*`** → redirect to `/areas` via Netlify
  `_redirects` (old detail pages were `noIndex`, so SEO risk is minimal).

## Components

- **`CategoryIcon.astro` → `AreaIcon.astro`** (both the `components/` and
  `components/icons/` copies): render the emoji from `area.data.icon` with a
  generic fallback. Drops the hardcoded 6-component `id` map.
- **New `AreaBadges.astro`**: maps a content item's `areas[]` to small tag chips
  linking to each area hub. Reused on `PostCard`, post meta, and use cards.
- **`PostMeta.astro`**: replace the single category link with `AreaBadges`.
- **`PostCard.astro` / `PostLayout.astro`**: color from
  `resolveThemeArea(areas[0])` → walk to the top-level ancestor → use its
  `themeColor` (preserves today's colorful posts).
- **`PostCta.astro` / `PostCtaInput.tsx`**: the "{category}" copy uses the
  primary area's title.
- **`NextGuidePost.astro`**: drop the category styling dependency.
- **`LayoutFooter.astro`**: `/categories` "Categories" link → `/areas` "Areas".
- **Homepage (`src/pages/index.astro`)**: add an "Explore by Area" section
  (reuse the existing `Section` component) listing top-level areas.

## Utilities

Replace `src/utils/categories.ts` with `src/utils/areas.ts`:

- `topLevelAreas()`, `subAreasOf(area)`
- `contentForArea(area, { posts, uses })` — rolls up sub-area content for
  top-level areas
- `resolveThemeArea(item)` — walk `areas[0]` to its top-level ancestor for color
- `areaHref(area)` and content-count helpers
- `validateTwoLevel(areas)` — the two-level build-time guard

Add `src/utils/areas.test.ts` covering: sub-area content rollup, primary-area
theme resolution, `areaHref`, and the two-level validation rule (including a
failing three-level case).

## RSS & sitemap

- `src/pages/rss.xml.ts`: `categories: [post.data.category.id]` →
  `categories: post.data.areas.map((a) => a.id)`.

## Migration / tagging (two phases)

1. **Build phase** — ship schema, pages, components, and utils against a small
   starter set of real areas the author writes (top-level + a few sub-areas,
   e.g. AI → Claude Code, Terminal → Neovim). Achieve a green build + passing
   tests. `.min(1)` on the content `areas` array means every post/use must have
   at least one area before the build passes, so this phase includes tagging
   enough content to build — or temporarily relaxing `.min(1)` until phase 2.
2. **Assisted tagging pass** — with the area set in place, go post-by-post and
   use-by-use proposing an `areas[]` array for each (primary first) for the
   author's review, until all content is tagged. Confirm every item has ≥1 area
   and enforce `.min(1)`.

## Risks & mitigations

- **`.min(1)` vs. incremental tagging:** enforcing ≥1 area breaks the build for
  any untagged post. Mitigation: tag all posts/uses in the same change set as
  the migration, or land `.min(1)` only after the tagging pass completes.
- **Color resolution for sub-area-only posts:** a post tagged solely with
  sub-areas still resolves color by walking `areas[0]` to its top-level
  ancestor, so a `themeColor` is always available as long as every top-level
  area defines one.
- **Old category URLs:** detail pages were `noIndex`; a blanket redirect to
  `/areas` covers bookmarks and internal links.

## Testing

- `utils/areas.test.ts` as above.
- `astro build` succeeds (validates references, two-level guard, `.min(1)`).
- Manual: `/areas` directory renders top-level cards + sub-areas; a top-level
  hub rolls up sub-area content; a sub-area hub shows a breadcrumb; area badges
  link correctly; homepage section renders; `/categories` redirects.
