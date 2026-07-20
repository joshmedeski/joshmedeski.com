import type { CollectionEntry } from 'astro:content'
import { rankPosts } from './fathom'

export type CategoryWithTopPosts = {
  category: CollectionEntry<'categories'>
  postCount: number
  topPosts: CollectionEntry<'posts'>[]
}

export function categoriesWithTopPosts(
  categories: CollectionEntry<'categories'>[],
  posts: CollectionEntry<'posts'>[],
  viewsByPathname: Map<string, number>,
  topN = 2,
): CategoryWithTopPosts[] {
  return [...categories]
    .sort((a, b) => a.data.title.localeCompare(b.data.title))
    .map((category) => {
      const categoryPosts = posts.filter(
        (post) => post.data.category.id === category.id,
      )
      const ranked = rankPosts(categoryPosts, viewsByPathname)
      return {
        category,
        postCount: categoryPosts.length,
        topPosts: ranked.slice(0, topN).map(({ post }) => post),
      }
    })
}
