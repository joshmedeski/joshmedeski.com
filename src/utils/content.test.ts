import { describe, it, expect } from 'vitest'
import {
  byLongest,
  byNewest,
  byOldest,
  byShortest,
  lengthBucket,
  type Listable,
} from './content'

const item = (title: string, date: string, minutes?: number): Listable => ({
  title,
  date: new Date(date),
  minutes,
})

const stream = item('Stream', '2026-01-01', 120)
const short = item('Short', '2026-03-01', 1)
const long = item('Long', '2026-02-01', 10)
const podcast = item('Podcast', '2026-04-01')
const titles = (list: Listable[]) => list.map((i) => i.title)

describe('content sorting', () => {
  const list = [stream, short, long, podcast]

  it('sorts by date both ways', () => {
    expect(titles([...list].sort(byNewest))).toEqual([
      'Podcast',
      'Short',
      'Long',
      'Stream',
    ])
    expect(titles([...list].sort(byOldest))).toEqual([
      'Stream',
      'Long',
      'Short',
      'Podcast',
    ])
  })

  it('sorts by length both ways with unknown lengths last', () => {
    expect(titles([...list].sort(byLongest))).toEqual([
      'Stream',
      'Long',
      'Short',
      'Podcast',
    ])
    expect(titles([...list].sort(byShortest))).toEqual([
      'Short',
      'Long',
      'Stream',
      'Podcast',
    ])
  })

  it('breaks date ties by title', () => {
    const a = item('A', '2026-01-01')
    const b = item('B', '2026-01-01')
    expect(titles([b, a].sort(byNewest))).toEqual(['A', 'B'])
  })
})

describe('lengthBucket', () => {
  it('groups minutes with exclusive upper bounds', () => {
    expect(lengthBucket(1)).toBe('under-5')
    expect(lengthBucket(5)).toBe('5-15')
    expect(lengthBucket(20)).toBe('15-30')
    expect(lengthBucket(59.99)).toBe('30-60')
    expect(lengthBucket(60)).toBe('over-60')
    expect(lengthBucket()).toBe('unknown')
  })
})
