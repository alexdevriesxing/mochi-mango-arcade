import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, 'public');
const DATA = join(ROOT, 'assets', 'data');

/* ── board variant data ── */
const GAMES = [
  { id: 7045, title: 'Crownlight Chess', slug: 'crownlight-chess', variant: 'chess', mascot: 'Kingpin Pawnie', genre: 'Strategy', desc: 'Move your ivory army, protect your king, and checkmate the moon court. Streamlined Quick Chess: standard movement, check, checkmate, stalemate and queen promotion; castling, en passant and repetition draws are omitted.', hook: 'Kingpin Pawnie plush with crowned chess piece, crownlight board sticker pack, checkmate tee, and enamel pin set.' },
  { id: 7046, title: 'Biscuit Brigade Checkers', slug: 'biscuit-brigade-checkers', variant: 'checkers', mascot: 'Captain Checker', genre: 'Board', desc: 'Move diagonally on dark squares. Captures are mandatory; chain every available jump. Reach the far edge to crown a king.', hook: 'Captain Checker plush with checker cape, biscuit token keychain, brigade sticker pack, and king-crown hoodie.' },
  { id: 7047, title: 'Trio Bloom', slug: 'trio-bloom', variant: 'tic-tac-toe', mascot: 'Trixie Bloom', genre: 'Board', desc: 'Place a blossom and make three in a row. The moon sprite plays a perfect reply, so build a fork!', hook: 'Trixie Bloom plush with flower crown, trio-bloom magnet set, blossom tee, and enamel pin.' },
  { id: 7048, title: 'Starstack Four', slug: 'starstack-four', variant: 'connect-four', mascot: 'Stella Stacker', genre: 'Board', desc: 'Tap a column to drop a star. Connect four horizontally, vertically or diagonally before the sky keeper.', hook: 'Stella Stacker plush with stacking stars, drop-column keychain, constellation sticker pack, and four-in-a-row tee.' },
  { id: 7049, title: 'Moonflip Garden', slug: 'moonflip-garden', variant: 'reversi', mascot: 'Luna Flipper', genre: 'Strategy', desc: 'Place a sun disk to bracket moon disks in any direction and flip them. A player with no legal move passes; the fuller garden wins.', hook: 'Luna Flipper plush with flip-disk wings, moon-garden sticker pack, reversi strategy tee, and enamel pin.' },
  { id: 7050, title: 'Petal Five', slug: 'petal-five', variant: 'gomoku', mascot: 'Petal Prime', genre: 'Strategy', desc: 'Place petals on the intersections. First to form five or more in an unbroken line wins this compact freestyle game.', hook: 'Petal Prime plush with petal crown, five-in-row keychain, blossom-field sticker pack, and strategy tee.' },
  { id: 7051, title: 'Mango Mancala Market', slug: 'mango-mancala-market', variant: 'mancala', mascot: 'Mango Merchant', genre: 'Board', desc: 'Choose one of your six bowls and sow every seed counter-clockwise. Skip the rival store, capture opposite seeds, and earn another turn by landing in your store.', hook: 'Mango Merchant plush with seed-bowl apron, market token keychain, and mancala strategy tee.' },
  { id: 7052, title: 'Doodle Paddocks', slug: 'doodle-paddocks', variant: 'dots-and-boxes', mascot: 'Doodle Fencer', genre: 'Board', desc: 'Tap between neighboring dots to draw a fence. Completing a paddock scores it and grants another turn.', hook: 'Doodle Fencer plush with fence-post staff, doodle-paddock sticker pack, and box-claiming tee.' },
  { id: 7053, title: 'Lantern Mill', slug: 'lantern-mill', variant: 'nine-mens-morris', mascot: 'Lantern Keeper', genre: 'Strategy', desc: 'Place nine lanterns on marked points; every line of three lets you remove one rival lantern. Trap or reduce the rival below three.', hook: 'Lantern Keeper plush with lantern staff, mill-run keychain, lantern-glow sticker pack, and tee.' },
  { id: 7054, title: 'Pebble Pond Go', slug: 'pebble-pond-go', variant: 'go-9x9', mascot: 'Pebble Sage', genre: 'Strategy', desc: 'Surround empty space and capture groups with no liberties. Suicide and repeated positions are forbidden.', hook: 'Pebble Sage plush with stone bowl, go-board mat, pebble keychain, and territory tee.' },
  { id: 7055, title: 'Hexbridge Heroes', slug: 'hexbridge-heroes', variant: 'hex', mascot: 'Hexa Knight', genre: 'Strategy', desc: 'Connect your left and right shores with a chain of sun stones. The moon keeper connects top to bottom. Hex has no draw.', hook: 'Hexa Knight plush with hex shield, bridge-builder keychain, hex-grid sticker pack, and connection tee.' },
  { id: 7056, title: 'Treasure Fleet Tactics', slug: 'treasure-fleet-tactics', variant: 'treasure-fleet', mascot: 'Admiral Chart', genre: 'Strategy', desc: 'Your fleets are placed automatically on an 8x8 sea. Tap the rival chart to fire one unique shot per turn; sink every ship first.', hook: 'Admiral Chart plush with spyglass, treasure-fleet keychain, sea-chart sticker pack, and naval tee.' },
  { id: 7057, title: 'Codebreaker Crystals', slug: 'codebreaker-crystals', variant: 'codebreaker', mascot: 'Crystal Cipher', genre: 'Puzzle', desc: 'Build a four-crystal guess from six colors; duplicates are allowed. Exact and color-only clues appear after submission.', hook: 'Crystal Cipher plush with crystal crown, code-cracker keychain, gemstone sticker pack, and deduction tee.' },
  { id: 7058, title: 'Cloudpath Chutes & Charms', slug: 'cloudpath-chutes-charms', variant: 'snakes-and-ladders', mascot: 'Cloud Rider', genre: 'Board', desc: 'Tap Roll and race to square 100. Ladders lift you and cloud chutes drift you down once per turn.', hook: 'Cloud Rider plush with rainbow-chute scarf, ladder-climb keychain, charm-path sticker pack, and racing tee.' },
  { id: 7059, title: 'Cozy Backgammon', slug: 'cozy-backgammon', variant: 'backgammon', mascot: 'Dicey Bear', genre: 'Board', desc: 'Roll two dice, then move ivory checkers toward home. Blocked points hold two rivals; a lone rival is bumped to the bar.', hook: 'Dicey Bear plush with foam dice, backgammon board sticker, cozy-game tee, and enamel pin.' },
  { id: 7060, title: 'Cross-Crown Carnival', slug: 'cross-crown-carnival', variant: 'cross-and-crown', mascot: 'Crown Prince', genre: 'Board', desc: 'Roll a six to leave the yard; land on a rival to send it home, while starred squares are safe. Reach home exactly.', hook: 'Crown Prince plush with crown, carnival-pawn keychain, game-board sticker pack, and royal tee.' },
];

