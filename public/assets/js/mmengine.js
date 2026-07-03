/**
 * Mochi Mango Arcade — Themed Game Engine
 * A self-contained, dependency-free HTML5 game framework.
 *
 * One entry point, `startGame(mount, game)`, reads a game's metadata
 * (mascot, universe palette, genre) and renders a real, playable,
 * mobile-friendly canvas game themed to that title.
 *
 * Modes: runner · dodger · shooter · match3 · serve
 */

/* ------------------------------------------------------------------ *
 * Theme derivation
 * ------------------------------------------------------------------ */

const UNIVERSE_PALETTE = {
  cozyverse:  { primary: '#ff8eb3', accent: '#ffd166', sky: ['#fff0f6', '#ffe0ec'], ground: '#f7b7cf' },
  astromochi: { primary: '#8a5cff', accent: '#25d8ff', sky: ['#1a1440', '#3a2a7a'], ground: '#5c3fb0' },
  ninegates:  { primary: '#0fbf9f', accent: '#f7c948', sky: ['#04372f', '#0a5c4d'], ground: '#0b8f78' },
  snackstreet:{ primary: '#ff6b35', accent: '#ffd100', sky: ['#2a1206', '#5c2a12'], ground: '#c24a1a' },
  oracle:     { primary: '#8d3cff', accent: '#ff4f9a', sky: ['#1a0730', '#3a1060'], ground: '#5c1e9a' },
  standalone: { primary: '#ffbd2e', accent: '#ff4f9a', sky: ['#fff7e6', '#ffe9c7'], ground: '#f2b34a' }
};

// Keyword -> hero glyph. First match on the lowercased mascot/title wins.
const HERO_GLYPHS = [
  ['dragon', '🐉'], ['panda', '🐼'], ['neko', '🐱'], ['cat', '🐱'], ['kitt', '🐱'],
  ['corgi', '🐶'], ['pup', '🐶'], ['duck', '🦆'], ['bear', '🐻'], ['bunny', '🐰'],
  ['rabbit', '🐰'], ['frog', '🐸'], ['ninja', '🥷'], ['fox', '🦊'], ['owl', '🦉'],
  ['penguin', '🐧'], ['koala', '🐨'], ['llama', '🦙'], ['monkey', '🐵'], ['mouse', '🐭'],
  ['hamster', '🐹'], ['hedgehog', '🦔'], ['crab', '🦀'], ['octopus', '🐙'], ['kraken', '🐙'],
  ['shrimp', '🦐'], ['prawn', '🦐'], ['starfish', '⭐'], ['star', '⭐'], ['whale', '🐋'],
  ['walrus', '🦭'], ['flamingo', '🦩'], ['parrot', '🦜'], ['crow', '🐦‍⬛'], ['pigeon', '🐦'],
  ['zebra', '🦓'], ['hippo', '🦛'], ['tiger', '🐯'], ['wombat', '🐨'], ['sloth', '🦥'],
  ['gecko', '🦎'], ['lizard', '🦎'], ['turtle', '🐢'], ['snail', '🐌'], ['worm', '🐛'],
  ['beetle', '🪲'], ['firefly', '🪰'], ['bee', '🐝'], ['bumble', '🐝'], ['bat', '🦇'],
  ['goblin', '👺'], ['wizard', '🧙'], ['knight', '🛡️'], ['robot', '🤖'], ['bot', '🤖'],
  ['mecha', '🤖'], ['astro', '🚀'], ['rocket', '🚀'], ['comet', '☄️'], ['meteor', '☄️'],
  ['nova', '🌟'], ['moon', '🌙'], ['cloud', '☁️'], ['lantern', '🏮'], ['crane', '🕊️'],
  ['chef', '👨‍🍳'], ['noodle', '🍜'], ['ramen', '🍜'], ['donut', '🍩'], ['cupcake', '🧁'],
  ['muffin', '🧁'], ['waffle', '🧇'], ['pancake', '🥞'], ['biscuit', '🍪'], ['cookie', '🍪'],
  ['gummy', '🐻'], ['jelly', '🍮'], ['jellyfish', '🎐'], ['mallow', '🍡'], ['mochi', '🍡'],
  ['mango', '🥭'], ['banana', '🍌'], ['lemon', '🍋'], ['onion', '🧅'], ['radish', '🌱'],
  ['beet', '🌱'], ['peapod', '🫛'], ['pumpkin', '🎃'], ['cactus', '🌵'], ['pickle', '🥒'],
  ['tofu', '🍲'], ['cheese', '🧀'], ['nacho', '🧀'], ['hotdog', '🌭'], ['ravioli', '🥟'],
  ['spaghetti', '🍝'], ['yeti', '❄️'], ['sock', '🧦'], ['teacup', '🍵'], ['teapot', '🫖'],
  ['coffee', '☕'], ['bean', '☕'], ['tankard', '🍺'], ['popcorn', '🍿'], ['cornflake', '🥣'],
  ['pirate', '🏴‍☠️'], ['captain', '⚓'], ['fortune', '🔮'], ['oracle', '🔮'], ['tarot', '🔮'],
  ['ghost', '👻'], ['mummy', '🧟'], ['monster', '👾'], ['zebra', '🦓'], ['volcano', '🌋'],
  ['golem', '🗿'], ['detective', '🕵️'], ['postmaster', '📮'], ['pegasus', '🦄'], ['unicorn', '🦄']
];

