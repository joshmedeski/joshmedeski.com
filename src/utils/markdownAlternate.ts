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
  if (pathname.endsWith('.md')) return undefined
  const [section, id, ...rest] = pathname.split('/').filter(Boolean)
  if (!section || rest.length) return undefined
  if (!id) return LISTINGS.includes(section) ? `/${section}.md` : undefined
  return DETAILS.includes(section) ? `/${section}/${id}.md` : undefined
}

export const wantsMarkdown = (accept: string | null) =>
  /(^|,)\s*text\/markdown\s*(;|,|$)/i.test(accept ?? '')

const AGENT_USER_AGENTS = /\b(ChatGPT-User|Claude-User|Perplexity-User)\b/i

export const isAgent = (userAgent: string | null) =>
  AGENT_USER_AGENTS.test(userAgent ?? '')
