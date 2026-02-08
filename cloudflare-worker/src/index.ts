interface Env {
  API_KEYS: string // Comma-separated list of valid API keys
  GOOGLE_BOOKS_API_KEY?: string // Google Books API key for higher quotas
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight - allow all origins
    if (request.method === 'OPTIONS') {
      return handleCORS()
    }

    // Validate API key
    const apiKey = request.headers.get('X-API-Key')
    const validKeys = env.API_KEYS.split(',').map((k) => k.trim())

    if (!apiKey || !validKeys.includes(apiKey)) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Route requests
    const url = new URL(request.url)
    const path = url.pathname

    try {
      if (path.startsWith('/isbn/')) {
        return await handleISBNLookup(path, url, env)
      }
      if (path.startsWith('/cover/')) {
        return await handleCoverImage(url)
      }
      return new Response('Not Found', { status: 404 })
    } catch {
      return new Response('Internal Error', { status: 500 })
    }
  }
}

function handleCORS(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'X-API-Key, Content-Type, Cache-Control',
      'Access-Control-Max-Age': '300'
    }
  })
}

function addCORSHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response)
  newResponse.headers.set('Access-Control-Allow-Origin', '*')
  return newResponse
}

async function handleISBNLookup(path: string, url: URL, env: Env): Promise<Response> {
  const pathPart = path.replace('/isbn/', '')
  const source = url.searchParams.get('source') || 'google'

  // Handle author lookup for Open Library
  if (pathPart === 'author') {
    const authorKey = url.searchParams.get('key')
    if (!authorKey) {
      return new Response('Missing key parameter', { status: 400 })
    }
    const targetUrl = `https://openlibrary.org${authorKey}.json`
    const response = await fetch(targetUrl)
    return addCORSHeaders(response)
  }

  const isbn = pathPart
  let targetUrl: string
  if (source === 'openlibrary') {
    targetUrl = `https://openlibrary.org/isbn/${isbn}.json`
  } else {
    targetUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
    if (env.GOOGLE_BOOKS_API_KEY) {
      targetUrl += `&key=${env.GOOGLE_BOOKS_API_KEY}`
    }
  }

  const response = await fetch(targetUrl)
  return addCORSHeaders(response)
}

async function handleCoverImage(url: URL): Promise<Response> {
  const imageUrl = url.searchParams.get('url')

  if (!imageUrl) {
    return new Response('Missing url parameter', { status: 400 })
  }

  // Validate allowed domains
  const allowedDomains = ['covers.openlibrary.org', 'books.google.com', 'www.googleapis.com']

  const targetDomain = new URL(imageUrl).hostname
  if (!allowedDomains.includes(targetDomain)) {
    return new Response('Domain not allowed', { status: 403 })
  }

  const response = await fetch(imageUrl)
  return addCORSHeaders(response)
}
