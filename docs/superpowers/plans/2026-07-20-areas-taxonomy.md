# Areas Taxonomy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `categories` feature with a site-wide, two-level `areas` taxonomy that tags posts and uses, with area hub pages, an areas directory, area badges, and a homepage section.

**Architecture:** Add a richer `areas` collection (title, icon, parent, themeColor, cover). Content items get an optional `areas: reference[]` array. Pure helper functions in `src/utils/areas.ts` resolve hierarchy, roll up sub-area content, and derive a post's theme color from its primary area's top-level ancestor. Work is additive-first: `areas` lands alongside `category`/`area` so every task builds green, then the old `categories` collection is removed in the final task.

**Tech Stack:** Astro 5 content collections, Zod, Tailwind 4, Preact islands, Vitest, pnpm.

## Global Constraints

- Runtime: Node `^22`, package manager `pnpm`.
- Path alias `~/` maps to `src/` (use it in new imports).
- Content collections are non-strict: unknown frontmatter keys are ignored (so leftover `category:` on posts is harmless until cleaned up).
- Areas are at most two levels: a sub-area's `parent` must itself have no parent.
- `areas` on posts/uses is **optional** in this plan; all consumers must handle an absent/empty array gracefully. Flipping to required (`.min(1)`) is an out-of-scope follow-up after content is tagged.
- Commit messages use conventional-commit format (`feat:`, `refactor:`, `chore:`).
- Run tests with `pnpm exec vitest run <path>`; type-check/build with `pnpm exec astro sync && pnpm exec astro check`.

---

## File Structure

**Create:**
- `src/utils/areas.ts` — pure hierarchy/rollup/theme helpers
- `src/utils/areas.test.ts` — unit tests for the above
- `src/components/AreaIcon.astro` — renders an area's emoji icon
- `src/components/AreaBadges.astro` — chip list of an item's areas
- `src/components/sections/Areas.astro` — homepage "Explore by Area" section
- `src/pages/areas/index.astro` — areas directory
- `src/pages/areas/[...id].astro` — area hub page
- `content/areas/ai.md`, `content/areas/claude-code.md` — seed hierarchy example

**Modify:**
- `src/content.config.ts` — areas schema; add `areas` to posts/uses; later remove `categories`
- `content/areas/audio.md`, `hardware.md`, `keyboards.md` — re-author to new shape
- `content/uses/*.md` (16 files) — add `areas: [...]`
- `src/components/post/PostMeta.astro`, `PostCard.astro`, `PostLayout.astro`
- `src/components/cta/PostCta.astro`, `PostCtaInput.tsx`
- `src/components/NextGuidePost.astro`, `LayoutFooter.astro`
- `src/pages/index.astro`, `rss.xml.ts`, `uses.astro`, `uses/[...id].astro`, `posts/[...id].astro`
- `netlify.toml` — `/categories*` → `/areas` redirect

**Delete (final task):**
- `src/pages/categories/index.astro`, `src/pages/categories/[...id].astro`
- `src/components/CategoryIcon.astro`, `src/components/icons/CategoryIcon.astro`
- `src/utils/categories.ts`, `src/utils/categories.test.ts`
- `content/categories/*.md` (6 files)

---

### Task 1: Extend schema (additive)

**Files:**
- Modify: `src/content.config.ts` — replace `areasCollection`; add `areas` to posts and uses

**Interfaces:**
- Produces: `areas` collection entries with `{ title, icon?, parent?, themeColor?, cover?, description? }`; `posts[].data.areas?` and `uses[].data.areas?` as `{ collection: 'areas'; id: string }[]`.

- [ ] **Step 1: Replace the `areasCollection` definition**

Replace the current `areasCollection` (lines ~54-59) with:

```ts
const areasCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './content/areas' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      icon: z.string().optional(),
      parent: reference('areas').optional(),
      themeColor: z.string().optional(),
      cover: image().optional(),
      description: z.string().optional(),
    }),
})
```

- [ ] **Step 2: Add `areas` to the posts schema**

In `postsCollection`, immediately after the `category: reference('categories'),` line, add:

```ts
      areas: z.array(reference('areas')).optional(),
```

(Keep `category` for now — it is removed in Task 9.)

- [ ] **Step 3: Add `areas` to the uses schema**

In `usesCollection`, immediately after the `area: reference('areas'),` line, add:

```ts
      areas: z.array(reference('areas')).optional(),
```

- [ ] **Step 4: Regenerate types and type-check**

Run: `pnpm exec astro sync && pnpm exec astro check`
Expected: sync writes `.astro/` types; check reports 0 errors (pre-existing warnings unrelated to areas are acceptable).

- [ ] **Step 5: Commit**

```bash
git add src/content.config.ts
git commit -m "feat: add areas schema and optional areas arrays to posts and uses"
```

---

### Task 2: Areas utilities (TDD)

