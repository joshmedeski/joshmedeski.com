# Footer Redesign + Categories Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the footer's category-card grid with a sitemap navigation, and add a `/categories` index page that shows each category's two most-viewed posts.

**Architecture:** A pure, unit-tested helper (`src/utils/categories.ts`) groups posts by category and ranks them using the existing committed `pageviews.json` snapshot. The new `src/pages/categories/index.astro` consumes it and renders with existing `CategoryIcon` + `PostCard` components. Footer and header are static `.astro` edits verified by `astro build`.

**Tech Stack:** Astro 5, TypeScript, Tailwind CSS 4, Vitest.

## Global Constraints

- Node `^22`.
- TypeScript, ES module syntax, functional patterns.
- Category ordering on the index page: **alphabetical by `data.title`**.
- Top posts per category: **2**, ranked by lifetime pageviews.
- Reuse existing components (`CategoryIcon`, `PostCard`, `Link`, `SocialLinks`, `Wrapper`, `PageTitle`, `Layout`); do not restyle them.
- Vitest test files match `./src/**/*.test.ts` (co-located `*.test.ts`).
- Ranking reads the committed `src/data/pageviews.json` snapshot — no live Fathom calls at build (mirror `src/pages/stats.astro`).

---

### Task 1: Category ranking helper

Pure function that groups posts by category, ranks each group by pageviews, and returns categories sorted alphabetically with a post count and the top N posts.

**Files:**

- Create: `src/utils/categories.ts`
- Test: `src/utils/categories.test.ts`

**Interfaces:**

- Consumes: `rankPosts(posts, viewsByPathname)` from `src/utils/fathom.ts` (returns `{ post, pageviews }[]` sorted by pageviews desc, tie-broken by newest `pubDate`).
- Produces:

  ```ts
  export type CategoryWithTopPosts = {
    category: CollectionEntry<'categories'>
    postCount: number
    topPosts: CollectionEntry<'posts'>[]
  }

  export function categoriesWithTopPosts(
    categories: CollectionEntry<'categories'>[],
    posts: CollectionEntry<'posts'>[],
    viewsByPathname: Map<string, number>,
    topN?: number, // default 2
  ): CategoryWithTopPosts[]
  ```

- [ ] **Step 1: Write the failing test**

Create `src/utils/categories.test.ts`. The helper only touches `id`, `data.title`, `data.category.id`, and `data.pubDate`, so build minimal fixtures cast to the collection types.

```ts
import { describe, expect, it } from 'vitest'
import type { CollectionEntry } from 'astro:content'
import { categoriesWithTopPosts } from './categories'

const cat = (id: string, title: string) =>
  ({ id, data: { title } }) as unknown as CollectionEntry<'categories'>

const post = (id: string, categoryId: string, pubDate: string) =>
  ({
    id,
    data: { category: { id: categoryId }, pubDate: new Date(pubDate) },
  }) as unknown as CollectionEntry<'posts'>

const categories = [cat('development', 'Development'), cat('tech', 'Tech')]
const posts = [
  post('dev-a', 'development', '2024-01-01'),
  post('dev-b', 'development', '2024-02-01'),
  post('dev-c', 'development', '2024-03-01'),
  post('tech-a', 'tech', '2024-01-01'),
]
const views = new Map<string, number>([
  ['/posts/dev-a', 10],
  ['/posts/dev-b', 30],
  ['/posts/dev-c', 20],
  ['/posts/tech-a', 5],
])

describe('categoriesWithTopPosts', () => {
  it('orders categories alphabetically by title', () => {
    const reversed = [cat('tech', 'Tech'), cat('development', 'Development')]
    const result = categoriesWithTopPosts(reversed, posts, views)
    expect(result.map((r) => r.category.id)).toEqual(['development', 'tech'])
  })

  it('returns the top N posts per category by pageviews', () => {
    const result = categoriesWithTopPosts(categories, posts, views, 2)
    const dev = result.find((r) => r.category.id === 'development')!
    expect(dev.topPosts.map((p) => p.id)).toEqual(['dev-b', 'dev-c'])
  })

  it('reports the full post count, not the truncated top N', () => {
    const result = categoriesWithTopPosts(categories, posts, views, 2)
    const dev = result.find((r) => r.category.id === 'development')!
    expect(dev.postCount).toBe(3)
  })

  it('defaults to two top posts', () => {
    const result = categoriesWithTopPosts(categories, posts, views)
    const dev = result.find((r) => r.category.id === 'development')!
    expect(dev.topPosts).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/utils/categories.test.ts`
Expected: FAIL — `categoriesWithTopPosts` is not exported / module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/utils/categories.ts`:

```ts
import type { CollectionEntry } from 'astro:content'
import { rankPosts } from './fathom'

