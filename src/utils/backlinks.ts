import { getCollection } from 'astro:content'
import type { CollectionEntry } from 'astro:content'
import { resolveWikiPage } from './wikiLinkIndex'

export interface BacklinkEntry {
  id: string
  title: string
  collection: string
  url: string
}

type BacklinkKey = `${string}:${string}`

const BACKLINK_COLLECTIONS = ['posts', 'guides'] as const
type BacklinkCollection = (typeof BACKLINK_COLLECTIONS)[number]

const WIKI_LINK_RE = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]+)?\]\]/g

let cache: Map<BacklinkKey, BacklinkEntry[]> | null = null

async function loadAllLinkingEntries(): Promise<
  Array<CollectionEntry<BacklinkCollection>>
> {
  const all: Array<CollectionEntry<BacklinkCollection>> = []
  for (const name of BACKLINK_COLLECTIONS) {
    const entries = await getCollection(name as BacklinkCollection)
    all.push(...entries)
  }
  return all
}

function extractWikiTargets(body: string): string[] {
  const targets: string[] = []
  let match: RegExpExecArray | null
  WIKI_LINK_RE.lastIndex = 0
  while ((match = WIKI_LINK_RE.exec(body)) !== null) {
    const target = match[1].trim()
    if (target && !target.startsWith('!')) targets.push(target)
  }
  return targets
}

async function buildCache(): Promise<Map<BacklinkKey, BacklinkEntry[]>> {
  const map = new Map<BacklinkKey, BacklinkEntry[]>()
  const entries = await loadAllLinkingEntries()

  for (const entry of entries) {
    const body = (entry as unknown as { body?: string }).body ?? ''
    if (!body) continue
    const targets = extractWikiTargets(body)
    if (targets.length === 0) continue

    const sourceTitle = (entry.data as { title?: string }).title ?? entry.id
    const sourceUrl = `/${entry.collection}/${entry.id}`
    const sourceBacklink: BacklinkEntry = {
      id: entry.id,
      title: sourceTitle,
      collection: entry.collection,
      url: sourceUrl,
    }

    const seenKeys = new Set<BacklinkKey>()
    for (const target of targets) {
      const resolved = resolveWikiPage(target)
      if (!resolved) continue
      const key: BacklinkKey = `${resolved.collection}:${resolved.id}`
      if (seenKeys.has(key)) continue
      seenKeys.add(key)
      const list = map.get(key) ?? []
      if (
        !list.some(
          (b) => b.collection === entry.collection && b.id === entry.id,
        )
      ) {
        list.push(sourceBacklink)
        map.set(key, list)
      }
    }
  }
  return map
}

export async function getBacklinks(
  collection: string,
  id: string,
): Promise<BacklinkEntry[]> {
  if (!cache) cache = await buildCache()
  const list = cache.get(`${collection}:${id}`) ?? []
  return [...list].sort((a, b) => a.title.localeCompare(b.title))
}