**Files:**
- Create: `src/utils/areas.ts`
- Test: `src/utils/areas.test.ts`

**Interfaces:**
- Produces:
  - `isTopLevel(area): boolean`
  - `topLevelAreas(areas): Area[]` (sorted by title)
  - `subAreasOf(parent, areas): Area[]` (sorted by title)
  - `resolveTopLevel(area, areas): Area`
  - `areaIdsFor(item): string[]`
  - `resolveThemeArea(item, areas): Area | undefined`
  - `areaScopeIds(area, areas): string[]`
  - `contentForArea<T>(area, areas, items: T[]): T[]`
  - `areaHref(area): string`
  - `validateTwoLevel(areas): void` (throws on 3+ levels)
  - where `Area = CollectionEntry<'areas'>`, `Taggable = { data: { areas?: { id: string }[] } }`

- [ ] **Step 1: Write the failing test**

Create `src/utils/areas.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import type { CollectionEntry } from 'astro:content'
import {
  isTopLevel,
  topLevelAreas,
  subAreasOf,
  resolveTopLevel,
  resolveThemeArea,
  contentForArea,
  areaScopeIds,
  areaHref,
  validateTwoLevel,
} from './areas'

const area = (
  id: string,
  opts: { title?: string; parent?: string; themeColor?: string } = {},
): CollectionEntry<'areas'> =>
  ({
    id,
    data: {
      title: opts.title ?? id,
      parent: opts.parent ? { collection: 'areas', id: opts.parent } : undefined,
      themeColor: opts.themeColor,
    },
  }) as unknown as CollectionEntry<'areas'>

const item = (...areaIds: string[]) =>
  ({
    data: { areas: areaIds.map((id) => ({ collection: 'areas', id })) },
  }) as unknown as { data: { areas?: { id: string }[] } }

const ai = area('ai', { title: 'AI', themeColor: 'bg-indigo-900' })
const claude = area('claude-code', { title: 'Claude Code', parent: 'ai' })
const hardware = area('hardware', { title: 'Hardware', themeColor: 'bg-slate-800' })
const areas = [claude, ai, hardware]

describe('areas utils', () => {
  it('isTopLevel is true only when no parent', () => {
    expect(isTopLevel(ai)).toBe(true)
    expect(isTopLevel(claude)).toBe(false)
  })

  it('topLevelAreas returns parentless areas sorted by title', () => {
    expect(topLevelAreas(areas).map((a) => a.id)).toEqual(['ai', 'hardware'])
  })

  it('subAreasOf returns children sorted by title', () => {
    expect(subAreasOf(ai, areas).map((a) => a.id)).toEqual(['claude-code'])
    expect(subAreasOf(hardware, areas)).toEqual([])
  })

  it('resolveTopLevel walks a sub-area to its parent, returns top-level as-is', () => {
    expect(resolveTopLevel(claude, areas).id).toBe('ai')
    expect(resolveTopLevel(ai, areas).id).toBe('ai')
  })

  it('resolveThemeArea uses areas[0] resolved to its top-level ancestor', () => {
    expect(resolveThemeArea(item('claude-code'), areas)?.id).toBe('ai')
    expect(resolveThemeArea(item(), areas)).toBeUndefined()
  })

  it('areaScopeIds includes the area plus its sub-areas', () => {
    expect(areaScopeIds(ai, areas).sort()).toEqual(['ai', 'claude-code'])
    expect(areaScopeIds(claude, areas)).toEqual(['claude-code'])
  })

  it('contentForArea rolls up sub-area content for a top-level area', () => {
    const items = [item('claude-code'), item('hardware'), item('ai')]
    expect(contentForArea(ai, areas, items)).toHaveLength(2)
    expect(contentForArea(claude, areas, items)).toHaveLength(1)
  })

  it('areaHref builds the hub path', () => {
    expect(areaHref(ai)).toBe('/areas/ai')
  })

  it('validateTwoLevel passes for two levels', () => {
    expect(() => validateTwoLevel(areas)).not.toThrow()
  })

  it('validateTwoLevel throws for three levels', () => {
    const deep = area('opus', { parent: 'claude-code' })
    expect(() => validateTwoLevel([...areas, deep])).toThrow(/two levels/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/utils/areas.test.ts`
Expected: FAIL — cannot resolve `./areas`.

- [ ] **Step 3: Write the implementation**

Create `src/utils/areas.ts`:

