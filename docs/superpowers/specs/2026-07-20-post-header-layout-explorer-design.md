# Post Header Layout Explorer — Design

Date: 2026-07-20
Status: Approved (design), pending implementation plan

## Goal

Improve the blog post reading experience toward a Medium / magazine feel, and
provide a **throwaway, dev-only toggle** to compare several header layouts
(thumbnail/video + title + metadata) so Josh can pick a favorite. Once a winner
is chosen, the winning layout is baked in and the toggle is removed.

## Scope

- File: `src/components/post/PostLayout.astro` (primary)
- Supporting: `src/components/post/PostMeta.astro` (metadata sizing)
- No changes ship the toggle to production — it is gated to `import.meta.env.DEV`.

## Part 1 — Reading experience (fixed, applies to every variant)

- Replace the current two-column desktop layout (article left, sticky
  video/thumbnail right via `flex-row-reverse`) with a **single centered
  reading column**.
- Column width: ~`max-w-[680px]`, horizontally centered on screen.
- Body font: bump to ~18–19px base with relaxed line-height. Use Tailwind
  Typography `prose-lg` plus a size nudge. Left-aligned text (NOT
  center-aligned) — centered column only.
- The hero image / YouTube video is no longer a sticky side element; it becomes
  part of the header block whose placement is chosen by the toggle.

## Part 2 — Header variants

The header container carries a `data-layout` attribute. All four variants render
once; CSS shows only the active one. Shared across all variants:

- Title bumped up: `text-4xl md:text-6xl`, extra-bold.
- Metadata enlarged: `text-base md:text-lg` with slightly increased spacing.

| Variant         | Thumbnail/video                     | Title + meta                   |
| --------------- | ----------------------------------- | ------------------------------ |
| A — Above       | Full-width on top                   | Below, centered                |
| B — Below       | Full-width under title              | Title + meta on top, centered  |
| C — Center/hero | Large centered image                | Big centered title, meta under |
| D — Side        | Right column (evolves current look) | Left column, larger title      |

## Part 3 — Toggle mechanism

- A radio group (or button group) pinned near the top of the post page.
- Rendered ONLY when `import.meta.env.DEV` is true.
- Vanilla JS: on change, set `data-layout="A|B|C|D"` on the header container.
- CSS (Tailwind arbitrary variants or a small `<style>` block) shows/hides the
  variant matching the active `data-layout`. Default variant: A.
- Optional nicety: persist last choice in `localStorage` so it survives reloads
  during evaluation. (YAGNI candidate — include only if trivial.)

## Non-goals

- No reader-facing layout switching in production.
- No changes to `PostCard.astro`, `PostHero.astro`, or list pages.
- No new dependencies.

## Success criteria

- Body content reads as a centered, larger-type magazine column.
- In dev, toggling the radio group live-swaps between 4 header layouts.
- Production build contains no toggle UI and renders the chosen default cleanly.
- Existing hero image + YouTube embed behavior preserved within each variant.