const GENRE_ITEMS = {
  cozyverse:  ['🍓', '🍯', '🌸', '🍄', '🌰'],
  astromochi: ['⭐', '🪐', '🌟', '☄️', '🛸'],
  ninegates:  ['🀄', '🏮', '🐉', '🪙', '🎋'],
  snackstreet:['🍜', '🍔', '🍤', '🌮', '🧋'],
  oracle:     ['🔮', '🌙', '🃏', '✨', '🕯️'],
  standalone: ['🍬', '🍭', '⭐', '🎈', '🧁']
};

const HAZARDS = {
  cozyverse:  ['🌧️', '🐝', '🪨'],
  astromochi: ['☄️', '👾', '🌑'],
  ninegates:  ['💣', '🌩️', '🐍'],
  snackstreet:['🌶️', '🔥', '💣'],
  oracle:     ['💀', '🕷️', '⚡'],
  standalone: ['💣', '🌩️', '🪨']
};

function pick(list, str) {
  const s = str.toLowerCase();
  for (const [key, glyph] of list) if (s.includes(key)) return glyph;
  return null;
}

function themeFor(game) {
  const uni = UNIVERSE_PALETTE[game.universe] || UNIVERSE_PALETTE.standalone;
  const hero = pick(HERO_GLYPHS, game.mascot + ' ' + game.title) || '🍡';
  const dark = ['astromochi', 'ninegates', 'snackstreet', 'oracle'].includes(game.universe);
  return {
    ...uni,
    hero,
    items: GENRE_ITEMS[game.universe] || GENRE_ITEMS.standalone,
    hazards: HAZARDS[game.universe] || HAZARDS.standalone,
    dark,
    text: dark ? '#ffffff' : '#2C2352'
  };
}

function modeFor(game) {
  const g = (game.genre + ' ' + game.engine).toLowerCase();
  if (/(shooter|bullet|boss|defen|arena|battler|tactic|tower|rescue patrol)/.test(g)) return 'shooter';
  if (/(match|tile|mahjong|sort|flow|logic|gravity|memory|solitaire|hidden|deduction|slide)/.test(g)) return 'match3';
  if (/(manage|cook|serv|shop|hotel|tavern|farm|sim|cafe|kitchen|bakery|time management|market|salon|dress)/.test(g)) return 'serve';
  if (/(runner|racing|racer|driv|lane|dash|sprint|derby|flight|flying|glide|rhythm|drift)/.test(g)) return 'runner';
  if (game.engine === 'runner') return 'runner';
  if (game.engine === 'puzzle') return 'match3';
  if (game.engine === 'management') return 'serve';
  return 'dodger';
}

/* ------------------------------------------------------------------ *
 * Audio (WebAudio, tiny synth blips)
 * ------------------------------------------------------------------ */

class Audio {
  constructor() { this.ctx = null; this.muted = localStorage.mma_muted === '1'; }
  ensure() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; } } }
  blip(freq = 440, dur = 0.08, type = 'sine', vol = 0.2) {
    if (this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start(t); o.stop(t + dur);
  }
  coin() { this.blip(880, 0.09, 'triangle', 0.18); this.blip(1320, 0.07, 'triangle', 0.12); }
  jump() { this.blip(520, 0.12, 'square', 0.14); }
  hit() { this.blip(140, 0.22, 'sawtooth', 0.22); }
  power() { this.blip(660, 0.1, 'sine', 0.2); setTimeout(() => this.blip(990, 0.12, 'sine', 0.2), 90); }
  over() { this.blip(300, 0.3, 'sawtooth', 0.2); setTimeout(() => this.blip(180, 0.4, 'sawtooth', 0.2), 140); }
  toggle() { this.muted = !this.muted; localStorage.mma_muted = this.muted ? '1' : '0'; return this.muted; }
}

/* ------------------------------------------------------------------ *
 * Base game — shared canvas, loop, input, HUD, particles
 * ------------------------------------------------------------------ */