```ts
import type { CollectionEntry } from 'astro:content'

type Area = CollectionEntry<'areas'>
type Taggable = { data: { areas?: { id: string }[] } }

export function isTopLevel(area: Area): boolean {
  return !area.data.parent
}

export function topLevelAreas(areas: Area[]): Area[] {
  return areas
    .filter(isTopLevel)
    .sort((a, b) => a.data.title.localeCompare(b.data.title))
}

export function subAreasOf(parent: Area, areas: Area[]): Area[] {
  return areas
    .filter((a) => a.data.parent?.id === parent.id)
    .sort((a, b) => a.data.title.localeCompare(b.data.title))
}

export function resolveTopLevel(area: Area, areas: Area[]): Area {
  const parentId = area.data.parent?.id
  if (!parentId) return area
  return areas.find((a) => a.id === parentId) ?? area
}

export function areaIdsFor(item: Taggable): string[] {
  return item.data.areas?.map((a) => a.id) ?? []
}

export function resolveThemeArea(
  item: Taggable,
  areas: Area[],
): Area | undefined {
  const firstId = item.data.areas?.[0]?.id
  if (!firstId) return undefined
  const area = areas.find((a) => a.id === firstId)
  return area ? resolveTopLevel(area, areas) : undefined
}

export function areaScopeIds(area: Area, areas: Area[]): string[] {
  return [area.id, ...subAreasOf(area, areas).map((a) => a.id)]
}

export function contentForArea<T extends Taggable>(
  area: Area,
  areas: Area[],
  items: T[],
): T[] {
  const scope = new Set(areaScopeIds(area, areas))
  return items.filter((item) => areaIdsFor(item).some((id) => scope.has(id)))
}

export function areaHref(area: Pick<Area, 'id'>): string {
  return `/areas/${area.id}`
}

export function validateTwoLevel(areas: Area[]): void {
  const byId = new Map(areas.map((a) => [a.id, a]))
  const violations: string[] = []
  for (const a of areas) {
    const parentId = a.data.parent?.id
    if (!parentId) continue
    const parent = byId.get(parentId)
    if (parent?.data.parent) {
      violations.push(`${a.id} -> ${parentId} -> ${parent.data.parent.id}`)
    }
  }
  if (violations.length > 0) {
    throw new Error(
      `Areas must be at most two levels deep. Offending chains:\n${violations.join('\n')}`,
    )
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/utils/areas.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/areas.ts src/utils/areas.test.ts
git commit -m "feat: add areas hierarchy and rollup utilities"
```

---

### Task 3: AreaIcon + AreaBadges components + seed areas

**Files:**
- Create: `src/components/AreaIcon.astro`, `src/components/AreaBadges.astro`
- Create: `content/areas/ai.md`, `content/areas/claude-code.md`
- Modify: `content/areas/audio.md`, `content/areas/hardware.md`, `content/areas/keyboards.md`

**Interfaces:**
- Produces: `<AreaIcon icon?={string} class?={string} />`; `<AreaBadges areas?={{ collection: 'areas'; id: string }[]} />`
- Consumes: `areaHref` from Task 2.

- [ ] **Step 1: Create `AreaIcon.astro`**

```astro
---
interface Props {
  icon?: string
  class?: string
}
const { icon, class: className } = Astro.props
---

<span class={className} aria-hidden="true">{icon ?? '📁'}</span>
```

- [ ] **Step 2: Create `AreaBadges.astro`**

```astro
---
import { getEntry } from 'astro:content'
import { areaHref } from '~/utils/areas'
import AreaIcon from './AreaIcon.astro'

interface Props {
  areas?: { collection: 'areas'; id: string }[]
}
const { areas = [] } = Astro.props
const resolved = (
  await Promise.all((areas ?? []).map((ref) => getEntry(ref)))
).filter((a) => a != null)
---

{
  resolved.length > 0 && (
    <ul class="flex flex-wrap items-center gap-2">
      {resolved.map((area) => (
        <li>
          <a
            href={areaHref(area)}
            class="flex items-center gap-1 rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-200 hover:bg-neutral-700"
          >
            <AreaIcon icon={area.data.icon} />
            <span>{area.data.title}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 3: Re-author the three uses areas**

Overwrite `content/areas/audio.md`:

```md
---
title: Audio
icon: 🎧
themeColor: bg-emerald-900
---
```

Overwrite `content/areas/hardware.md`:

```md
---
title: Hardware
icon: 🖥️
themeColor: bg-slate-800
---
```

Overwrite `content/areas/keyboards.md`:

```md
---
title: Keyboards
icon: ⌨️
themeColor: bg-amber-900
---
```

- [ ] **Step 4: Create seed hierarchy example**

Create `content/areas/ai.md`:

```md
---
title: AI
icon: 🤖
themeColor: bg-indigo-900
description: Artificial intelligence tools, agents, and workflows.
---
```

Create `content/areas/claude-code.md`:

```md
---
title: Claude Code
icon: ✴️
parent: ai
---
```

- [ ] **Step 5: Type-check**

Run: `pnpm exec astro sync && pnpm exec astro check`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/AreaIcon.astro src/components/AreaBadges.astro content/areas
git commit -m "feat: add area icon and badge components with seed areas"
```

---

### Task 4: Areas directory page

**Files:**
- Create: `src/pages/areas/index.astro`

