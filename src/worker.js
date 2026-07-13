import { handleProfileApi } from './profile-api.js';

const CANONICAL_HOST = 'www.mochimangoarcade.com';
const HARDENING_SCRIPT = '<script src="/js/site-hardening.js"></script>';
const HARDENING_STYLESHEET = '<link rel="stylesheet" href="/assets/css/hardening.css">';

function isEmbeddedGameDocument(pathname) {
  return /^\/play\/(?:[^/]+\/)?game(?:\/|$)/.test(pathname);
}

function isHtmlResponse(response) {
  return (response.headers.get('content-type') || '').includes('text/html');
}

function deleteStructuredField(value, key) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) deleteStructuredField(item, key);
    return;
  }
  delete value[key];
  for (const item of Object.values(value)) deleteStructuredField(item, key);
}

function sanitizeStructuredData(value) {
  deleteStructuredField(value, 'aggregateRating');
  deleteStructuredField(value, 'review');
  deleteStructuredField(value, 'reviewRating');
  deleteStructuredField(value, 'potentialAction');

  const visit = node => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    const type = node['@type'];
    if (type === 'Product') {
      delete node.offers;
      node.description = String(node.description || '').replace(/available|in stock/gi, 'planned');
    }
    if (type === 'Organization' && typeof node.description === 'string') {
      node.description = node.description.replace(/character merch shop/gi, 'character merchandise preview');
    }
    if (type === 'FAQPage' && Array.isArray(node.mainEntity)) {
      for (const item of node.mainEntity) {
        if (/buy plushies|buy merch/i.test(item?.name || '')) {
          item.acceptedAnswer = {
            '@type': 'Answer',
            text: 'Character merchandise is currently shown as a concept preview. Purchasing is not yet available.'
          };
        }
      }
    }
    Object.values(node).forEach(visit);
  };
  visit(value);
  return value;
}

class JsonLdSanitizer {
  constructor() {
    this.buffer = '';
  }

  text(chunk) {
    this.buffer += chunk.text;
    chunk.remove();
    if (!chunk.lastInTextNode) return;
    try {
      chunk.after(JSON.stringify(sanitizeStructuredData(JSON.parse(this.buffer))), { html: false });
    } catch {
      chunk.after(this.buffer, { html: false });
    }
  }
}

function hardenHtml(response, pathname) {
  if (!isHtmlResponse(response) || isEmbeddedGameDocument(pathname)) return response;

  return new HTMLRewriter()
    .on('meta[name="keywords"]', { element: element => element.remove() })
    .on('script[src*="monetag-loader"]', { element: element => element.remove() })
    .on('script[src*="demolishwrestconclusions.com"]', { element: element => element.remove() })
    .on('script[src*="n6wxm.com"]', { element: element => element.remove() })
    .on('script[src*="5gvci.com"]', { element: element => element.remove() })
    .on('script[type="application/ld+json"]', new JsonLdSanitizer())
    .on('.ad-slot', { element: element => element.remove() })
    .on('.product-rating-row', { element: element => element.remove() })
    .on('.rating', { element: element => element.remove() })
    .on('head', {
      element(element) {
        element.append(HARDENING_STYLESHEET, { html: true });
      }
    })
    .on('body', {
      element(element) {
        element.append(HARDENING_SCRIPT, { html: true });
      }
    })
    .transform(response);
}

function withSecurityHeaders(response, url) {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob:",
      "media-src 'self' blob:",
      "connect-src 'self'",
      "frame-src 'self'",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      'upgrade-insecure-requests'
    ].join('; ')
  );

  if (url.hostname.endsWith('.workers.dev')) headers.set('X-Robots-Tag', 'noindex, nofollow');
  if (/^\/shop\/[^/]+\/$/.test(url.pathname) || ['/leaderboards/', '/adsterra-map/'].includes(url.pathname)) {
    headers.set('X-Robots-Tag', 'noindex, follow');
  }
  if (url.pathname === '/sw.js') {
    headers.set('Cache-Control', 'no-store, max-age=0');
    headers.set('Service-Worker-Allowed', '/');
  } else if (isHtmlResponse(response)) {
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function sanitizeGame(game) {
  if (!game || typeof game !== 'object') return game;
  const { rating, plays, merchHook, status, ...safe } = game;
  return safe;
}

async function assetJson(env, url, pathname) {
  const response = await env.ASSETS.fetch(new Request(new URL(pathname, url), { headers: { Accept: 'application/json' } }));
  if (!response.ok) return response;
  return response.json();
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const requestHost = (request.headers.get('host') || '').split(':')[0];

    if (url.hostname === 'mochimangoarcade.com' && !/^(localhost|127\.0\.0\.1)$/.test(requestHost)) {
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === '/play/game' || url.pathname.startsWith('/play/game/')) {
      return Response.redirect(new URL('/games/', url), 301);
    }

    const profileResponse = await handleProfileApi(request, env, ctx);
    if (profileResponse) return withSecurityHeaders(profileResponse, url);

    if (url.pathname === '/api/health') {
      return withSecurityHeaders(Response.json({ ok: true, name: 'Mochi Mango Arcade', hardened: true }), url);
    }

    if (url.pathname === '/api/games') {
      const games = await assetJson(env, url, '/assets/data/games.json');
      const response = games instanceof Response ? games : Response.json(games.map(sanitizeGame));
      return withSecurityHeaders(response, url);
    }

    if (url.pathname === '/api/products') {
      const products = await assetJson(env, url, '/assets/data/products.json');
      const response = products instanceof Response
        ? products
        : Response.json(products.map(product => ({ ...product, commerceStatus: 'preview', availableForPurchase: false })));
      return withSecurityHeaders(response, url);
    }

    if (url.pathname.startsWith('/api/game/')) {
      const slug = url.pathname.split('/').filter(Boolean).pop();
      const games = await assetJson(env, url, '/assets/data/games.json');
      if (games instanceof Response) return withSecurityHeaders(games, url);
      const game = games.find(item => item.slug === slug);
      return withSecurityHeaders(Response.json(game ? sanitizeGame(game) : null, { status: game ? 200 : 404 }), url);
    }

    let response = await env.ASSETS.fetch(request);

    if (url.pathname === '/llms.txt' && response.ok) {
      let text = await response.text();
      text = text
        .replace(/also sold as plushies, apparel, pins and stickers in the merch shop\./gi, 'planned for future character merchandise concepts.')
        .replace(/Official Mochi Mango Arcade merch[^\n]+is available in the on-site merch shop\./gi, 'Character merchandise is currently a concept preview and is not yet available for purchase.')
        .replace(/\[Merch shop\]\([^\)]+\): plushies and collectibles\./gi, '[Merch preview](https://www.mochimangoarcade.com/shop/): planned character merchandise concepts.');
      response = new Response(text, response);
    }

    response = hardenHtml(response, url.pathname);
    return withSecurityHeaders(response, url);
  }
};