class Base {
  constructor(mount, game, theme, audio) {
    this.mount = mount; this.game = game; this.theme = theme; this.audio = audio;
    this.W = 0; this.H = 0; this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.score = 0; this.lives = 3; this.running = false; this.over = false; this.started = false;
    this.particles = []; this.floats = [];
    this.keys = {}; this.pointer = { x: 0, y: 0, down: false, tapped: false };
    this.bestKey = 'mma_best_' + game.slug;
    this.best = parseInt(localStorage[this.bestKey] || '0', 10);
    this.time = 0; this.last = 0;
    this._build();
  }

  _build() {
    this.mount.innerHTML = '';
    this.mount.classList.add('mma-stage');
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'mma-canvas';
    this.ctx = this.canvas.getContext('2d');
    this.mount.appendChild(this.canvas);

    this.hud = document.createElement('div');
    this.hud.className = 'mma-hud';
    this.hud.innerHTML = `<div class="mma-score">0</div>
      <div class="mma-hud-right">
        <div class="mma-lives"></div>
        <button class="mma-mute" aria-label="Mute">${this.audio.muted ? '🔇' : '🔊'}</button>
      </div>`;
    this.mount.appendChild(this.hud);
    this.scoreEl = this.hud.querySelector('.mma-score');
    this.livesEl = this.hud.querySelector('.mma-lives');
    this.hud.querySelector('.mma-mute').onclick = (e) => {
      e.stopPropagation();
      const m = this.audio.toggle();
      e.target.textContent = m ? '🔇' : '🔊';
    };

    this.overlay = document.createElement('div');
    this.overlay.className = 'mma-overlay';
    this.mount.appendChild(this.overlay);

    this._resize();
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(this.mount);

    addEventListener('keydown', this._kd = (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) e.preventDefault();
      if (!this.started || this.over) { if (e.key === ' ' || e.key === 'Enter') this._primary(); }
    });
    addEventListener('keyup', this._ku = (e) => { this.keys[e.key.toLowerCase()] = false; });

    const rect = () => this.canvas.getBoundingClientRect();
    this.canvas.addEventListener('pointerdown', (e) => {
      const r = rect(); this.pointer.x = e.clientX - r.left; this.pointer.y = e.clientY - r.top;
      this.pointer.down = true; this.pointer.tapped = true;
      this.audio.ensure();
      if (!this.started || this.over) this._primary();
    });
    this.canvas.addEventListener('pointermove', (e) => {
      const r = rect(); this.pointer.x = e.clientX - r.left; this.pointer.y = e.clientY - r.top;
    });
    addEventListener('pointerup', () => { this.pointer.down = false; });

