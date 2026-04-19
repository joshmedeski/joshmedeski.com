#!/usr/bin/env tsx
/**
 * Migrate src/data + src/assets → content/ (Obsidian-compatible vault).
 *
 * Usage:
 *   pnpm tsx scripts/migrate-to-vault.ts --dry-run
 *   pnpm tsx scripts/migrate-to-vault.ts
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, extname, join, relative, sep } from 'node:path'
import matter from 'gray-matter'

const REPO_ROOT = process.cwd()
const DATA_DIR = join(REPO_ROOT, 'src/data')
const ASSETS_DIR = join(REPO_ROOT, 'src/assets')
const CONTENT_DIR = join(REPO_ROOT, 'content')
const ATTACHMENTS_DIR = join(CONTENT_DIR, 'attachments')
const DRY_RUN = process.argv.includes('--dry-run')

const NOTE_COLLECTIONS = [
  'posts',
  'guides',
  'categories',
  'areas',
  'uses',
  'projects',
  'wallpapers',
] as const

const KEEP_MDX = new Set<string>(['guides/dev-workflow-intro'])

interface FileReport {
  from: string
  to: string
  keptMdx: boolean
  assetsMoved: string[]
  ghRepoDirectiveCount: number
  imageTagsConverted: number
  warnings: string[]
}

const reports: FileReport[] = []
const globalWarnings: string[] = []

function log(msg: string) {
  console.log(`${DRY_RUN ? '[dry] ' : ''}${msg}`)
}

function warn(msg: string) {
  console.warn(`WARN: ${msg}`)
  globalWarnings.push(msg)
}

function ensureDir(path: string) {
  if (DRY_RUN) return
  mkdirSync(path, { recursive: true })
}

function copyFile(from: string, to: string) {
  if (!existsSync(from)) {
    warn(`missing source file: ${from}`)
    return false
  }
  if (DRY_RUN) return true
  ensureDir(dirname(to))
  cpSync(from, to, { force: true })
  return true
}

function writeOut(path: string, content: string) {
  if (DRY_RUN) return
  ensureDir(dirname(path))
  writeFileSync(path, content, 'utf8')
}

function kebabCase(name: string): string {
  const ext = extname(name)
  const base = basename(name, ext)
  const slugged = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slugged}${ext.toLowerCase()}`
}

/**
 * Splits body into fenced-code and non-fenced sections so we can skip
 * transformations inside code blocks.
 */
