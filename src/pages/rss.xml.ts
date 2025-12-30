import rss from '@astrojs/rss'
import { SITE_DESCRIPTION, SITE_TITLE } from '../config'

export function GET() {
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: import.meta.env.SITE,
    items: import.meta.glob('../content/posts/*.mdx'),
  })
}
