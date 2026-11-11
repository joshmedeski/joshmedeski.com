export type Listable = { title: string; date: Date; minutes?: number }

export const APPEARANCE_FORMATS = {
  podcast: { label: 'Podcast', icon: '🎧' },
  article: { label: 'Article', icon: '📰' },
  interview: { label: 'Interview', icon: '💬' },
  video: { label: 'Video', icon: '📺' },
} as const

export type AppearanceFormat = keyof typeof APPEARANCE_FORMATS

export const byNewest = (a: Listable, b: Listable) =>
  b.date.getTime() - a.date.getTime() || a.title.localeCompare(b.title)

export const byOldest = (a: Listable, b: Listable) => byNewest(b, a)

const byMinutes =
  (direction: 1 | -1) =>
  (a: Listable, b: Listable): number => {
    if (a.minutes === undefined || b.minutes === undefined)
      return (
        Number(a.minutes === undefined) - Number(b.minutes === undefined) ||
        byNewest(a, b)
      )
    return direction * (a.minutes - b.minutes) || byNewest(a, b)
  }

export const byLongest = byMinutes(-1)
export const byShortest = byMinutes(1)

export const LENGTH_BUCKETS = [
  { id: 'under-5', label: 'Under 5 min', max: 5 },
  { id: '5-15', label: '5–15 min', max: 15 },
  { id: '15-30', label: '15–30 min', max: 30 },
  { id: '30-60', label: '30–60 min', max: 60 },
  { id: 'over-60', label: 'Over 1 hr', max: Infinity },
] as const

export const UNKNOWN_LENGTH = 'unknown'

export const lengthBucket = (minutes?: number) =>
  minutes === undefined
    ? UNKNOWN_LENGTH
    : LENGTH_BUCKETS.find(({ max }) => minutes < max)!.id
