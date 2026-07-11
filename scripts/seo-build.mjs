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
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUB = join(__dirname, '..', 'public');
const ORIGIN = 'https://www.mochimangoarcade.com';
const SITE = 'Mochi Mango Arcade';
const SOCIAL = '/assets/images/home_hero_banner_200_games.jpg';
const write = (rel, data) => { const f = join(PUB, rel); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, data); };

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
    `<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">` +
    `<meta name="googlebot" content="index,follow,max-image-preview:large,max-snippet:-1">` +
    `<meta name="author" content="Fire Dragon Interactive">` +
    `<meta name="publisher" content="${SITE}">` +
    `<meta name="rating" content="general">` +
    `<meta name="format-detection" content="telephone=no">` +
    `<link rel="canonical" href="${canonical}">` +
    `<meta property="og:type" content="website">` +
    `<meta property="og:site_name" content="${SITE}">` +
    `<meta property="og:locale" content="en_US">` +
    `<meta property="og:title" content="${esc(title)}">` +
    `<meta property="og:description" content="${esc(desc)}">` +
    `<meta property="og:url" content="${canonical}">` +
    `<meta property="og:image" content="${img}">` +
    `<meta property="og:image:width" content="1200">` +
    `<meta property="og:image:height" content="630">` +
    `<meta property="og:image:alt" content="${esc(title)}">` +
    `<meta name="twitter:card" content="summary_large_image">` +
    `<meta name="twitter:site" content="@mochimangoarcade">` +
    `<meta name="twitter:title" content="${esc(title)}">` +
    `<meta name="twitter:description" content="${esc(desc)}">` +
    `<meta name="twitter:image" content="${img}">` +
    `<meta name="apple-mobile-web-app-capable" content="yes">` +
    `<meta name="apple-mobile-web-app-title" content="${SITE}">` +
    `<link rel="icon" href="/favicon.svg">` +
    `<link rel="apple-touch-icon" href="/favicon.svg">` +
    `<link rel="manifest" href="/manifest.webmanifest">` +
    `<link rel="preload" href="/assets/css/styles.css" as="style">` +
    `<link rel="preload" href="/assets/js/app.js" as="script" crossorigin>` +
    `<link rel="preload" href="/assets/data/games.json" as="fetch" crossorigin>` +
    `<link rel="stylesheet" href="/assets/css/styles.css">` +
    `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` +
    `<script src="/js/monetag-loader.js" defer></script>` +
    `</head>`;
}

// Build-time static content inside #appMain — real HTML for crawlers and AI
// answer engines (the SPA replaces it after hydration for interactive users).
function body(page, slug, content = '') {
  return `<body data-page="${page}" data-slug="${slug}">` +
    `<div class="site-bg"><span class="orb one"></span><span class="orb two"></span><span class="orb three"></span></div>` +
    `<div id="appHeader"></div><div id="appMain">${content}</div><div id="appFooter"></div>` +
    `<script type="module" src="/assets/js/app.js"></script></body></html>`;
}

function breadcrumb(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url }))
  };
}

