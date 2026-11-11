import { describe, it, expect } from 'vitest'
import { durationMinutes, postMinutes, postType, readingMinutes } from './posts'

const post = (
  title: string,
  pubDate: string,
  extra: {
    duration?: string
    videoType?: 'video' | 'livestream'
    body?: string
  } = {},
) => ({
  body: extra.body,
  data: {
    title,
    pubDate: new Date(pubDate),
    duration: extra.duration,
    videoType: extra.videoType,
  },
})

const words = (n: number) => Array(n).fill('word').join(' ')

describe('durationMinutes', () => {
  it('parses m:ss and h:mm:ss', () => {
    expect(durationMinutes('10:30')).toBe(10.5)
    expect(durationMinutes('1:02:00')).toBe(62)
    expect(durationMinutes('01:36:15')).toBe(96.25)
  })
})

describe('readingMinutes', () => {
  it('rounds words to minutes with a one minute floor', () => {
    expect(readingMinutes(words(460))).toBe(2)
    expect(readingMinutes('')).toBe(1)
    expect(readingMinutes()).toBe(1)
  })
})

const video = post('Video', '2026-01-01', {
  duration: '20:00',
  videoType: 'video',
})
const long = post('Long', '2026-02-01', { body: words(2300) })

describe('postMinutes and postType', () => {
  it('uses video duration, otherwise reading time', () => {
    expect(postMinutes(video)).toBe(20)
    expect(postMinutes(long)).toBe(10)
    expect(postType(video)).toBe('video')
    expect(postType(long)).toBe('writing')
    expect(
      postType(
        post('Stream', '2026-01-01', {
          duration: '2:00:00',
          videoType: 'livestream',
        }),
      ),
    ).toBe('livestream')
  })
})
