import type { APIContext } from 'astro'
import {
  byTitle,
  entryLink,
  getPublished,
  markdownResponse,
} from '~/utils/siteContent'

export async function GET({ site }: APIContext) {
  const projects = (await getPublished('projects')).sort(byTitle)
  return markdownResponse([
    '# Projects',
    `Open source projects Josh Medeski builds and maintains. Each link is the plain markdown version of the project page. The HTML version is at ${new URL('/projects/', site)}.`,
    projects.map((project) => entryLink(site, 'projects', project)).join('\n'),
  ])
}
