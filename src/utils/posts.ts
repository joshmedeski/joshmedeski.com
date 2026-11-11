const WORDS_PER_MINUTE = 230

type PostLike = {
  body?: string
  data: {
    title: string
    pubDate: Date
    duration?: string
    videoType?: 'video' | 'livestream'
  }
}

export type PostType = 'video' | 'livestream' | 'writing'

export const postType = (post: PostLike): PostType =>
  post.data.videoType ?? 'writing'

export const durationMinutes = (duration: string) =>
  duration
    .split(':')
    .map(Number)
    .reduce((total, part) => total * 60 + part, 0) / 60

export const readingMinutes = (body = '') =>
  Math.max(
    1,
    Math.round(body.split(/\s+/).filter(Boolean).length / WORDS_PER_MINUTE),
  )

export const postMinutes = (post: PostLike) =>
  post.data.duration
    ? durationMinutes(post.data.duration)
    : readingMinutes(post.body)
