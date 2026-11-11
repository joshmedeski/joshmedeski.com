import { describe, it, expect } from 'vitest'
import type { CollectionEntry } from 'astro:content'
import {
  isTopLevel,
  topLevelAreas,
  subAreasOf,
  resolveTopLevel,
  resolveThemeAreas,
  areaTexture,
  contentForArea,
  groupByDirectArea,
  areaScopeIds,
  areaHref,
  validateTwoLevel,
} from './areas'

const area = (
  id: string,
  opts: {
    title?: string
    parent?: string
    themeColor?: string
    texture?: string
  } = {},
): CollectionEntry<'areas'> =>
  ({
    id,
    data: {
      title: opts.title ?? id,
      parent: opts.parent
        ? { collection: 'areas', id: opts.parent }
        : undefined,
      themeColor: opts.themeColor,
      texture: opts.texture,
    },
  }) as unknown as CollectionEntry<'areas'>

const item = (...areaIds: string[]) =>
  ({
    data: { areas: areaIds.map((id) => ({ collection: 'areas', id })) },
  }) as unknown as { data: { areas?: { id: string }[] } }

const ai = area('ai', {
  title: 'AI',
  themeColor: 'bg-indigo-900',
  texture: 'film',
})
const claude = area('claude-code', { title: 'Claude Code', parent: 'ai' })
const hardware = area('hardware', {
  title: 'Hardware',
  themeColor: 'bg-slate-800',
})
const audio = area('audio', {
  parent: 'hardware',
  themeColor: 'bg-area-audio',
  texture: 'grit',
})
const areas = [claude, ai, hardware]
const withAudio = [...areas, audio]

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

  it('resolveThemeAreas resolves every area to a unique top-level ancestor', () => {
    const ids = (...a: string[]) =>
      resolveThemeAreas(item(...a), areas).map((x) => x.id)
    expect(ids('claude-code', 'ai')).toEqual(['ai'])
    expect(ids()).toEqual([])
    expect(ids('hardware', 'claude-code')).toEqual(['hardware', 'ai'])
    expect(
      resolveThemeAreas(item('audio', 'hardware'), withAudio).map((x) => x.id),
    ).toEqual(['audio', 'hardware'])
  })

  it('areaTexture prefers the area and falls back to its parent', () => {
    expect(areaTexture(audio, withAudio)).toBe('grit')
    expect(areaTexture(claude, areas)).toBe('film')
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

  it('contentForArea matches an item tagged with multiple areas', () => {
    const items = [item('claude-code', 'hardware')]
    expect(contentForArea(ai, areas, items)).toHaveLength(1)
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

describe('groupByDirectArea', () => {
  const audio = area('audio', { title: 'Audio', parent: 'hardware' })
  const keyboards = area('keyboards', {
    title: 'Keyboards',
    parent: 'hardware',
  })
  const all = [ai, claude, hardware, audio, keyboards]
  const laptop = item('hardware')
  const moonlander = item('keyboards')
  const headphones = item('audio')
  const agent = item('claude-code')

  it('groups items by their own area, not their parent', () => {
    const groups = groupByDirectArea(all, [laptop, moonlander, headphones])
    expect(groups.map((g) => g.area.id)).toEqual([
      'hardware',
      'audio',
      'keyboards',
    ])
    expect(groups[0].items).toEqual([laptop])
  })

  it('puts ordered areas first and keeps the rest in tree order', () => {
    const groups = groupByDirectArea(
      all,
      [agent, laptop, moonlander, headphones],
      ['hardware', 'keyboards', 'audio'],
    )
    expect(groups.map((g) => g.area.id)).toEqual([
      'hardware',
      'keyboards',
      'audio',
      'claude-code',
    ])
  })
})
