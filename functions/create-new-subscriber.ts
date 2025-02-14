import { Handler } from '@netlify/functions'
import fetch from 'node-fetch'

class ClientError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ClientError'
  }
}

const validateEmail = (email: string | null) => {
  if (!email) throw new ClientError('Email is missing')
  if (
    email.match(
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    )
  ) {
    return email
  } else {
    throw new ClientError('Email is invalid')
  }
}

type Body = {
  email: string
  metadata?: {}
  notes?: string
  referrer_url?: string
  tags?: string[]
}

const validateBody = (body: string | null): Body => {
  if (!body) throw new ClientError('Body is missing')
  const parsedBody = JSON.parse(body) as Body
  validateEmail(parsedBody.email)
  return parsedBody
}

type Response = {
  creation_date: Date
  email: string
  id: string
  metadata: {}
  notes: string
  referrer_url: string
  secondary_id: number
  source: 'api'
  subscriber_type: 'regular'
  tags: string[]
  utm_campaign: string
  utm_medium: string
  utm_source: string
}

const createNewSubscriber = async (body: Body) => {
  try {
    return await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${process.env.BUTTONDOWN_API_KEY}`,
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((response) => {
        if (process.env.NODE_ENV !== 'test') console.info(response)
        // TODO: Handle non-201 responses (duplicate, error, etc...)
        return response
      })
      .then((body) => body as Response)
  } catch (e: unknown) {
    throw new Error('Error creating subscriber')
  }
}

const handler: Handler = async (event) => {
  try {
    const validatedBody = validateBody(event.body)
    await createNewSubscriber(validatedBody)
    return {
      statusCode: 201,
      body: 'Created new subscriber successfully',
    }
  } catch (e: unknown) {
    console.error(e)
    let body = e instanceof Error ? e.message : 'Error creating subscriber'
    const statusCode = e instanceof ClientError ? 400 : 500
    return { statusCode, body }
  }
}

export { validateEmail, validateBody, createNewSubscriber, handler }
