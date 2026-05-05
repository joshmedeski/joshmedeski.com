import sharp from 'sharp'
import { readFileSync } from 'node:fs'

const svg = readFileSync('/Users/joshmedeski/c/jm/vault/public/favicon.svg')

await sharp(svg, { density: 320 })
  .resize(256, 256, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png({ compressionLevel: 9, palette: true })
  .toFile('/Users/joshmedeski/c/jm/vault/public/favicon.png')

console.log('done')
