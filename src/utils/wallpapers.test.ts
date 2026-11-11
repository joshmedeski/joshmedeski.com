import { describe, it, expect } from 'vitest'
import {
  byLargest,
  byLatest,
  bySmallest,
  byTitle,
  madeWith,
  serviceId,
  wallpaperSize,
} from './wallpapers'

describe('madeWith', () => {
  it('joins service and model without repeating the service', () => {
    expect(madeWith('Midjourney', 'v7')).toBe('Midjourney v7')
    expect(madeWith('Krea', 'Krea 2 Medium')).toBe('Krea 2 Medium')
    expect(madeWith('Krea')).toBe('Krea')
    expect(madeWith()).toBe('')
  })
})

describe('serviceId', () => {
  it('slugs the service and falls back to unknown', () => {
    expect(serviceId('Midjourney')).toBe('midjourney')
    expect(serviceId('Adobe Firefly')).toBe('adobe-firefly')
    expect(serviceId()).toBe('unknown')
  })
})

describe('wallpaperSize', () => {
  it('buckets widths by their largest full size', () => {
    expect(wallpaperSize(5160)).toBe('5K')
    expect(wallpaperSize(5120)).toBe('5K')
    expect(wallpaperSize(3840)).toBe('4K')
    expect(wallpaperSize(2912)).toBe('HD')
    expect(wallpaperSize(1920)).toBe('HD')
    expect(wallpaperSize(1456)).toBe('SD')
    expect(wallpaperSize()).toBe('SD')
  })
})

const wallpaper = (
  title: string,
  added: string,
  width: number,
  height: number,
) => ({ data: { title, added: new Date(added), width, height } })

const cave = wallpaper('Cave', '2026-02-03', 5120, 2880)
const alien = wallpaper('Alien', '2026-02-03', 2912, 1632)
const forest = wallpaper('Forest', '2026-11-11', 1456, 816)
const titles = (list: (typeof cave)[]) => list.map((w) => w.data.title)

describe('wallpaper sorting', () => {
  const list = [cave, alien, forest]

  it('sorts by title', () => {
    expect(titles([...list].sort(byTitle))).toEqual(['Alien', 'Cave', 'Forest'])
  })

  it('sorts newest first, then by title on the same day', () => {
    expect(titles([...list].sort(byLatest))).toEqual([
      'Forest',
      'Alien',
      'Cave',
    ])
  })

  it('prefers the created date over the added date', () => {
    const old = {
      data: { ...forest.data, title: 'Old', created: new Date('2024-01-12') },
    }
    expect(titles([old, alien].sort(byLatest))).toEqual(['Alien', 'Old'])
  })

  it('sorts by pixel count in both directions', () => {
    expect(titles([...list].sort(byLargest))).toEqual([
      'Cave',
      'Alien',
      'Forest',
    ])
    expect(titles([...list].sort(bySmallest))).toEqual([
      'Forest',
      'Alien',
      'Cave',
    ])
  })
})
