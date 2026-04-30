const { http, HttpResponse } = require('msw')
const { setupServer } = require('msw/node')

const server = setupServer(
  http.post(
    'https://api.buttondown.email/v1/subscribers',
    async ({ request }) => {
      const body = await request.json()
      const response = {
        creation_date: '2022-10-24T19:21:28.855Z',
        email: body.email,
        id: '13399cbd-37a6-40f0-9d64-7b580a31ef02',
        notes: '',
        metadata: {},
        secondary_id: 20,
        subscriber_type: 'regular',
        source: 'api',
        tags: body.tags ?? [],
        utm_campaign: '',
        utm_medium: '',
        utm_source: '',
      }
      if (body.referrer_url) response.referrer_url = body.referrer_url
      return HttpResponse.json(response)
    },
  ),
)

if (process.env.NODE_ENV !== 'test') {
  server.listen({ onUnhandledRequest: 'bypass' })
  console.info('🔶 Mock server running')

  process.once('SIGINT', () => server.close())
  process.once('SIGTERM', () => server.close())
}

module.exports = { server }
