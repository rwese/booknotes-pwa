interface Env {
  SENTRY_DSN: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Only proxy /api/* requests to Sentry
    if (!url.pathname.startsWith('/api/')) {
      return new Response('Not Found', { status: 404 })
    }

    // Forward the request to Sentry
    const sentryUrl = `${env.SENTRY_DSN}${url.pathname}${url.search}`
    
    const sentryRequest = new Request(sentryUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    })

    try {
      const response = await fetch(sentryRequest)
      
      // Return the response with CORS headers
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          ...Object.fromEntries(response.headers)
        }
      })
    } catch (error) {
      return new Response('Sentry proxy error', { status: 500 })
    }
  }
} satisfies ExportedHandler<Env>