export type CategoryWithTopPosts = {
  category: CollectionEntry<'categories'>
  postCount: number
  topPosts: CollectionEntry<'posts'>[]
}

export function categoriesWithTopPosts(
  categories: CollectionEntry<'categories'>[],
  posts: CollectionEntry<'posts'>[],
  viewsByPathname: Map<string, number>,
  topN = 2,
): CategoryWithTopPosts[] {
  return [...categories]
    .sort((a, b) => a.data.title.localeCompare(b.data.title))
    .map((category) => {
      const categoryPosts = posts.filter(
        (post) => post.data.category.id === category.id,
      )
      const ranked = rankPosts(categoryPosts, viewsByPathname)
      return {
        category,
        postCount: categoryPosts.length,
        topPosts: ranked.slice(0, topN).map(({ post }) => post),
      }
    })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/utils/categories.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/categories.ts src/utils/categories.test.ts
git commit -m "feat: add category ranking helper"
```

---

### Task 2: Categories index page

New `/categories` page listing every category (alphabetical) with its post count and two top-ranked posts.

**Files:**

- Create: `src/pages/categories/index.astro`

**Interfaces:**

- Consumes: `categoriesWithTopPosts(...)` from Task 1; `pageviewsFromRecord` from `src/utils/fathom.ts`; `src/data/pageviews.json`.
- Produces: a route at `/categories` (indexable — no `noIndex`).

- [ ] **Step 1: Create the page**

Create `src/pages/categories/index.astro`. Mirror the data setup in `src/pages/stats.astro` (draft filtering, snapshot import) and the layout wrappers used there.

```astro
---
import { getCollection } from 'astro:content'
import Layout from '../../components/Layout.astro'
import PageTitle from '../../components/PageTitle.astro'
import Wrapper from '../../components/Wrapper.astro'
import CategoryIcon from '~/components/CategoryIcon.astro'
import PostCard from '~/components/post/PostCard.astro'
import { pageviewsFromRecord } from '../../utils/fathom'
import { categoriesWithTopPosts } from '../../utils/categories'
import pageviewSnapshot from '../../data/pageviews.json'

const includeDrafts = import.meta.env.DEV
const posts = await getCollection(
  'posts',
  ({ data: { draft } }) => includeDrafts || !draft,
)
const categories = await getCollection('categories')
const grouped = categoriesWithTopPosts(
  categories,
  posts,
  pageviewsFromRecord(pageviewSnapshot.pageviews),
)
---

<Layout title="Categories" description="Browse posts by category.">
  <Wrapper>
    <PageTitle>Categories</PageTitle>
    <div class="mb-32 flex flex-col gap-16">
      {
        grouped.map(({ category, postCount, topPosts }) => (
          <section>
            <a
              href={`/categories/${category.id}`}
              class="group mb-6 flex items-center gap-3"
              data-astro-prefetch
            >
              <CategoryIcon id={category.id} class="w-10 shrink-0" />
              <div>
                <h2 class="text-2xl font-bold group-hover:underline">
                  {category.data.title}
                </h2>
                <p class="text-sm text-neutral-500">
                  {postCount} {postCount === 1 ? 'post' : 'posts'}
                </p>
              </div>
            </a>
            <div class="grid gap-4 sm:grid-cols-2 sm:gap-8">
              {topPosts.map((post) => (
                <PostCard post={post} />
              ))}
            </div>
          </section>
        ))
      }
    </div>
  </Wrapper>
</Layout>
```

- [ ] **Step 2: Verify the build**

Run: `pnpm build`
Expected: build succeeds; output includes `dist/categories/index.html`.

Run: `test -f dist/categories/index.html && echo OK`
Expected: `OK`.

- [ ] **Step 3: Format check**

Run: `pnpm exec prettier --check src/pages/categories/index.astro`
Expected: passes (run `pnpm exec prettier --write src/pages/categories/index.astro` if not).

- [ ] **Step 4: Commit**

```bash
git add src/pages/categories/index.astro
git commit -m "feat: add categories index page with top posts"
```

---

### Task 3: Sitemap footer

Replace the category-card grid in the footer with a three-column sitemap (Content / Explore / About) and remove the redundant mobile-only nav.

**Files:**

- Modify: `src/components/LayoutFooter.astro`

**Interfaces:**

- Consumes: `Link`, `SocialLinks`, `Wrapper`, `SITE_TITLE`, `profileCircle` (all already imported in the file).
- Produces: footer with a `/categories` link; no longer renders `Category.astro`.

- [ ] **Step 1: Rewrite the footer body**

In `src/components/LayoutFooter.astro`:

1. Remove the `Category` import (`import Category from './Category.astro'`), the `getCollection` import if now unused, and the `const categories = await getCollection('categories')` line.
2. Remove the mobile-only `<nav class="mb-8 flex flex-wrap ... sm:hidden">...</nav>` block.
3. Remove the "Find me online" block from the left column (the `<div>` containing `<h3>Find me online</h3>`, the profile `<Image>`, and `<SocialLinks />`), but keep the profile `<Image>` — move it directly under the logo/tagline block in the left column. `SocialLinks` moves to the About column in the sitemap (below).
4. Replace the right column block (the `<div class="mt-12 md:mt-0 lg:col-span-4">` containing the `categories.map(...)` section) with the sitemap below.

Right-column replacement (note `SocialLinks` under the About heading):

```astro
<nav
  class="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-3 md:mt-0 lg:col-span-4"
  aria-label="Sitemap"
>
  <div>
    <h3 class="mb-3 font-bold">Content</h3>
    <ul class="space-y-2 text-neutral-400">
      <li><Link href="/posts">Posts</Link></li>
      <li><Link href="/videos">Videos</Link></li>
      <li><Link href="/projects">Projects</Link></li>
      <li><Link href="/guides">Guides</Link></li>
      <li><Link href="/categories">Categories</Link></li>
    </ul>
  </div>
  <div>
    <h3 class="mb-3 font-bold">Explore</h3>
    <ul class="space-y-2 text-neutral-400">
      <li><Link href="/wallpapers">Wallpapers</Link></li>
      <li><Link href="/uses">Uses</Link></li>
      <li><Link href="/stats">Stats</Link></li>
      <li><Link href="/appearances">Appearances</Link></li>
    </ul>
  </div>
  <div>
    <h3 class="mb-3 font-bold">About</h3>
    <ul class="mb-4 space-y-2 text-neutral-400">
      <li><Link href="/about">About</Link></li>
    </ul>
    <SocialLinks iconSize="h-6" />
  </div>
</nav>
```

`SocialLinks` accepts an `iconSize` prop (default `h-10`); use `h-6` here so the icons sit comfortably in the sitemap column. Keep the `SocialLinks` import in the frontmatter.

- [ ] **Step 2: Verify the build**

Run: `pnpm build`
Expected: build succeeds with no unused-import or undefined-variable errors.

- [ ] **Step 3: Confirm the footer no longer references Category**

Run: `grep -n "Category" src/components/LayoutFooter.astro`
Expected: no matches (exit status 1, no output).

- [ ] **Step 4: Format check**

Run: `pnpm exec prettier --check src/components/LayoutFooter.astro`
Expected: passes (run `--write` if not).

- [ ] **Step 5: Commit**

```bash
git add src/components/LayoutFooter.astro
git commit -m "feat: replace footer category grid with sitemap nav"
```

---

### Task 4: Trim header nav

Remove Wallpapers and Uses from the header nav — they now live in the footer sitemap.

**Files:**

- Modify: `src/components/LayoutHeader.astro:34-40`

- [ ] **Step 1: Remove the two links**

Delete these two lines from the `<nav>` block:

```astro
<Link href="/wallpapers">Wallpapers</Link>
<Link href="/uses">Uses</Link>
```

Resulting nav order: Posts, Videos, Projects, Guides, About.

- [ ] **Step 2: Verify the build**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 3: Confirm the links are gone from the header**

Run: `grep -nE "/wallpapers|/uses" src/components/LayoutHeader.astro`
Expected: no matches (exit status 1, no output).

- [ ] **Step 4: Commit**

```bash
git add src/components/LayoutHeader.astro
git commit -m "refactor: move wallpapers and uses out of header nav"
```

---

### Task 5: Delete the unused Category component

`Category.astro` was only used by the footer. After Task 3 it is dead code.

**Files:**

- Delete: `src/components/Category.astro`

- [ ] **Step 1: Confirm there are no remaining references**

Run: `grep -rn "Category.astro\|from './Category'\|from '../components/Category'" src`
Expected: no matches (exit status 1, no output). If any match exists, stop and resolve it before deleting.

- [ ] **Step 2: Delete the file**

```bash
git rm src/components/Category.astro
```

- [ ] **Step 3: Verify the build**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: remove unused Category component"
```

---

## Final verification

- [ ] Run full test suite: `pnpm vitest run` — expected: all pass.
- [ ] Run `pnpm build` — expected: succeeds, `dist/categories/index.html` present.
- [ ] Run `pnpm exec prettier --check .` — expected: passes.
- [ ] Manual check via `pnpm start`: `/categories` lists all categories alphabetically, each with a post count and two top posts; footer shows the three sitemap columns with a working Categories link; header nav no longer shows Wallpapers or Uses.
