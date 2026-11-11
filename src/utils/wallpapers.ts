export const WALLPAPER_SIZES = ['5K', '4K', 'HD', 'SD'] as const
export type WallpaperSize = (typeof WALLPAPER_SIZES)[number]

export const wallpaperSize = (width = 0): WallpaperSize =>
  width >= 5120 ? '5K' : width >= 3840 ? '4K' : width >= 1920 ? 'HD' : 'SD'

export const UNKNOWN_SERVICE = 'Unknown'

export const serviceId = (service = UNKNOWN_SERVICE) =>
  service.toLowerCase().replace(/[^a-z0-9]+/g, '-')

export const madeWith = (service?: string, model?: string) =>
  service && model?.startsWith(service)
    ? model
    : [service, model].filter(Boolean).join(' ')

type Sortable = {
  data: {
    title: string
    added?: Date
    created?: Date
    width?: number
    height?: number
  }
}

const date = ({ data }: Sortable) =>
  (data.created ?? data.added)?.getTime() ?? 0

const pixels = ({ data }: Sortable) => (data.width ?? 0) * (data.height ?? 0)

export const byTitle = (a: Sortable, b: Sortable) =>
  a.data.title.localeCompare(b.data.title)

export const byLatest = (a: Sortable, b: Sortable) =>
  date(b) - date(a) || byTitle(a, b)

export const byLargest = (a: Sortable, b: Sortable) =>
  pixels(b) - pixels(a) || byTitle(a, b)

export const bySmallest = (a: Sortable, b: Sortable) =>
  pixels(a) - pixels(b) || byTitle(a, b)
