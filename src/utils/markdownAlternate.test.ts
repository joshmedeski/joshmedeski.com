import { describe, expect, it } from 'vitest'
import { isAgent, markdownPathFor, wantsMarkdown } from './markdownAlternate'

describe('markdownPathFor', () => {
  it('maps content pages to their markdown version', () => {
    expect(markdownPathFor('/projects/sesh/')).toBe('/projects/sesh.md')
    expect(markdownPathFor('/posts/abbreviate-everything')).toBe(
      '/posts/abbreviate-everything.md',
    )
    expect(markdownPathFor('/areas/tmux/')).toBe('/areas/tmux.md')
  })

  it('maps listing pages to their markdown version', () => {
    expect(markdownPathFor('/posts/')).toBe('/posts.md')
    expect(markdownPathFor('/wallpapers/')).toBe('/wallpapers.md')
    expect(markdownPathFor('/stats')).toBe('/stats.md')
  })

  it('skips pages without a markdown version', () => {
    expect(markdownPathFor('/')).toBeUndefined()
    expect(markdownPathFor('/about/')).toBeUndefined()
    expect(markdownPathFor('/wallpapers/alien-forest/')).toBeUndefined()
    expect(
      markdownPathFor('/appearances/zsa-people-interview/'),
    ).toBeUndefined()
    expect(markdownPathFor('/posts/a/b/')).toBeUndefined()
    expect(markdownPathFor('/posts/sesh.md')).toBeUndefined()
  })
})

describe('wantsMarkdown', () => {
  it('matches an Accept header that lists text/markdown', () => {
    expect(wantsMarkdown('text/markdown')).toBe(true)
    expect(wantsMarkdown('text/markdown;q=0.9, text/html;q=0.8')).toBe(true)
    expect(wantsMarkdown('text/html, text/markdown')).toBe(true)
  })

  it('ignores browser and missing Accept headers', () => {
    expect(wantsMarkdown(null)).toBe(false)
    expect(wantsMarkdown('*/*')).toBe(false)
    expect(
      wantsMarkdown('text/html,application/xhtml+xml,application/xml;q=0.9'),
    ).toBe(false)
  })
})

describe('isAgent', () => {
  it('matches user-triggered AI fetchers', () => {
    expect(
      isAgent(
        'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot',
      ),
    ).toBe(true)
    expect(isAgent('Claude-User/1.0')).toBe(true)
    expect(isAgent('Perplexity-User/1.0')).toBe(true)
  })

  it('ignores browsers, crawlers, and missing user agents', () => {
    expect(isAgent(null)).toBe(false)
    expect(
      isAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
      ),
    ).toBe(false)
    expect(isAgent('Mozilla/5.0 (compatible; GPTBot/1.2)')).toBe(false)
    expect(isAgent('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe(false)
  })
})
