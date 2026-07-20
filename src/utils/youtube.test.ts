import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
// @ts-expect-error - cjs mock module has no types
import { server } from '../../mocks/index.cjs'
import {
  extractVideoId,
  rankVideos,
  viewsFromRecord,
  fetchVideoViews,
} from './youtube'

type TestPost = { id: string; data: { pubDate: Date; youtubeUrl?: string } }
const post = (id: string, pubDate: string, youtubeUrl?: string): TestPost => ({
  id,
  data: { pubDate: new Date(pubDate), youtubeUrl },
})
const embed = (id: string) => `https://www.youtube.com/embed/${id}`

describe('extractVideoId', () => {
  it('extracts the id from a plain embed url', () => {
    expect(extractVideoId('https://www.youtube.com/embed/Mu4frtvHPOY')).toBe(
      'Mu4frtvHPOY',
    )
  })
  it('ignores ?si= and ?t= query params', () => {
    expect(
      extractVideoId('https://www.youtube.com/embed/GKQ9rJ12hjc?si=Wn_klpgsSU'),
    ).toBe('GKQ9rJ12hjc')
    expect(
      extractVideoId('https://www.youtube.com/embed/3o0gPmusT0Y?t=1m10s'),
    ).toBe('3o0gPmusT0Y')
  })
  it('returns null for malformed input', () => {
    expect(extractVideoId('not a url')).toBeNull()
    expect(extractVideoId('https://www.youtube.com/watch?v=abc')).toBeNull()
  })
})

describe('viewsFromRecord', () => {
  it('rebuilds a Map from a snapshot record', () => {
    const map = viewsFromRecord({ abc: 1200, def: 30 })
    expect(map.get('abc')).toBe(1200)
    expect(map.size).toBe(2)
  })
})

describe('rankVideos', () => {
  it('keeps only posts with an extractable youtubeUrl, sorted by views desc', () => {
    const posts = [
      post('low', '2020-01-01', embed('low12345678')),
      post('nopost', '2020-01-02'),
      post('high', '2020-01-03', embed('high1234567')),
    ] as any
    const views = new Map([
      ['low12345678', 10],
      ['high1234567', 100],
    ])
    const ranked = rankVideos(posts, views)
    expect(ranked.map((r) => r.post.id)).toEqual(['high', 'low'])
    expect(ranked.map((r) => r.views)).toEqual([100, 10])
  })
  it('defaults missing videos to 0 and falls back to pubDate desc', () => {
    const posts = [
      post('older', '2020-01-01', embed('older12345a')),
      post('newer', '2020-06-01', embed('newer12345a')),
      post('has', '2019-01-01', embed('has12345678')),
    ] as any
    const views = new Map([['has12345678', 5]])
    const ranked = rankVideos(posts, views)
    expect(ranked.map((r) => r.post.id)).toEqual(['has', 'newer', 'older'])
    expect(ranked.map((r) => r.views)).toEqual([5, 0, 0])
  })
})

const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos'

describe('fetchVideoViews', () => {
  it('parses viewCount strings into a videoId->int map', async () => {
    server.use(
      http.get(VIDEOS_URL, () =>
        HttpResponse.json({
          items: [
            { id: 'abc12345678', statistics: { viewCount: '1200' } },
            { id: 'def12345678', statistics: { viewCount: '30' } },
          ],
        }),
      ),
    )
    const map = await fetchVideoViews('test-token', [
      'abc12345678',
      'def12345678',
    ])
    expect(map.get('abc12345678')).toBe(1200)
    expect(map.get('def12345678')).toBe(30)
  })

  it('throws when the token is missing', async () => {
    await expect(fetchVideoViews('', ['abc12345678'])).rejects.toThrow(
      /YOUTUBE_API_KEY/,
    )
  })

  it('throws on a failed request', async () => {
    server.use(
      http.get(VIDEOS_URL, () => new HttpResponse(null, { status: 403 })),
    )
    await expect(
      fetchVideoViews('test-token', ['abc12345678']),
    ).rejects.toThrow(/403/)
  })

  it('returns an empty map when given no ids (no request)', async () => {
    const map = await fetchVideoViews('test-token', [])
    expect(map.size).toBe(0)
  })
})
