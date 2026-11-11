import { describe, expect, it } from 'vitest'
import { markdownPathFor } from './markdownAlternate'

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
  })
})
