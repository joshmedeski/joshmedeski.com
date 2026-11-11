import { getCollection, type CollectionEntry } from 'astro:content'
import { subAreasOf, topLevelAreas } from './areas'

export const CONTENT_TYPES = ['posts', 'guides', 'projects', 'uses'] as const
export type ContentType = (typeof CONTENT_TYPES)[number]

export const getPublished = <T extends ContentType>(type: T) =>
  getCollection(
    type,
    ({ data }) => !('draft' in data && data.draft),
  ) as Promise<CollectionEntry<T>[]>

export const byNewest = (
  a: { data: { pubDate: Date } },
  b: { data: { pubDate: Date } },
) => b.data.pubDate.getTime() - a.data.pubDate.getTime()

export const byTitle = (
  a: { data: { title: string } },
  b: { data: { title: string } },
) => a.data.title.localeCompare(b.data.title)

export const isoDate = (date: Date) => date.toISOString().slice(0, 10)

export const markdownLink = (
  site: URL | undefined,
  path: string,
  title: string,
  note?: string,
) => `- [${title}](${new URL(path, site)})${note ? `: ${note}` : ''}`

export const entryLink = (
  site: URL | undefined,
  type: ContentType,
  { id, data }: CollectionEntry<ContentType>,
) =>
  markdownLink(
    site,
    `/${type}/${id}.md`,
    data.title,
    'pubDate' in data
      ? `${isoDate(data.pubDate)} · ${data.description}`
      : data.description,
  )

export const appearanceLink = (
  site: URL | undefined,
  { data }: CollectionEntry<'appearances'>,
) =>
  markdownLink(
    site,
    data.url,
    data.title,
    `${data.publisher}, ${isoDate(data.pubDate)} · ${data.description}`,
  )

export const areaLinks = (
  site: URL | undefined,
  areas: CollectionEntry<'areas'>[],
) => {
  const link = (area: CollectionEntry<'areas'>, indent = '') =>
    indent +
    markdownLink(
      site,
      `/areas/${area.id}.md`,
      area.data.title,
      area.data.description,
    )
  return topLevelAreas(areas).flatMap((area) => [
    link(area),
    ...subAreasOf(area, areas).map((sub) => link(sub, '  ')),
  ])
}

export const markdownSection = (heading: string, lines: string[]) =>
  lines.length ? `## ${heading}\n\n${lines.join('\n')}` : ''

export const markdownResponse = (blocks: string[]) =>
  new Response(`${blocks.filter(Boolean).join('\n\n')}\n`, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
