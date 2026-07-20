# Post Header Layout Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the blog post page a centered, larger-type magazine reading column plus a dev-only toggle that live-swaps between 4 header layouts so Josh can pick a favorite.

**Architecture:** Rework `PostLayout.astro` so the body is a single centered `max-w-[680px]` column with `prose-lg` typography. The header (hero image / YouTube + title + metadata) renders inside a container carrying a `data-layout` attribute; all four variants are expressed via CSS keyed off that attribute. A radio group, rendered only when `import.meta.env.DEV`, sets `data-layout` via a tiny vanilla-JS handler.

**Tech Stack:** Astro, Tailwind CSS (+ `@tailwindcss/typography`), vanilla JS. No new dependencies.

## Global Constraints

- Toggle UI and its JS render ONLY when `import.meta.env.DEV` is true — never in production builds.
- No changes to `PostCard.astro`, `PostHero.astro`, or list pages.
- No new npm dependencies.
- Preserve existing hero image (`astro:assets` `<Image>`, `transition:name`) and YouTube iframe behavior.
- Title across all variants: `text-4xl md:text-6xl` extra-bold. Metadata: `text-base md:text-lg`.
- Default variant when no toggle present (production): variant A (Above).

---

### Task 1: Centered reading column + enlarged typography

**Files:**

- Modify: `src/components/post/PostLayout.astro`

**Interfaces:**

- Consumes: `post` prop (`CollectionEntry<'posts'>`), `category` via `getEntry`.
- Produces: a `<main>` prose container centered at `max-w-[680px]` with `prose-lg`, and a header block (hero/title/meta) stacked above it (variant A baseline). Later tasks add `data-layout` variants and the toggle.

- [ ] **Step 1: Replace the two-column section with a single centered column**

In `src/components/post/PostLayout.astro`, replace the `<section class="mb-20 md:flex md:flex-row-reverse">` block (lines ~27–74) with a centered stack. Keep the hero image + YouTube markup, but move them into a full-width header above the article. Body becomes:

```astro
<article class="mx-auto max-w-[680px]" data-pagefind-body>
  {/* header block goes here (Task 2 wraps it with data-layout) */}
  <header class="post-header mb-10" data-layout="A">
    <div class="post-header__media relative aspect-video w-full">
      {
        post.data.youtubeUrl && (
          <div class="post-header__video animate-fade-in absolute inset-0 z-20 w-full rounded-xl shadow-lg">
            <iframe
              width="100%"
              height="100%"
              class="aspect-video w-full rounded-xl bg-black shadow-lg"
              src={post.data.youtubeUrl}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            />
          </div>
        )
      }
      <Image
        class:list={[
          post.data.heroClasses,
          'absolute inset-0 z-10 aspect-video w-full rounded-xl bg-black shadow-lg',
        ]}
        src={post.data.heroImage}
        width="1640"
        height="922.5"
        alt={`${post.data.title} hero`}
        transition:name={`post-${post.id}-thumb`}
      />
    </div>

    <div class="post-header__text mt-8">
      <h1 class="post-title mb-4 text-4xl font-extrabold md:text-6xl">
        {post.data.title}
      </h1>
      <div class="post-meta">
        <PostMeta post={post} />
      </div>
    </div>
  </header>

  <main class="prose prose-invert prose-lg max-w-full">
    <slot />
  </main>
</article>
```

Keep the existing outer `themeColor` spacer div and the `<slot name="after-post" />`. Remove the old `md:-mt-[300px]` / `md:pt-[350px]` sticky offset scaffolding that only made sense for the side layout (replace with simple top padding, e.g. `pt-16` on the inner section).

- [ ] **Step 2: Build to verify it compiles**

Run: `npm run build`
Expected: build succeeds, no Astro/TS errors.

- [ ] **Step 3: Visually verify in dev**

Run: `npm run dev`, open a post (e.g. `/posts/<any-slug>`).
Expected: hero on top, large title below, metadata, then a single centered reading column with noticeably larger body text.

- [ ] **Step 4: Commit**

