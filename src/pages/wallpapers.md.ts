import type { APIContext } from 'astro'
import { getCollection } from 'astro:content'
import { markdownLink, markdownResponse } from '~/utils/siteContent'
import { byLatest, madeWith } from '~/utils/wallpapers'

export async function GET({ site }: APIContext) {
  const wallpapers = (await getCollection('wallpapers')).sort(byLatest)
  return markdownResponse([
    '# Wallpapers',
    `A collection of free desktop wallpapers created by Josh Medeski. Each link is a wallpaper's page with an HD download, plus 4K and 5K where the source is large enough. Browse them all at ${new URL('/wallpapers/', site)}.`,
    wallpapers
      .map(({ id, data }) => {
        const note = [
          data.width && `${data.width}×${data.height}`,
          madeWith(data.service, data.model),
          data.created && `created ${data.created.toISOString().slice(0, 10)}`,
        ]
          .filter(Boolean)
          .join(', ')
        const link = markdownLink(site, `/wallpapers/${id}/`, data.title, note)
        return data.prompt ? `${link}\n  - Prompt: ${data.prompt}` : link
      })
      .join('\n'),
  ])
}
