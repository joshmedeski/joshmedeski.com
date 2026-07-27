import { glob } from 'astro/loaders'
import { z, defineCollection, reference } from 'astro:content'

const postsCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './content/posts' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.date(),
      areas: z.array(reference('areas')).optional(),
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
    }),
})

const usesCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './content/uses' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      areas: z.array(reference('areas')).optional(),
      image: image(),
    }),
})

const areasCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './content/areas' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      icon: z.string().optional(),
      parent: reference('areas').optional(),
      themeColor: z.string().optional(),
      cover: image().optional(),
      description: z.string().optional(),
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
    }),
})

const wallpapersCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './content/wallpapers' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      image: image(),
      added: z.date().optional(),
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
      areas: z.array(reference('areas')).optional(),
      heroImage: image(),
      cta: z
        .object({
          label: z.string(),
          url: z.string(),
        })
        .optional(),
    }),
})

export const collections = {
  areas: areasCollection,
  posts: postsCollection,
  projects: projectsCollection,
  guides: guidesCollection,
  uses: usesCollection,
  wallpapers: wallpapersCollection,
}
