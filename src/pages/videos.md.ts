import type { APIContext } from 'astro'
import {
  byNewest,
  entryLink,
  getPublished,
  markdownResponse,
} from '~/utils/siteContent'

export async function GET({ site }: APIContext) {
  const videos = (await getPublished('posts'))
    .filter(({ data }) => 'youtubeUrl' in data && data.youtubeUrl)
    .sort(byNewest)
  return markdownResponse([
    '# Videos',
    `Posts by Josh Medeski that have a YouTube video, newest first. Live streams are marked "(live stream)"; everything else is an edited video. Each link is the plain markdown version of the post, including the video's embed URL. The HTML version is at ${new URL('/content?type=video,livestream', site)}.`,
    videos.map((post) => entryLink(site, 'posts', post)).join('\n'),
  ])
}