/* ── 1. Add board to EXPLICIT_GAME_MODES in app.js ── */
let appJs = readFileSync(join(ROOT, 'assets', 'js', 'app.js'), 'utf8');
const explicitModes = new Set([
  'sports', 'racing', 'breakout', 'snake', 'rhythm', 'tower', 'pinball',
  'fishing', 'archery', 'pong', 'bubbleshooter', 'cannon', 'merge', 'helix',
  'doodlejump', 'asteroids', 'pipeline', 'gallery', 'idleclicker', 'flappy',
  'platformer', 'shooter', 'whack', 'match3', 'serve', 'maze', 'memory',
  'stacker', 'dodger', 'runner', 'board',
]);
const newExplicit = `const EXPLICIT_GAME_MODES = new Set([
  'sports', 'racing', 'breakout', 'snake', 'rhythm', 'tower', 'pinball',
  'fishing', 'archery', 'pong', 'bubbleshooter', 'cannon', 'merge', 'helix',
  'doodlejump', 'asteroids', 'pipeline', 'gallery', 'idleclicker', 'flappy',
  'platformer', 'shooter', 'whack', 'match3', 'serve', 'maze', 'memory',
  'stacker', 'dodger', 'runner', 'board',
]);`;
const oldExplicit = appJs.match(/const EXPLICIT_GAME_MODES[\s\S]*?\];/);
if (oldExplicit) {
  appJs = appJs.replace(oldExplicit[0], newExplicit);
  writeFileSync(join(ROOT, 'assets', 'js', 'app.js'), appJs, 'utf8');
  console.log('✅ Added board to EXPLICIT_GAME_MODES in app.js');
}

/* ── 2. Add tabletop-kingdom to universes.json ── */
const universesPath = join(DATA, 'universes.json');
const universes = JSON.parse(readFileSync(universesPath, 'utf8'));
universes['tabletop-kingdom'] = {
  name: 'Tabletop Kingdom',
  color: '#6b4c3b',
  accent: '#f0c987',
  description: 'Wooden boards, carved pieces and classic strategy games reimagined with storybook charm.'
};
writeFileSync(universesPath, JSON.stringify(universes, null, 2) + '\n', 'utf8');
console.log('✅ Added tabletop-kingdom to universes.json');

