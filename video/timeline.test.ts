import { expect, test } from 'vitest'
import { timeline } from './timeline'

test('finds the step playing at a time and whether its key is held', () => {
  const steps = [
    { id: 'a', ms: 100 },
    { id: 'b', ms: 200, hold: 150 },
  ]
  const t = timeline(steps, 50)

  expect(t.ms).toBe(300)
  expect(t.at(0)).toEqual({ step: steps[0], held: true })
  expect(t.at(60)).toEqual({ step: steps[0], held: false })
  expect(t.at(100)).toEqual({ step: steps[1], held: true })
  expect(t.at(260)).toEqual({ step: steps[1], held: false })
  expect(t.at(999).step).toBe(steps[1])
})
