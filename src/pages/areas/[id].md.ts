import type { APIRoute } from 'astro'
import { getCollection, type CollectionEntry } from 'astro:content'
import { contentForArea } from '~/utils/areas'
import {
  appearanceLink,
  byNewest,
  byTitle,
  entryLink,
  markdownResponse,
  markdownSection,
} from '~/utils/siteContent'

export async function getStaticPaths() {
  const areas = await getCollection('areas')
  return areas.map((area) => ({ params: { id: area.id }, props: { area } }))
}

export const GET: APIRoute<{ area: CollectionEntry<'areas'> }> = async ({
  props: { area },
  site,
}) => {
  const areas = await getCollection('areas')
  const inArea = <T extends { data: { areas?: { id: string }[] } }>(
    items: T[],
  ) => contentForArea(area, areas, items)

  const areaPosts = inArea(await getCollection('posts')).sort(byNewest)
  const posts = areaPosts.filter(({ data }) => !data.youtubeUrl)
  const videos = areaPosts.filter(({ data }) => data.youtubeUrl)
  const guides = inArea(await getCollection('guides')).sort(byNewest)
  const projects = inArea(await getCollection('projects')).sort(byTitle)
  const uses = inArea(await getCollection('uses')).sort(byTitle)
  const appearances = inArea(await getCollection('appearances')).sort(byNewest)

  return markdownResponse([
    `# ${area.data.title}`,
    area.data.description ?? '',
    area.body?.trim() ?? '',
    `The HTML version is at ${new URL(`/areas/${area.id}/`, site)}.`,
    markdownSection(
      'Guides',
      guides.map((e) => entryLink(site, 'guides', e)),
    ),
    markdownSection(
      'Videos',
      videos.map((e) => entryLink(site, 'posts', e)),
    ),
    markdownSection(
      'Posts',
      posts.map((e) => entryLink(site, 'posts', e)),
    ),
    markdownSection(
      'Projects',
      projects.map((e) => entryLink(site, 'projects', e)),
    ),
    markdownSection(
      'Uses',
      uses.map((e) => entryLink(site, 'uses', e)),
    ),
    markdownSection(
      'Appearances',
      appearances.map((e) => appearanceLink(site, e)),
    ),
  ])
}
