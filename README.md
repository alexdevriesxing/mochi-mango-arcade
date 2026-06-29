# Mochi Mango Arcade

Polished, scalable, multilingual HTML5 game portal and merch shop for **mochimangoarcade.com**.

Footer credit is included on every page:

**© 2026 by Fire Dragon Interactive · www.firedragoninteractive.com**

## Included

- 200 game catalogue with generated detail pages.
- 200 play-shell pages ready for real HTML5 builds.
- Merch shop with product filters, product pages and localStorage cart.
- 18-language UI selector with RTL support for Arabic.
- SVG logo, hero artwork, 200 generated game thumbnails, character icons, universe art and product images.
- Modern responsive UI, hover tilt, floating orbs, cursor sparkles, VFX and reduced-motion support.
- Adsterra-ready placement zones and ad placement map.
- Cloudflare Worker + Static Assets setup.
- API routes: `/api/health`, `/api/games`, `/api/game/:slug`, `/api/products`.
- Sitemap, robots, manifest and favicon.

## Deploy

```bash
npm install
npm run dev
npm run deploy
```

For scaling: keep the portal and lightweight builds in Workers Static Assets or Pages. Put large finished game asset packs in Cloudflare R2 and reference them from play shells.

## Merch shop

The shop is a front-end mockup. Connect Shopify, WooCommerce, Snipcart, Medusa, Stripe or a custom Cloudflare backend for real checkout.
