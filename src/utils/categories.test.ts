import { describe, expect, it } from 'vitest'
import type { CollectionEntry } from 'astro:content'
import { categoriesWithTopPosts } from './categories'

const cat = (id: string, title: string) =>
  ({ id, data: { title } }) as unknown as CollectionEntry<'categories'>

const post = (id: string, categoryId: string, pubDate: string) =>
  ({
    id,
    data: { category: { id: categoryId }, pubDate: new Date(pubDate) },
  }) as unknown as CollectionEntry<'posts'>

const categories = [cat('development', 'Development'), cat('tech', 'Tech')]
const posts = [
  post('dev-a', 'development', '2024-01-01'),
  post('dev-b', 'development', '2024-02-01'),
  post('dev-c', 'development', '2024-03-01'),
  post('tech-a', 'tech', '2024-01-01'),
]
const views = new Map<string, number>([
  ['/posts/dev-a', 10],
  ['/posts/dev-b', 30],
  ['/posts/dev-c', 20],
  ['/posts/tech-a', 5],
])

describe('categoriesWithTopPosts', () => {
  it('orders categories alphabetically by title', () => {
    const reversed = [cat('tech', 'Tech'), cat('development', 'Development')]
    const result = categoriesWithTopPosts(reversed, posts, views)
    expect(result.map((r) => r.category.id)).toEqual(['development', 'tech'])
  })

  it('returns the top N posts per category by pageviews', () => {
    const result = categoriesWithTopPosts(categories, posts, views, 2)
    const dev = result.find((r) => r.category.id === 'development')!
    expect(dev.topPosts.map((p) => p.id)).toEqual(['dev-b', 'dev-c'])
  })

  it('reports the full post count, not the truncated top N', () => {
    const result = categoriesWithTopPosts(categories, posts, views, 2)
    const dev = result.find((r) => r.category.id === 'development')!
    expect(dev.postCount).toBe(3)
  })

  it('defaults to two top posts', () => {
    const result = categoriesWithTopPosts(categories, posts, views)
    const dev = result.find((r) => r.category.id === 'development')!
    expect(dev.topPosts).toHaveLength(2)
  })
})