**Interfaces:**
- Consumes: `topLevelAreas`, `subAreasOf`, `contentForArea`, `areaHref`, `validateTwoLevel` (Task 2); `AreaIcon` (Task 3).

- [ ] **Step 1: Create the page**

```astro
---
import { getCollection } from 'astro:content'
import Layout from '../../components/Layout.astro'
import PageTitle from '../../components/PageTitle.astro'
import Wrapper from '../../components/Wrapper.astro'
import AreaIcon from '~/components/AreaIcon.astro'
import {
  topLevelAreas,
  subAreasOf,
  contentForArea,
  areaHref,
  validateTwoLevel,
} from '~/utils/areas'

const includeDrafts = import.meta.env.DEV
const areas = await getCollection('areas')
validateTwoLevel(areas)
const posts = await getCollection(
  'posts',
  ({ data }) => includeDrafts || !data.draft,
)
const uses = await getCollection('uses')
const allItems = [...posts, ...uses]
const tops = topLevelAreas(areas)
---

<Layout title="Areas" description="Browse everything by topic area.">
  <Wrapper>
    <PageTitle>Areas</PageTitle>
    <div class="mb-32 grid gap-8 sm:grid-cols-2">
      {
        tops.map((area) => {
          const subs = subAreasOf(area, areas)
          const count = contentForArea(area, areas, allItems).length
          return (
            <section
              class={`rounded-2xl p-6 ${area.data.themeColor ?? 'bg-neutral-900'}`}
            >
              <a href={areaHref(area)} class="flex items-center gap-3">
                <AreaIcon icon={area.data.icon} class="text-3xl" />
                <div>
                  <h2 class="text-2xl font-bold">{area.data.title}</h2>
                  <p class="text-sm opacity-80">
                    {count} {count === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </a>
              {subs.length > 0 && (
                <ul class="mt-4 flex flex-wrap gap-2">
                  {subs.map((sub) => (
                    <li>
                      <a
                        href={areaHref(sub)}
                        class="rounded-full bg-black/30 px-3 py-1 text-sm hover:bg-black/50"
                      >
                        {sub.data.title}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })
      }
    </div>
  </Wrapper>
</Layout>
```

- [ ] **Step 2: Verify build**

Run: `pnpm exec astro build`
Expected: build succeeds; `/areas` is emitted (check output for `areas/index.html`).

- [ ] **Step 3: Commit**

```bash
git add src/pages/areas/index.astro
git commit -m "feat: add areas directory page"
```

---

### Task 5: Area hub page

**Files:**
- Create: `src/pages/areas/[...id].astro`

**Interfaces:**
- Consumes: `contentForArea`, `resolveTopLevel`, `subAreasOf`, `areaHref`, `validateTwoLevel` (Task 2); `AreaIcon` (Task 3); `PostCard`, `UseCard`.

- [ ] **Step 1: Create the page**

```astro
---
import { getCollection, render } from 'astro:content'
import type { CollectionEntry } from 'astro:content'
import { Image } from 'astro:assets'
import Layout from '../../components/Layout.astro'
import Wrapper from '../../components/Wrapper.astro'
import PostCard from '~/components/post/PostCard.astro'
import UseCard from '~/components/uses/UseCard.astro'
import AreaIcon from '~/components/AreaIcon.astro'
import {
  contentForArea,
  resolveTopLevel,
  areaHref,
  validateTwoLevel,
} from '~/utils/areas'

export async function getStaticPaths() {
  const areas = await getCollection('areas')
  validateTwoLevel(areas)
  return areas.map((area) => ({ params: { id: area.id }, props: { area } }))
}

interface Props {
  area: CollectionEntry<'areas'>
}

const { area } = Astro.props
const includeDrafts = import.meta.env.DEV
const areas = await getCollection('areas')
const allPosts = await getCollection(
  'posts',
  ({ data }) => includeDrafts || !data.draft,
)
const allUses = await getCollection('uses')

const posts = contentForArea(area, areas, allPosts).sort(
  (a, b) =>
    new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime(),
)
const uses = contentForArea(area, areas, allUses).sort((a, b) =>
  a.data.title.localeCompare(b.data.title),
)

const parent = area.data.parent ? resolveTopLevel(area, areas) : undefined
const themeArea = parent ?? area
const themeColor = themeArea.data.themeColor ?? 'bg-neutral-900'
const { Content } = await render(area)
---

<Layout
  title={area.data.title}
  description={area.data.description ?? `Content in ${area.data.title}`}
  themeColor={themeColor}
  noIndex
>
  <header class={`py-16 text-center ${themeColor}`}>
    <Wrapper>
      {
        parent && (
          <a href={areaHref(parent)} class="mb-2 inline-block opacity-80">
            ← {parent.data.title}
          </a>
        )
      }
      {
        themeArea.data.cover && (
          <Image
            src={themeArea.data.cover}
            alt={area.data.title}
            width="1200"
            height="480"
            class="mx-auto mb-6 aspect-[5/2] w-full max-w-3xl rounded-2xl object-cover shadow-lg"
          />
        )
      }
      <div class="text-5xl"><AreaIcon icon={area.data.icon} /></div>
      <h1 class="mt-4 text-4xl font-extrabold">{area.data.title}</h1>
      {
        area.data.description && (
          <p class="mt-2 opacity-80">{area.data.description}</p>
        )
      }
    </Wrapper>
  </header>

  <Wrapper>
    {
      posts.length > 0 && (
        <section class="py-12">
          <h2 class="mb-6 text-2xl font-bold">Posts</h2>
          <div class="grid gap-4 sm:grid-cols-2 sm:gap-8">
            {posts.map((post) => (
              <PostCard post={post} />
            ))}
          </div>
        </section>
      )
    }
    {
      uses.length > 0 && (
        <section class="py-12">
          <h2 class="mb-6 text-2xl font-bold">Uses</h2>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {uses.map((use) => (
              <UseCard use={use} />
            ))}
          </div>
        </section>
      )
    }
    <article class="prose prose-invert mx-auto max-w-screen-md py-12">
      <Content />
    </article>
  </Wrapper>
</Layout>
```

