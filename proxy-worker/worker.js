const ALLOWED_PREFIXES = ['/v1/', '/v2/']

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(),
      })
    }

    if (request.method !== 'GET') {
      return json(
        { error: 'Method not allowed' },
        405,
      )
    }

    const path = url.pathname
    const isAllowed = ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))
    if (!isAllowed) {
      return json(
        { error: 'Endpoint not allowed by proxy' },
        403,
      )
    }

    const upstreamUrl = `https://fortnite-api.com${path}${url.search}`
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        Authorization: env.FORTNITE_API_KEY,
      },
    })

    const responseHeaders = new Headers(upstreamResponse.headers)
    applyCors(responseHeaders)
    responseHeaders.set('Cache-Control', 'public, max-age=60')

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    })
  },
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function applyCors(headers) {
  Object.entries(corsHeaders()).forEach(([key, value]) => {
    headers.set(key, value)
  })
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  })
}
