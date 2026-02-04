import { readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import sharp from 'sharp'

const WALLPAPERS_DIR = resolve(import.meta.dirname, '../src/data/wallpapers')

async function main() {
  const files = await readdir(WALLPAPERS_DIR)
  const mdFiles = files.filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))

  let updated = 0

  for (const file of mdFiles) {
    const filePath = resolve(WALLPAPERS_DIR, file)
    const content = await readFile(filePath, 'utf-8')

    const match = content.match(/^---\n([\s\S]*?)\n---/)
    if (!match) {
      console.log(`Skipping ${file}: no frontmatter found`)
      continue
    }

    const frontmatter = match[1]
    const imageMatch = frontmatter.match(/^image:\s*(.+)$/m)
    if (!imageMatch) {
      console.log(`Skipping ${file}: no image field`)
      continue
    }

    const imagePath = resolve(dirname(filePath), imageMatch[1].trim())
    const metadata = await sharp(imagePath).metadata()

    if (!metadata.width || !metadata.height) {
      console.log(`Skipping ${file}: could not read dimensions`)
      continue
    }

    const hasWidth = /^width:\s/m.test(frontmatter)
    const hasHeight = /^height:\s/m.test(frontmatter)

    if (hasWidth && hasHeight) {
      console.log(`Skipping ${file}: already has dimensions`)
      continue
    }

    const dimensionLines = `width: ${metadata.width}\nheight: ${metadata.height}`
    const newContent = content.replace(
      /^---\n([\s\S]*?)\n---/,
      `---\n$1\n${dimensionLines}\n---`,
    )

    await writeFile(filePath, newContent)
    console.log(`Updated ${file}: ${metadata.width}x${metadata.height}`)
    updated++
  }

  console.log(`\nDone. Updated ${updated}/${mdFiles.length} files.`)
}

main().catch(console.error)
