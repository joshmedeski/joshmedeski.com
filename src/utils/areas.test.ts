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
      parent: opts.parent
        ? { collection: 'areas', id: opts.parent }
        : undefined,
      themeColor: opts.themeColor,
    },
  }) as unknown as CollectionEntry<'areas'>

const item = (...areaIds: string[]) =>
  ({
    data: { areas: areaIds.map((id) => ({ collection: 'areas', id })) },
  }) as unknown as { data: { areas?: { id: string }[] } }

const ai = area('ai', { title: 'AI', themeColor: 'bg-indigo-900' })
const claude = area('claude-code', { title: 'Claude Code', parent: 'ai' })
const hardware = area('hardware', {
  title: 'Hardware',
  themeColor: 'bg-slate-800',
})
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
