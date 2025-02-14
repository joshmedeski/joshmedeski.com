import {
  createNewSubscriber,
  validateBody,
  validateEmail,
} from '../create-new-subscriber'
import { describe, it, expect } from 'vitest'

describe('validateEmail', () => {
  it('should require value', () => {
    expect(() => validateEmail(null)).toThrowErrorMatchingInlineSnapshot(
      '"Email is missing"',
    )
  })
  it('should be an invalid email', () => {
    expect(() =>
      validateEmail('invalid-email'),
    ).toThrowErrorMatchingInlineSnapshot('"Email is invalid"')
  })
  it('should be an valid email', () => {
    expect(validateEmail('example@example.com')).toBe('example@example.com')
  })
})

describe('validateBody', () => {
  it('should require value', () => {
    expect(() => validateBody(null)).toThrowErrorMatchingInlineSnapshot(
      '"Body is missing"',
    )
  })
  it('should be an invalid email', () => {
    expect(() =>
      validateBody(JSON.stringify({ email: 'invalid-email' })),
    ).toThrowErrorMatchingInlineSnapshot('"Email is invalid"')
  })
  it('should be an valid body', () => {
    expect(
      validateBody(JSON.stringify({ email: 'example@example.com' })),
    ).toStrictEqual({
      email: 'example@example.com',
    })
  })
})

describe('createNewSubscriber', () => {
  it('should create a new subscriber', async () => {
    await expect(
      createNewSubscriber({
        email: 'example@example.com',
      }),
    ).resolves.toMatchInlineSnapshot(`
      {
        "creation_date": "2022-10-24T19:21:28.855Z",
        "email": "example@example.com",
        "id": "13399cbd-37a6-40f0-9d64-7b580a31ef02",
        "metadata": {},
        "notes": "",
        "secondary_id": 20,
        "source": "api",
        "subscriber_type": "regular",
        "tags": [],
        "utm_campaign": "",
        "utm_medium": "",
        "utm_source": "",
      }
    `)
  })
})
