import type { APIContext } from 'astro'
import { getCollection } from 'astro:content'
import { contentForArea, topLevelAreas } from '~/utils/areas'
import {
  byTitle,
  entryLink,
  getPublished,
  markdownResponse,
  markdownSection,
} from '~/utils/siteContent'

export async function GET({ site }: APIContext) {
  const areas = await getCollection('areas')
  const uses = await getPublished('uses')
  return markdownResponse([
    '# Uses',
    `The hardware, software, and tools Josh Medeski uses, grouped by area. Each link is the plain markdown version of that page. The HTML version is at ${new URL('/uses/', site)}.`,
    ...topLevelAreas(areas).map((area) =>
      markdownSection(
        area.data.title,
        contentForArea(area, areas, uses)
          .sort(byTitle)
          .map((use) => entryLink(site, 'uses', use)),
      ),
    ),
  ])
}
