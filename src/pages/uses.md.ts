import type { APIContext } from 'astro'
import { getCollection } from 'astro:content'
import { USES_AREA_ORDER } from '~/config'
import { groupByDirectArea } from '~/utils/areas'
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
    ...groupByDirectArea(areas, uses, USES_AREA_ORDER).map(({ area, items }) =>
      markdownSection(
        area.data.title,
        items.sort(byTitle).map((use) => entryLink(site, 'uses', use)),
      ),
    ),
  ])
}