```bash
git add src/components/post/PostLayout.astro
git commit -m "feat(post): centered magazine reading column with larger type"
```

---

### Task 2: Four header variants via `data-layout` CSS

**Files:**

- Modify: `src/components/post/PostLayout.astro`

**Interfaces:**

- Consumes: the `<header class="post-header" data-layout="...">` structure from Task 1, with children `.post-header__media`, `.post-header__text`, `.post-title`, `.post-meta`.
- Produces: CSS in a component `<style>` block that renders variants A/B/C/D based on `data-layout`. Later task (toggle) only flips the attribute value.

- [ ] **Step 1: Add a scoped `<style>` block with the four variants**

Append to `src/components/post/PostLayout.astro`. Uses `is:global` is NOT needed — target within component scope. Because `data-layout` is set at runtime, keep selectors on `.post-header`:

```astro
<style>
  /* A — Above (default): media on top, text below, centered */
  .post-header[data-layout='A'] {
    text-align: center;
  }
  .post-header[data-layout='A'] .post-header__text {
    margin-top: 2rem;
  }

  /* B — Below: text (title + meta) on top, media under, centered */
  .post-header[data-layout='B'] {
    display: flex;
    flex-direction: column;
    text-align: center;
  }
  .post-header[data-layout='B'] .post-header__text {
    order: 1;
    margin-top: 0;
    margin-bottom: 2rem;
  }
  .post-header[data-layout='B'] .post-header__media {
    order: 2;
  }

  /* C — Center/hero: big centered title first, large media under, meta last */
  .post-header[data-layout='C'] {
    display: flex;
    flex-direction: column;
    text-align: center;
  }
  .post-header[data-layout='C'] .post-title {
    order: 1;
    font-size: clamp(2.5rem, 6vw, 4.5rem);
    margin-bottom: 1.5rem;
  }
  .post-header[data-layout='C'] .post-header__media {
    order: 2;
  }
  .post-header[data-layout='C'] .post-meta {
    order: 3;
    margin-top: 1.5rem;
  }
  /* keep title out of the text wrapper flow for C */
  .post-header[data-layout='C'] .post-header__text {
    display: contents;
  }

  /* D — Side: media right, text left (two columns on md+) */
  @media (min-width: 768px) {
    .post-header[data-layout='D'] {
      display: flex;
      flex-direction: row-reverse;
      gap: 1.5rem;
      text-align: left;
    }
    .post-header[data-layout='D'] .post-header__media {
      flex: 1 1 55%;
    }
    .post-header[data-layout='D'] .post-header__text {
      flex: 1 1 45%;
      margin-top: 0;
      align-self: center;
    }
  }
</style>
```

Note: for variant D the article's `max-w-[680px]` will constrain the row; that is acceptable for preview. If it feels cramped during review, widen the header only — handled in review, not pre-planned.

- [ ] **Step 2: Manually test each variant**

Temporarily hand-edit `data-layout="A"` → `B`, `C`, `D` in the template, run `npm run dev`, and confirm each renders as described in the spec table. Revert to `data-layout="A"` when done.

