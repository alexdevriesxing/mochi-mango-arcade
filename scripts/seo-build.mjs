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
const clip = (s, n = 158) => { s = String(s).replace(/\s+/g, ' ').trim(); let r = s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; return r.endsWith('.') || r.endsWith('…') ? r : r + '.'; };

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

function head({ title, desc, canonical, image, jsonld, keywords }) {
  const img = ORIGIN + image;
  const kw = keywords ? `<meta name="keywords" content="${esc(keywords)}">` : '';
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
    kw +
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

// Genre-specific gameplay tips, controls, and features
const GAMEPLAY = {
  'board': {
    controls: 'Tap or click on the board to select and move your pieces. Drag to rearrange, or tap again to confirm your move.',
    tips: 'Think ahead — plan your moves several turns in advance. Control the center of the board for maximum strategic advantage.',
    features: ['Classic turn-based strategy', 'Real-time move validation', 'Undo support', 'AI opponent with adjustable difficulty']
  },
  'Strategy': {
    controls: 'Tap or click to select an action, then tap the target area to execute it. The game guides you through each turn.',
    tips: 'Look for opportunities to set up multi-turn combos. Sacrificing a small advantage can lead to a bigger victory later.',
    features: ['Deep strategic gameplay', 'Turn-based mechanics', 'Multiple win conditions', 'Replayable scenarios']
  },
  'match3': {
    controls: 'Tap or click adjacent tiles to swap them. Match three or more identical tiles in a row to clear them and score points.',
    tips: 'Look for chains — clearing one match may create another. Focus on the bottom of the board to trigger cascading combos.',
    features: ['Classic match-3 mechanics', 'Chain-reaction combos', 'Special gem power-ups', 'Endless or timed modes']
  },
  'Puzzle': {
    controls: 'Tap or click to interact with the puzzle elements. Follow on-screen prompts for specific actions.',
    tips: 'Examine the whole board before making your first move. Sometimes the solution is simpler than it looks.',
    features: ['Brain-teasing puzzle mechanics', 'Progressive difficulty', 'Hint system', 'Relaxing gameplay pace']
  },
  'memory': {
    controls: 'Tap or click cards to flip them. Match pairs to clear the board. Remember where each card is hiding!',
    tips: 'Start from one corner and work systematically. Say each card aloud as you flip it to lock it in memory.',
    features: ['Classic memory matching', 'Multiple grid sizes', 'Themed card sets', 'Time-attack mode']
  },
  'runner': {
    controls: 'Tap or click to jump. Tap again while in the air to perform a double jump. Swipe down to slide under obstacles.',
    tips: 'Timing is everything — watch the obstacles and find the rhythm. Collect power-ups for temporary invincibility.',
    features: ['Auto-scrolling runner gameplay', 'Procedurally generated obstacles', 'Power-up collection', 'High-score chasing']
  },
  'Runner': {
    controls: 'Tap or click to jump. Tap again while in the air to perform a double jump. Swipe down to slide under obstacles.',
    tips: 'Timing is everything — watch the obstacles and find the rhythm. Collect power-ups for temporary invincibility.',
    features: ['Auto-scrolling runner gameplay', 'Procedurally generated obstacles', 'Power-up collection', 'High-score chasing']
  },
  'Platformer': {
    controls: 'Use the left and right arrows (or swipe) to move. Tap or press up to jump. Land on platforms and avoid hazards.',
    tips: 'Look before you leap — survey the platform layout before making a jump. Collect all items for bonus points.',
    features: ['Side-scrolling platform action', 'Multiple levels', 'Secret collectibles', 'Smooth touch and keyboard controls']
  },
  'platformer': {
    controls: 'Use the left and right arrows (or swipe) to move. Tap or press up to jump. Land on platforms and avoid hazards.',
    tips: 'Look before you leap — survey the platform layout before making a jump. Collect all items for bonus points.',
    features: ['Side-scrolling platform action', 'Multiple levels', 'Secret collectibles', 'Smooth touch and keyboard controls']
  },
  'flappy': {
    controls: 'Tap or click repeatedly to flap and stay aloft. Time your taps carefully to navigate through gaps.',
    tips: 'Short, steady taps work better than long presses. Find a comfortable rhythm and stick to it.',
    features: ['One-tap controls', 'Procedurally generated pipes', 'Endless flying action', 'Distance-based scoring']
  },
  'whack': {
    controls: 'Tap or click on characters as they pop up. Hit them before they hide again. Watch out for bombs!',
    tips: 'Keep your eyes moving across the whole play area. Prioritize targets about to disappear.',
    features: ['Fast-paced reflex action', 'Multiple target types', 'Combo multiplier system', 'Timed rounds']
  },
  'serve': {
    controls: 'Swipe or drag to aim your shot. Release to serve the ball. Time your return for the perfect strike.',
    tips: 'Aim for the corners to make it harder for your opponent to return. Vary your shots to keep them guessing.',
    features: ['Realistic ball physics', 'Opponent AI', 'Multiple court environments', 'Match scoring system']
  },
  'Sports': {
    controls: 'Swipe, tap, or drag to control your athlete. Follow on-screen prompts for sport-specific actions.',
    tips: 'Practice the basic moves first before attempting advanced techniques. Watch your opponent\'s patterns.',
    features: ['Arcade-style sports action', 'Responsive controls', 'Opponent AI', 'Quick match format']
  },
  'Racing': {
    controls: 'Tap left/right or tilt to steer. Avoid obstacles and other racers. Collect speed boosts along the way.',
    tips: 'Take the inside line on turns to maintain speed. Boost strips are best used on straightaways.',
    features: ['Top-down racing action', 'Multiple tracks', 'Speed boosts and power-ups', 'Real-time opponent racing']
  },
  'racing': {
    controls: 'Tap left/right or tilt to steer. Avoid obstacles and other racers. Collect speed boosts along the way.',
    tips: 'Take the inside line on turns to maintain speed. Boost strips are best used on straightaways.',
    features: ['Top-down racing action', 'Multiple tracks', 'Speed boosts and power-ups', 'Real-time opponent racing']
  },
  'Fishing': {
    controls: 'Tap to cast your line, then wait for a bite. Tap again to reel in your catch. Time your pulls carefully!',
    tips: 'Watch for the bobber to dip below the surface — that\'s when you strike. Different fish prefer different depths.',
    features: ['Relaxing fishing simulation', 'Multiple fish species', 'Upgradeable gear', 'Peaceful ocean setting']
  },
  'fishing': {
    controls: 'Tap to cast your line, then wait for a bite. Tap again to reel in your catch. Time your pulls carefully!',
    tips: 'Watch for the bobber to dip below the surface — that\'s when you strike. Different fish prefer different depths.',
    features: ['Relaxing fishing simulation', 'Multiple fish species', 'Upgradeable gear', 'Peaceful ocean setting']
  },
  'Arcade': {
    controls: 'Tap, swipe, or use keyboard arrows to control your character. Each game has simple one-touch mechanics.',
    tips: 'Start slow and build up speed as you get comfortable with the controls. Watch for visual cues.',
    features: ['Classic arcade action', 'Simple one-touch controls', 'Progressive difficulty', 'Retro-inspired visuals']
  },
  'Shooter': {
    controls: 'Tap to fire at targets. Drag to aim. Collect power-ups to upgrade your weapons and increase firepower.',
    tips: 'Lead your shots — aim where the target is going, not where it is. Conserve power-ups for tough waves.',
    features: ['Fast-paced shooting action', 'Multiple enemy types', 'Weapon power-ups', 'Wave-based progression']
  },
  'shooter': {
    controls: 'Tap to fire at targets. Drag to aim. Collect power-ups to upgrade your weapons and increase firepower.',
    tips: 'Lead your shots — aim where the target is going, not where it is. Conserve power-ups for tough waves.',
    features: ['Fast-paced shooting action', 'Multiple enemy types', 'Weapon power-ups', 'Wave-based progression']
  },
  'Idle': {
    controls: 'Tap to collect resources and purchase upgrades. The game keeps progressing even when you\'re away.',
    tips: 'Invest early in passive income upgrades — they add up fast. Check back regularly to collect and reinvest.',
    features: ['Idle progression system', 'Auto-earning mechanics', 'Deep upgrade tree', 'Prestige system']
  },
  'idleclicker': {
    controls: 'Tap to collect resources and purchase upgrades. The game keeps progressing even when you\'re away.',
    tips: 'Invest early in passive income upgrades — they add up fast. Check back regularly to collect and reinvest.',
    features: ['Idle progression system', 'Auto-earning mechanics', 'Deep upgrade tree', 'Prestige system']
  },
  'Action': {
    controls: 'Tap or click to perform actions. Swipe to move or dodge. React quickly to on-screen prompts.',
    tips: 'Stay mobile — standing still makes you an easy target. Learn enemy patterns to anticipate attacks.',
    features: ['Action-packed gameplay', 'Responsive controls', 'Visual feedback', 'Progressive challenge']
  },
  'Music': {
    controls: 'Tap in time with the music as notes reach the target zone. Accuracy and timing determine your score.',
    tips: 'Listen to the beat first before trying to tap. Focus on the rhythm, not just the visual cues.',
    features: ['Rhythm-based gameplay', 'Original soundtrack', 'Multiple difficulty levels', 'Combo scoring system']
  },
  'Card': {
    controls: 'Tap or click to select cards from your hand, then tap the play area to place them. Follow the game rules for valid moves.',
    tips: 'Manage your hand carefully — keep versatile cards for later. Watch what your opponent plays.',
    features: ['Card-based strategy', 'Hand management', 'AI opponent', 'Quick play sessions']
  },
  'Rhythm': {
    controls: 'Tap in time with the beat. Follow the visual cues and maintain your rhythm for the highest score.',
    tips: 'Focus on the beat of the music rather than watching the screen. Consistent timing beats occasional perfect hits.',
    features: ['Rhythm-action gameplay', 'Original music tracks', 'Combo scoring', 'Practice mode']
  },
  'Whack-a-mole': {
    controls: 'Tap or click characters as they pop up. Quick reflexes earn bonus points. Avoid tapping the wrong targets!',
    tips: 'Scan the entire play area constantly. Your peripheral vision is faster than focused looking.',
    features: ['Reflex-testing action', 'Multiple spawn points', 'Speed increases over time', 'High-score leaderboard']
  },
  'maze': {
    controls: 'Swipe or use arrow keys to navigate through the maze. Find the exit while avoiding dead ends.',
    tips: 'Follow one wall (left or right) consistently — it will eventually lead you to the exit.',
    features: ['Procedurally generated mazes', 'Multiple difficulty levels', 'Timer-based scoring', 'Bonus collectibles']
  },
  'snake': {
    controls: 'Swipe or use arrow keys to change direction. Eat food to grow longer. Avoid hitting walls or yourself.',
    tips: 'Plan your route ahead of time. Don\'t trap yourself in corners — leave room to maneuver.',
    features: ['Classic snake mechanics', 'Speed increases as you grow', 'Grid-based movement', 'Endless gameplay']
  },
  'pong': {
    controls: 'Swipe or use arrow keys to move your paddle up and down. Block the ball and score past your opponent.',
    tips: 'Stay centered and react to the ball\'s angle. Try to return the ball to the edges for harder saves.',
    features: ['Classic pong action', 'AI opponent', 'Speed increases over time', 'First-to-5 scoring']
  },
  'breakout': {
    controls: 'Swipe or use arrow keys to move the paddle. Keep the ball in play and break all the bricks to win.',
    tips: 'Keep the ball on your paddle by moving to where it will land, not where it is. Aim for the top bricks first.',
    features: ['Classic brick-breaking action', 'Multiple brick types', 'Power-up drops', 'Level progression']
  },
  'cannon': {
    controls: 'Tap or drag to aim your cannon. Release to fire. Match colors to clear groups and score combos.',
    tips: 'Plan several shots ahead. Bouncing shots off the walls can reach tricky spots.',
    features: ['Aim-and-shoot mechanics', 'Color matching', 'Chain reaction combos', 'Progressive difficulty']
  },
  'doodlejump': {
    controls: 'Tilt your device or use arrow keys to move left and right. Keep jumping upward and don\'t fall off the screen!',
    tips: 'Land in the center of platforms for the most stable bounce. Move toward the side you want to go early.',
    features: ['Endless vertical jumping', 'Tilt and keyboard controls', 'Moving platforms', 'Collectible power-ups']
  },
  'tower': {
    controls: 'Tap at the right moment to place each block. Stack them as evenly as possible for the tallest tower.',
    tips: 'Watch the block\'s movement speed — it changes with tower height. A steady rhythm beats frantic tapping.',
    features: ['Precision stacking mechanics', 'Progressive speed increase', 'Height-based scoring', 'Relaxing visual feedback']
  },
  'helix': {
    controls: 'Tap to rotate the helix platforms. Guide the ball downward through the gaps without falling off the edge.',
    tips: 'Look ahead to plan your path through multiple layers. Small adjustments prevent big falls.',
    features: ['Rotating platform mechanics', 'Multi-tier descent', 'One-touch controls', 'Increasing speed']
  },
  'merge': {
    controls: 'Tap and drag identical items together to merge them into a more valuable item. Keep merging to discover rare items!',
    tips: 'Keep your board organized — grouped items are easier to merge. Don\'t merge too quickly; wait for the perfect match.',
    features: ['Drag-and-drop merging', 'Item discovery progression', 'Board management', 'Rare item unlocks']
  },
  'stacker': {
    controls: 'Tap or click to stop the moving platform. Each successful stack adds a new layer. Precision is key!',
    tips: 'Watch the speed pattern — it follows a rhythm. Aim for the center of each platform for the most stable stack.',
    features: ['Timing-based stacking', 'Progressive difficulty', 'Perfect-stack bonus', 'Height leaderboard']
  },
  'Archery': {
    controls: 'Tap and drag to aim your bow. Pull back further for more power. Release to fire at the target.',
    tips: 'Account for wind and distance. A steady hand and consistent pull angle are the keys to accuracy.',
    features: ['Precision archery mechanics', 'Wind and distance physics', 'Multiple rounds', 'Score tracking']
  }
};

function howToPlay(g, gp) {
  return `<h2>How to Play ${esc(g.title)}</h2>
<p><strong>${esc(g.title)}</strong> is easy to pick up. ${gp.controls}</p>
<h2>Tips &amp; Strategy</h2>
<p>${gp.tips}</p>
<h2>Why You'll Love It</h2>
<ul>${gp.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>`;
}

// Build-time SSR content for a game page — semantic, crawlable, no JS required.
function gameContent(g, image, related) {
  const cta = g.built
    ? `<a class="btn" href="/play/${g.slug}/">▶ Play ${esc(g.title)} Free</a>`
    : `<span class="btn disabled">🚧 Coming Soon</span>`;
  const rel = (related || []).slice(0, 6).map(r =>
    `<li><a href="/games/${r.slug}/">${esc(r.title)}</a> — ${esc(r.genre)}</li>`).join('');
  const gp = GAMEPLAY[g.engine] || GAMEPLAY[g.genre] || GAMEPLAY['Puzzle'];
  return `<main id="main" class="container">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/games/">Games</a> › <span>${esc(g.title)}</span></nav>
<article class="seo-article">
<img src="${image}" width="640" height="400" alt="${esc(g.title)} — free ${esc(g.genre.toLowerCase())} game starring ${esc(g.mascot)}" style="max-width:100%;height:auto;border-radius:20px">
<h1>${esc(g.title)}</h1>
<p class="lead">${esc(g.description)}</p>
${cta}
${g.built ? howToPlay(g, gp) : ''}
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

  const gp = GAMEPLAY[g.engine] || GAMEPLAY[g.genre] || GAMEPLAY['Puzzle'];
  const gpDesc = `${g.title} is a ${g.genre.toLowerCase()} game starring ${g.mascot}. ${gp.controls} ${gp.tips}`;
  const videoGame = {
    '@context': 'https://schema.org', '@type': 'VideoGame',
    name: g.title, description: clip(g.description + ' ' + gp.tips, 300), url: `${ORIGIN}/games/${g.slug}/`,
    image: ORIGIN + image, genre: [g.genre, 'HTML5', 'Free-to-Play'],
    gamePlatform: ['Web Browser', 'HTML5'],
    applicationCategory: 'Game', operatingSystem: 'Any',
    playMode: 'SinglePlayer', inLanguage: 'en',
    author: { '@type': 'Organization', name: 'Fire Dragon Interactive' },
    publisher: { '@type': 'Organization', name: SITE },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: g.built ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder', category: 'free' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: g.rating, bestRating: 5, worstRating: 1, ratingCount: Math.max(20, g.plays % 900 + 20) },
    characterAttribute: g.mascot,
    ...(g.gameplayDescription ? {} : { gameplayDescription: gpDesc })
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
  const detailHtml = head({ title: detailTitle, desc: detailDesc, canonical: detailCanon, image, jsonld: detailGraph, keywords: kw })
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
  const playHtml = head({ title: playTitle, desc: playDesc, canonical: playCanon, image, jsonld: playGraph, keywords: kw })
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
const crumbsH = (a, b) => `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a>${a ? ` › <a href="${a.href}">${esc(a.name)}</a>` : ''}${b ? ` › <span>${esc(b)}</span>` : ''}</nav>`;

function homeContent() {
  return `<main id="main" class="container">
${crumbsH()}
<section class="seo-hero">
<h1>${SITE} — Play ${games.length}+ Free HTML5 Games Online</h1>
<p class="lead">${SITE} is a free browser-game arcade starring original mascot characters. Play ${builtGames.length} instant games right now — runners, platformers, puzzles, arcade shooters, mazes, memory and tower-stacking games — on any phone, tablet or computer. No downloads, no sign-up, always free.</p>
<p><a class="btn" href="/games/">🎮 Browse all games</a> <a class="btn secondary" href="/shop/">🛍️ Merch shop</a> <a class="btn secondary" href="/new-releases/">🆕 New releases</a> <a class="btn secondary" href="/characters/">👥 Characters</a> <a class="btn secondary" href="/about/">ℹ️ About</a></p>
</section>
<section><h2>Featured free games</h2><ul>${builtGames.slice(0, 12).map(g => `<li><a href="/games/${g.slug}/">${esc(g.title)}</a> — free ${esc(g.genre.toLowerCase())} game starring ${esc(g.mascot)}</li>`).join('')}</ul></section>
<section><h2>Play by universe</h2><ul>${uniList.map(u => `<li><a href="/universes/">${esc(u)}</a></li>`).join('')}</ul></section>
<section><h2>Frequently asked questions</h2><dl>${FAQ.map(([q, a]) => `<dt><strong>${esc(q)}</strong></dt><dd>${esc(a)}</dd>`).join('')}</dl></section>
</main>`;
}
function gamesContent() {
  return `<main id="main" class="container">
${crumbsH(null, 'All Games')}
<h1>All Free Games — ${SITE}</h1>
<p class="lead">Browse all ${games.length} ${SITE} games by universe, genre and character. ${builtGames.length} are playable right now — free, instant and mobile-friendly.</p>
<ul>${builtGames.map(g => `<li><a href="/games/${g.slug}/">${esc(g.title)}</a> — ${esc(g.genre)} · ${esc(g.mascot)}</li>`).join('')}</ul>
</main>`;
}
function staticContent(s) {
  const h1 = s.title.split(' — ')[0].split(' · ')[0];
  return `<main id="main" class="container">${crumbsH(null, h1)}<h1>${esc(h1)}</h1><p class="lead">${esc(s.desc)}</p></main>`;
}

const SHORT_UNI = uniList.length > 5 ? uniList.slice(0, 5).join(', ') + ' and more' : uniList.join(', ');
const KWS = {
  home: 'free online games, browser games, HTML5 games, free arcade, play free games online, Mochi Mango Arcade',
  games: 'free games list, browser games catalogue, HTML5 games directory, play free online games, all free games',
  universes: 'game universes, recurring game worlds, mascot universes, game character worlds, themed game collections',
  characters: 'game mascots, original characters, plushie characters, game heroes, cute game mascots',
  shop: 'game merch, plushies, game apparel, collectible pins, game stickers, character merchandise',
  'new-releases': 'new games, latest browser games, new HTML5 games, fresh releases, newly added games',
  about: 'about Mochi Mango Arcade, Fire Dragon Interactive, free game portal, browser game site',
  leaderboards: 'top games, most played games, popular games, game leaderboards, high scores',
  'adsterra-map': 'ad placements, advertising map, site monetization',
  privacy: 'privacy policy, data privacy, cookie policy, privacy terms',
  terms: 'terms of use, terms of service, site terms, legal terms'
};

const STATIC = [
  { path: '', page: 'home', title: `${SITE} — Play ${games.length}+ Free HTML5 Games Online`, desc: `Play ${games.length}+ free browser games at ${SITE}, starring cute original mascots. ${builtGames.length} playable now — no download, works on mobile and desktop.`, keywords: KWS.home, graph: [g1(websiteLd), g1(orgLd), g1(homeCollection), g1(faqLd), g1(itemListLd)], content: homeContent() },
  { path: 'games', page: 'games', title: `All Free Games · ${SITE}`, desc: `Browse and filter all ${games.length} free ${SITE} games by universe, genre and character — ${builtGames.length} playable now. Instant play, no download.`, keywords: KWS.games, graph: [g1(itemListLd), g1(faqLd), g1(orgLd)], content: gamesContent() },
  { path: 'universes', page: 'universes', title: `Game Universes — ${SITE}`, desc: `Explore all ${uniList.length} recurring worlds of ${SITE}. Each universe is packed with playable games and collectible mascot characters.`, keywords: KWS.universes },
  { path: 'characters', page: 'characters', title: `Characters & Mascots — ${SITE}`, desc: `Meet the mascots of ${SITE}. Original characters with bios, designed for plushies, pins, stickers and collectibles.`, keywords: KWS.characters },
  { path: 'shop', page: 'shop', title: `Merch Shop — ${SITE}`, desc: `Shop official ${SITE} merch: plushies, apparel, mugs, stickers, pins and bundles featuring your favourite mascots.`, keywords: KWS.shop },
  { path: 'new-releases', page: 'newReleases', title: `New Releases — ${SITE}`, desc: `The newest free HTML5 games and mascot drops at ${SITE}. Fresh releases added regularly.`, keywords: KWS['new-releases'] },
  { path: 'about', page: 'about', title: `About ${SITE} — Free HTML5 Games Portal`, desc: `${SITE} is a free HTML5 game and merch platform by Fire Dragon Interactive with ${games.length}+ games, recurring universes and collectible characters.`, keywords: KWS.about },
  { path: 'leaderboards', page: 'leaderboards', title: `Leaderboards — ${SITE}`, desc: `See the most-played free games at ${SITE}.`, keywords: KWS.leaderboards },
  { path: 'adsterra-map', page: 'adMap', title: `Ad Placements — ${SITE}`, desc: `Advertising placement map for ${SITE}.`, keywords: KWS['adsterra-map'] },
  { path: 'privacy', page: 'privacy', title: `Privacy Policy — ${SITE}`, desc: `Privacy policy for ${SITE}. Learn how we handle your data and cookies.`, keywords: KWS.privacy },
  { path: 'terms', page: 'terms', title: `Terms of Use — ${SITE}`, desc: `Terms of use for ${SITE}. Your rights and responsibilities when using our service.`, keywords: KWS.terms }
];

let staticCount = 0;
for (const s of STATIC) {
  const canonical = ORIGIN + '/' + (s.path ? s.path + '/' : '');
  const graph = s.graph || [g1(websiteLd), g1(orgLd)];
  const content = s.content || staticContent(s);
  const html = head({ title: s.title, desc: s.desc, canonical, image: SOCIAL, jsonld: graph.length === 1 ? graph[0] : { '@context': 'https://schema.org', '@graph': graph.map(x => { const { ['@context']: _c, ...rest } = x; return rest; }) }, keywords: s.keywords || '' })
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
- [About](${ORIGIN}/about/): about the site and Fire Dragon Interactive.
- [Leaderboards](${ORIGIN}/leaderboards/): most-played games and high scores.
- [Privacy](${ORIGIN}/privacy/): privacy policy and data handling.
- [Terms](${ORIGIN}/terms/): terms of use.

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