function transformOutsideCode(
  body: string,
  transform: (chunk: string) => string,
): string {
  const lines = body.split('\n')
  const out: string[] = []
  let inFence = false
  let fenceMarker = ''
  let buffer: string[] = []
  const flush = () => {
    if (buffer.length > 0) {
      out.push(transform(buffer.join('\n')))
      buffer = []
    }
  }
  for (const line of lines) {
    const fenceMatch = line.match(/^(\s*)(```+|~~~+)/)
    if (fenceMatch) {
      const marker = fenceMatch[2]
      if (!inFence) {
        flush()
        inFence = true
        fenceMarker = marker
        out.push(line)
        continue
      }
      if (
        marker.startsWith(fenceMarker[0]) &&
        marker.length >= fenceMarker.length
      ) {
        inFence = false
        fenceMarker = ''
        out.push(line)
        continue
      }
    }
    if (inFence) out.push(line)
    else buffer.push(line)
  }
  flush()
  return out.join('\n')
}

/**
 * Rewrites a `../../assets/<collection>/<...rest>` reference into a
 * `/attachments/<collection>/<...rest>` public URL, with special handling
 * for the posts collection (flat-file images get homed into a slug folder).
 *
 * Returns the new URL plus the physical move plan [from, to].
 */
function assetMovePlan(
  ref: string,
  noteCollection: string,
  noteSlug: string,
): { newUrl: string; moves: Array<[string, string]> } | null {
  const cleaned = ref.replace(/^(?:\.{1,2}\/)+/, '')
  // Expect "assets/..." or similar after relative-path cleanup.
  let rest: string
  if (cleaned.startsWith('assets/')) rest = cleaned.slice('assets/'.length)
  else if (cleaned.startsWith('src/assets/'))
    rest = cleaned.slice('src/assets/'.length)
  else return null

  const parts = rest.split('/')
  const collection = parts[0]
  const subpath = parts.slice(1).join('/')

  let fromAbs: string
  let toRel: string

  if (collection === 'posts' && parts.length === 2) {
    const file = parts[1]
    fromAbs = join(ASSETS_DIR, 'posts', file)
    toRel = `posts/${noteSlug}/${file}`
  } else if (
    (collection === 'wallpapers' || collection === 'uses') &&
    parts.length === 2
  ) {
    const original = parts[1]
    const renamed = collection === 'wallpapers' ? kebabCase(original) : original
    fromAbs = join(ASSETS_DIR, collection, original)
    toRel = `${collection}/${renamed}`
  } else if (collection === 'publishers' && parts.length === 2) {
    fromAbs = join(ASSETS_DIR, 'publishers', parts[1])
    toRel = `site/publishers/${parts[1]}`
  } else if (NOTE_COLLECTIONS.includes(collection as any)) {
    fromAbs = join(ASSETS_DIR, rest)
    toRel = rest
  } else if (parts.length === 1) {
    // root-level asset (josh-medeski.jpg, memoji, etc.)
    fromAbs = join(ASSETS_DIR, rest)
    toRel = `site/${rest}`
  } else {
    fromAbs = join(ASSETS_DIR, rest)
    toRel = rest
  }

  const toAbs = join(ATTACHMENTS_DIR, toRel)
  return {
    newUrl: `/attachments/${toRel}`,
    moves: [[fromAbs, toAbs]],
  }
}

function rewriteAssetReferencesInFrontmatter(
  data: Record<string, unknown>,
  noteCollection: string,
  noteSlug: string,
  plannedMoves: Array<[string, string]>,
): Record<string, unknown> {
  const rewrite = (value: string): string => {
    if (!/^(?:\.{1,2}\/)+assets\//.test(value)) return value
    const plan = assetMovePlan(value, noteCollection, noteSlug)
    if (!plan) return value
    plannedMoves.push(...plan.moves)
    // Frontmatter image() resolves relative to note; the new note sits at
    // content/<collection>/<slug>.md, and attachments live at
    // content/attachments/<...>. Relative path: ../attachments/<...>
    return `../attachments/${plan.newUrl.replace(/^\/attachments\//, '')}`
  }

  const out: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === 'string') out[key] = rewrite(val)
    else out[key] = val
  }
  return out
}

function extractAssetImports(body: string): {
  imports: Map<string, string>
  bodyWithoutImports: string
} {
  const imports = new Map<string, string>()
  const lines = body.split('\n')
  const kept: string[] = []
  let inFence = false
  let fenceMarker = ''
  const importRe =
    /^import\s+([A-Za-z_$][A-Za-z0-9_$]*)\s+from\s+['"](\.{1,2}\/[^'"]*assets\/[^'"]+)['"]\s*;?$/
  for (const line of lines) {
    const fenceMatch = line.match(/^(\s*)(```+|~~~+)/)
    if (fenceMatch) {
      const marker = fenceMatch[2]
      if (!inFence) {
        inFence = true
        fenceMarker = marker
      } else if (
        marker.startsWith(fenceMarker[0]) &&
        marker.length >= fenceMarker.length
      ) {
        inFence = false
        fenceMarker = ''
      }
      kept.push(line)
      continue
    }
    if (!inFence) {
      const m = line.match(importRe)
      if (m) {
        imports.set(m[1], m[2])
        continue
      }
    }
    kept.push(line)
  }
  return { imports, bodyWithoutImports: kept.join('\n') }
}

function rewriteBody(
  body: string,
  noteCollection: string,
  noteSlug: string,
  plannedMoves: Array<[string, string]>,
  report: FileReport,
): string {
  const { imports, bodyWithoutImports } = extractAssetImports(body)

  const replaceImageJsxInChunk = (chunk: string): string => {
    // <Image src={varName} alt="..." [other attrs]/> (may span lines)
    return chunk.replace(
      /<Image\b([\s\S]*?)\/?>\s*(?:<\/Image>)?/g,
      (full, attrs: string) => {
        const srcMatch = attrs.match(/\bsrc=\{([A-Za-z_$][A-Za-z0-9_$]*)\}/)
        if (!srcMatch) return full
        const varName = srcMatch[1]
        const importPath = imports.get(varName)
        if (!importPath) return full
        const altMatch = attrs.match(/\balt=["']([^"']*)["']/)
        const alt = altMatch ? altMatch[1] : ''
        const widthMatch = attrs.match(/\bwidth=\{?["']?(\d+)/)
        const heightMatch = attrs.match(/\bheight=\{?["']?(\d+)/)
        const classMatch = attrs.match(/\bclass=["']([^"']+)["']/)
        const plan = assetMovePlan(importPath, noteCollection, noteSlug)
        if (!plan) return full
        plannedMoves.push(...plan.moves)
        report.imageTagsConverted++
        const hasAttrs = widthMatch || heightMatch || classMatch
        if (!hasAttrs) return `![${alt}](${plan.newUrl})`
        const extra = [
          `src="${plan.newUrl}"`,
          `alt="${alt}"`,
          widthMatch ? `width="${widthMatch[1]}"` : '',
          heightMatch ? `height="${heightMatch[1]}"` : '',
          classMatch ? `class="${classMatch[1]}"` : '',
        ]
          .filter(Boolean)
          .join(' ')
        return `<img ${extra} />`
      },
    )
  }

  const replaceMarkdownImagesInChunk = (chunk: string): string => {
    return chunk.replace(
      /!\[([^\]]*)\]\((\.\.\/\.\.\/assets\/[^)\s]+)\)/g,
      (_full, alt: string, path: string) => {
        const plan = assetMovePlan(path, noteCollection, noteSlug)
        if (!plan) return _full
        plannedMoves.push(...plan.moves)
        return `![${alt}](${plan.newUrl})`
      },
    )
  }

  const replaceGhRepoInChunk = (chunk: string): string => {
    return chunk.replace(
      /<GhRepo\s+repo=["']([^"']+)["']\s*\/?>\s*(?:<\/GhRepo>)?/g,
      (_full, repo: string) => {
        report.ghRepoDirectiveCount++
        return `::gh-repo{repo="${repo}"}`
      },
    )
  }

  return transformOutsideCode(bodyWithoutImports, (chunk) => {
    let out = chunk
    out = replaceGhRepoInChunk(out)
    out = replaceImageJsxInChunk(out)
    out = replaceMarkdownImagesInChunk(out)
    return out
  })
}

function hasRemainingJsxImports(body: string): boolean {
  const lines = body.split('\n')
  let inFence = false
  let fenceMarker = ''
  for (const line of lines) {
    const fenceMatch = line.match(/^(\s*)(```+|~~~+)/)
    if (fenceMatch) {
      const marker = fenceMatch[2]
      if (!inFence) {
        inFence = true
        fenceMarker = marker
      } else if (
        marker.startsWith(fenceMarker[0]) &&
        marker.length >= fenceMarker.length
      ) {
        inFence = false
        fenceMarker = ''
      }
      continue
    }
    if (inFence) continue
    if (/^import\s+[^'"]+from\s+['"][^'"]+['"]\s*;?$/.test(line)) return true
  }
  return false
}

function walk(root: string): string[] {
  const out: string[] = []
  if (!existsSync(root)) return out
  for (const entry of readdirSync(root)) {
    const full = join(root, entry)
    const s = statSync(full)
    if (s.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

function migrateNote(filePath: string) {
  const rel = relative(DATA_DIR, filePath)
  const parts = rel.split(sep)
  if (parts.length < 2) return
  const collection = parts[0]
  if (!NOTE_COLLECTIONS.includes(collection as any)) return
  const slug = parts
    .slice(1)
    .join('/')
    .replace(/\.(md|mdx)$/, '')
  const keepMdx = KEEP_MDX.has(`${collection}/${slug}`)
  const ext = extname(filePath)

  const raw = readFileSync(filePath, 'utf8')
  const parsed = matter(raw)
  const plannedMoves: Array<[string, string]> = []

  const report: FileReport = {
    from: filePath,
    to: '',
    keptMdx: false,
    assetsMoved: [],
    ghRepoDirectiveCount: 0,
    imageTagsConverted: 0,
    warnings: [],
  }

  // Rewrite frontmatter asset refs.
  const newData = rewriteAssetReferencesInFrontmatter(
    parsed.data,
    collection,
    slug,
    plannedMoves,
  )

  // Transform body.
  const newBody = rewriteBody(
    parsed.content,
    collection,
    slug,
    plannedMoves,
    report,
  )

  // Decide final extension.
  const stillHasJsx = hasRemainingJsxImports(newBody)
  const useMdx = keepMdx || (ext === '.mdx' && stillHasJsx)
  if (stillHasJsx && !keepMdx) {
    report.warnings.push(`file has unhandled JSX imports; keeping .mdx: ${rel}`)
  }

  const targetExt = useMdx ? '.mdx' : '.md'
  const toPath = join(CONTENT_DIR, collection, `${slug}${targetExt}`)
  report.to = toPath
  report.keptMdx = useMdx

  // Reserialize.
  const outFile = matter.stringify(newBody, newData)
  writeOut(toPath, outFile)

  // Move referenced assets.
  const seen = new Set<string>()
  for (const [from, to] of plannedMoves) {
    const key = `${from}→${to}`
    if (seen.has(key)) continue
    seen.add(key)
    if (copyFile(from, to)) report.assetsMoved.push(to)
  }

  reports.push(report)
}

function migrateCollection(name: string) {
  const dir = join(DATA_DIR, name)
  if (!existsSync(dir)) return
  for (const file of walk(dir)) {
    if (!/\.(md|mdx)$/.test(file)) continue
    migrateNote(file)
  }
}

function moveOrphanAssets() {
  // Root-level assets (memoji, desk, OG images) → content/attachments/site/
  if (!existsSync(ASSETS_DIR)) return
  for (const entry of readdirSync(ASSETS_DIR)) {
    const full = join(ASSETS_DIR, entry)
    const s = statSync(full)
    if (s.isFile()) {
      const to = join(ATTACHMENTS_DIR, 'site', entry)
      if (copyFile(full, to)) log(`site asset: ${entry}`)
    }
  }
  // Publishers (consumed by AsSeenOn.astro) → site/publishers/
  const publishers = join(ASSETS_DIR, 'publishers')
  if (existsSync(publishers)) {
    for (const f of readdirSync(publishers)) {
      copyFile(
        join(publishers, f),
        join(ATTACHMENTS_DIR, 'site', 'publishers', f),
      )
    }
  }
  // Top-level guides folder (icons etc.)
  const guidesTop = join(ASSETS_DIR, 'guides')
  if (existsSync(guidesTop)) {
    for (const f of walk(guidesTop)) {
      const rel = relative(ASSETS_DIR, f)
      copyFile(f, join(ATTACHMENTS_DIR, rel))
    }
  }
}

function main() {
  log(
    `Migration starting (${DRY_RUN ? 'DRY RUN' : 'REAL'}) — content/ will be created at ${CONTENT_DIR}`,
  )

  if (!DRY_RUN) ensureDir(CONTENT_DIR)
  if (!DRY_RUN) ensureDir(ATTACHMENTS_DIR)

  for (const col of NOTE_COLLECTIONS) migrateCollection(col)
  moveOrphanAssets()

  // Summary
  const mdxKept = reports.filter((r) => r.keptMdx).length
  const mdConverted = reports.filter((r) => !r.keptMdx).length
  const ghRepoTotal = reports.reduce((a, r) => a + r.ghRepoDirectiveCount, 0)
  const imageTotal = reports.reduce((a, r) => a + r.imageTagsConverted, 0)
  const assetsTotal = new Set<string>()
  for (const r of reports) for (const a of r.assetsMoved) assetsTotal.add(a)

  log('')
  log('── Summary ───────────────────')
  log(`Notes migrated: ${reports.length}`)
  log(`  → .md: ${mdConverted}`)
  log(`  → kept .mdx: ${mdxKept}`)
  log(`GhRepo directives written: ${ghRepoTotal}`)
  log(`<Image> JSX converted: ${imageTotal}`)
  log(`Unique assets moved: ${assetsTotal.size}`)
  if (globalWarnings.length > 0) {
    log(`Warnings: ${globalWarnings.length}`)
    for (const w of globalWarnings.slice(0, 10)) log(`  - ${w}`)
  }
  for (const r of reports.filter((r) => r.warnings.length > 0)) {
    for (const w of r.warnings) log(`  - ${w}`)
  }
  if (DRY_RUN) log('')
  if (DRY_RUN) log('Dry run complete. No files were written.')
}

main()
