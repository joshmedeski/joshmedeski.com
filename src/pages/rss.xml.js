import { SITE_TITLE, SITE_DESCRIPTION } from "../config";
import rss, { pagesGlobToRssItems } from "@astrojs/rss";

export async function GET() {
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: import.meta.env.SITE,
    items: await pagesGlobToRssItems(import.meta.glob("./posts/*.mdx")),
  });
}