/* ── 3. Add board games to games.json ── */
const gamesPath = join(DATA, 'games.json');
const games = JSON.parse(readFileSync(gamesPath, 'utf8'));
let added = 0;
for (const g of GAMES) {
  if (games.some(x => x.id === g.id)) { console.log(`⏭️  Game ${g.id} exists, skipping`); continue; }
  games.push({
    id: g.id, title: g.title, slug: g.slug, universe: 'tabletop-kingdom',
    universeName: 'Tabletop Kingdom', genre: g.genre, mascot: g.mascot,
    description: g.desc, image: `/assets/images/tabletop-cards/${g.slug}.svg`,
    detailUrl: `/games/${g.slug}/`, playUrl: `/play/${g.slug}/`,
    featured: false, new: true, rating: 4.5, plays: 0, status: 'Playable',
    engine: 'board', merchHook: g.hook, built: true,
    boardVariant: g.variant,
  });
  added++;
}
games.sort((a, b) => a.id - b.id);
writeFileSync(gamesPath, JSON.stringify(games, null, 2) + '\n', 'utf8');
console.log(`✅ Added ${added} games to games.json`);

/* ── 4. Generate SVG card images ── */
const CARD_DIR = join(ROOT, 'assets', 'images', 'tabletop-cards');
if (!existsSync(CARD_DIR)) mkdirSync(CARD_DIR, { recursive: true });

for (const g of GAMES) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 480">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6b4c3b"/>
      <stop offset="100%" stop-color="#4a3328"/>
    </linearGradient>
  </defs>
  <rect width="320" height="480" rx="16" fill="url(#bg)"/>
  <rect x="8" y="8" width="304" height="464" rx="12" fill="none" stroke="#f0c987" stroke-width="1.5" opacity=".3"/>
  <text x="160" y="70" text-anchor="middle" fill="#f0c987" font-size="64" font-family="serif">♔</text>
  <text x="160" y="140" text-anchor="middle" fill="#f0c987" font-size="28" font-weight="bold" font-family="Outfit,sans-serif">${g.title}</text>
  <text x="160" y="180" text-anchor="middle" fill="#c4a87c" font-size="14" font-family="Outfit,sans-serif">${g.variant}</text>
  <rect x="60" y="210" width="200" height="200" rx="12" fill="rgba(240,201,135,.08)" stroke="#f0c987" stroke-width="1" opacity=".4"/>
  <text x="160" y="320" text-anchor="middle" fill="#f0c987" font-size="96" font-family="serif" opacity=".6">${g.mascot.split(' ')[0] === 'Kingpin' ? '♚' : g.title.includes('Chess') ? '♚' : g.variant === 'checkers' ? '♛' : g.variant === 'tic-tac-toe' ? '◯' : g.variant === 'connect-four' ? '⬇' : g.variant === 'reversi' ? '◐' : g.variant === 'gomoku' ? '✧' : g.variant === 'mancala' ? '⚬' : g.variant === 'dots-and-boxes' ? '▣' : g.variant === 'nine-mens-morris' ? '◉' : g.variant === 'go-9x9' ? '⬤' : g.variant === 'hex' ? '⬡' : g.variant === 'treasure-fleet' ? '⛵' : g.variant === 'codebreaker' ? '✦' : g.variant === 'snakes-and-ladders' ? '⚂' : g.variant === 'backgammon' ? '🎲' : '♛'}</text>
  <text x="160" y="440" text-anchor="middle" fill="#c4a87c" font-size="11" font-family="Outfit,sans-serif">${g.mascot}</text>