- [ ] **Step 3: Build to verify**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/post/PostLayout.astro
git commit -m "feat(post): add A/B/C/D header layout variants via data-layout"
```

---

### Task 3: Dev-only layout toggle

**Files:**

- Modify: `src/components/post/PostLayout.astro`

**Interfaces:**

- Consumes: the `.post-header[data-layout]` element and CSS variants from Tasks 1–2.
- Produces: a radio-group control rendered only in dev that sets `document.querySelector('.post-header').dataset.layout`.

- [ ] **Step 1: Render the toggle (dev only) and wire the handler**

Add near the top of the returned markup, inside the centered section but above `<article>`:

```astro
{
  import.meta.env.DEV && (
    <fieldset class="post-layout-toggle mx-auto mb-8 flex max-w-[680px] flex-wrap items-center gap-3 rounded-lg border border-neutral-700 bg-neutral-900 p-3 text-sm">
      <legend class="px-1 font-semibold">Header layout (dev)</legend>
      {['A', 'B', 'C', 'D'].map((v) => (
        <label class="flex cursor-pointer items-center gap-1">
          <input
            type="radio"
            name="post-layout"
            value={v}
            checked={v === 'A'}
          />
          {v}
        </label>
      ))}
    </fieldset>
  )
}
```

Then add a dev-only script at the bottom of the component:

```astro
{
  import.meta.env.DEV && (
    <script is:inline>
      {`
        (function () {
          var header = document.querySelector('.post-header');
          var saved = localStorage.getItem('postLayout');
          if (header && saved) {
            header.dataset.layout = saved;
            var pre = document.querySelector('input[name="post-layout"][value="' + saved + '"]');
            if (pre) pre.checked = true;
          }
          document.querySelectorAll('input[name="post-layout"]').forEach(function (el) {
            el.addEventListener('change', function (e) {
              if (header) header.dataset.layout = e.target.value;
              localStorage.setItem('postLayout', e.target.value);
            });
          });
        })();
      `}
    </script>
  )
}
```

- [ ] **Step 2: Verify toggle works in dev**

Run: `npm run dev`, open a post.
Expected: radio group visible; selecting A/B/C/D live-swaps the header layout; choice persists across reload.

- [ ] **Step 3: Verify toggle is absent in production build**

Run: `npm run build && npm run preview`, open a post.
Expected: NO toggle UI, NO toggle script; header renders variant A.

- [ ] **Step 4: Commit**

```bash
git add src/components/post/PostLayout.astro
git commit -m "feat(post): dev-only header layout toggle"
```

---

### Task 4: Metadata sizing polish

**Files:**

- Modify: `src/components/post/PostMeta.astro`

**Interfaces:**

- Consumes: nothing new.
- Produces: enlarged, better-spaced metadata used by the header in all variants.

- [ ] **Step 1: Enlarge the meta row**

In `src/components/post/PostMeta.astro`, change the container class from
`flex w-full flex-wrap gap-4 font-medium` to
`flex w-full flex-wrap items-center justify-center gap-5 text-base font-medium md:text-lg`.

(Note: `justify-center` suits variants A/B/C; variant D overrides text-align to left and flex-wrap will still left-pack acceptably within its column. If it looks off in D during review, gate centering behind the header variant — handled in review.)

- [ ] **Step 2: Bump icon sizes to match larger text**

Increase icon heights: change `h-4` → `h-5` and `w-4` → `w-5` for `CategoryIcon`, `DateIcon`, `DurationIcon`, `GuideIcon` usages in this file.

- [ ] **Step 3: Build + visual check**

Run: `npm run build`, then `npm run dev` and confirm metadata is larger and aligned in each variant.
Expected: build succeeds; metadata visibly larger.

- [ ] **Step 4: Commit**

```bash
git add src/components/post/PostMeta.astro
git commit -m "feat(post): enlarge post metadata to match magazine header"
```

---

## Self-Review

**Spec coverage:**

- Centered reading column + larger font → Task 1. ✓
- 4 header variants (above/below/center/side) → Task 2. ✓
- Dev-only toggle (radio group), gated to `import.meta.env.DEV`, optional localStorage persistence → Task 3. ✓
- Title bumped (`text-4xl md:text-6xl`) → Task 1 markup + constraint. ✓
- Metadata enlarged (`text-base md:text-lg`) → Task 4. ✓
- No toggle in production → Task 3 Step 3 verifies. ✓
- No changes to PostCard/PostHero/list pages; no new deps → Global Constraints. ✓

**Placeholder scan:** No TBD/TODO; every code step shows actual code. Review-deferred notes (variant D width, meta centering in D) are explicitly optional polish, not required deliverables.

**Type/name consistency:** Class names `.post-header`, `.post-header__media`, `.post-header__video`, `.post-header__text`, `.post-title`, `.post-meta`, attribute `data-layout`, radio `name="post-layout"`, and `localStorage` key `postLayout` are consistent across Tasks 1–3. ✓
