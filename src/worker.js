import { handleProfileApi } from './profile-api.js';

const MONETAG_LOADER_TAG = '<script src="/js/monetag-loader.js" defer></script>';

function isEmbeddedGameDocument(pathname) {
  return /^\/play\/(?:[^/]+\/)?game(?:\/|$)/.test(pathname);
}

async function injectPlatformHead(response, pathname) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html') || isEmbeddedGameDocument(pathname)) return response;

  const html = await response.text();
  if (html.includes('/js/monetag-loader.js') || !/<\/head>/i.test(html)) {
    return new Response(html, response);
  }

  return new Response(html.replace(/<\/head>/i, `${MONETAG_LOADER_TAG}</head>`), response);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const requestHost = (request.headers.get('host') || '').split(':')[0];
    // canonical host is www — redirect the bare apex so search engines see one URL
    if (url.hostname === 'mochimangoarcade.com' && !/^(localhost|127\.0\.0\.1)$/.test(requestHost)) {
      url.hostname = 'www.mochimangoarcade.com';
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname === '/play/game' || url.pathname.startsWith('/play/game/')) {
      return Response.redirect(new URL('/games/', url), 301);
    }
    const profileResponse = await handleProfileApi(request, env, ctx);
    if (profileResponse) return profileResponse;
    if (url.pathname === '/api/health') return Response.json({ ok: true, name: 'Mochi Mango Arcade' });
    if (url.pathname === '/api/games') return env.ASSETS.fetch(new Request(new URL('/assets/data/games.json', url)));
    if (url.pathname === '/api/products') return env.ASSETS.fetch(new Request(new URL('/assets/data/products.json', url)));
    if (url.pathname.startsWith('/api/game/')) {
      const slug = url.pathname.split('/').pop();
      const games = await (await env.ASSETS.fetch(new Request(new URL('/assets/data/games.json', url)))).json();
      const game = games.find(g => g.slug === slug);
      return Response.json(game || null, { status: game ? 200 : 404 });
    }
    const response = await env.ASSETS.fetch(request);
    return injectPlatformHead(response, url.pathname);
  }
};