- [ ] **Step 2: Verify build**

Run: `pnpm exec astro build`
Expected: build succeeds; hub pages emitted (e.g. `areas/ai/index.html`, `areas/claude-code/index.html`). `PostCard` still reads `category` here — that is fine until Task 6.

- [ ] **Step 3: Commit**

```bash
git add src/pages/areas/[...id].astro
git commit -m "feat: add area hub page with sub-area rollup and breadcrumb"
```

---

### Task 6: Migrate post consumers to areas

Posts have no `areas` yet, so every change here must degrade gracefully (no badges, neutral color, generic CTA). Color comes from `resolveThemeArea(post, areas)`.

**Files:**
- Modify: `src/components/post/PostMeta.astro`, `src/components/post/PostCard.astro`, `src/components/post/PostLayout.astro`
- Modify: `src/components/cta/PostCta.astro`, `src/components/cta/PostCtaInput.tsx`
- Modify: `src/components/NextGuidePost.astro`, `src/pages/rss.xml.ts`, `src/pages/posts/[...id].astro`

**Interfaces:**
- Consumes: `resolveThemeArea` (Task 2), `AreaBadges` (Task 3).

- [ ] **Step 1: Rewrite `PostMeta.astro`**

Replace the frontmatter block and the category `<a>` element. New frontmatter:

```astro
---
import { CollectionEntry, getEntry } from 'astro:content'
import AreaBadges from '../AreaBadges.astro'
import { DateIcon, DurationIcon, GuideIcon } from '../icons/index.astro'

interface Props {
  post: CollectionEntry<'posts'>
  align?: 'left' | 'center'
}

const {
  align = 'center',
  post: {
    data: { pubDate, duration, guide: postGuide, areas },
  },
} = Astro.props

let guide: CollectionEntry<'guides'> | undefined
if (postGuide) guide = await getEntry(postGuide.ref)
---
```

Then replace the category anchor:

```astro
  <a href={`/categories/${category.id}`} class={'flex items-center'}>
    <CategoryIcon id={postCategory.id} class="mr-1 h-5" />
    <span class={category.data.style.title}>{category.data.title}</span>
  </a>
```

with:

```astro
  <AreaBadges areas={areas} />
```

- [ ] **Step 2: Rewrite `PostCard.astro` frontmatter and color usage**

New frontmatter:

```astro
---
import { getCollection } from 'astro:content'
import type { CollectionEntry } from 'astro:content'
import { Image } from 'astro:assets'
import PostMeta from './PostMeta.astro'
import { resolveThemeArea } from '~/utils/areas'

interface Props {
  post: CollectionEntry<'posts'>
}
const { post } = Astro.props
const areas = await getCollection('areas')
const themeColor = resolveThemeArea(post, areas)?.data.themeColor ?? 'bg-neutral-900'
---
```

Change the outer container class from:

```astro
  class=`relative flex flex-col justify-end rounded-lg px-4 py-4 shadow-md md:px-6 ${category?.data?.style?.themeColor}`
```

to:

```astro
  class=`relative flex flex-col justify-end rounded-lg px-4 py-4 shadow-md md:px-6 ${themeColor}`
```

Change the hero `<Image>` inline style from:

```astro
        style={{ backgroundColor: category?.data.style.themeColor }}
```

to (remove the color-name-as-style bug; keep a solid black backdrop):

```astro
        style={{ backgroundColor: '#000' }}
```

- [ ] **Step 3: Rewrite `PostLayout.astro` frontmatter and color usage**

New frontmatter:

