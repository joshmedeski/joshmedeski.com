import { describe, it, expect } from 'vitest'
import { pillClass } from './pills'

describe('pillClass', () => {
  it('defaults to the small pill', () => {
    expect(pillClass()).toBe(pillClass('sm'))
  })

  it('shares the same surface across sizes', () => {
    for (const cls of ['rounded-full', 'bg-neutral-800', 'text-neutral-200']) {
      expect(pillClass('sm')).toContain(cls)
      expect(pillClass('lg')).toContain(cls)
    }
  })

  it('scales type and padding up for the large pill', () => {
    expect(pillClass('sm')).toContain('text-sm')
    expect(pillClass('lg')).toContain('md:text-lg')
    expect(pillClass('lg')).toContain('px-4')
  })
})