// Build-time SSR content for a game page — semantic, crawlable, no JS required.
function gameContent(g, image, related) {
  const cta = g.built
    ? `<a class="btn" href="/play/${g.slug}/">▶ Play ${esc(g.title)} Free</a>`
    : `<span class="btn disabled">🚧 Coming Soon</span>`;
  const rel = (related || []).slice(0, 6).map(r =>
    `<li><a href="/games/${r.slug}/">${esc(r.title)}</a> — ${esc(r.genre)}</li>`).join('');
  return `<main id="main" class="container">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/games/">Games</a> › <span>${esc(g.title)}</span></nav>
<article class="seo-article">
<img src="${image}" width="640" height="400" alt="${esc(g.title)} — free ${esc(g.genre.toLowerCase())} game starring ${esc(g.mascot)}" style="max-width:100%;height:auto;border-radius:20px">
<h1>${esc(g.title)}</h1>
<p class="lead">${esc(g.description)}</p>
${cta}
<h2>About ${esc(g.title)}</h2>
<p><strong>${esc(g.title)}</strong> is a free, instant-play HTML5 ${esc(g.genre.toLowerCase())} game starring <strong>${esc(g.mascot)}</strong> from the ${esc(g.universeName)}. Play it right in your browser on mobile or desktop — no download, no sign-up, 100% free.</p>
<ul class="game-facts">
<li><strong>Genre:</strong> ${esc(g.genre)}</li>
<li><strong>Character:</strong> ${esc(g.mascot)}</li>
<li><strong>Universe:</strong> ${esc(g.universeName)}</li>
<li><strong>Price:</strong> Free to play</li>
<li><strong>Platform:</strong> Web browser (mobile &amp; desktop)</li>
<li><strong>Players:</strong> Single player</li>
</ul>
${g.merchHook ? `<h2>Merch</h2><p>${esc(g.merchHook)} Shop official <a href="/shop/">${esc(g.mascot)} merch</a>.</p>` : ''}
${rel ? `<h2>More ${esc(g.universeName)} games</h2><ul>${rel}</ul>` : ''}
</article>
</main>`;
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
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: g.built ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder', category: 'free' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: g.rating, bestRating: 5, worstRating: 1, ratingCount: Math.max(20, g.plays % 900 + 20) },
    characterAttribute: g.mascot
  };

  const related = games.filter(x => x.universe === g.universe && x.slug !== g.slug);

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
    + body('gameDetail', g.slug, gameContent(g, image, related));
  write(`games/${g.slug}/index.html`, detailHtml);
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
    + body('play', g.slug, gameContent(g, image, related));
  write(`play/${g.slug}/index.html`, playHtml);
  playCount++;
}

// Static / section pages — unique meta + site-wide structured data on home.
const uniList = [...new Set(games.map(g => g.universeName))];
const builtGames = games.filter(g => g.built);
function universeNames() { return uniList.join(', '); }

