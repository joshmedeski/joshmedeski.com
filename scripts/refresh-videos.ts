import { readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  fetchVideoViews,
  extractVideoId,
  type VideoViewsSnapshot,
} from '../src/utils/youtube.ts'

const POSTS_DIR = resolve(import.meta.dirname, '../content/posts')
const OUT = resolve(import.meta.dirname, '../src/data/youtube-views.json')

// Pull `youtubeUrl: '...'` out of a post's frontmatter without a YAML parser —
// it's the only field the refresh script needs.
function readYoutubeUrl(source: string): string | null {
  const match = source.match(/^youtubeUrl:\s*['"]?([^'"\n]+)['"]?\s*$/m)
  return match ? match[1].trim() : null
}

async function collectVideoIds(): Promise<string[]> {
  const files = (await readdir(POSTS_DIR)).filter((f) => /\.(md|mdx)$/.test(f))
  const ids: string[] = []
  for (const file of files) {
    const source = await readFile(resolve(POSTS_DIR, file), 'utf8')
    const url = readYoutubeUrl(source)
    const id = url ? extractVideoId(url) : null
    if (id) ids.push(id)
  }
  return ids
}

async function main() {
  const ids = await collectVideoIds()
  const views = await fetchVideoViews(process.env.YOUTUBE_API_KEY, ids)

  if (views.size === 0) {
    throw new Error('YouTube returned no views — refusing to write snapshot')
  }

  const sorted = [...views.entries()].sort((a, b) => b[1] - a[1])
  const snapshot: VideoViewsSnapshot = {
    fetchedAt: new Date().toISOString(),
    views: Object.fromEntries(sorted),
  }

  await writeFile(OUT, JSON.stringify(snapshot, null, 2) + '\n')
  console.log(
    `Wrote ${views.size} videos to src/data/youtube-views.json (fetched ${snapshot.fetchedAt})`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
