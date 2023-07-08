import { z, defineCollection, reference } from "astro:content";

const postsCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    category: reference("categories"),
    guide: reference("guides").optional(),
    heroImage: z.string(),
    draft: z.boolean().optional(),
    titleClasses: z.string().optional(),
    updatedDate: z.string().optional(),
    youtubeUrl: z.string().optional(),
    heroClasses: z.string().optional(),
    thumbnail: z.string().optional(),
  }),
});

const categoriesCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    desc: z.string(),
    style: z.object({
      container: z.string(),
      title: z.string(),
      desc: z.string(),
      themeColor: z.string(),
    }),
  }),
});

const guidesCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    heroImage: z.string(),
  }),
});

export const collections = {
  posts: postsCollection,
  categories: categoriesCollection,
  guides: guidesCollection,
};
