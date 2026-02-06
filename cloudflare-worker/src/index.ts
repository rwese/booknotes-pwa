interface Env {
  API_KEYS: string // Comma-separated list of valid API keys
  GOOGLE_BOOKS_API_KEY?: string // Google Books API key for higher quotas
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') || ''

    // Validate origin for CORS
    if (!isAllowedOrigin(origin)) {
      // For preflight OPTIONS, still validate origin
      if (request.method === 'OPTIONS') {
        return new Response('CORS not allowed', { status: 403 })
      }
      // For actual requests, check API key but still reject CORS
      const apiKey = request.headers.get('X-API-Key')
      const validKeys = env.API_KEYS.split(',').map((k) => k.trim())
      if (!apiKey || !validKeys.includes(apiKey)) {
        return new Response('Unauthorized', { status: 401 })
      }
      return new Response('CORS not allowed', { status: 403 })
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(origin)
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
        return await handleISBNLookup(path, url, env, origin)
      }
      if (path.startsWith('/cover/')) {
        return await handleCoverImage(url, origin)
      }
      return new Response('Not Found', { status: 404 })
    } catch {
      return new Response('Internal Error', { status: 500 })
    }
  }
}

function isAllowedOrigin(origin: string): boolean {
  try {
    const url = new URL(origin)
    return url.hostname.endsWith('.nope.at') || url.hostname === 'nope.at'
  } catch {
    return false
  }
}

function handleCORS(origin: string): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'X-API-Key, Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  })
}

function addCORSHeaders(response: Response, origin: string): Response {
  const newResponse = new Response(response.body, response)
  newResponse.headers.set('Access-Control-Allow-Origin', origin)
  return newResponse
}

async function handleISBNLookup(path: string, url: URL, env: Env, origin: string): Promise<Response> {
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
    return addCORSHeaders(response, origin)
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
  return addCORSHeaders(response, origin)
}

async function handleCoverImage(url: URL, origin: string): Promise<Response> {
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
  return addCORSHeaders(response, origin)
}
