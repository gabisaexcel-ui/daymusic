/**
 * Cloudflare Worker - YouTube Music InnerTube Edge Proxy & SPA Static Asset Server
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Proxy requests to YouTube Music InnerTube API
    if (url.pathname.startsWith('/api/') || url.pathname === '/api') {
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
        const subpath = url.pathname.replace(/^\/?api\/?/, '');
        const targetUrl = new URL(`https://music.youtube.com/youtubei/v1/${subpath}`);
        if (!targetUrl.searchParams.has('key')) {
          targetUrl.searchParams.set('key', 'AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30');
        }

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

    // Serve static assets for all other routes
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};
