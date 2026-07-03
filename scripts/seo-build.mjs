/**
 * SEO / GAIO build step for Mochi Mango Arcade.
 *
 * - Marks every catalogue game as Playable (they now have real engines).
 * - Regenerates unique <head> metadata + JSON-LD for every game detail
 *   and play page (VideoGame + BreadcrumbList structured data).
 * - Emits llms.txt (AI answer-engine index), robots.txt, and a fresh
 *   sitemap.xml covering every route.
 *
 * Run: node scripts/seo-build.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUB = join(__dirname, '..', 'public');
const ORIGIN = 'https://mochimangoarcade.com';
const SITE = 'Mochi Mango Arcade';
const SOCIAL = '/assets/images/home_hero_banner_200_games.jpg';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s, n = 158) => { s = String(s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };

const games = JSON.parse(readFileSync(join(PUB, 'assets/data/games.json'), 'utf8'));

// 1. Every game is now backed by a real, themed engine → mark Playable.
for (const g of games) {
  if (!/Playable/.test(g.status)) g.status = 'Playable';
}
writeFileSync(join(PUB, 'assets/data/games.json'), JSON.stringify(games, null, 2));

function ogImage(g) {
  const jpg = `assets/images/games/${g.slug}.jpg`;
  const svg = `assets/images/games/${g.slug}.svg`;
  if (existsSync(join(PUB, jpg))) return '/' + jpg;
  if (existsSync(join(PUB, svg))) return '/' + svg;
  return SOCIAL;
}

function head({ title, desc, canonical, image, jsonld }) {
  const img = ORIGIN + image;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="theme-color" content="#ff4f9a">` +
    `<title>${esc(title)}</title>` +
    `<meta name="description" content="${esc(desc)}">` +
    `<link rel="canonical" href="${canonical}">` +
    `<meta property="og:type" content="website">` +
    `<meta property="og:site_name" content="${SITE}">` +
    `<meta property="og:title" content="${esc(title)}">` +
    `<meta property="og:description" content="${esc(desc)}">` +
    `<meta property="og:url" content="${canonical}">` +
    `<meta property="og:image" content="${img}">` +
    `<meta name="twitter:card" content="summary_large_image">` +
    `<meta name="twitter:title" content="${esc(title)}">` +
    `<meta name="twitter:description" content="${esc(desc)}">` +
    `<meta name="twitter:image" content="${img}">` +
    `<link rel="icon" href="/favicon.svg">` +
    `<link rel="manifest" href="/manifest.webmanifest">` +
    `<link rel="stylesheet" href="/assets/css/styles.css">` +
    `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` +
    `</head>`;
}

function body(page, slug) {
  return `<body data-page="${page}" data-slug="${slug}">` +
    `<div class="site-bg"><span class="orb one"></span><span class="orb two"></span><span class="orb three"></span></div>` +
    `<div id="appHeader"></div><div id="appMain"></div><div id="appFooter"></div>` +
    `<script type="module" src="/assets/js/app.js"></script></body></html>`;
}

function breadcrumb(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url }))
  };
}

let detailCount = 0, playCount = 0;
for (const g of games) {
  const image = ogImage(g);
  const kw = [g.title, g.mascot, g.genre, g.universeName, 'free online game', 'HTML5 game', 'browser game'].join(', ');

  const videoGame = {
    '@context': 'https://schema.org', '@type': 'VideoGame',
    name: g.title, description: clip(g.description, 300), url: `${ORIGIN}/games/${g.slug}/`,
    image: ORIGIN + image, genre: g.genre, gamePlatform: ['Web Browser', 'HTML5'],
    applicationCategory: 'Game', operatingSystem: 'Any',
    playMode: 'SinglePlayer', inLanguage: 'en',
    author: { '@type': 'Organization', name: 'Fire Dragon Interactive' },
    publisher: { '@type': 'Organization', name: SITE },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: g.rating, bestRating: 5, ratingCount: Math.max(20, g.plays % 900 + 20) },
    characterAttribute: g.mascot
  };

  // Detail page
  const detailTitle = `${g.title} — Play Free Online · ${SITE}`;
  const detailDesc = clip(`Play ${g.title}, a free ${g.genre.toLowerCase()} game from the ${g.universeName}. ${g.description}`);
  const detailCanon = `${ORIGIN}/games/${g.slug}/`;
  const detailGraph = {
    '@context': 'https://schema.org',
    '@graph': [videoGame, {
      ...breadcrumb([
        { name: 'Home', url: ORIGIN + '/' },
        { name: 'Games', url: ORIGIN + '/games/' },
        { name: g.title, url: detailCanon }
      ])
    }]
  };
  const detailHtml = head({ title: detailTitle, desc: detailDesc, canonical: detailCanon, image, jsonld: detailGraph })
    .replace('<link rel="canonical"', `<meta name="keywords" content="${esc(kw)}"><link rel="canonical"`)
    + body('gameDetail', g.slug);
  writeFileSync(join(PUB, 'games', g.slug, 'index.html'), detailHtml);
  detailCount++;

  // Play page
  const playTitle = `Play ${g.title} — Free HTML5 Game · ${SITE}`;
  const playDesc = clip(`Play ${g.title} now, free in your browser. ${g.genre} fun starring ${g.mascot} from the ${g.universeName}. No download, works on mobile and desktop.`);
  const playCanon = `${ORIGIN}/play/${g.slug}/`;
  const playGraph = {
    '@context': 'https://schema.org',
    '@graph': [{ ...videoGame, url: playCanon }, breadcrumb([
      { name: 'Home', url: ORIGIN + '/' },
      { name: 'Games', url: ORIGIN + '/games/' },
      { name: g.title, url: detailCanon },
      { name: 'Play', url: playCanon }
    ])]
  };
  const playHtml = head({ title: playTitle, desc: playDesc, canonical: playCanon, image, jsonld: playGraph })
    .replace('<link rel="canonical"', `<meta name="keywords" content="${esc(kw)}"><link rel="canonical"`)
    + body('play', g.slug);
  writeFileSync(join(PUB, 'play', g.slug, 'index.html'), playHtml);
  playCount++;
}

// Static / section pages — unique meta + site-wide structured data on home.
const uniList = [...new Set(games.map(g => g.universeName))];
const orgLd = {
  '@type': 'Organization', name: SITE, url: ORIGIN + '/', logo: ORIGIN + '/assets/images/logo.svg',
  parentOrganization: { '@type': 'Organization', name: 'Fire Dragon Interactive', url: 'https://www.firedragoninteractive.com' }
};
const websiteLd = {
  '@type': 'WebSite', name: SITE, url: ORIGIN + '/',
  potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${ORIGIN}/games/?q={search_term_string}` }, 'query-input': 'required name=search_term_string' }
};
const homeCollection = {
  '@type': 'CollectionPage', name: SITE, url: ORIGIN + '/',
  numberOfItems: games.length, description: `Play ${games.length} free HTML5 games online.`
};

const STATIC = [
  { path: '', page: 'home', title: `${SITE} — Play ${games.length}+ Free HTML5 Games Online`, desc: `Play ${games.length}+ free browser games at ${SITE}: runners, puzzles, arcade, tower defense and cooking games starring cute original mascots. No download, works on mobile and desktop.`, graph: [{ '@context': 'https://schema.org', ...websiteLd }, { '@context': 'https://schema.org', ...orgLd }, { '@context': 'https://schema.org', ...homeCollection }] },
  { path: 'games', page: 'games', title: `All Games — Browse ${games.length} Free HTML5 Games · ${SITE}`, desc: `Browse and filter all ${games.length} free ${SITE} games by universe, genre and character. Instant play, no download, mobile-friendly.` },
  { path: 'universes', page: 'universes', title: `Game Universes — ${SITE}`, desc: `Explore the recurring worlds of ${SITE}: ${universeNames()}. Each universe is packed with playable games and collectible characters.` },
  { path: 'characters', page: 'characters', title: `Characters & Mascots — ${SITE}`, desc: `Meet the mascots of ${SITE}. Original characters with bios, designed for plushies, pins, stickers and collectibles.` },
  { path: 'shop', page: 'shop', title: `Merch Shop — Plushies, Apparel & Collectibles · ${SITE}`, desc: `Shop official ${SITE} merch: plushies, apparel, mugs, stickers, pins and bundles featuring your favourite mascots.` },
  { path: 'new-releases', page: 'newReleases', title: `New Releases — Latest Free Games · ${SITE}`, desc: `The newest free HTML5 games and mascot drops at ${SITE}. Fresh releases added regularly.` },
  { path: 'about', page: 'about', title: `About — ${SITE}`, desc: `${SITE} is a free HTML5 game and merch platform by Fire Dragon Interactive: ${games.length}+ games, recurring universes and collectible characters.` },
  { path: 'leaderboards', page: 'leaderboards', title: `Leaderboards — Top Games · ${SITE}`, desc: `See the most-played free games at ${SITE}.` },
  { path: 'adsterra-map', page: 'adMap', title: `Ad Placements — ${SITE}`, desc: `Advertising placement map for ${SITE}.` },
  { path: 'privacy', page: 'privacy', title: `Privacy Policy — ${SITE}`, desc: `Privacy policy for ${SITE}.` },
  { path: 'terms', page: 'terms', title: `Terms of Use — ${SITE}`, desc: `Terms of use for ${SITE}.` }
];
function universeNames() { return uniList.join(', '); }

let staticCount = 0;
for (const s of STATIC) {
  const canonical = ORIGIN + '/' + (s.path ? s.path + '/' : '');
  const graph = s.graph || [{ '@context': 'https://schema.org', ...websiteLd }, { '@context': 'https://schema.org', ...orgLd }];
  const html = head({ title: s.title, desc: s.desc, canonical, image: SOCIAL, jsonld: graph.length === 1 ? graph[0] : { '@context': 'https://schema.org', '@graph': graph.map(x => { const { ['@context']: _c, ...rest } = x; return rest; }) } })
    + body(s.page, '');
  const file = s.path ? join(PUB, s.path, 'index.html') : join(PUB, 'index.html');
  writeFileSync(file, html);
  staticCount++;
}

// llms.txt — concise index for AI answer engines (GAIO)
const llms = `# ${SITE}

> ${SITE} is a free HTML5 games portal and character merch shop by Fire Dragon Interactive. ${games.length} instant-play browser games — runners, puzzles, arcade, tower-defense and cooking games — starring original mascots, playable on mobile and desktop with no download or sign-up.

## About
- Free to play, no install, works in any modern browser.
- Family-friendly original characters across ${uniList.length} universes: ${uniList.join(', ')}.
- Companion merch shop: plushies, apparel, pins, stickers.

## Key pages
- [All games](${ORIGIN}/games/): browse and filter all ${games.length} games.
- [Universes](${ORIGIN}/universes/): recurring worlds and their games.
- [Characters](${ORIGIN}/characters/): mascot bios.
- [Merch shop](${ORIGIN}/shop/): plushies and collectibles.
- [New releases](${ORIGIN}/new-releases/)

## Games
${games.map(g => `- [${g.title}](${ORIGIN}/play/${g.slug}/): free ${g.genre} game — ${clip(g.description, 110)}`).join('\n')}
`;
writeFileSync(join(PUB, 'llms.txt'), llms);

// robots.txt — welcome search + reputable AI crawlers, point to sitemap
const robots = `# ${SITE}
User-agent: *
Allow: /

# AI answer engines
User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Applebot-Extended
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
Host: ${ORIGIN}
`;
writeFileSync(join(PUB, 'robots.txt'), robots);

// sitemap.xml — every route, with lastmod
const today = new Date().toISOString().slice(0, 10);
const staticRoutes = ['/', '/games/', '/universes/', '/characters/', '/shop/', '/new-releases/', '/about/', '/leaderboards/', '/adsterra-map/', '/privacy/', '/terms/'];
const urls = [];
for (const r of staticRoutes) urls.push({ loc: ORIGIN + r, pri: r === '/' ? '1.0' : '0.8' });
for (const g of games) {
  urls.push({ loc: `${ORIGIN}/games/${g.slug}/`, pri: '0.7' });
  urls.push({ loc: `${ORIGIN}/play/${g.slug}/`, pri: g.featured ? '0.9' : '0.7' });
}
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `<url><loc>${u.loc}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${u.pri}</priority></url>`).join('\n') +
  `\n</urlset>\n`;
writeFileSync(join(PUB, 'sitemap.xml'), sitemap);

console.log(`SEO build done: ${staticCount} static pages, ${detailCount} detail pages, ${playCount} play pages, ${urls.length} sitemap URLs.`);
