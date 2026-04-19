import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative, sep } from 'node:path'
import matter from 'gray-matter'
import GithubSlugger from 'github-slugger'

export interface PageTarget {
  collection: string
  id: string
  title: string
  url: string
}

export interface AttachmentTarget {
  path: string
  url: string
}

const slugger = new GithubSlugger()
const slugify = (input: string) => {
  slugger.reset()
  return slugger.slug(input)
}

const COLLECTIONS_WITH_ROUTES: Record<string, string> = {
  posts: '/posts',
  guides: '/guides',
  categories: '/categories',
  uses: '/uses',
  projects: '/projects',
  wallpapers: '/wallpapers',
}

const COLLISION_PRIORITY = [
  'posts',
  'guides',
  'projects',
  'uses',
  'categories',
  'wallpapers',
  'areas',
]

const NOTE_EXTENSIONS = new Set(['.md', '.mdx'])
const IMAGE_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.avif',
])

const VAULT_ROOT = 'content'
const ATTACHMENT_ROOT = `${VAULT_ROOT}/attachments`

let pageIndex: Map<string, PageTarget> | null = null
let attachmentIndex: Map<string, AttachmentTarget> | null = null

function walk(root: string): string[] {
  const out: string[] = []
  let entries: string[]
  try {
    entries = readdirSync(root)
  } catch {
    return out
  }
  for (const entry of entries) {
    const full = join(root, entry)
    let s
    try {
      s = statSync(full)
    } catch {
      continue
    }
    if (s.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

function registerPage(
  index: Map<string, PageTarget>,
  key: string,
  target: PageTarget,
) {
  if (!key) return
  const existing = index.get(key)
  if (!existing) {
    index.set(key, target)
    return
  }
  if (existing.collection === target.collection && existing.id === target.id)
    return
  const existingRank = COLLISION_PRIORITY.indexOf(existing.collection)
  const newRank = COLLISION_PRIORITY.indexOf(target.collection)
  if (newRank !== -1 && (existingRank === -1 || newRank < existingRank)) {
    index.set(key, target)
  }
}

function buildPageIndex(cwd: string): Map<string, PageTarget> {
  const index = new Map<string, PageTarget>()
  const vaultRoot = join(cwd, VAULT_ROOT)
  const files = walk(vaultRoot).filter((f) => NOTE_EXTENSIONS.has(extname(f)))

  for (const file of files) {
    const rel = relative(vaultRoot, file)
    if (rel.startsWith('attachments' + sep)) continue
    const parts = rel.split(sep)
    if (parts.length < 2) continue
    const collection = parts[0]
    const route = COLLECTIONS_WITH_ROUTES[collection]
    if (!route) continue
    const id = parts
      .slice(1)
      .join('/')
      .replace(/\.(md|mdx)$/, '')

    let fm: Record<string, unknown> = {}
    try {
      fm = matter(readFileSync(file, 'utf8')).data as Record<string, unknown>
    } catch {
      /* ignore parse errors */
    }

    const title = typeof fm.title === 'string' ? fm.title : id
    const aliases = Array.isArray(fm.aliases)
      ? (fm.aliases.filter((a) => typeof a === 'string') as string[])
      : []
    const url = `${route}/${id}`
    const target: PageTarget = { collection, id, title, url }

    registerPage(index, slugify(id), target)
    registerPage(index, slugify(title), target)
    for (const alias of aliases) registerPage(index, slugify(alias), target)
  }
  return index
}

function buildAttachmentIndex(cwd: string): Map<string, AttachmentTarget> {
  const index = new Map<string, AttachmentTarget>()
  const root = join(cwd, ATTACHMENT_ROOT)
  const files = walk(root).filter((f) =>
    IMAGE_EXTENSIONS.has(extname(f).toLowerCase()),
  )
  for (const file of files) {
    const rel = relative(join(cwd, VAULT_ROOT), file)
    const url = '/' + rel.split(sep).join('/')
    const basename = rel.split(sep).pop() ?? ''
    const existing = index.get(basename)
    if (!existing) index.set(basename, { path: file, url })
  }
  return index
}

export function getPageIndex(): Map<string, PageTarget> {
  if (!pageIndex) pageIndex = buildPageIndex(process.cwd())
  return pageIndex
}

export function getAttachmentIndex(): Map<string, AttachmentTarget> {
  if (!attachmentIndex) attachmentIndex = buildAttachmentIndex(process.cwd())
  return attachmentIndex
}

export function resolveWikiPage(name: string): PageTarget | undefined {
  return getPageIndex().get(slugify(name))
}

export function resolveAttachment(name: string): AttachmentTarget | undefined {
  return getAttachmentIndex().get(name)
}

export function slugifyWiki(name: string): string {
  return slugify(name)
}

export function resetWikiLinkIndex(): void {
  pageIndex = null
  attachmentIndex = null
}
