import { describe, it, expect } from 'vitest'
import { rankPosts } from './fathom'

type TestPost = { id: string; data: { pubDate: Date } }

const post = (id: string, pubDate: string): TestPost => ({
  id,
  data: { pubDate: new Date(pubDate) },
})

describe('rankPosts', () => {
  it('sorts posts by pageviews descending', () => {
    const posts = [
      post('low', '2020-01-01'),
      post('high', '2020-01-02'),
      post('mid', '2020-01-03'),
    ] as any
    const views = new Map([
      ['/posts/low', 10],
      ['/posts/high', 100],
      ['/posts/mid', 50],
    ])
    const ranked = rankPosts(posts, views)
    expect(ranked.map((r) => r.post.id)).toEqual(['high', 'mid', 'low'])
    expect(ranked.map((r) => r.pageviews)).toEqual([100, 50, 10])
  })

  it('defaults missing posts to 0 views and falls back to pubDate desc', () => {
    const posts = [
      post('older-nodata', '2020-01-01'),
      post('newer-nodata', '2020-06-01'),
      post('hasviews', '2019-01-01'),
    ] as any
    const views = new Map([['/posts/hasviews', 5]])
    const ranked = rankPosts(posts, views)
    expect(ranked.map((r) => r.post.id)).toEqual([
      'hasviews',
      'newer-nodata',
      'older-nodata',
    ])
    expect(ranked.map((r) => r.pageviews)).toEqual([5, 0, 0])
  })
})