```astro
---
import type { CollectionEntry } from 'astro:content'
import { getCollection } from 'astro:content'
import Layout from '../Layout.astro'
import Wrapper from '../Wrapper.astro'
import PostMeta from './PostMeta.astro'
import { Image } from 'astro:assets'
import { resolveThemeArea } from '~/utils/areas'

interface Props {
  post: CollectionEntry<'posts'>
}

const { post } = Astro.props
const areas = await getCollection('areas')
const themeColor = resolveThemeArea(post, areas)?.data.themeColor ?? 'bg-neutral-900'
---
```

Replace both usages of `category?.data.style.themeColor` with `themeColor`:
- `<Layout ... themeColor={category?.data.style.themeColor}>` → `themeColor={themeColor}`
- `<div class={category?.data.style.themeColor}>` → `<div class={themeColor}>`

- [ ] **Step 4: Rewrite `PostCta.astro` to accept an optional topic**

Replace the frontmatter:

```astro
---
import PostCtaInput from './PostCtaInput.tsx'
import RssIcon from '../icons/RssIcon.astro'
interface Props {
  topic?: string
}

const { topic } = Astro.props
---
```

Replace the description paragraph:

```astro
    <p class="mt-2 leading-tight text-neutral-300 sm:mt-6 sm:text-lg">
      Stay in the loop and get the latest blog posts about {category} sent to your
      inbox.
    </p>
    <PostCtaInput category={category} client:visible />
```

with:

```astro
    <p class="mt-2 leading-tight text-neutral-300 sm:mt-6 sm:text-lg">
      Stay in the loop and get the latest blog posts{topic ? ` about ${topic}` : ''} sent to your
      inbox.
    </p>
    <PostCtaInput topic={topic} client:visible />
```

- [ ] **Step 5: Update `PostCtaInput.tsx` prop**

Change the component signature from:

```tsx
const PostCtaInput: FunctionalComponent<{ category: string }> = ({
  category,
}) => {
```

to:

```tsx
const PostCtaInput: FunctionalComponent<{ topic?: string }> = ({ topic }) => {
```

Change the fetch body `tags` from:

```tsx
        body: JSON.stringify({ email, referrer_url, tags: [category] }),
```

to:

```tsx
        body: JSON.stringify({ email, referrer_url, tags: topic ? [topic] : [] }),
```

- [ ] **Step 6: Update `posts/[...id].astro` to pass the primary area topic**

Change the imports line from:

```astro
import { getCollection, render } from 'astro:content'
```

to:

```astro
import { getCollection, getEntry, render } from 'astro:content'
```

Replace the section after `const { Content } = await render(post)`:

```astro
const { Content } = await render(post)
---

<PostLayout post={post}>
  <Content />
  <Cta category={post.data.category.id} />
  <NextGuidePost currentPostGuide={post.data.guide} slot="after-post" />
</PostLayout>
```

with:

```astro
const { Content } = await render(post)
const primaryRef = post.data.areas?.[0]
const primaryArea = primaryRef ? await getEntry(primaryRef) : undefined
---

<PostLayout post={post}>
  <Content />
  <Cta topic={primaryArea?.data.title} />
  <NextGuidePost currentPostGuide={post.data.guide} slot="after-post" />
</PostLayout>
```

- [ ] **Step 7: Simplify `NextGuidePost.astro`**

Remove the unused `CategoryIcon` import and the entire `category` lookup block:

```astro
import CategoryIcon from './CategoryIcon.astro'
```
```astro
let category: CollectionEntry<'categories'> | undefined
if (nextPost?.data.category) {
  category = await getEntry('categories', nextPost.data.category.id)
}
```

Change the render guard from:

```astro
  nextPost && guide && category && (
```

to:

```astro
  nextPost && guide && (
```

- [ ] **Step 8: Update `rss.xml.ts` categories mapping**

Change:

```ts
        categories: [post.data.category.id],
```

to:

```ts
        categories: post.data.areas?.map((a) => a.id) ?? [],
```

- [ ] **Step 9: Verify build**

Run: `pnpm exec astro build`
Expected: build succeeds. Posts render with neutral color and no badges (no areas tagged yet); no references to `category` remain in these files.

- [ ] **Step 10: Commit**

```bash
git add src/components/post src/components/cta src/components/NextGuidePost.astro src/pages/rss.xml.ts src/pages/posts
git commit -m "refactor: drive post styling and metadata from areas instead of category"
```

---

### Task 7: Migrate uses to areas

The 16 use files currently have `area: audio | hardware | keyboards`. Add an `areas` array (keep `area` for now; it is removed in Task 9). Then switch the uses pages to `areas`.

**Files:**
- Modify: all 16 files in `content/uses/*.md`
- Modify: `src/pages/uses.astro`, `src/pages/uses/[...id].astro`

**Interfaces:**
- Consumes: `topLevelAreas`, `contentForArea`, `areaIdsFor` (Task 2).

- [ ] **Step 1: Add `areas` to every use file**

