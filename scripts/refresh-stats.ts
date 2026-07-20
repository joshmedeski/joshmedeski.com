import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  fetchPageviews,
  FATHOM_DATA_SINCE,
  type PageviewsSnapshot,
} from '../src/utils/fathom.ts'

const OUT = resolve(import.meta.dirname, '../src/data/pageviews.json')

async function main() {
  const pageviews = await fetchPageviews(process.env.FATHOM_API_KEY)

  if (pageviews.size === 0) {
    throw new Error('Fathom returned no pageviews — refusing to write snapshot')
  }

  // Sort descending so the committed file is diff-friendly and readable.
  const sorted = [...pageviews.entries()].sort((a, b) => b[1] - a[1])

  const snapshot: PageviewsSnapshot = {
    since: FATHOM_DATA_SINCE.toISOString(),
    fetchedAt: new Date().toISOString(),
    pageviews: Object.fromEntries(sorted),
  }

  await writeFile(OUT, JSON.stringify(snapshot, null, 2) + '\n')
  console.log(
    `Wrote ${pageviews.size} pathnames to src/data/pageviews.json (fetched ${snapshot.fetchedAt})`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
