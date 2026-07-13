import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const gamesPath = path.join(publicDir, 'assets/data/games.json');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, content) => {
  const full = path.join(root, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.replace(/\r\n/g, '\n'));
};
const replaceRequired = (text, pattern, replacement, label) => {
  const next = text.replace(pattern, replacement);
  if (next === text) throw new Error(`Required replacement failed: ${label}`);
  return next;
};
const escapeHtml = value => String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

let games = JSON.parse(fs.readFileSync(gamesPath, 'utf8'));
if (!Array.isArray(games)) throw new Error('games.json must be an array');

const uniqueDescriptions = {
  'lulu-lanterns-lost-woods': 'Guide Lulu Lantern through a shifting woodland of glow paths, sleepy spirits and hidden clearings. Follow the light, recover lost fireflies and unlock safer routes before the forest closes in.',
  'lulu-lanterns-glow-garden': 'Help Lulu Lantern restore a moonlit garden by linking glowing blossoms, waking gentle creatures and building longer light chains for increasingly spectacular bloom bonuses.',
  'nine-gates-mahjong-trails': 'Travel the Nine Gates Mahjong Kingdom through handcrafted tile trails, clearing layered formations, uncovering lucky symbols and mastering calm, strategic matching challenges.',
  'baos-jade-dragon-rescue': 'Join Bao on a jade-dragon rescue mission where every tile chain opens a new path, releases trapped guardians and rebuilds the lantern bridges across the kingdom.'
};

const abilityByEngine = {
  runner: 'Momentum Rush', match3: 'Combo Spark', puzzle: 'Insight Pulse', management: 'Rush Hour',
  serve: 'Rush Hour', memory: 'Perfect Recall', rhythm: 'Beat Focus', shooter: 'Overdrive', board: 'Tactical Focus',
  tower: 'Guardian Shield', racing: 'Turbo Line', sports: 'Precision Shot', cannon: 'Bank Shot', merge: 'Merge Spark',
  pipeline: 'Flow Freeze', bubbleshooter: 'Bubble Burst', platformer: 'Air Step', asteroids: 'Sector Shield',
  pinball: 'Multiball', flappy: 'Wind Glide', stacker: 'Perfect Drop'
};