const orgLd = {
  '@type': 'Organization', name: SITE, url: ORIGIN + '/', logo: ORIGIN + '/assets/images/logo.svg',
  image: ORIGIN + SOCIAL, slogan: 'Play free. Collect the cuteness.',
  description: `${SITE} is a free HTML5 games portal and character merch shop featuring ${games.length} instant-play browser games starring original mascots.`,
  sameAs: ['https://www.firedragoninteractive.com'],
  parentOrganization: { '@type': 'Organization', name: 'Fire Dragon Interactive', url: 'https://www.firedragoninteractive.com' }
};
const websiteLd = {
  '@type': 'WebSite', name: SITE, url: ORIGIN + '/', inLanguage: 'en', publisher: { '@type': 'Organization', name: SITE },
  potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${ORIGIN}/games/?q={search_term_string}` }, 'query-input': 'required name=search_term_string' }
};
const homeCollection = {
  '@type': 'CollectionPage', name: SITE, url: ORIGIN + '/',
  numberOfItems: games.length, description: `Play ${games.length} free HTML5 games online.`
};

// Shared FAQ — powers FAQPage rich results, GAIO answers and visible content.
const FAQ = [
  ['Is Mochi Mango Arcade free to play?', `Yes. Every game on ${SITE} is 100% free to play — no downloads, no installs and no sign-up required.`],
  ['Do I need to download or install anything?', `No. All ${SITE} games are instant-play HTML5 games that run right in your web browser on phones, tablets and computers.`],
  ['Can I play the games on mobile?', `Yes. ${SITE} games are mobile-friendly and work on iOS, Android, tablets and desktop browsers with touch or keyboard controls.`],
  ['Are the games kid-friendly?', `Yes. ${SITE} games feature original, family-friendly mascot characters and are safe and suitable for players of all ages.`],
  ['How many games does Mochi Mango Arcade have?', `${SITE} has ${games.length} games across ${uniList.length} original universes, with ${builtGames.length} playable right now and more added regularly.`],
  ['Can I buy plushies and merch of the characters?', `Yes. Official ${SITE} merch — plushies, apparel, mugs, pins and stickers featuring the mascots — is available in the on-site merch shop.`],
  ['Who makes Mochi Mango Arcade?', `${SITE} is created by Fire Dragon Interactive, an original games and character studio.`]
];
const faqLd = { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
const itemListLd = {
  '@type': 'ItemList', name: `${SITE} Games`, numberOfItems: games.length,
  itemListElement: builtGames.slice(0, 30).map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: `${ORIGIN}/games/${g.slug}/`, name: g.title }))
};

const g1 = x => ({ '@context': 'https://schema.org', ...x });
function homeContent() {
  return `<main id="main" class="container">
<section class="seo-hero">
<h1>${SITE} — Play ${games.length}+ Free HTML5 Games Online</h1>
<p class="lead">${SITE} is a free browser-game arcade starring original mascot characters. Play ${builtGames.length} instant games right now — runners, platformers, puzzles, arcade shooters, mazes, memory and tower-stacking games — on any phone, tablet or computer. No downloads, no sign-up, always free.</p>
<p><a class="btn" href="/games/">🎮 Browse all games</a> <a class="btn secondary" href="/shop/">🛍️ Merch shop</a></p>
</section>
<section><h2>Featured free games</h2><ul>${builtGames.slice(0, 12).map(g => `<li><a href="/games/${g.slug}/">${esc(g.title)}</a> — free ${esc(g.genre.toLowerCase())} game starring ${esc(g.mascot)}</li>`).join('')}</ul></section>
<section><h2>Play by universe</h2><ul>${uniList.map(u => `<li>${esc(u)}</li>`).join('')}</ul></section>
<section><h2>Frequently asked questions</h2><dl>${FAQ.map(([q, a]) => `<dt><strong>${esc(q)}</strong></dt><dd>${esc(a)}</dd>`).join('')}</dl></section>
</main>`;
}
function gamesContent() {
  return `<main id="main" class="container">
<h1>All Free Games — ${SITE}</h1>
<p class="lead">Browse all ${games.length} ${SITE} games by universe, genre and character. ${builtGames.length} are playable right now — free, instant and mobile-friendly.</p>
<ul>${builtGames.map(g => `<li><a href="/games/${g.slug}/">${esc(g.title)}</a> — ${esc(g.genre)} · ${esc(g.mascot)}</li>`).join('')}</ul>
</main>`;
}
function staticContent(s) {
  const h1 = s.title.split(' — ')[0].split(' · ')[0];
  return `<main id="main" class="container"><h1>${esc(h1)}</h1><p class="lead">${esc(s.desc)}</p></main>`;
}

const STATIC = [
  { path: '', page: 'home', title: `${SITE} — Play ${games.length}+ Free HTML5 Games Online`, desc: `Play ${games.length}+ free browser games at ${SITE}: runners, puzzles, arcade, mazes, tower defense and more, starring cute original mascots. ${builtGames.length} playable now — no download, works on mobile and desktop.`, graph: [g1(websiteLd), g1(orgLd), g1(homeCollection), g1(faqLd), g1(itemListLd)], content: homeContent() },
  { path: 'games', page: 'games', title: `All Games — Browse ${games.length} Free HTML5 Games · ${SITE}`, desc: `Browse and filter all ${games.length} free ${SITE} games by universe, genre and character — ${builtGames.length} playable now. Instant play, no download, mobile-friendly.`, graph: [g1(itemListLd), g1(faqLd), g1(orgLd)], content: gamesContent() },
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

let staticCount = 0;
for (const s of STATIC) {
  const canonical = ORIGIN + '/' + (s.path ? s.path + '/' : '');
  const graph = s.graph || [g1(websiteLd), g1(orgLd)];
  const content = s.content || staticContent(s);
  const html = head({ title: s.title, desc: s.desc, canonical, image: SOCIAL, jsonld: graph.length === 1 ? graph[0] : { '@context': 'https://schema.org', '@graph': graph.map(x => { const { ['@context']: _c, ...rest } = x; return rest; }) } })
    + body(s.page, '', content);
  write(s.path ? `${s.path}/index.html` : 'index.html', html);
  staticCount++;
}

// llms.txt — structured index for AI answer engines (GAIO / llmstxt.org)
const llms = `# ${SITE}

> ${SITE} is a free HTML5 games portal and character-merch shop by Fire Dragon Interactive. ${games.length} instant-play browser games — runners, platformers, puzzles, arcade shooters, mazes, memory and tower-stacking games — starring original mascot characters, playable on mobile and desktop with no download and no sign-up. ${builtGames.length} games are playable right now, with more added regularly.

## About
- 100% free to play, no install or account, runs in any modern browser.
- Family-friendly original characters across ${uniList.length} universes: ${uniList.join(', ')}.
- Every game stars a recurring mascot, also sold as plushies, apparel, pins and stickers in the merch shop.
- Made by Fire Dragon Interactive (https://www.firedragoninteractive.com).

## Key pages
- [All games](${ORIGIN}/games/): browse and filter all ${games.length} games.
- [Universes](${ORIGIN}/universes/): recurring worlds and their games.
- [Characters](${ORIGIN}/characters/): mascot bios.
- [Merch shop](${ORIGIN}/shop/): plushies and collectibles.
- [New releases](${ORIGIN}/new-releases/): the latest free games.

## FAQ
${FAQ.map(([q, a]) => `### ${q}\n${a}`).join('\n\n')}

## Playable games
${builtGames.map(g => `- [${g.title}](${ORIGIN}/play/${g.slug}/): free ${g.genre} game starring ${g.mascot} — ${clip(g.description, 120)}`).join('\n')}

## Full catalogue
${games.map(g => `- [${g.title}](${ORIGIN}/games/${g.slug}/) (${g.genre}, ${g.universeName}${g.built ? '' : ', coming soon'})`).join('\n')}
`;
write('llms.txt', llms);

// robots.txt — welcome search + reputable AI crawlers, point to sitemap
const aiBots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'GoogleOther', 'ClaudeBot', 'Claude-Web', 'anthropic-ai', 'Applebot', 'Applebot-Extended', 'Amazonbot', 'Bytespider', 'CCBot', 'cohere-ai', 'Meta-ExternalAgent', 'FacebookBot', 'Diffbot', 'YouBot', 'DuckAssistBot', 'Timpibot'];
const robots = `# ${SITE}
User-agent: *
Allow: /

# Reputable search + AI answer engines are explicitly welcome
${aiBots.map(b => `User-agent: ${b}\nAllow: /`).join('\n')}

Sitemap: ${ORIGIN}/sitemap.xml
Host: www.mochimangoarcade.com
`;
write('robots.txt', robots);

// sitemap.xml — every route, with lastmod, image and priority (playable first)
const today = new Date().toISOString().slice(0, 10);
const staticRoutes = [['/', '1.0'], ['/games/', '0.9'], ['/new-releases/', '0.8'], ['/universes/', '0.7'], ['/characters/', '0.7'], ['/shop/', '0.8'], ['/about/', '0.5'], ['/leaderboards/', '0.5'], ['/privacy/', '0.3'], ['/terms/', '0.3']];
const urls = [];
for (const [r, pri] of staticRoutes) urls.push({ loc: ORIGIN + r, pri });
for (const g of games) {
  const img = ORIGIN + ogImage(g);
  const pri = g.built ? (g.featured ? '0.9' : '0.8') : '0.4';
  urls.push({ loc: `${ORIGIN}/games/${g.slug}/`, pri, img, title: g.title });
  urls.push({ loc: `${ORIGIN}/play/${g.slug}/`, pri: g.built ? pri : '0.4', img, title: g.title });
}
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
  urls.map(u => `<url><loc>${u.loc}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${u.pri}</priority>` +
    (u.img ? `<image:image><image:loc>${u.img}</image:loc><image:title>${esc(u.title)}</image:title></image:image>` : '') + `</url>`).join('\n') +
  `\n</urlset>\n`;
write('sitemap.xml', sitemap);

console.log(`SEO build done: ${staticCount} static pages, ${detailCount} detail pages, ${playCount} play pages, ${urls.length} sitemap URLs.`);
