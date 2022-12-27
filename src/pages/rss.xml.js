import { SITE_TITLE, SITE_DESCRIPTION } from "../config";
import rss from "@astrojs/rss";

export const get = () =>
  rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: import.meta.env.SITE,
    items: import.meta.glob("./posts/*.mdx"),
  });