For each file in `content/uses/`, add an `areas` array mirroring its existing `area`. Example — `airpods-max.md` frontmatter becomes:

```md
---
title: AirPods Max
description: Apple's over-ear headphones with active noise cancellation and spatial audio.
area: audio
areas:
  - audio
image: ../attachments/uses/airpods-max.jpeg
---
```

Apply the same pattern to all 16 files: `areas` gets a single element equal to the current `area` value.

- [ ] **Step 2: Rewrite `uses.astro` to group by top-level area**

Replace the frontmatter:

```astro
---
import { getCollection } from 'astro:content'
import Layout from '../components/Layout.astro'
import PageTitle from '../components/PageTitle.astro'
import Wrapper from '../components/Wrapper.astro'
import UseCard from '~/components/uses/UseCard.astro'
import { topLevelAreas, contentForArea } from '~/utils/areas'

const areas = await getCollection('areas')
const uses = await getCollection('uses')
const groups = topLevelAreas(areas)
  .map((area) => ({ area, uses: contentForArea(area, areas, uses) }))
  .filter((g) => g.uses.length > 0)
---
```

Replace the `areas.map(...)` body with:

```astro
      {
        groups.map(({ area, uses }) => (
          <section>
            <h2 class="mb-4 text-4xl font-bold">{area.data.title}</h2>
            <div class="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 sm:gap-8 md:grid-cols-3 lg:grid-cols-4">
              {uses
                .sort((a, b) => a.data.title.localeCompare(b.data.title))
                .map((use) => (
                  <UseCard use={use} />
                ))}
            </div>
          </section>
        ))
      }
```

- [ ] **Step 3: Rewrite related-uses logic in `uses/[...id].astro`**

Add the import:

```astro
import { areaIdsFor } from '~/utils/areas'
```

Replace the `relatedUses` query:

```astro
const relatedUses = await getCollection(
  'uses',
  (relatedUse) =>
    relatedUse.data.area.id === use.data.area.id &&
    relatedUse.data.title !== use.data.title,
)
```

with:

```astro
const useAreaIds = new Set(areaIdsFor(use))
const relatedUses = (await getCollection('uses')).filter(
  (relatedUse) =>
    relatedUse.id !== use.id &&
    areaIdsFor(relatedUse).some((id) => useAreaIds.has(id)),
)
```

Change the related-uses heading from:

```astro
          <h3 class="mb-4 text-4xl font-bold">Related {use.data.area.id}</h3>
```

to:

```astro
          <h3 class="mb-4 text-4xl font-bold">Related uses</h3>
```

- [ ] **Step 4: Verify build**

Run: `pnpm exec astro build`
Expected: build succeeds; `/uses` shows Audio / Hardware / Keyboards sections; a use detail page shows related uses.

- [ ] **Step 5: Commit**

```bash
git add content/uses src/pages/uses.astro src/pages/uses/[...id].astro
git commit -m "refactor: group uses by area and relate by shared areas"
```

---

### Task 8: Homepage section + footer link

**Files:**
- Create: `src/components/sections/Areas.astro`
- Modify: `src/pages/index.astro`, `src/components/LayoutFooter.astro`

**Interfaces:**
- Consumes: `topLevelAreas`, `areaHref` (Task 2); `AreaIcon` (Task 3); existing `Section` component.

- [ ] **Step 1: Create `sections/Areas.astro`**

```astro
---
import { getCollection } from 'astro:content'
import Section from './Section.astro'
import AreaIcon from '~/components/AreaIcon.astro'
import { topLevelAreas, areaHref } from '~/utils/areas'

const areas = await getCollection('areas')
const tops = topLevelAreas(areas)
---

<Section title="Explore by Area" viewAllHref="/areas" viewAllLabel="Browse all areas →">
  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
    {
      tops.map((area) => (
        <a
          href={areaHref(area)}
          class={`flex flex-col items-center gap-2 rounded-2xl p-6 text-center ${area.data.themeColor ?? 'bg-neutral-900'}`}
        >
          <AreaIcon icon={area.data.icon} class="text-4xl" />
          <span class="font-bold">{area.data.title}</span>
        </a>
      ))
    }
  </div>
</Section>
```

- [ ] **Step 2: Add the section to the homepage**

In `src/pages/index.astro`, add the import:

```astro
import Areas from '~/components/sections/Areas.astro'
```

Add `<Areas />` into the layout after `<RecentPosts />`:

```astro
  <StaticImageGrid />
  <RecentPosts />
  <Areas />
  <Projects />
  <Wallpapers />
```

- [ ] **Step 3: Update the footer link**

In `src/components/LayoutFooter.astro`, change:

```astro
          <li><Link href="/categories">Categories</Link></li>
```

to:

```astro
          <li><Link href="/areas">Areas</Link></li>
```

- [ ] **Step 4: Verify build**

