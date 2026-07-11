# Mochi Mango Arcade

Polished, scalable, multilingual HTML5 game portal and merch shop for **mochimangoarcade.com**.

Footer credit is included on every page:

**© 2026 by Fire Dragon Interactive · www.firedragoninteractive.com**

## Included

- 384 game catalogue across 14 universes with generated detail + play pages.
- Shared HTML5 game engine (`mmengine.js`) supporting 30+ game modes.
- 7 built-out universes with per-game illustrated SVG card art:
  `Tabletop Kingdom` · `Puzzle Realm` · `Candy Galaxy` · `Mango Island` · `Mochi World` · `Panda Kingdom` · `Pixel Playground`
- Monetag rewarded ad integration with mode-specific boost benefits.
- Cloudflare D1 profile database for accounts and trophies.
- Merch shop with product filters, product pages and localStorage cart.
- 18-language UI selector with RTL support for Arabic.
- SVG logo, hero artwork, 380+ game card SVGs, character icons, universe art and product images.
- Modern responsive UI with universe-aware arcade bezels, floating orbs, cursor sparkles, VFX and reduced-motion support.
- Cloudflare Worker + Static Assets setup with SPA routing.
- API routes: `/api/health`, `/api/games`, `/api/game/:slug`, `/api/products`, `/api/profile/*`.
- Sitemap, robots.txt, llms.txt, manifest and favicon.

## Deploy

```bash
npm install
npm run dev
npm run deploy
```

For scaling: keep the portal and lightweight builds in Workers Static Assets or Pages. Put large finished game asset packs in Cloudflare R2 and reference them from play shells.

## Merch shop

The shop is a front-end mockup. Connect Shopify, WooCommerce, Snipcart, Medusa, Stripe or a custom Cloudflare backend for real checkout.
