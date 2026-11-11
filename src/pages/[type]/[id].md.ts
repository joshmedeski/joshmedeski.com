import type { APIRoute } from 'astro'
import type { CollectionEntry } from 'astro:content'
import {
  CONTENT_TYPES,
  getPublished,
  type ContentType,
} from '~/utils/siteContent'

export async function getStaticPaths() {
  const groups = await Promise.all(
    CONTENT_TYPES.map(async (type) =>
      (await getPublished(type)).map((entry) => ({
        params: { type, id: entry.id },
        props: { entry },
      })),
    ),
  )
  return groups.flat()
}

export const GET: APIRoute<{ entry: CollectionEntry<ContentType> }> = ({
  props: { entry },
}) =>
  new Response(
    `# ${entry.data.title}\n\n${entry.data.description}\n\n${entry.body}`,
    { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } },
  )
