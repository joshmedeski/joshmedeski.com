import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'unified'
import type { Root } from 'mdast'

interface GhRepoRecord {
  fullName?: string
  description?: string
  url?: string
}

const GITHUB_ICON_SVG = `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor" display="inline-block" overflow="visible" style="vertical-align:text-bottom" class="h-6 w-6"><path d="M10.226 17.284c-2.965-.36-5.054-2.493-5.054-5.256 0-1.123.404-2.336 1.078-3.144-.292-.741-.247-2.314.09-2.965.898-.112 2.111.36 2.83 1.01.853-.269 1.752-.404 2.853-.404 1.1 0 1.999.135 2.807.382.696-.629 1.932-1.1 2.83-.988.315.606.36 2.179.067 2.942.72.854 1.101 2 1.101 3.167 0 2.763-2.089 4.852-5.098 5.234.763.494 1.28 1.572 1.28 2.807v2.336c0 .674.561 1.056 1.235.786 4.066-1.55 7.255-5.615 7.255-10.646C23.5 6.188 18.334 1 11.978 1 5.62 1 .5 6.188.5 12.545c0 4.986 3.167 9.12 7.435 10.669.606.225 1.19-.18 1.19-.786V20.63a2.9 2.9 0 0 1-1.078.224c-1.483 0-2.359-.808-2.987-2.313-.247-.607-.517-.966-1.034-1.033-.27-.023-.359-.135-.359-.27 0-.27.45-.471.898-.471.652 0 1.213.404 1.797 1.235.45.651.921.943 1.483.943.561 0 .92-.202 1.437-.719.382-.381.674-.718.944-.943"></path></svg>`

let repoCache: Record<string, GhRepoRecord> | null = null

function loadRepoCache(): Record<string, GhRepoRecord> {
  if (repoCache) return repoCache
  try {
    const raw = readFileSync(
      join(process.cwd(), 'src/data/gh-repos.json'),
      'utf8',
    )
    repoCache = JSON.parse(raw) as Record<string, GhRepoRecord>
  } catch {
    repoCache = {}
  }
  return repoCache
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderGhRepo(repo: string): string {
  const data = loadRepoCache()[repo]
  const fullName = data?.fullName ?? repo
  const description = data?.description ?? null
  const url = data?.url ?? `https://github.com/${repo}`

  const descHtml = description
    ? `<p class="sm:text-md text-sm leading-none text-white">${escapeHtml(description)}</p>`
    : ''

  return (
    `<a href="${escapeHtml(url)}" target="_blank" class="not-prose mb-4 block no-underline text-gh-light">` +
    `<section class="flex flex-col gap-2 rounded bg-gh-dark p-2 sm:flex-row sm:gap-4 sm:p-4">` +
    `<div>` +
    `<div class="flex items-center gap-2">${GITHUB_ICON_SVG}<strong class="sm:text-lg">${escapeHtml(fullName)}</strong></div>` +
    `${descHtml}` +
    `</div>` +
    `</section>` +
    `</a>`
  )
}

const remarkGhRepoDirective: Plugin<[], Root> = () => {
  return (tree) => {
    const visit = (node: any, parent: any, index: number | null) => {
      if (
        node &&
        node.type === 'leafDirective' &&
        node.name === 'gh-repo' &&
        parent &&
        index !== null
      ) {
        const repo = (node.attributes && (node.attributes as any).repo) ?? ''
        if (repo) {
          parent.children[index] = {
            type: 'html',
            value: renderGhRepo(String(repo)),
          }
        }
        return
      }
      if (node && Array.isArray(node.children)) {
        for (let i = 0; i < node.children.length; i++) {
          visit(node.children[i], node, i)
        }
      }
    }
    visit(tree, null, null)
  }
}

export default remarkGhRepoDirective