const imageDir = path.join(publicDir, 'assets/images/games');
fs.mkdirSync(imageDir, { recursive: true });
const colors = ['#ff4f9a','#8a5cff','#19c39c','#ff6b35','#3ad0ff','#ffd166'];
function makeGameSvg(game, index) {
  const c1 = colors[index % colors.length];
  const c2 = colors[(index + 2) % colors.length];
  const initials = String(game.title || game.slug).split(/\s+/).slice(0, 3).map(part => part[0]).join('').toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750" viewBox="0 0 1200 750" role="img" aria-labelledby="title desc">
<title id="title">${escapeHtml(game.title)}</title><desc id="desc">Original key art for ${escapeHtml(game.title)}.</desc>
<defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient><radialGradient id="glow"><stop stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
<rect width="1200" height="750" rx="48" fill="url(#bg)"/><circle cx="960" cy="120" r="250" fill="url(#glow)"/><circle cx="150" cy="650" r="310" fill="#140a2e" opacity=".22"/>
<g fill="#fff" opacity=".22">${Array.from({length:18},(_,i)=>`<circle cx="${80+(i*137)%1080}" cy="${70+(i*89)%560}" r="${7+(i%4)*4}"/>`).join('')}</g>
<g transform="translate(600 335)"><circle r="178" fill="#fff" opacity=".18"/><circle r="142" fill="#fff" opacity=".94"/><text x="0" y="36" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="110" fill="${c1}">${escapeHtml(initials)}</text></g>
<text x="600" y="600" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="58" fill="#fff">${escapeHtml(game.title)}</text>
<text x="600" y="657" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="28" fill="#fff" opacity=".86">${escapeHtml(game.mascot || 'Mochi Mango Arcade')} · ${escapeHtml(game.genre || 'Arcade')}</text>
</svg>`;
}

let generatedImages = 0;
for (let index = 0; index < games.length; index++) {
  const game = games[index];
  delete game.rating;
  delete game.plays;
  delete game.merchHook;
  game.status = game.built ? 'Playable' : 'In development';
  game.author = 'Fire Dragon Interactive';
  game.version = game.version || '1.1';
  game.releaseDate = game.releaseDate || '2026-07-13';
  game.lastUpdated = '2026-07-13';
  game.objective = game.objective || `Master the ${String(game.genre || game.engine || 'arcade').toLowerCase()} challenge and beat your personal best.`;
  game.signatureAbility = game.signatureAbility || abilityByEngine[game.engine] || 'Arcade Spark';
  if (uniqueDescriptions[game.slug]) game.description = uniqueDescriptions[game.slug];

  const exact = String(game.image || '').replace(/^\//, '');
  let selected = exact && fs.existsSync(path.join(publicDir, exact)) ? `/${exact}` : '';
  if (!selected) {
    for (const ext of ['jpg','jpeg','png','webp','svg']) {
      const candidate = `assets/images/games/${game.slug}.${ext}`;
      if (fs.existsSync(path.join(publicDir, candidate))) { selected = `/${candidate}`; break; }
    }
  }
  if (!selected) {
    const rel = `assets/images/games/${game.slug}.svg`;
    fs.writeFileSync(path.join(publicDir, rel), makeGameSvg(game, index));
    selected = `/${rel}`;
    generatedImages++;
  }
  game.image = selected;
  game.detailUrl = `/games/${game.slug}/`;
  game.playUrl = `/play/${game.slug}/`;
}
fs.writeFileSync(gamesPath, JSON.stringify(games, null, 2) + '\n');

function pageHtml(game, kind) {
  const isPlay = kind === 'play';
  const canonical = `https://www.mochimangoarcade.com/${isPlay ? 'play' : 'games'}/${game.slug}/`;
  const title = isPlay ? `Play ${game.title} — Free HTML5 Game` : `${game.title} — Free Browser Game`;
  const description = `${game.description} Play free in your browser on mobile and desktop.`.slice(0, 220);
  const schema = {
    '@context': 'https://schema.org', '@type': 'VideoGame', name: game.title, description: game.description,
    url: canonical, image: `https://www.mochimangoarcade.com${game.image}`, genre: [game.genre, 'HTML5'],
    gamePlatform: ['Web Browser','HTML5'], applicationCategory: 'Game', operatingSystem: 'Any',
    playMode: 'SinglePlayer', inLanguage: 'en', author: {'@type':'Organization',name:'Fire Dragon Interactive'},
    publisher: {'@type':'Organization',name:'Mochi Mango Arcade'}, offers: {'@type':'Offer',price:'0',priceCurrency:'USD'}
  };
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#c61f68"><title>${escapeHtml(title)} · Mochi Mango Arcade</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="Mochi Mango Arcade"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="https://www.mochimangoarcade.com${game.image}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/favicon.svg"><link rel="manifest" href="/manifest.webmanifest"><link rel="stylesheet" href="/assets/css/styles.css"><script type="application/ld+json">${JSON.stringify(schema)}</script></head><body data-page="${isPlay ? 'play' : 'gameDetail'}" data-slug="${game.slug}"><div class="site-bg"><span class="orb one"></span><span class="orb two"></span><span class="orb three"></span></div><div id="appHeader"></div><div id="appMain"><main id="main" class="container"><article class="seo-article"><img src="${game.image}" width="640" height="400" alt="${escapeHtml(game.title)}"><h1>${escapeHtml(game.title)}</h1><p class="lead">${escapeHtml(game.description)}</p><p><a class="btn" href="/play/${game.slug}/">▶ Play free</a></p><h2>How to play</h2><p>${escapeHtml(game.objective)}</p><h2>Signature ability</h2><p>${escapeHtml(game.signatureAbility)}</p><h2>Game facts</h2><ul><li>Genre: ${escapeHtml(game.genre)}</li><li>Character: ${escapeHtml(game.mascot)}</li><li>Universe: ${escapeHtml(game.universeName || game.universe)}</li><li>Version: ${escapeHtml(game.version)}</li></ul></article></main></div><div id="appFooter"></div><script type="module" src="/assets/js/app.js"></script></body></html>`;
}

