# Mochi Mango Arcade

Mochi Mango Arcade is a scalable, multilingual HTML5 game portal for **mochimangoarcade.com**, published by Fire Dragon Interactive.

## Included

- 392 playable browser games across 14 original universes.
- Shared HTML5 game engine supporting 30+ game modes.
- Illustrated game cards, character art, universe art and responsive play shells.
- Cloudflare D1 profile database for optional accounts, trophies and validated player progress.
- Character merchandise concept preview. Purchasing and checkout are intentionally disabled until a real commerce backend is connected.
- 18-language UI selector with RTL support for Arabic.
- Cloudflare Worker and Static Assets deployment with canonical-host routing, real 404 responses and production security headers.
- API routes: `/api/health`, `/api/games`, `/api/game/:slug`, `/api/products`, `/api/profile/*`.
- Sitemap, robots.txt, llms.txt, manifest and favicon.

## Production hardening

- Third-party advertising service-worker code has been removed.
- The cleanup service worker unregisters previous registrations and clears their caches.
- Third-party ad scripts are disabled until consent, child-safety and brand-safety controls are implemented.
- Synthetic ratings, review counts and public play counts are not displayed or exposed through the public API.
- Shop and newsletter features are labelled as previews rather than simulated as live services.

## Deploy

```bash
npm install
npm run dev
npm run deploy
```

For scaling, keep the portal and lightweight builds in Workers Static Assets. Put large finished game asset packs in Cloudflare R2 and reference them from play shells.
