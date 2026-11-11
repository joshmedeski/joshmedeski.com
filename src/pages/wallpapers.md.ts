import type { APIContext } from 'astro'
import { getCollection } from 'astro:content'
import { byTitle, markdownLink, markdownResponse } from '~/utils/siteContent'

export async function GET({ site }: APIContext) {
  const wallpapers = (await getCollection('wallpapers')).sort(byTitle)
  return markdownResponse([
    '# Wallpapers',
    `A collection of free desktop wallpapers created by Josh Medeski. Each link is a wallpaper's page with an HD download, plus 4K where the source is large enough. Browse them all at ${new URL('/wallpapers/', site)}.`,
    wallpapers
      .map(({ id, data }) =>
        markdownLink(
          site,
          `/wallpapers/${id}/`,
          data.title,
          data.width ? `${data.width}×${data.height}` : undefined,
        ),
      )
      .join('\n'),
  ])
}