</svg>`;
  const p = join(CARD_DIR, `${g.slug}.svg`);
  if (!existsSync(p)) {
    writeFileSync(p, svg, 'utf8');
    console.log(`  🖼️  Created ${g.slug}.svg`);
  }
}
console.log('✅ SVG cards generated');

/* ── 5. Add CSS accent ── */
const cssPath = join(ROOT, 'assets', 'css', 'styles.css');
let css = readFileSync(cssPath, 'utf8');
if (!css.includes('data-universe="tabletop-kingdom"')) {
  css = css.replace(
    '.play-shell[data-universe="retroverse"] { --stage-accent: #39ffde; }',
    '.play-shell[data-universe="retroverse"] { --stage-accent: #39ffde; }\n.play-shell[data-universe="tabletop-kingdom"] { --stage-accent: #f0c987; }'
  );
  writeFileSync(cssPath, css, 'utf8');
  console.log('✅ Added tabletop-kingdom CSS accent');
}

/* ── 6. Generate play/ and games/ HTML pages ── */
function renderPlayPage(g) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><title>${g.title} - Play Tabletop Kingdom</title><meta name="description" content="${g.mascot}: ${g.desc}"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="dns-prefetch" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="/assets/css/styles.css"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap"><style>
#mm-game{width:100%;max-width:540px;margin:0 auto;display:block;aspect-ratio:3/4;background:#231815;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.3)}.play-wrapper{min-height:100vh;background:linear-gradient(135deg,#6b4c3b 0%,#4a3328 100%);padding:24px 16px;display:flex;flex-direction:column;align-items:center}
</style></head><body class="play-wrapper"><h1 style="color:#f0c987;font-size:22px;margin:0 0 4px;text-align:center">${g.title}</h1><p style="color:#c4a87c;font-size:13px;margin:0 0 16px;text-align:center">${g.mascot} · ${g.genre}</p><div id="mm-game"></div>
<script type="module">
import { startGame } from '/assets/js/mmengine.js';
import { themeFor, modeFor } from '/assets/js/mmengine.js';
const game = ${JSON.stringify({ id: g.id, title: g.title, slug: g.slug, universe: 'tabletop-kingdom', genre: g.genre, engine: 'board', boardVariant: g.variant, mascot: g.mascot, description: g.desc })};
const mount = document.getElementById('mm-game');
startGame(mount, game);
</script>
<p style="color:#c4a87c;font-size:12px;margin:16px 0 0;text-align:center">← <a href="/games/${g.slug}/" style="color:#f0c987">Game details</a> · <a href="/" style="color:#f0c987">Home</a></p>
<script src="/assets/js/monetag-loader.js" defer></script></body></html>`;
}

function renderDetailPage(g) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${g.title} - Tabletop Kingdom Game Details</title><meta name="description" content="${g.mascot}: ${g.desc}"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="dns-prefetch" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="/assets/css/styles.css"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap"><style>
body{background:linear-gradient(135deg,#6b4c3b 0%,#4a3328 100%);min-height:100vh;color:#f0e8dc;font-family:Outfit,sans-serif;padding:24px 16px}.detail-wrap{max-width:800px;margin:0 auto}.card-img{width:100%;max-width:320px;border-radius:16px;display:block;margin:0 auto 24px;box-shadow:0 8px 32px rgba(0,0,0,.3)}.play-btn{display:inline-block;background:#f0c987;color:#4a3328;padding:14px 48px;border-radius:40px;font-weight:700;font-size:18px;text-decoration:none;margin:0 auto 24px;text-align:center;transition:transform .15s}.play-btn:hover{transform:scale(1.05)}h1{color:#f0c987;font-size:32px;text-align:center;margin:0 0 8px}.meta{text-align:center;color:#c4a87c;font-size:14px;margin:0 0 24px}.desc{font-size:15px;line-height:1.6;text-align:center;max-width:600px;margin:0 auto 24px;color:#ddd0c0}
</style></head><body><div class="detail-wrap"><img src="/assets/images/tabletop-cards/${g.slug}.svg" alt="${g.title}" class="card-img" loading="lazy"><h1>${g.title}</h1><p class="meta">${g.mascot} · ${g.genre} · ${g.variant}</p><p class="desc">${g.desc}</p><div style="text-align:center"><a href="/play/${g.slug}/" class="play-btn">▶ Play Now</a></div><p style="text-align:center;margin-top:24px;color:#c4a87c;font-size:13px"><a href="/" style="color:#f0c987">Home</a> · <a href="/universes/" style="color:#f0c987">Universes</a> · <a href="/games/" style="color:#f0c987">All Games</a></p></div>
<script src="/assets/js/monetag-loader.js" defer></script></body></html>`;
}

for (const g of GAMES) {
  const playDir = join(ROOT, 'play', g.slug);
  const gamesDir = join(ROOT, 'games', g.slug);
  if (!existsSync(playDir)) mkdirSync(playDir, { recursive: true });
  if (!existsSync(gamesDir)) mkdirSync(gamesDir, { recursive: true });
  writeFileSync(join(playDir, 'index.html'), renderPlayPage(g), 'utf8');
  writeFileSync(join(gamesDir, 'index.html'), renderDetailPage(g), 'utf8');
  console.log(`  📄 Generated ${g.slug} pages`);
}

console.log('\n🎉 Tabletop Kingdom build complete!');
