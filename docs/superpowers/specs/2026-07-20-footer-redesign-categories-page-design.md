# Footer Redesign + Categories Page

Date: 2026-07-20

## Goal

The footer currently renders a grid of category cards, which isn't pulling its
weight. Replace it with a sitemap-style navigation footer, and move category
discovery to a dedicated `/categories` index page that surfaces each category's
most popular posts using the existing ranked pageview data.

## 1. Sitemap footer — `src/components/LayoutFooter.astro`

Remove the category-card grid (the `<section>` mapping `<Category />`). Replace
the right-hand column with a three-column sitemap:

| Content    | Explore     | About          |
| ---------- | ----------- | -------------- |
| Posts      | Wallpapers  | About          |
| Videos     | Uses        | (social icons) |
| Projects   | Stats       |                |
| Guides     | Appearances |                |
| Categories |             |                |

- The left block keeps logo (`SITE_TITLE`), tagline, and profile image.
- The existing mobile-only `<nav>` in the footer is removed; the sitemap
  columns stack on mobile and cover the same links.
- `SocialLinks` moves under the **About** column (with the About link).
- Copyright bar unchanged.
- Links use the existing `Link.astro` component.

## 2. Header — `src/components/LayoutHeader.astro`

Remove **Wallpapers** and **Uses** from the header nav (now in the footer).
Resulting header nav: Posts, Videos, Projects, Guides, About.

"Categories" is intentionally _not_ added to the header — it lives in the
footer sitemap only.

## 3. Categories index page — `src/pages/categories/index.astro` (new)

Mirrors the data approach of `src/pages/stats.astro` (reads the committed
`src/data/pageviews.json` snapshot, no live Fathom calls at build).

Logic:

1. Load all posts (include drafts only in `DEV`, matching existing pages).
2. Load all categories, sort **alphabetically by title**.
3. Build the pageviews map via `pageviewsFromRecord(pageviewSnapshot.pageviews)`.
4. For each category:
   - Filter posts to `post.data.category.id === category.id`.
   - Rank with `rankPosts(categoryPosts, pageviews)`.
   - Take the **top 2** for display; keep the full filtered count for the label.

Render, looping through all categories stacked down the page:

- A heading row: `CategoryIcon` + category **title** side by side.
- A small **post count** label (e.g. "12 posts").
- The **top 2 posts as `PostCard`** components.

Page is indexable (no `noIndex`), unlike the individual `categories/[...id]`
pages. Uses the standard `Layout` + `Wrapper` + `PageTitle` like `stats.astro`.

## 4. Cleanup

`src/components/Category.astro` is only consumed by the footer. After the footer
change it is unused — delete it.

`CategoryIcon.astro` and `PostCard.astro` are reused as-is.

## Out of scope

- No changes to `categories/[...id].astro` (individual category pages).
- No changes to the ranking logic or the snapshot refresh script.
- No new header link for Categories.
