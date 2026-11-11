export const CONTENT_TYPES = ['posts', 'guides', 'projects', 'uses'] as const
export type ContentType = (typeof CONTENT_TYPES)[number]

const LISTINGS = [
  'posts',
  'videos',
  'guides',
  'projects',
  'uses',
  'wallpapers',
  'appearances',
  'stats',
  'areas',
]
const DETAILS: string[] = [...CONTENT_TYPES, 'areas']

export const markdownPathFor = (pathname: string) => {
  const [section, id, ...rest] = pathname.split('/').filter(Boolean)
  if (!section || rest.length) return undefined
  if (!id) return LISTINGS.includes(section) ? `/${section}.md` : undefined
  return DETAILS.includes(section) ? `/${section}/${id}.md` : undefined
}
