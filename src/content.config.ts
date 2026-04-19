import { glob } from 'astro/loaders'
import { z, defineCollection, reference } from 'astro:content'

const postsCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './content/posts' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.date(),
      category: reference('categories'),
      duration: z.string().optional(),
      heroImage: image(),
      draft: z.boolean().optional(),
      titleClasses: z.string().optional(),
      updatedDate: z.string().optional(),
      youtubeUrl: z.string().optional(),
      heroClasses: z.string().optional(),
      thumbnail: image().optional(),
      guide: z
        .object({
          ref: reference('guides'),
          position: z.number(),
        })
        .optional(),
      aliases: z.array(z.string()).optional(),
    }),
})

const categoriesCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './content/categories' }),
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
})

const usesCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './content/uses' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      area: reference('areas'),
      image: image(),
    }),
})

const areasCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './content/areas' }),
  schema: z.object({
    title: z.string(),
  }),
})

const guidesCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './content/guides' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.date(),
      heroImage: image(),
      aliases: z.array(z.string()).optional(),
    }),
})

const wallpapersCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './content/wallpapers' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      image: image(),
      width: z.number().optional(),
      height: z.number().optional(),
      favorite: z.boolean().optional(),
    }),
})

const projectsCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      repo: z.string(),
      heroImage: image(),
    }),
})

export const collections = {
  areas: areasCollection,
  posts: postsCollection,
  projects: projectsCollection,
  categories: categoriesCollection,
  guides: guidesCollection,
  uses: usesCollection,
  wallpapers: wallpapersCollection,
}
