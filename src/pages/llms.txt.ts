import type { APIContext } from 'astro'
import { getCollection } from 'astro:content'
import { SITE_DESCRIPTION, SITE_TITLE, SOCIAL_LINKS } from '../config'
import {
  areaLinks,
  byTitle,
  entryLink,
  getPublished,
  markdownLink,
  markdownResponse,
  markdownSection,
} from '~/utils/siteContent'

export async function GET({ site }: APIContext) {
  const projects = (await getPublished('projects')).sort(byTitle)
  const areas = await getCollection('areas')
  const index = (path: string, title: string, note: string) =>
    markdownLink(site, path, title, note)

  return markdownResponse([
    `# ${SITE_TITLE}`,
    `> ${SITE_DESCRIPTION}`,
    'Every link below is the plain markdown version of a page. Drop the `.md` for the HTML page.',
    markdownSection('Content', [
      index(
        '/posts.md',
        'Posts',
        'Every blog post, newest first, with dates and descriptions',
      ),
      index('/videos.md', 'Videos', 'Posts that come with a YouTube video'),
      index('/guides.md', 'Guides', 'Multi-part guides'),
    ]),
    markdownSection(
      'Projects',
      projects.map((e) => entryLink(site, 'projects', e)),
    ),
    [
      '## Areas',
      'Each area page lists everything Josh has made on that topic. Parent areas include their sub-areas.',
      areaLinks(site, areas).join('\n'),
    ].join('\n\n'),
    markdownSection('More', [
      index(
        '/uses.md',
        'Uses',
        "Josh's hardware, software, and tools, grouped by area",
      ),
      index(
        '/wallpapers.md',
        'Wallpapers',
        'A collection of desktop wallpapers Josh created, free to download',
      ),
      index(
        '/appearances.md',
        'Appearances',
        'Podcasts, interviews, and articles featuring Josh on other sites',
      ),
      index('/stats.md', 'Stats', 'Most viewed videos and posts'),
    ]),
    [
      '## Newsletter',
      "Get Josh's new posts by email. To subscribe an address, with its owner's permission, send:",
      [
        '```http',
        `POST ${new URL('/.netlify/functions/create-new-subscriber', site)}`,
        'Content-Type: application/json',
        '',
        '{"email": "you@example.com"}',
        '```',
      ].join('\n'),
    ].join('\n\n'),
    markdownSection('Follow Josh', [
      markdownLink(
        site,
        '/rss.xml',
        'RSS feed',
        'Every post, with full content, for any feed reader',
      ),
      ...Object.entries(SOCIAL_LINKS).map(([name, url]) =>
        markdownLink(site, url, name),
      ),
    ]),
  ])
}