Run: `pnpm exec astro build`
Expected: build succeeds; homepage includes the "Explore by Area" section; footer links to `/areas`.

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/Areas.astro src/pages/index.astro src/components/LayoutFooter.astro
git commit -m "feat: add explore-by-area homepage section and areas footer link"
```

---

### Task 9: Remove the categories feature + redirects

Nothing references `categories` in code anymore (verify in Step 1). Now delete the collection, files, and pages, and redirect old URLs.

**Files:**
- Delete: `src/pages/categories/index.astro`, `src/pages/categories/[...id].astro`
- Delete: `src/components/CategoryIcon.astro`, `src/components/icons/CategoryIcon.astro`
- Delete: `src/utils/categories.ts`, `src/utils/categories.test.ts`
- Delete: `content/categories/` (6 files)
- Modify: `src/content.config.ts`
- Modify: `netlify.toml`

- [ ] **Step 1: Confirm no remaining code references**

Run: `grep -rn "categor" src --include=*.astro --include=*.ts --include=*.tsx | grep -vi "rss\|areas"`
Expected: no matches referencing the `categories` collection, `category` field, or `CategoryIcon`. (`categories:` in `rss.xml.ts` is the RSS element name and is expected — the grep above excludes it.)

- [ ] **Step 2: Delete category files**

```bash
git rm src/pages/categories/index.astro src/pages/categories/[...id].astro
git rm src/components/CategoryIcon.astro src/components/icons/CategoryIcon.astro
git rm src/utils/categories.ts src/utils/categories.test.ts
git rm -r content/categories
```

- [ ] **Step 3: Remove `categories` from `content.config.ts`**

Delete the entire `categoriesCollection` definition, the `category: reference('categories'),` line in `postsCollection`, the `area: reference('areas'),` line in `usesCollection`, and the `categories: categoriesCollection,` entry in the `collections` export.

Verify the `collections` export reads:

```ts
export const collections = {
  areas: areasCollection,
  posts: postsCollection,
  projects: projectsCollection,
  guides: guidesCollection,
  uses: usesCollection,
  wallpapers: wallpapersCollection,
}
```

- [ ] **Step 4: Add redirects to `netlify.toml`**

Append:

```toml
[[redirects]]
  from = "/categories"
  to = "/areas"
  status = 301

[[redirects]]
  from = "/categories/*"
  to = "/areas"
  status = 301
```

- [ ] **Step 5: Verify build and tests**

Run: `pnpm exec astro sync && pnpm exec astro check && pnpm exec vitest run && pnpm exec astro build`
Expected: type-check clean, all tests pass, build succeeds with no `categories` route emitted.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: remove categories feature in favor of areas taxonomy"
```

---

## Follow-ups (out of scope for this plan)

- **Assisted tagging pass:** interactively add `areas: [...]` (primary first) to every post and use, then remove the now-stale `category:`/`area:` frontmatter keys.
- **Flip to required:** once all content is tagged, change `areas: z.array(reference('areas')).optional()` to `.min(1)` on posts and uses to enforce coverage at build time.
- **Restructure seed areas:** replace/expand the seed set (`audio`, `hardware`, `keyboards`, `ai`, `claude-code`) with the full authored taxonomy.

## Self-Review

**Spec coverage:**
- Areas collection (title/icon/parent/themeColor/cover/description) → Task 1, Task 3. ✅
- Two-level guard → Task 2 (`validateTwoLevel`), enforced in Tasks 4 & 5. ✅
- Many areas per item (array) → Task 1. ✅
- Site-authored areas → Tasks 3 (seed), follow-up (full set). ✅
- Top-level styled / sub-areas plain → Task 4 (directory), Task 5 (hub). ✅
- Areas directory → Task 4. ✅
- Area hub pages with sub-area rollup + breadcrumb → Task 5. ✅
- Area badges on cards → Task 3 + Task 6 (PostMeta). ✅
- Homepage explore-by-area → Task 8. ✅
- Post color from areas[0] → top-level ancestor → Task 2 (`resolveThemeArea`) + Task 6. ✅
- RSS categories from areas → Task 6. ✅
- Remove categories + redirects → Task 9. ✅
- Migration/tagging → Task 7 (uses) + Follow-ups (posts). ✅

**Placeholder scan:** No TBD/TODO/"handle edge cases"; every code step shows full content. ✅

**Type consistency:** `resolveThemeArea(item, areas)`, `contentForArea(area, areas, items)`, `areaHref(area)`, `areaIdsFor(item)`, `topLevelAreas(areas)`, `subAreasOf(parent, areas)`, `validateTwoLevel(areas)` — names and signatures identical across Tasks 2, 4, 5, 6, 7, 8. `<AreaBadges areas={...} />` and `<AreaIcon icon={...} />` props consistent across Tasks 3 & 6. `<Cta topic={...} />` / `PostCtaInput topic={...}` consistent across Task 6. ✅
