import type { Context } from '@netlify/functions'

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

type SubscriberResponse = {
  creation_date: string
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

const createNewSubscriber = async (body: Body): Promise<SubscriberResponse> => {
  const response = await fetch('https://api.buttondown.email/v1/subscribers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${process.env.BUTTONDOWN_API_KEY}`,
    },
    body: JSON.stringify(body),
  })
  const data = (await response.json()) as SubscriberResponse
  if (process.env.NODE_ENV !== 'test') console.info(data)
  return data
}

export default async (req: Request, _ctx: Context): Promise<Response> => {
  try {
    const validatedBody = validateBody(await req.text())
    await createNewSubscriber(validatedBody)
    return new Response('Created new subscriber successfully', { status: 201 })
  } catch (e: unknown) {
    console.error(e)
    const body = e instanceof Error ? e.message : 'Error creating subscriber'
    const status = e instanceof ClientError ? 400 : 500
    return new Response(body, { status })
  }
}

export { validateEmail, validateBody, createNewSubscriber }
