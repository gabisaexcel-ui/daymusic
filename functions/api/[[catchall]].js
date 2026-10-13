/**
 * Cloudflare Pages Function - YouTube Music InnerTube Edge Proxy
 * Handles CORS and proxies requests to https://music.youtube.com/youtubei/v1/
 */
export async function onRequest(context) {
  const { request } = context;

  // Handle CORS preflight options request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Origin, X-Goog-AuthUser',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    const url = new URL(request.url);
    // Remove '/api/' from the pathname to get the InnerTube endpoint (e.g., 'browse', 'search', 'next')
    const subpath = url.pathname.replace(/^\/?api\/?/, '');
    
    // Check if query already has key, otherwise append default client key
    const targetUrl = new URL(`https://music.youtube.com/youtubei/v1/${subpath}`);
    if (!targetUrl.searchParams.has('key')) {
      targetUrl.searchParams.set('key', 'AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30');
    }

    // Forward query params if any
    url.searchParams.forEach((val, key) => {
      if (key !== 'key') targetUrl.searchParams.set(key, val);
    });

    const body = request.method === 'POST' ? await request.text() : undefined;

    const proxyHeaders = {
      'Content-Type': 'application/json',
      'Origin': 'https://music.youtube.com',
      'Referer': 'https://music.youtube.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    // Forward any user authorization or cookie headers if provided
    const authHeader = request.headers.get('Authorization');
    if (authHeader) proxyHeaders['Authorization'] = authHeader;
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) proxyHeaders['Cookie'] = cookieHeader;

    const ytResponse = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: proxyHeaders,
      body,
    });

    const responseBody = await ytResponse.text();

    return new Response(responseBody, {
      status: ytResponse.status,
      headers: {
        'Content-Type': ytResponse.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Origin, X-Goog-AuthUser',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy failed', details: err?.message || String(err) }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