    this.showStart();
  }

  _resize() {
    const w = this.mount.clientWidth || 360;
    const h = this.mount.clientHeight || Math.round(w * 1.2);
    this.W = w; this.H = h;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.onResize) this.onResize();
  }

  _primary() {
    if (!this.started || this.over) this.start();
  }

  showStart() {
    this.overlay.innerHTML = `<div class="mma-panel">
      <div class="mma-hero">${this.theme.hero}</div>
      <h2>${this.game.title}</h2>
      <p>${this.instructions()}</p>
      <button class="mma-btn">▶ Play</button>
      <div class="mma-best">Best: ${this.best}</div>
    </div>`;
    this.overlay.classList.add('show');
    this.overlay.querySelector('.mma-btn').onclick = () => this.start();
  }

  showOver() {
    this.over = true; this.running = false;
    this.audio.over();
    if (this.score > this.best) { this.best = this.score; localStorage[this.bestKey] = this.best; }
    if (window.MochiMangoSDK && window.MochiMangoSDK.reportScore) {
      try { window.MochiMangoSDK.reportScore(this.game.slug, this.score); } catch (e) {}
    }
    this.overlay.innerHTML = `<div class="mma-panel">
      <div class="mma-hero">${this.score >= this.best ? '🏆' : this.theme.hero}</div>
      <h2>Game Over</h2>
      <p class="mma-final">Score <b>${this.score}</b></p>
      <div class="mma-best">Best: ${this.best}</div>
      <button class="mma-btn">↻ Play Again</button>
    </div>`;
    this.overlay.classList.add('show');
    this.overlay.querySelector('.mma-btn').onclick = () => this.start();
  }

  start() {
    this.overlay.classList.remove('show');
    this.overlay.innerHTML = '';
    this.score = 0; this.lives = 3; this.over = false; this.started = true; this.running = true;
    this.particles = []; this.floats = []; this.time = 0;
    this.setScore(0); this.drawLives();
    if (this.reset) this.reset();
    this.last = performance.now();
    if (!this._raf) this.loop(this.last);
  }

  loop(now) {
    this._raf = requestAnimationFrame((t) => this.loop(t));
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.05) dt = 0.05;
    if (this.running) { this.time += dt; this.update(dt); }
    this.render();
    this.pointer.tapped = false;
  }

  setScore(v) { this.score = v; this.scoreEl.textContent = Math.floor(v); }
  addScore(v) { this.setScore(this.score + v); }
  drawLives() { this.livesEl.innerHTML = '❤️'.repeat(Math.max(0, this.lives)); }
  loseLife() {
    this.lives--; this.drawLives(); this.audio.hit();
    this.shake = 0.35;
    if (this.lives <= 0) this.showOver();
  }

  burst(x, y, color, n = 12) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 160;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: 0.6, max: 0.6, color, r: 2 + Math.random() * 3 });
    }
  }
  float(x, y, text, color) { this.floats.push({ x, y, text, color, life: 0.9 }); }

  stepFx(dt) {
    for (const p of this.particles) { p.life -= dt; p.vy += 380 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const f of this.floats) { f.life -= dt; f.y -= 46 * dt; }
    this.floats = this.floats.filter(f => f.life > 0);
    if (this.shake) { this.shake -= dt; if (this.shake < 0) this.shake = 0; }
  }

  drawFx() {
    const c = this.ctx;
    for (const p of this.particles) {
      c.globalAlpha = Math.max(0, p.life / p.max);
      c.fillStyle = p.color;
      c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill();
    }
    c.globalAlpha = 1;
    c.textAlign = 'center';
    for (const f of this.floats) {
      c.globalAlpha = Math.max(0, f.life);
      c.font = '800 22px Outfit, system-ui, sans-serif';
      c.fillStyle = f.color; c.fillText(f.text, f.x, f.y);
    }
    c.globalAlpha = 1;
  }

  bg() {
    const c = this.ctx;
    const g = c.createLinearGradient(0, 0, 0, this.H);
    g.addColorStop(0, this.theme.sky[0]); g.addColorStop(1, this.theme.sky[1]);
    c.fillStyle = g; c.fillRect(0, 0, this.W, this.H);
  }

  glyph(ch, x, y, size) {
    const c = this.ctx;
    c.font = `${size}px system-ui, "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(ch, x, y);
  }

  destroy() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
    removeEventListener('keydown', this._kd);
    removeEventListener('keyup', this._ku);
    if (this._ro) this._ro.disconnect();
  }

  // Overridden by modes:
  instructions() { return 'Tap or press Space to play.'; }
  reset() {}
  update() {}
  render() { this.bg(); }
}

/* ------------------------------------------------------------------ *
 * RUNNER — auto-run, jump/duck obstacles, collect items
 * ------------------------------------------------------------------ */

class Runner extends Base {
  instructions() { return 'Space / Tap to jump. Hold for a higher hop. Grab treats, dodge hazards!'; }
  reset() {
    this.gy = this.H - Math.max(70, this.H * 0.16);
    this.p = { x: this.W * 0.22, y: this.gy, vy: 0, r: Math.max(18, this.W * 0.05), onGround: true, duck: false };
    this.obs = []; this.coins = []; this.spawnT = 0; this.coinT = 0.5;
    this.speed = Math.max(260, this.W * 0.55); this.scroll = 0;
  }
  jump() {
    if (this.p.onGround) { this.p.vy = -Math.max(560, this.H * 0.9); this.p.onGround = false; this.audio.jump(); }
  }
  update(dt) {
    this.stepFx(dt);
    this.gy = this.H - Math.max(70, this.H * 0.16);
    this.speed += dt * 6;
    this.scroll += this.speed * dt;
    if (this.keys[' '] || this.keys['arrowup'] || this.keys['w'] || this.pointer.down) this.jump();
    this.p.duck = this.keys['arrowdown'] || this.keys['s'];

    this.p.vy += 2000 * dt; this.p.y += this.p.vy * dt;
    const foot = this.p.duck ? this.gy + this.p.r * 0.4 : this.gy;
    if (this.p.y >= foot) { this.p.y = foot; this.p.vy = 0; this.p.onGround = true; }

    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = 0.7 + Math.random() * 0.7;
      const air = Math.random() < 0.35;
      this.obs.push({ x: this.W + 40, y: air ? this.gy - this.p.r * 2.2 : this.gy, s: Math.max(26, this.W * 0.07), air, ch: this.theme.hazards[Math.floor(Math.random() * this.theme.hazards.length)] });
    }
    this.coinT -= dt;
    if (this.coinT <= 0) {
      this.coinT = 0.4 + Math.random() * 0.5;
      this.coins.push({ x: this.W + 30, y: this.gy - (40 + Math.random() * (this.H * 0.28)), s: Math.max(20, this.W * 0.055), ch: this.theme.items[Math.floor(Math.random() * this.theme.items.length)] });
    }
    const move = this.speed * dt;
    for (const o of this.obs) o.x -= move;
    for (const cn of this.coins) cn.x -= move;
    this.obs = this.obs.filter(o => o.x > -60);
    this.coins = this.coins.filter(c => c.x > -60);

    const pr = this.p.r * (this.p.duck ? 0.6 : 1);
    for (const o of this.obs) {
      if (o.hit) continue;
      if (Math.abs(o.x - this.p.x) < o.s * 0.5 + pr * 0.7 && Math.abs(o.y - this.p.y) < o.s * 0.5 + pr * 0.7) {
        o.hit = true; this.burst(o.x, o.y, '#ff4f6d', 14); this.loseLife();
      }
    }
    for (const cn of this.coins) {
      if (cn.got) continue;
      if (Math.abs(cn.x - this.p.x) < cn.s * 0.5 + pr && Math.abs(cn.y - this.p.y) < cn.s * 0.5 + pr) {
        cn.got = true; this.addScore(5); this.audio.coin();
        this.burst(cn.x, cn.y, this.theme.accent, 10); this.float(cn.x, cn.y, '+5', this.theme.accent);
      }
    }
    this.coins = this.coins.filter(c => !c.got);
    this.addScore(dt * 4);
  }
  render() {
    const c = this.ctx;
    c.save();
    if (this.shake) c.translate((Math.random() - 0.5) * 10 * this.shake, (Math.random() - 0.5) * 10 * this.shake);
    this.bg();
    // ground
    c.fillStyle = this.theme.ground;
    c.fillRect(0, this.gy + this.p.r * 0.7, this.W, this.H);
    // dashes
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 4; c.setLineDash([24, 22]);
    c.beginPath(); c.moveTo(-(this.scroll % 46), this.gy + this.p.r * 1.5); c.lineTo(this.W, this.gy + this.p.r * 1.5); c.stroke();
    c.setLineDash([]);
    for (const cn of this.coins) this.glyph(cn.ch, cn.x, cn.y, cn.s);
    for (const o of this.obs) if (!o.hit) this.glyph(o.ch, o.x, o.y, o.s);
    const bob = this.p.onGround ? Math.sin(this.time * 18) * 3 : 0;
    this.glyph(this.theme.hero, this.p.x, this.p.y - this.p.r * (this.p.duck ? 0.2 : 0.5) + bob, this.p.r * 2 * (this.p.duck ? 0.8 : 1));
    this.drawFx();
    c.restore();
  }
}

/* ------------------------------------------------------------------ *
 * DODGER — move to catch treats, avoid hazards falling from the top
 * ------------------------------------------------------------------ */

class Dodger extends Base {
  instructions() { return 'Move to catch treats and dodge hazards. Drag or use ← →.'; }
  reset() {
    this.p = { x: this.W / 2, y: this.H - Math.max(50, this.H * 0.12), r: Math.max(20, this.W * 0.06) };
    this.items = []; this.spawnT = 0; this.fallBase = Math.max(150, this.H * 0.35);
  }
  update(dt) {
    this.stepFx(dt);
    this.p.y = this.H - Math.max(50, this.H * 0.12);
    const sp = Math.max(300, this.W * 0.9);
    if (this.keys['arrowleft'] || this.keys['a']) this.p.x -= sp * dt;
    if (this.keys['arrowright'] || this.keys['d']) this.p.x += sp * dt;
    if (this.pointer.down) this.p.x += (this.pointer.x - this.p.x) * Math.min(1, dt * 12);
    this.p.x = Math.max(this.p.r, Math.min(this.W - this.p.r, this.p.x));

    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = Math.max(0.28, 0.85 - this.time * 0.01);
      const bad = Math.random() < 0.32;
      const arr = bad ? this.theme.hazards : this.theme.items;
      this.items.push({ x: 30 + Math.random() * (this.W - 60), y: -30, s: Math.max(24, this.W * 0.07), vy: this.fallBase + Math.random() * 120 + this.time * 3, bad, ch: arr[Math.floor(Math.random() * arr.length)] });
    }
    for (const it of this.items) it.y += it.vy * dt;
    for (const it of this.items) {
      if (it.done) continue;
      if (Math.abs(it.x - this.p.x) < it.s * 0.5 + this.p.r * 0.8 && Math.abs(it.y - this.p.y) < it.s * 0.5 + this.p.r * 0.8) {
        it.done = true;
        if (it.bad) { this.burst(it.x, it.y, '#ff4f6d', 14); this.loseLife(); }
        else { this.addScore(3); this.audio.coin(); this.burst(it.x, it.y, this.theme.accent, 10); this.float(it.x, it.y, '+3', this.theme.accent); }
      } else if (it.y > this.H + 40) {
        it.done = true;
        if (!it.bad) { /* missed treat, mild */ }
      }
    }
    this.items = this.items.filter(i => !i.done && i.y < this.H + 60);
  }
  render() {
    const c = this.ctx;
    c.save();
    if (this.shake) c.translate((Math.random() - 0.5) * 10 * this.shake, (Math.random() - 0.5) * 10 * this.shake);
    this.bg();
    c.fillStyle = this.theme.ground; c.fillRect(0, this.H - 16, this.W, 16);
    for (const it of this.items) this.glyph(it.ch, it.x, it.y, it.s);
    this.glyph(this.theme.hero, this.p.x, this.p.y, this.p.r * 2);
    this.drawFx();
    c.restore();
  }
}

/* ------------------------------------------------------------------ *
 * SHOOTER — move & fire at descending foes
 * ------------------------------------------------------------------ */

class Shooter extends Base {
  instructions() { return 'Move with ← → or drag. Auto-fire! Blast foes before they reach you.'; }
  reset() {
    this.p = { x: this.W / 2, y: this.H - Math.max(50, this.H * 0.12), r: Math.max(20, this.W * 0.06) };
    this.foes = []; this.shots = []; this.spawnT = 0; this.fireT = 0;
  }
  update(dt) {
    this.stepFx(dt);
    this.p.y = this.H - Math.max(50, this.H * 0.12);
    const sp = Math.max(320, this.W * 0.95);
    if (this.keys['arrowleft'] || this.keys['a']) this.p.x -= sp * dt;
    if (this.keys['arrowright'] || this.keys['d']) this.p.x += sp * dt;
    if (this.pointer.down) this.p.x += (this.pointer.x - this.p.x) * Math.min(1, dt * 14);
    this.p.x = Math.max(this.p.r, Math.min(this.W - this.p.r, this.p.x));

    this.fireT -= dt;
    if (this.fireT <= 0) { this.fireT = 0.28; this.shots.push({ x: this.p.x, y: this.p.y - this.p.r, r: 6 }); this.audio.blip(760, 0.05, 'square', 0.08); }
    for (const s of this.shots) s.y -= Math.max(520, this.H) * dt;
    this.shots = this.shots.filter(s => s.y > -20);

    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = Math.max(0.35, 1.1 - this.time * 0.012);
      this.foes.push({ x: 30 + Math.random() * (this.W - 60), y: -30, s: Math.max(26, this.W * 0.075), vy: Math.max(60, this.H * 0.12) + Math.random() * 40 + this.time * 2, hp: 1, ch: this.theme.hazards[Math.floor(Math.random() * this.theme.hazards.length)] });
    }
    for (const f of this.foes) f.y += f.vy * dt;
    for (const f of this.foes) {
      for (const s of this.shots) {
        if (!s.dead && Math.abs(s.x - f.x) < f.s * 0.5 && Math.abs(s.y - f.y) < f.s * 0.5) {
          s.dead = true; f.hp--;
          if (f.hp <= 0) { f.dead = true; this.addScore(4); this.audio.coin(); this.burst(f.x, f.y, this.theme.accent, 12); this.float(f.x, f.y, '+4', this.theme.accent); }
        }
      }
      if (!f.dead && f.y > this.H - Math.max(50, this.H * 0.12)) { f.dead = true; this.burst(f.x, f.y, '#ff4f6d', 12); this.loseLife(); }
    }
    this.shots = this.shots.filter(s => !s.dead);
    this.foes = this.foes.filter(f => !f.dead);
  }
  render() {
    const c = this.ctx;
    c.save();
    if (this.shake) c.translate((Math.random() - 0.5) * 10 * this.shake, (Math.random() - 0.5) * 10 * this.shake);
    this.bg();
    c.fillStyle = this.theme.accent;
    for (const s of this.shots) { c.beginPath(); c.arc(s.x, s.y, s.r, 0, 7); c.fill(); }
    for (const f of this.foes) this.glyph(f.ch, f.x, f.y, f.s);
    this.glyph(this.theme.hero, this.p.x, this.p.y, this.p.r * 2);
    this.drawFx();
    c.restore();
  }
}

/* ------------------------------------------------------------------ *
 * MATCH3 — swap adjacent tiles to line up 3+
 * ------------------------------------------------------------------ */

class Match3 extends Base {
  instructions() { return 'Swap two touching tiles to line up 3 or more. Beat the 60s clock!'; }
  reset() {
    this.N = 8;
    this.symbols = this.theme.items.slice(0, 5);
    this.grid = [];
    this.sel = null; this.anim = 0; this.busy = false;
    this.timeLeft = 60; this.lives = 999; this.livesEl.innerHTML = '⏱️';
    this._layout();
    do { this._fill(); } while (this._findMatches().length);
  }
  onResize() { if (this.grid && this.grid.length) this._layout(); }
  _layout() {
    const pad = Math.max(8, this.W * 0.03);
    const avail = Math.min(this.W, this.H) - pad * 2;
    this.cell = Math.floor(avail / this.N);
    this.ox = Math.floor((this.W - this.cell * this.N) / 2);
    this.oy = Math.floor((this.H - this.cell * this.N) / 2) + 6;
  }
  _fill() {
    for (let r = 0; r < this.N; r++) { this.grid[r] = []; for (let col = 0; col < this.N; col++) this.grid[r][col] = Math.floor(Math.random() * this.symbols.length); }
  }
  _cellAt(px, py) {
    const col = Math.floor((px - this.ox) / this.cell), r = Math.floor((py - this.oy) / this.cell);
    if (col < 0 || r < 0 || col >= this.N || r >= this.N) return null;
    return { r, col };
  }
  _swap(a, b) { const t = this.grid[a.r][a.col]; this.grid[a.r][a.col] = this.grid[b.r][b.col]; this.grid[b.r][b.col] = t; }
  _findMatches() {
    const m = [];
    for (let r = 0; r < this.N; r++) for (let col = 0; col < this.N - 2; col++) {
      const v = this.grid[r][col]; if (v == null) continue;
      if (v === this.grid[r][col + 1] && v === this.grid[r][col + 2]) m.push([r, col], [r, col + 1], [r, col + 2]);
    }
    for (let col = 0; col < this.N; col++) for (let r = 0; r < this.N - 2; r++) {
      const v = this.grid[r][col]; if (v == null) continue;
      if (v === this.grid[r + 1][col] && v === this.grid[r + 2][col]) m.push([r, col], [r + 1, col], [r + 2, col]);
    }
    return m;
  }
  _resolve() {
    let combo = 0;
    const step = () => {
      const m = this._findMatches();
      if (!m.length) { this.busy = false; return; }
      combo++;
      const seen = new Set();
      for (const [r, col] of m) { const k = r + ',' + col; if (!seen.has(k)) { seen.add(k); this.grid[r][col] = null; this.burst(this.ox + col * this.cell + this.cell / 2, this.oy + r * this.cell + this.cell / 2, this.theme.accent, 8); } }
      const gained = seen.size * 10 * combo;
      this.addScore(gained);
      this.audio.coin();
      this.timeLeft = Math.min(75, this.timeLeft + seen.size * 0.4);
      // gravity
      for (let col = 0; col < this.N; col++) {
        let write = this.N - 1;
        for (let r = this.N - 1; r >= 0; r--) if (this.grid[r][col] != null) { this.grid[write][col] = this.grid[r][col]; if (write !== r) this.grid[r][col] = null; write--; }
        for (let r = write; r >= 0; r--) this.grid[r][col] = Math.floor(Math.random() * this.symbols.length);
      }
      setTimeout(step, 130);
    };
    this.busy = true; step();
  }
  update(dt) {
    this.stepFx(dt);
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) { this.timeLeft = 0; this.showOver(); return; }
    this.scoreEl.textContent = Math.floor(this.score) + '  ·  ' + Math.ceil(this.timeLeft) + 's';
    if (this.pointer.tapped && !this.busy) {
      const cc = this._cellAt(this.pointer.x, this.pointer.y);
      if (cc) {
        if (!this.sel) this.sel = cc;
        else {
          const d = Math.abs(this.sel.r - cc.r) + Math.abs(this.sel.col - cc.col);
          if (d === 1) {
            this._swap(this.sel, cc);
            if (this._findMatches().length) { this.audio.jump(); this._resolve(); }
            else { this._swap(this.sel, cc); this.audio.blip(220, 0.1, 'sine', 0.1); }
            this.sel = null;
          } else this.sel = cc;
        }
      }
    }
  }
  render() {
    const c = this.ctx;
    this.bg();
    // board bg
    c.fillStyle = this.theme.dark ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.5)';
    this._round(this.ox - 6, this.oy - 6, this.cell * this.N + 12, this.cell * this.N + 12, 16); c.fill();
    for (let r = 0; r < this.N; r++) for (let col = 0; col < this.N; col++) {
      const v = this.grid[r][col]; if (v == null) continue;
      const x = this.ox + col * this.cell, y = this.oy + r * this.cell;
      const selHere = this.sel && this.sel.r === r && this.sel.col === col;
      c.fillStyle = selHere ? this.theme.accent : (this.theme.dark ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.8)');
      this._round(x + 3, y + 3, this.cell - 6, this.cell - 6, 12); c.fill();
      this.glyph(this.symbols[v], x + this.cell / 2, y + this.cell / 2, this.cell * 0.6);
    }
    this.drawFx();
  }
  _round(x, y, w, h, r) { const c = this.ctx; c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
}

/* ------------------------------------------------------------------ *
 * SERVE — customers arrive with orders; tap the matching dish
 * ------------------------------------------------------------------ */

class Serve extends Base {
  instructions() { return 'Match each customer\'s craving by tapping the matching dish before patience runs out!'; }
  reset() {
    this.menu = this.theme.items.slice(0, 4);
    this.queue = []; this.spawnT = 0; this.maxQ = 4;
    this._layoutBtns();
  }
  onResize() { this._layoutBtns(); }
  _layoutBtns() {
    if (!this.menu) return;
    const n = this.menu.length;
    const bw = Math.min(this.W / n - 10, 90);
    this.btns = this.menu.map((ch, i) => ({ ch, x: (this.W / n) * i + (this.W / n) / 2, y: this.H - Math.max(46, this.H * 0.1), r: Math.max(28, bw * 0.5) }));
  }
  update(dt) {
    this.stepFx(dt);
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.queue.length < this.maxQ) {
      this.spawnT = Math.max(0.7, 1.8 - this.time * 0.02);
      this.queue.push({ want: Math.floor(Math.random() * this.menu.length), patience: 1, decay: 0.06 + this.time * 0.001 + Math.random() * 0.02 });
    }
    for (const q of this.queue) q.patience -= q.decay * dt;
    for (const q of this.queue) if (q.patience <= 0 && !q.done) { q.done = true; this.loseLife(); }
    this.queue = this.queue.filter(q => !q.done);

    if (this.pointer.tapped) {
      for (const b of this.btns) {
        if (Math.hypot(this.pointer.x - b.x, this.pointer.y - b.y) < b.r) {
          const idx = this.menu.indexOf(b.ch);
          const q = this.queue.find(q => q.want === idx && !q.done);
          if (q) { q.done = true; this.addScore(6); this.audio.coin(); this.float(b.x, b.y - 30, '+6', this.theme.accent); this.burst(b.x, b.y - 30, this.theme.accent, 10); }
          else { this.audio.blip(200, 0.12, 'sine', 0.1); }
          b.press = 1;
        }
      }
      this.queue = this.queue.filter(q => !q.done);
    }
  }
  render() {
    const c = this.ctx;
    this.bg();
    // counter
    c.fillStyle = this.theme.ground; c.fillRect(0, this.H - Math.max(80, this.H * 0.18), this.W, this.H);
    // customers
    const n = this.queue.length;
    this.queue.forEach((q, i) => {
      const x = (this.W / (this.maxQ)) * i + (this.W / this.maxQ) / 2;
      const y = this.H * 0.3;
      this.glyph(['🧒', '👧', '🧑', '👵', '👴', '🧙'][i % 6], x, y, Math.max(38, this.W * 0.1));
      // speech bubble
      c.fillStyle = this.theme.dark ? 'rgba(255,255,255,.14)' : '#fff';
      this._round(x - 26, y - 78, 52, 46, 12); c.fill();
      this.glyph(this.menu[q.want], x, y - 55, 30);
      // patience bar
      c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(x - 26, y + 34, 52, 7);
      c.fillStyle = q.patience > 0.4 ? '#3ad07a' : '#ff5b6e'; c.fillRect(x - 26, y + 34, 52 * Math.max(0, q.patience), 7);
    });
    // buttons
    for (const b of this.btns) {
      c.fillStyle = this.theme.primary; c.globalAlpha = b.press ? 0.7 : 1;
      c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill(); c.globalAlpha = 1;
      this.glyph(b.ch, b.x, b.y, b.r * 1.1);
      if (b.press) b.press -= 0.08;
    }
    this.drawFx();
  }
  _round(x, y, w, h, r) { const c = this.ctx; c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
}

/* ------------------------------------------------------------------ *
 * Public entry
 * ------------------------------------------------------------------ */

const MODES = { runner: Runner, dodger: Dodger, shooter: Shooter, match3: Match3, serve: Serve };
const audio = new Audio();
let current = null;

export function startGame(mount, game) {
  if (!mount || !game) return;
  if (current) { try { current.destroy(); } catch (e) {} current = null; }
  const theme = themeFor(game);
  const mode = modeFor(game);
  const Cls = MODES[mode] || Dodger;
  current = new Cls(mount, game, theme, audio);
  return current;
}

export { themeFor, modeFor };
