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
