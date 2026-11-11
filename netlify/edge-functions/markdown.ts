import {
  isAgent,
  markdownPathFor,
  wantsMarkdown,
} from '../../src/utils/markdownAlternate.ts'

type Context = { next: () => Promise<Response> }

export default async (request: Request, context: Context) => {
  const markdownPath = markdownPathFor(new URL(request.url).pathname)
  if (!markdownPath) return

  const asMarkdown =
    wantsMarkdown(request.headers.get('accept')) ||
    isAgent(request.headers.get('user-agent'))

  const response = asMarkdown
    ? await fetch(new URL(markdownPath, request.url))
    : await context.next()

  const headers = new Headers(response.headers)
  headers.append('Vary', 'Accept, User-Agent')
  return new Response(response.body, { status: response.status, headers })
}

export const config = {
  path: [
    '/posts',
    '/posts/*',
    '/videos',
    '/guides',
    '/guides/*',
    '/projects',
    '/projects/*',
    '/uses',
    '/uses/*',
    '/wallpapers',
    '/appearances',
    '/stats',
    '/areas',
    '/areas/*',
  ],
  excludedPath: ['/*.md', '/**/*.md'],
}