let generatedPages = 0;
for (const game of games) {
  for (const kind of ['games','play']) {
    const file = path.join(publicDir, kind, game.slug, 'index.html');
    if (!fs.existsSync(file)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, pageHtml(game, kind === 'play' ? 'play' : 'detail'));
      generatedPages++;
    }
  }
}

function cleanStructured(value) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) return value.forEach(cleanStructured);
  for (const key of ['aggregateRating','review','reviewRating','potentialAction']) delete value[key];
  if (value['@type'] === 'Product') delete value.offers;
  Object.values(value).forEach(cleanStructured);
}

let cleanedHtml = 0;
for (const dirent of fs.readdirSync(publicDir, { recursive: true, withFileTypes: true })) {
  if (!dirent.isFile() || !dirent.name.endsWith('.html')) continue;
  const full = path.join(dirent.parentPath || dirent.path, dirent.name);
  let html = fs.readFileSync(full, 'utf8');
  const before = html;
  html = html.replace(/<meta\s+name=["']keywords["'][^>]*>/gi, '');
  html = html.replace(/<script[^>]+src=["'][^"']*(?:monetag-loader|demolishwrestconclusions\.com|n6wxm\.com|5gvci\.com)[^"']*["'][^>]*><\/script>/gi, '');
  html = html.replace(/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi, (match, payload) => {
    try { const data = JSON.parse(payload); cleanStructured(data); return `<script type="application/ld+json">${JSON.stringify(data)}</script>`; }
    catch { return match; }
  });
  html = html.replace(/official\s+([\w &’'\-]+\s+)?merch(?:andise)?/gi, 'planned character merchandise');
  html = html.replace(/Shop official[^<.]*[.<]/gi, 'Explore the character world.<');
  if (html !== before) { fs.writeFileSync(full, html); cleanedHtml++; }
}

let app = read('public/assets/js/app.js');
app = replaceRequired(app,
  /const S=\{games:\[\],products:\[\],universes:\{\},i18n:\{\},lang:localStorage\.mma_lang\|\|'en',cart:JSON\.parse\(localStorage\.mma_cart\|\|'\[\]'\)\};/,
  `const safeParse=(value,fallback)=>{try{return JSON.parse(value)}catch{return fallback}};\nconst S={games:[],products:[],universes:{},i18n:{},lang:localStorage.mma_lang||'en',cart:safeParse(localStorage.mma_cart||'[]',[])};`, 'safe local storage');
app = replaceRequired(app, /async function J\(p\)\{return \(await fetch\(p\)\)\.json\(\)\}/,
  `async function J(p){const response=await fetch(p,{credentials:'same-origin'});if(!response.ok)throw new Error(\`Failed to load \${p}: \${response.status}\`);return response.json()}`, 'robust JSON loader');
app = replaceRequired(app, /function getProductRating\(id\) \{[\s\S]*?\n\}/,
  `function getProductRating(){return {rating:null,reviews:0,stars:''}}`, 'remove synthetic product rating');
app = replaceRequired(app, /\/\* ================= Adsterra ad units =================[\s\S]*?function gameCard\(g\)\{/,
  `/* Advertising is disabled until consent, privacy and brand-safety controls are implemented. */\nconst adSlot=()=>'';const adResponsive=()=>'';const adTop=()=>'';const adSide=()=>'';const adNative=()=>'';const adSkyscraper=()=>'';function mountAds(){}function mountSocialBar(){}\n\nfunction gameCard(g){`, 'remove ad runtime');
app = app.replace(/\s*<span class="rating">★ \$\{g\.rating\}<\/span>/g, '');
app = replaceRequired(app, /function rewardCard\(g\) \{[\s\S]*?\n\}\n\nfunction playPage/,
  `function rewardCard(){return ''}\n\nfunction playPage`, 'remove sponsor reward card');
app = replaceRequired(app, /function mountEngine\(sl\)\{[\s\S]*?\n\}\n\nfunction profileEventId/,
`function mountEngine(sl){
  const stage=document.getElementById('gameStage');
  if(!stage)return;
  const g=S.games.find(x=>x.slug===sl)||S.games[0];
  Promise.all([import('/assets/js/mmengine.js'),import('/assets/js/game-quality.js')]).then(([engine,quality])=>{
    try{activeGame=engine.startGame(stage,g)}catch(error){console.error('Primary game runtime failed',error);activeGame=quality.startFallback(stage,g);return}
    setTimeout(()=>{
      const visible=stage.querySelector('canvas,iframe');
      if(!visible){try{activeGame?.destroy?.()}catch{}activeGame=quality.startFallback(stage,g)}
      else activeGame=quality.enhanceShared(stage,g,activeGame)||activeGame;
      if(queuedReward){activeGame?.applyReward?.(queuedReward);queuedReward=null}
    },350);
  }).catch(error=>{
    console.error('Game engine failed to load',error);
    import('/assets/js/game-quality.js').then(quality=>{activeGame=quality.startFallback(stage,g)}).catch(()=>{stage.innerHTML='<div class="empty" style="padding:40px">This game could not load. <a href="'+g.detailUrl+'">View details</a></div>'});
  });
}

function profileEventId`, 'quality-aware engine mount');
app = app.replace(/sort=='popular'\? y\.plays-x\.plays : x\.id-y\.id/g, `sort=='popular'? Number(y.featured)-Number(x.featured)||y.id-x.id : x.id-y.id`);
app = app.replace(/document\.addEventListener\('pointermove',spark,\{passive:true\}\);/g, `/* Pointer spark disabled for performance and reduced visual noise. */`);
app = replaceRequired(app, /function tilt\(\)\{[\s\S]*?\n\}/,
  `function tilt(){/* Card tilt disabled for stable mobile and keyboard interaction. */}`, 'disable tilt');
app = app.replace(/\n\s*mountAds\(\);\n/g, '\n');
app = app.replace(/\n\s*mountSocialBar\(\);\n/g, '\n');
write('public/assets/js/app.js', app);

let engine = read('public/assets/js/mmengine.js');
engine = replaceRequired(engine, /\n\s*showPreroll\(\) \{[\s\S]*?\n\s*showStart\(\) \{/,
  `\n  showPreroll() { this.showStart(); }\n\n  showStart() {`, 'remove preroll');
engine = replaceRequired(engine, /\n\s*showStart\(\) \{[\s\S]*?\n\s*showOver\(\) \{/,
`\n  showStart() {
    const card=this.game.image||'';
    this.overlay.innerHTML=\`<div class="mma-panel mma-start-panel">
      \${card?\`<img class="mma-keyart" src="\${card}" alt="\${this.game.title} key art" decoding="async" onerror="this.remove()">\`:''}
      <h2>\${this.game.title}</h2><p class="mma-instructions">\${this.instructions()}</p>
      <div class="mma-difficulty" aria-label="Challenge level"><span>Challenge</span>
      \${[['cozy','Cozy'],['arcade','Arcade'],['legend','Legend']].map(([id,label])=>\`<button type="button" data-challenge="\${id}" aria-pressed="\${this.challenge===id}" class="\${this.challenge===id?'is-selected':''}">\${label}</button>\`).join('')}</div>
      <button class="mma-btn mma-play-normal" type="button">▶ Play</button>
      <div class="mma-best">Best: \${this.best} · Press F for fullscreen</div></div>\`;
    this.overlay.classList.add('show');
    this.overlay.querySelectorAll('[data-challenge]').forEach(button=>button.addEventListener('click',()=>{this.challenge=button.dataset.challenge;localStorage.setItem(\`mma_challenge_\${this.game.slug}\`,this.challenge);this.showStart()}));
    this.overlay.querySelector('.mma-play-normal').onclick=()=>this.start(false);
  }

  showOver() {`, 'simplify start menu');
engine = replaceRequired(engine, /\n\s*showOver\(\) \{[\s\S]*?\n\s*start\(useArmedBoost = Boolean\(this\._armedBoost\)\) \{/,
`\n  showOver() {
    if(this.over)return;this.over=true;this.running=false;this.sound.over();
    const outcome=this.outcome||this.raceResult||(this.completed||this.won?'win':'loss');
    const nb=this.score>this.best;if(nb){this.best=Math.floor(this.score);localStorage[this.bestKey]=this.best}
    window.dispatchEvent(new CustomEvent('mma:game-over',{detail:{slug:this.game.slug,score:Math.floor(this.score),combo:this.combo,outcome,challenge:this.challenge,level:this.level,wave:this.wave}}));
    this.overlay.innerHTML=\`<div class="mma-panel"><div class="mma-medal">\${nb?'🏆':'⭐'}</div><h2>\${nb?'New Best!':outcome==='win'?'Victory!':'Run Complete'}</h2><p class="mma-final">Score <b>\${Math.floor(this.score)}</b></p><div class="mma-best">Best: \${this.best}</div><div class="mma-over-actions"><button class="mma-btn mma-btn-secondary">↻ Play again</button></div></div>\`;
    this.overlay.classList.add('show');this.overlay.querySelector('.mma-btn-secondary').onclick=()=>this.start(false);
  }

  start(useArmedBoost = false) {`, 'simplify game over');
engine = replaceRequired(engine,
  /this\.grid = \[\];\n\s*this\.size = 4;\n\s*this\.won = false;\n\s*this\.undoGrid = null;\n\s*this\.mergesInMove = 0;\n\s*this\.bestTile = 0;\n\s*for \(let r = 0; r < this\.size; r\+\+\) \{ this\.grid\[r\] = \[\]; for \(let c = 0; c < this\.size; c\+\+\) this\.grid\[r\]\[c\] = 0; \}\n\s*this\._addRandom\(\); this\._addRandom\(\);\n\s*this\.mergePops = \[\];/,
  `this.grid = [];\n    this.size = 4;\n    this.won = false;\n    this.undoGrid = null;\n    this.mergesInMove = 0;\n    this.bestTile = 0;\n    this.mergePops = [];\n    for (let r = 0; r < this.size; r++) { this.grid[r] = []; for (let c = 0; c < this.size; c++) this.grid[r][c] = 0; }\n    this._addRandom(); this._addRandom();`, 'fix merge initialization');
const pipelineStart = engine.indexOf('class Pipeline extends Base');
const galleryStart = engine.indexOf('class Gallery extends Base', pipelineStart);
if (pipelineStart < 0 || galleryStart < 0) throw new Error('Pipeline class not found');
let pipeline = engine.slice(pipelineStart, galleryStart);
const renderStart = pipeline.indexOf('  render() {');
if (renderStart < 0) throw new Error('Pipeline render not found');
let pipelineHead = pipeline.slice(0, renderStart);
let pipelineRender = pipeline.slice(renderStart);
pipelineRender = pipelineRender.replace(/for \(let r = 0; r < this\.rows; r\+\+\) for \(let c = 0; c < this\.cols; c\+\+\)/g, 'for (let r = 0; r < this.rows; r++) for (let colIndex = 0; colIndex < this.cols; colIndex++)');
pipelineRender = pipelineRender.replace(/this\.grid\[r\]\[c\]/g, 'this.grid[r][colIndex]');
pipelineRender = pipelineRender.replace(/offX \+ c \* cs/g, 'offX + colIndex * cs');
engine = engine.slice(0, pipelineStart) + pipelineHead + pipelineRender + engine.slice(galleryStart);
write('public/assets/js/mmengine.js', engine);

let worker = read('src/worker.js');
worker = replaceRequired(worker, /const HARDENING_STYLESHEET = '<link rel="stylesheet" href="\/assets\/css\/hardening\.css">';/,
  `const HARDENING_STYLESHEET = '<link rel="stylesheet" href="/assets/css/hardening.css"><link rel="stylesheet" href="/assets/css/game-quality.css">';`, 'inject quality CSS');
worker = worker.replace(`"script-src 'self' 'unsafe-inline'"`, `"script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com"`);
worker = worker.replace(`"connect-src 'self'"`, `"connect-src 'self' https://cloudflareinsights.com"`);
const telemetryFn = `
const TELEMETRY_EVENTS = new Set(['runtime','fallback','start','finish','ability','error']);
async function handleTelemetry(request, env) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
  const type = request.headers.get('content-type') || '';
  if (!type.includes('application/json')) return Response.json({ ok: false, error: 'json_required' }, { status: 415 });
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 4096) return Response.json({ ok: false, error: 'too_large' }, { status: 413 });
  let body; try { body = await request.json(); } catch { return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  const event = String(body.event || '');
  const game = String(body.game || '');
  const mode = String(body.mode || '').slice(0, 40);
  const viewport = ['mobile','desktop'].includes(body.viewport) ? body.viewport : 'unknown';
  const outcome = String(body.outcome || '').slice(0, 40);
  const value = Number.isFinite(Number(body.value)) ? Math.max(0, Math.min(10000000, Math.round(Number(body.value)))) : null;
  if (!TELEMETRY_EVENTS.has(event) || !/^[a-z0-9-]{2,100}$/.test(game)) return Response.json({ ok: false, error: 'invalid_event' }, { status: 400 });
  const recordedAt = new Date().toISOString();
  const persist = async () => {
    if (!env.DB) return;
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS gameplay_events (id INTEGER PRIMARY KEY AUTOINCREMENT, event TEXT NOT NULL, game TEXT NOT NULL, mode TEXT, viewport TEXT, outcome TEXT, value INTEGER, recorded_at TEXT NOT NULL)').run();
    await env.DB.prepare('INSERT INTO gameplay_events (event, game, mode, viewport, outcome, value, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(event, game, mode, viewport, outcome, value, recordedAt).run();
  };
  try { await persist(); } catch (error) { console.error('telemetry_persist_failed', error); }
  console.log(JSON.stringify({ type: 'gameplay', event, game, mode, viewport, outcome, value, recordedAt }));
  return Response.json({ ok: true }, { status: 202 });
}
`;
worker = replaceRequired(worker, /\nexport default \{/,
  `${telemetryFn}\nexport default {`, 'add telemetry handler');
worker = replaceRequired(worker, /\n\s*if \(url\.pathname === '\/api\/health'\) \{/,
  `\n    if (url.pathname === '/api/telemetry') return withSecurityHeaders(await handleTelemetry(request, env), url);\n\n    if (url.pathname === '/api/health') {`, 'route telemetry');
write('src/worker.js', worker);

write('public/js/monetag-loader.js', `// Advertising intentionally disabled until consent, privacy and brand-safety controls are implemented.\nwindow.MochiMangoRewards={request:()=>false,peekReady:()=>null};\n`);
write('public/assets/css/game-quality.css', `
.mma-quality-panel{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:16px;align-items:center;margin:16px 0 22px;padding:16px 18px;border:1px solid rgba(138,92,255,.2);border-radius:20px;background:linear-gradient(135deg,rgba(255,255,255,.96),rgba(246,242,255,.96));box-shadow:0 10px 26px rgba(39,22,80,.08)}
.mma-quality-copy{display:grid;gap:3px}.mma-quality-kicker{text-transform:uppercase;letter-spacing:.12em;font-size:11px;font-weight:900;color:#7a47dc}.mma-quality-copy strong{font-size:18px;color:#2b2340}.mma-quality-copy span:last-child{font-size:13px;color:#665d7d}.mma-quality-stats{display:grid;gap:3px;text-align:right;font-size:12px;font-weight:800;color:#665d7d}.mma-quality-stats [data-quality-stars]{color:#d18a00;font-size:17px;letter-spacing:.08em}.mma-quality-ability{border:0;border-radius:999px;padding:12px 16px;background:linear-gradient(135deg,#7b3de2,#c61f68);color:#fff;font-weight:900;cursor:pointer;box-shadow:0 8px 18px rgba(123,61,226,.24)}.mma-quality-ability:disabled{opacity:.7;cursor:default}.mma-fallback-canvas{display:block;width:100%;height:100%;min-height:360px}
@media(max-width:720px){.mma-quality-panel{grid-template-columns:1fr 1fr}.mma-quality-copy{grid-column:1/-1}.mma-quality-stats{text-align:left}.mma-quality-ability{justify-self:end;padding:11px 14px}}
@media(prefers-reduced-motion:reduce){.mma-quality-panel,.mma-quality-ability{scroll-behavior:auto;transition:none!important}}
`);

const core = ['','games/','universes/','characters/','new-releases/','about/','privacy/','terms/'];
const urls = core.map(item => `https://www.mochimangoarcade.com/${item}`)
  .concat(games.flatMap(game => [`https://www.mochimangoarcade.com/games/${game.slug}/`,`https://www.mochimangoarcade.com/play/${game.slug}/`]));
write('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${url}</loc><lastmod>2026-07-13</lastmod></url>`).join('\n')}\n</urlset>\n`);
write('public/assets/data/site-facts.json', JSON.stringify({
  name:'Mochi Mango Arcade', canonicalUrl:'https://www.mochimangoarcade.com/', publisher:'Fire Dragon Interactive',
  gameCount:games.length, playableCount:games.filter(game=>game.built).length, universeCount:new Set(games.map(game=>game.universe)).size,
  pricing:'Free to play', accountRequired:false, merchandiseStatus:'Concept preview', lastVerified:'2026-07-13'
}, null, 2) + '\n');
write('public/llms.txt', `# Mochi Mango Arcade\n\nMochi Mango Arcade is a free browser-game portal by Fire Dragon Interactive.\n\n- Canonical URL: https://www.mochimangoarcade.com/\n- Games: ${games.length}\n- Playable now: ${games.filter(game=>game.built).length}\n- Universes: ${new Set(games.map(game=>game.universe)).size}\n- Price: Free to play\n- Account: Optional; not required to play\n- Merchandise: Concept preview; purchasing is not currently available\n- Publisher: Fire Dragon Interactive\n- Catalogue data: https://www.mochimangoarcade.com/assets/data/games.json\n- Machine-readable facts: https://www.mochimangoarcade.com/assets/data/site-facts.json\n- Sitemap: https://www.mochimangoarcade.com/sitemap.xml\n\nGame pages provide title, genre, character, universe, objective, version and play link. All characters and game artwork are original to the publisher.\n`);

let pkg = JSON.parse(read('package.json'));
pkg.scripts = { ...pkg.scripts, remediate:'node scripts/remediate-site.mjs', validate:'node scripts/validate-site.mjs', audit:'node scripts/sitewide-audit.mjs' };
pkg.devDependencies = { ...pkg.devDependencies, wrangler:'4.30.0', 'http-server':'14.1.1' };
write('package.json', JSON.stringify(pkg, null, 2) + '\n');

const placeholder = path.join(root, 'scripts/placeholder.txt');
if (fs.existsSync(placeholder)) fs.unlinkSync(placeholder);

console.log(JSON.stringify({ games: games.length, generatedImages, generatedPages, cleanedHtml }, null, 2));
