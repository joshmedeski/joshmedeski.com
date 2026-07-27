import { describe, it, expect } from 'vitest'
import { postsForProject, splitVideos } from './projects'

const post = (
  id: string,
  opts: { projects?: string[]; pubDate?: string; youtubeUrl?: string } = {},
) => ({
  id,
  data: {
    projects: opts.projects?.map((p) => ({ collection: 'projects', id: p })),
    pubDate: new Date(opts.pubDate ?? '2024-01-01'),
    youtubeUrl: opts.youtubeUrl,
  },
})

const seshVideo = post('sesh-video', {
  projects: ['sesh'],
  pubDate: '2025-03-24',
  youtubeUrl: 'https://www.youtube.com/embed/abc',
})
const seshArticle = post('sesh-article', {
  projects: ['sesh'],
  pubDate: '2026-01-05',
})
const other = post('other', { projects: ['pst'] })
const untagged = post('untagged')

const all = [seshVideo, seshArticle, other, untagged]

describe('postsForProject', () => {
  it('returns only posts referencing the project', () => {
    expect(postsForProject({ id: 'sesh' }, all).map((p) => p.id)).toEqual([
      'sesh-article',
      'sesh-video',
    ])
  })

  it('sorts newest first', () => {
    const [first] = postsForProject({ id: 'sesh' }, all)
    expect(first.id).toBe('sesh-article')
  })

  it('returns an empty list when nothing references the project', () => {
    expect(postsForProject({ id: 'unknown' }, all)).toEqual([])
  })
})

describe('splitVideos', () => {
  it('separates posts with a YouTube URL from the rest', () => {
    const { videos, articles } = splitVideos(all)
    expect(videos.map((p) => p.id)).toEqual(['sesh-video'])
    expect(articles.map((p) => p.id)).toEqual([
      'sesh-article',
      'other',
      'untagged',
    ])
  })
})
