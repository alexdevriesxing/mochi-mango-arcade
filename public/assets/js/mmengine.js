/**
 * Mochi Mango Arcade — Premium themed game engine.
 *
 * startGame(mount, game) reads a game's metadata and renders a real,
 * character-driven, mobile-friendly canvas game with:
 *   • the mascot as a large, consistent, animated hero (PNG sprite when
 *     available, polished vector character otherwise);
 *   • multi-layer parallax backgrounds themed per universe;
 *   • power-ups, combo multipliers and difficulty progression (depth);
 *   • screen shake, squash & stretch, particles and popups (juice);
 *   • eight modes for genre variety.
 */
import { sprites, drawVectorChar, speciesOf, shade, tint } from './mmchar.js';

/* ============================================================ Theme */

const UNIVERSE = {
  cozyverse:  { primary: '#ff8eb3', accent: '#ffd166', belly: '#fff0f6', sky: ['#ffe9f2', '#ffd0e2'], ground: '#8bd17c', dark: false, scene: 'meadow' },
  astromochi: { primary: '#8a5cff', accent: '#25d8ff', belly: '#d9ccff', sky: ['#160f38', '#3a2a7a'], ground: '#3a2f66', dark: true,  scene: 'space' },
  ninegates:  { primary: '#19c39c', accent: '#f7c948', belly: '#d8fff4', sky: ['#0a5c4d', '#0fbf9f'], ground: '#0b8f78', dark: true,  scene: 'temple' },
  snackstreet:{ primary: '#ff6b35', accent: '#ffd100', belly: '#ffe4c9', sky: ['#2a1030', '#7a2a52'], ground: '#3a2138', dark: true,  scene: 'city' },
  oracle:     { primary: '#a24dff', accent: '#ff4f9a', belly: '#e9d6ff', sky: ['#140a2e', '#3a1060'], ground: '#241246', dark: true,  scene: 'night' },
  standalone: { primary: '#ffbd2e', accent: '#ff4f9a', belly: '#fff2cf', sky: ['#fff2d6', '#ffd9e6'], ground: '#7fd6c2', dark: false, scene: 'candy' }
};

const ITEMS = {
  cozyverse: ['🍓', '🍯', '🌸', '🍄', '🌰'], astromochi: ['⭐', '🪐', '🌟', '☄️', '🛸'],
  ninegates: ['🀄', '🏮', '🪙', '🎋', '🥮'], snackstreet: ['🍜', '🍔', '🍤', '🌮', '🧋'],
  oracle: ['🔮', '🌙', '🃏', '✨', '🕯️'], standalone: ['🍬', '🍭', '⭐', '🎈', '🧁']
};
const HAZ = {
  cozyverse: ['🐝', '🌧️', '🪨'], astromochi: ['☄️', '👾', '🌑'], ninegates: ['💣', '🐍', '🌩️'],
  snackstreet: ['🌶️', '🔥', '💣'], oracle: ['💀', '🕷️', '⚡'], standalone: ['💣', '🌩️', '🪨']
};

function themeFor(g) {
  const u = UNIVERSE[g.universe] || UNIVERSE.standalone;
  return { ...u, items: ITEMS[g.universe] || ITEMS.standalone, hazards: HAZ[g.universe] || HAZ.standalone,
    slug: (g.mascot || g.title).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    species: speciesOf(g.mascot + ' ' + g.title) };
}

function modeFor(g) {
  // read title + slug too, so genre-generic games still play their real genre
  const s = (g.genre + ' ' + g.engine + ' ' + (g.title || '') + ' ' + (g.slug || '')).toLowerCase();
  if (/(parcel|kite|airlift|balloon|glide|flight|flying|aerial|paraglide|sky-diner|sky diner)/.test(s)) return 'flappy';
  if (/(maze|labyrinth|heist)/.test(s)) return 'maze';
  if (/(memory|mirror|hidden|detective|solitaire|concentration|mooncat|tarot|matching)/.test(s)) return 'memory';
  if (/(\bstack\b|\bfort\b|blanket|pillow|sleepover|snowflake|honey-rescue)/.test(s)) return 'stacker';
  if (/(defen|tower|patrol|survival|boss|arena|shooter|bullet|battler|tactic)/.test(s)) return 'shooter';
  if (/(whack|reaction|coordination|emergency|reflex|cleanup)/.test(s)) return 'whack';
  if (/(match|tile|mahjong|sort|flow|logic|gravity|deduction|slide)/.test(s)) return 'match3';
  if (/(manage|cook|serv|shop|hotel|tavern|farm|sim|cafe|kitchen|bakery|time management|market|salon|dress|diner|restaurant)/.test(s)) return 'serve';
  if (/(platform|jump|hop|bounce|climb|parkour|wall)/.test(s)) return 'platformer';
  if (/(runner|racing|racer|driv|lane|dash|sprint|derby|rhythm|drift|run)/.test(s)) return 'runner';
  if (g.engine === 'runner') return 'runner';
  if (g.engine === 'puzzle') return 'match3';
  if (g.engine === 'management') return 'serve';
  return 'dodger';
}

/* ============================================================ Audio */

class Sound {
  constructor() { this.ctx = null; this.muted = localStorage.mma_muted === '1'; }
  ensure() { if (!this.ctx) try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  blip(f = 440, d = 0.08, type = 'sine', v = 0.2) {
    if (this.muted) return; this.ensure(); if (!this.ctx) return;
    const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + d);
  }
  coin() { this.blip(880, 0.08, 'triangle', 0.16); this.blip(1320, 0.06, 'triangle', 0.1); }
  jump() { this.blip(480, 0.13, 'square', 0.13); }
  hit() { this.blip(150, 0.24, 'sawtooth', 0.22); }
  power() { this.blip(660, 0.09, 'sine', 0.2); setTimeout(() => this.blip(990, 0.12, 'sine', 0.2), 80); }
  combo(n) { this.blip(600 + n * 60, 0.08, 'triangle', 0.16); }
  over() { this.blip(320, 0.3, 'sawtooth', 0.2); setTimeout(() => this.blip(180, 0.4, 'sawtooth', 0.2), 130); }
  toggle() { this.muted = !this.muted; localStorage.mma_muted = this.muted ? '1' : '0'; return this.muted; }
}

/* ============================================================ Power-ups */

const POWERS = {
  shield: { icon: '🛡️', color: '#3ad0ff', dur: 8, tip: 'Shield' },
  magnet: { icon: '🧲', color: '#ff5b9a', dur: 7, tip: 'Magnet' },
  x2:     { icon: '✨', color: '#ffd166', dur: 8, tip: 'Double' },
  slow:   { icon: '🐌', color: '#8affc1', dur: 6, tip: 'Slow-mo' }
};

/* ============================================================ Base */

class Base {
  constructor(mount, game, theme, sound) {
    this.mount = mount; this.game = game; this.theme = theme; this.sound = sound;
    this.W = 0; this.H = 0; this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.score = 0; this.lives = 3; this.running = false; this.over = false; this.started = false;
    this.particles = []; this.floats = []; this.rings = [];
    this.keys = {}; this.pointer = { x: 0, y: 0, down: false, tapped: false };
    this.bestKey = 'mma_best_' + game.slug; this.best = +(localStorage[this.bestKey] || 0);
    this.time = 0; this.last = 0; this.shake = 0;
    this.combo = 0; this.comboT = 0; this.mult = 1;
    this.powers = {};                       // type -> remaining seconds
    this.scroll = 0;
    this._build();
  }

  _build() {
    this.mount.innerHTML = ''; this.mount.classList.add('mma-stage');
    this.canvas = document.createElement('canvas'); this.canvas.className = 'mma-canvas';
    this.ctx = this.canvas.getContext('2d'); this.mount.appendChild(this.canvas);

    this.hud = document.createElement('div'); this.hud.className = 'mma-hud';
    this.hud.innerHTML = `<div class="mma-hud-left"><div class="mma-score">0</div><div class="mma-combo"></div></div>
      <div class="mma-hud-right"><div class="mma-powers"></div><div class="mma-lives"></div>
      <button class="mma-mute" aria-label="Mute">${this.sound.muted ? '🔇' : '🔊'}</button></div>`;
    this.mount.appendChild(this.hud);
    this.scoreEl = this.hud.querySelector('.mma-score');
    this.comboEl = this.hud.querySelector('.mma-combo');
    this.livesEl = this.hud.querySelector('.mma-lives');
    this.powersEl = this.hud.querySelector('.mma-powers');
    this.hud.querySelector('.mma-mute').onclick = (e) => { e.stopPropagation(); e.target.textContent = this.sound.toggle() ? '🔇' : '🔊'; };

    this.overlay = document.createElement('div'); this.overlay.className = 'mma-overlay';
    this.mount.appendChild(this.overlay);

    this._resize();
    this._ro = new ResizeObserver(() => this._resize()); this._ro.observe(this.mount);

    addEventListener('keydown', this._kd = (e) => {
      const k = e.key.toLowerCase(); this.keys[k] = true;
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
      if ((!this.started || this.over) && (k === ' ' || k === 'enter')) this.start();
    });
    addEventListener('keyup', this._ku = (e) => { this.keys[e.key.toLowerCase()] = false; });

    const rect = () => this.canvas.getBoundingClientRect();
    this.canvas.addEventListener('pointerdown', (e) => {
      const r = rect(); this.pointer.x = e.clientX - r.left; this.pointer.y = e.clientY - r.top;
      this.pointer.down = true; this.pointer.tapped = true; this.sound.ensure();
      if (!this.started || this.over) this.start();
    });
    this.canvas.addEventListener('pointermove', (e) => { const r = rect(); this.pointer.x = e.clientX - r.left; this.pointer.y = e.clientY - r.top; });
    addEventListener('pointerup', this._pu = () => { this.pointer.down = false; });

    this.showStart();
  }

  _resize() {
    const w = this.mount.clientWidth || 360, h = this.mount.clientHeight || Math.round(w * 1.2);
    this.W = w; this.H = h;
    this.canvas.width = Math.round(w * this.dpr); this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.onResize) this.onResize();
  }

  showStart() {
    const card = this.game.image ? this.game.image.replace('.svg', '.jpg') : '';
    this.overlay.innerHTML = `<div class="mma-panel">
      ${card ? `<img class="mma-keyart" src="${card}" alt="${this.game.title}" onerror="this.remove()">` : ''}
      <h2>${this.game.title}</h2>
      <p>${this.instructions()}</p>
      <button class="mma-btn">▶ Play</button>
      <div class="mma-best">Best: ${this.best}</div></div>`;
    this.overlay.classList.add('show');
    this.overlay.querySelector('.mma-btn').onclick = () => this.start();
  }

  showOver() {
    this.over = true; this.running = false; this.sound.over();
    const nb = this.score > this.best; if (nb) { this.best = Math.floor(this.score); localStorage[this.bestKey] = this.best; }
    if (window.MochiMangoSDK && window.MochiMangoSDK.reportScore) try { window.MochiMangoSDK.reportScore(this.game.slug, Math.floor(this.score)); } catch (e) {}
    this.overlay.innerHTML = `<div class="mma-panel">
      <div class="mma-medal">${nb ? '🏆' : '⭐'}</div>
      <h2>${nb ? 'New Best!' : 'Game Over'}</h2>
      <p class="mma-final">Score <b>${Math.floor(this.score)}</b></p>
      <div class="mma-best">Best: ${this.best}</div>
      <button class="mma-btn">↻ Play Again</button></div>`;
    this.overlay.classList.add('show');
    this.overlay.querySelector('.mma-btn').onclick = () => this.start();
  }

  start() {
    this.overlay.classList.remove('show'); this.overlay.innerHTML = '';
    this.score = 0; this.lives = 3; this.over = false; this.started = true; this.running = true;
    this.particles = []; this.floats = []; this.rings = []; this.time = 0; this.shake = 0;
    this.combo = 0; this.comboT = 0; this.mult = 1; this.powers = {}; this.scroll = 0;
    this.setScore(0); this.drawLives(); this.drawPowers(); this.comboEl.textContent = '';
    if (this.reset) this.reset();
    this.last = performance.now();
    if (!this._raf) this.loop(this.last);
  }

  loop(now) {
    this._raf = requestAnimationFrame((t) => this.loop(t));
    let dt = (now - this.last) / 1000; this.last = now; if (dt > 0.05) dt = 0.05;
    if (this.powers.slow) dt *= 0.55;
    if (this.running) { this.time += dt; this.stepMeta(dt); this.update(dt); }
    this.render(); this.pointer.tapped = false;
  }

  stepMeta(dt) {
    // power-up timers
    for (const k in this.powers) { this.powers[k] -= dt; if (this.powers[k] <= 0) delete this.powers[k]; }
    this.drawPowers();
    // combo decay
    if (this.combo > 0) { this.comboT -= dt; if (this.comboT <= 0) { this.combo = 0; this.mult = 1; this.comboEl.textContent = ''; } }
    // fx
    for (const p of this.particles) { p.life -= dt; p.vy += (p.g ?? 380) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot = (p.rot || 0) + (p.vr || 0) * dt; }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const f of this.floats) { f.life -= dt; f.y -= 48 * dt; }
    this.floats = this.floats.filter(f => f.life > 0);
    for (const r of this.rings) { r.life -= dt; r.r += r.vr * dt; }
    this.rings = this.rings.filter(r => r.life > 0);
    if (this.shake > 0) { this.shake -= dt * 2.5; if (this.shake < 0) this.shake = 0; }
  }

  difficulty() { return 1 + this.time / 45; }          // ramps over time

  hitCombo(x, y, base) {
    this.combo++; this.comboT = 2.2;
    this.mult = this.combo >= 12 ? 4 : this.combo >= 6 ? 3 : this.combo >= 3 ? 2 : 1;
    const g = base * this.mult * (this.powers.x2 ? 2 : 1);
    this.addScore(g);
    if (this.mult > 1) { this.comboEl.textContent = `${this.mult}× combo`; this.sound.combo(this.combo); }
    this.float(x, y, '+' + g, this.theme.accent);
    return g;
  }

  grantPower(type) {
    this.powers[type] = POWERS[type].dur; this.sound.power();
    this.float(this.W / 2, this.H * 0.4, POWERS[type].tip + '!', POWERS[type].color);
    this.ring(this.W / 2, this.H * 0.4, POWERS[type].color);
  }

  setScore(v) { this.score = v; this.scoreEl.textContent = Math.floor(v); }
  addScore(v) { this.setScore(this.score + v); }
  drawLives() { this.livesEl.innerHTML = '❤️'.repeat(Math.max(0, this.lives)); }
  drawPowers() { this.powersEl.innerHTML = Object.keys(this.powers).map(k => `<span class="mma-pw" title="${POWERS[k].tip}">${POWERS[k].icon}</span>`).join(''); }
  loseLife() {
    if (this.powers.shield) { delete this.powers.shield; this.ring(this.W / 2, this.H / 2, POWERS.shield.color); this.sound.blip(300, 0.2, 'sine', 0.2); this.shake = 0.5; return; }
    this.lives--; this.drawLives(); this.sound.hit(); this.shake = 1; this.combo = 0; this.mult = 1; this.comboEl.textContent = '';
    if (this.lives <= 0) this.showOver();
  }

  burst(x, y, color, n = 12, spread = 1) {
    for (let i = 0; i < n; i++) { const a = Math.random() * 7, s = (40 + Math.random() * 160) * spread;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: 0.6, max: 0.6, color, r: 2 + Math.random() * 3, rot: Math.random() * 7, vr: (Math.random() - 0.5) * 12 }); }
  }
  confetti(x, y) { const cs = ['#ff4f9a', '#ffd166', '#3ad0ff', '#8affc1', '#a24dff']; for (let i = 0; i < 18; i++) { const a = Math.random() * 7, s = 80 + Math.random() * 220;
    this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 120, life: 1, max: 1, color: cs[i % cs.length], r: 3 + Math.random() * 3, sq: 1, rot: Math.random() * 7, vr: (Math.random() - 0.5) * 16 }); } }
  float(x, y, text, color) { this.floats.push({ x, y, text, color, life: 0.9 }); }
  ring(x, y, color) { this.rings.push({ x, y, r: 6, vr: 240, life: 0.5, color }); }

  drawFx() {
    const c = this.ctx;
    for (const r of this.rings) { c.globalAlpha = Math.max(0, r.life * 2); c.strokeStyle = r.color; c.lineWidth = 4; c.beginPath(); c.arc(r.x, r.y, r.r, 0, 7); c.stroke(); }
    for (const p of this.particles) { c.globalAlpha = Math.max(0, p.life / p.max); c.fillStyle = p.color;
      if (p.sq) { c.save(); c.translate(p.x, p.y); c.rotate(p.rot || 0); c.fillRect(-p.r, -p.r * 0.6, p.r * 2, p.r * 1.2); c.restore(); }
      else { c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill(); } }
    c.globalAlpha = 1; c.textAlign = 'center';
    for (const f of this.floats) { c.globalAlpha = Math.max(0, f.life); c.font = '900 22px Outfit, system-ui, sans-serif';
      c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.35)'; c.strokeText(f.text, f.x, f.y); c.fillStyle = f.color; c.fillText(f.text, f.x, f.y); }
    c.globalAlpha = 1;
  }

  glyph(ch, x, y, size) { const c = this.ctx; c.font = `${size}px system-ui,"Segoe UI Emoji","Apple Color Emoji",sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, x, y); }

  // draw mascot: real sprite if loaded else vector fallback
  hero(x, y, size, o = {}) {
    const rec = sprites.get(this.theme.slug);
    if (rec.ready) {
      const img = rec.img, ar = img.naturalWidth / img.naturalHeight;
      let w = size, h = size / ar; if (h > size) { h = size; w = size * ar; }
      const c = this.ctx; c.save(); c.translate(x, y + (o.run ? Math.sin(this.time * 14) * size * 0.03 : 0));
      if (o.face) c.scale(o.face, 1);
      const sq = o.squash || 0; c.scale(1 + sq * 0.15, 1 - sq * 0.2);
      c.globalAlpha = 0.18; c.fillStyle = '#000'; c.beginPath(); c.ellipse(0, h * 0.46, w * 0.36, h * 0.08, 0, 0, 7); c.fill(); c.globalAlpha = 1;
      c.drawImage(img, -w / 2, -h / 2, w, h); c.restore();
      return;
    }
    drawVectorChar(this.ctx, x, y, size, { body: this.theme.primary, belly: this.theme.belly, species: this.theme.species, t: o.t ?? this.time, run: o.run, squash: o.squash, face: o.face, expr: o.expr });
  }

  /* -------- Parallax scenery -------- */
  sky() { const c = this.ctx, g = c.createLinearGradient(0, 0, 0, this.H); g.addColorStop(0, this.theme.sky[0]); g.addColorStop(1, this.theme.sky[1]); c.fillStyle = g; c.fillRect(0, 0, this.W, this.H); }
  parallax(sx = this.scroll) {
    this.sky();
    const c = this.ctx, W = this.W, H = this.H, sc = this.theme.scene, dark = this.theme.dark;
    if (dark) { c.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 40; i++) { const x = (i * 97.3 - sx * 0.1) % W, y = (i * 53.7 % (H * 0.6)); c.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(i + this.time)); c.fillRect((x + W) % W, y, 2, 2); } c.globalAlpha = 1; }
    if (sc === 'space') { for (let i = 0; i < 4; i++) { const x = ((i * 220 - sx * 0.18) % (W + 200) + W + 200) % (W + 200) - 100, y = 60 + i * 40 % (H * 0.5); c.fillStyle = ['#ff8ec7', '#7fd6ff', '#ffd166', '#b78cff'][i]; c.globalAlpha = 0.5; c.beginPath(); c.arc(x, y, 26 - i * 3, 0, 7); c.fill(); } c.globalAlpha = 1; }
    const horizon = H * 0.72;
    // far layer
    c.fillStyle = dark ? shade(this.theme.ground, 26) : shade(this.theme.ground, 34);
    this.layer(sx * 0.25, horizon, 120, 70, sc, 'far');
    // near layer
    c.fillStyle = dark ? shade(this.theme.ground, 12) : shade(this.theme.ground, 16);
    this.layer(sx * 0.5, horizon + 20, 90, 110, sc, 'near');
  }
  layer(off, base, step, amp, sc, depth) {
    const c = this.ctx, W = this.W;
    off = ((off % step) + step) % step;
    for (let x = -off - step; x < W + step; x += step) {
      const cx = x + step / 2;
      if (sc === 'temple') { // pagodas
        c.fillRect(x + step * 0.2, base - amp, step * 0.6, amp);
        c.beginPath(); c.moveTo(x, base - amp); c.lineTo(cx, base - amp - amp * 0.4); c.lineTo(x + step, base - amp); c.closePath(); c.fill();
      } else if (sc === 'city') {
        const h = amp * (0.6 + (Math.sin(cx) * 0.5 + 0.5) * 0.6);
        c.fillRect(x + step * 0.12, base - h, step * 0.76, h);
        if (depth === 'near') { c.save(); c.fillStyle = this.theme.accent; c.globalAlpha = 0.5; c.fillRect(x + step * 0.3, base - h * 0.7, step * 0.4, h * 0.12); c.restore(); }
      } else if (sc === 'space') {
        c.beginPath(); c.arc(cx, base, amp * 0.7, Math.PI, 0); c.fill();
      } else { // meadow / candy / night — rolling hills + trees
        c.beginPath(); c.arc(cx, base + amp * 0.5, amp, Math.PI, 0); c.fill();
        if (depth === 'near' && sc !== 'night') { c.save(); c.fillStyle = shade(this.theme.ground, sc === 'candy' ? 40 : -20);
          c.beginPath(); c.moveTo(cx - amp * 0.16, base); c.lineTo(cx, base - amp * 0.7); c.lineTo(cx + amp * 0.16, base); c.closePath(); c.fill(); c.restore(); }
      }
    }
    // ground fill
    c.fillStyle = this.theme.ground; c.fillRect(0, base, W, this.H - base);
  }

  applyShake(c) { if (this.shake > 0) c.translate((Math.random() - 0.5) * 12 * this.shake, (Math.random() - 0.5) * 12 * this.shake); }

  destroy() { this.running = false; if (this._raf) cancelAnimationFrame(this._raf); this._raf = null;
    removeEventListener('keydown', this._kd); removeEventListener('keyup', this._ku); removeEventListener('pointerup', this._pu); if (this._ro) this._ro.disconnect(); }

  instructions() { return 'Tap or press Space to play.'; }
  reset() {} update() {} render() { this.sky(); }
}

/* ============================================================ RUNNER */

class Runner extends Base {
  instructions() { return 'Space / Tap to jump (double-jump!), hold ↓ to duck. Jump low hazards, duck the overhead bars, grab coin arcs. Watch for Sugar Rush!'; }
  reset() {
    this.gy = this.H - Math.max(78, this.H * 0.17);
    this.r = Math.max(26, this.W * 0.075);
    this.p = { x: this.W * 0.24, y: this.gy, vy: 0, onGround: true, jumps: 0, duck: false };
    this.obs = []; this.coins = []; this.pu = []; this.spawnT = 0.7; this.coinT = 0.5; this.puT = 8;
    this.speed = Math.max(280, this.W * 0.6); this.rush = 0; this.rushT = 15;
  }
  jump() { if (this.p.onGround || this.p.jumps < 2) { this.p.vy = -Math.max(620, this.H * 0.95); this.p.onGround = false; this.p.jumps++; this.sound.jump(); this.burst(this.p.x, this.p.y + this.r * 0.6, this.theme.belly, 5); } }
  _coinArc(x0, n, peak) { for (let i = 0; i < n; i++) { const t = i / (n - 1), y = this.gy - peak * (1 - (2 * t - 1) * (2 * t - 1)); this.coins.push({ x: x0 + i * this.r * 1.5, y: y - this.r * 0.6, s: Math.max(22, this.W * 0.055), ch: this.theme.items[0] }); } }
  update(dt) {
    const D = this.difficulty();
    this.gy = this.H - Math.max(78, this.H * 0.17);
    const rushing = this.rush > 0;
    this.speed = Math.max(280, this.W * 0.6) * D * (rushing ? 1.28 : 1); this.scroll += this.speed * dt;
    if ((this.keys[' '] || this.keys['arrowup'] || this.keys['w'] || this.pointer.tapped)) this.jump();
    this.p.duck = this.keys['arrowdown'] || this.keys['s'];
    this.p.vy += 2100 * dt; this.p.y += this.p.vy * dt;
    if (this.p.y >= this.gy) { this.p.y = this.gy; this.p.vy = 0; this.p.onGround = true; this.p.jumps = 0; }

    // Sugar Rush: brief coin-storm + magnet + double score, telegraphed
    this.rushT -= dt;
    if (rushing) { this.rush -= dt; if (this.rush <= 0) this.float(this.W / 2, this.H * 0.28, 'Rush over!', this.theme.accent); }
    else if (this.rushT <= 0) { this.rush = 4; this.rushT = 17 + Math.random() * 7; this.powers.x2 = Math.max(this.powers.x2 || 0, 4); this.powers.magnet = Math.max(this.powers.magnet || 0, 4); this.sound.power(); this.float(this.W / 2, this.H * 0.28, '🍭 Sugar Rush!', this.theme.accent); this.ring(this.W / 2, this.H * 0.28, this.theme.accent); }

    this.spawnT -= dt;
    if (this.spawnT <= 0 && !rushing) {
      this.spawnT = Math.max(0.55, 0.95 - this.time * 0.008) + Math.random() * 0.25;
      const roll = Math.random(), kind = roll < 0.5 ? 'low' : roll < 0.8 ? 'high' : 'tall';
      const s = Math.max(30, this.W * 0.08);
      if (kind === 'high') this.obs.push({ x: this.W + 50, kind, s, band: [this.gy - this.r * 2.3, this.gy - this.r * 1.15], ch: this.theme.hazards[0] });
      else if (kind === 'tall') this.obs.push({ x: this.W + 50, kind, s: s * 1.15, band: [this.gy - this.r * 1.9, this.gy], ch: this.theme.hazards[2 % 3] });
      else this.obs.push({ x: this.W + 50, kind, s, band: [this.gy - this.r * 0.95, this.gy], ch: this.theme.hazards[1 % 3] });
    }
    this.coinT -= dt;
    if (this.coinT <= 0) { this.coinT = rushing ? 0.18 : (0.4 + Math.random() * 0.5);
      if (!rushing && Math.random() < 0.4) this._coinArc(this.W + 40, 5, this.H * 0.26);
      else this.coins.push({ x: this.W + 30, y: this.gy - (rushing ? 30 + Math.random() * this.H * 0.35 : 36 + Math.random() * this.H * 0.28), s: Math.max(22, this.W * 0.058), ch: this.theme.items[Math.floor(Math.random() * this.theme.items.length)] }); }
    this.puT -= dt;
    if (this.puT <= 0) { this.puT = 11 + Math.random() * 6; const t = Object.keys(POWERS)[Math.floor(Math.random() * 4)];
      this.pu.push({ x: this.W + 40, y: this.gy - this.H * 0.24, s: Math.max(26, this.W * 0.07), type: t }); }

    const mv = this.speed * dt, mag = this.powers.magnet;
    for (const o of this.obs) o.x -= mv;
    for (const cn of this.coins) { cn.x -= mv; if (mag) { const dx = this.p.x - cn.x, dy = this.p.y - this.r - cn.y, d = Math.hypot(dx, dy); if (d < this.W * 0.5) { cn.x += dx / d * 460 * dt; cn.y += dy / d * 460 * dt; } } }
    for (const q of this.pu) q.x -= mv;
    this.obs = this.obs.filter(o => o.x > -60); this.coins = this.coins.filter(c => c.x > -60 && !c.got); this.pu = this.pu.filter(q => q.x > -60 && !q.got);

    // player vertical band (feet at p.y, head above; ducking shrinks it)
    const head = this.p.y - this.r * (this.p.duck ? 0.9 : 1.9), pr = this.r * 0.42;
    for (const o of this.obs) if (!o.hit && Math.abs(o.x - this.p.x) < o.s * 0.42 + pr && this.p.y > o.band[0] && head < o.band[1]) { o.hit = true; this.burst(o.x, (o.band[0] + o.band[1]) / 2, '#ff4f6d', 14); this.loseLife(); }
    for (const cn of this.coins) if (!cn.got && Math.abs(cn.x - this.p.x) < cn.s * 0.5 + this.r && Math.abs(cn.y - (this.p.y - this.r * 0.6)) < cn.s * 0.5 + this.r) { cn.got = true; this.sound.coin(); this.burst(cn.x, cn.y, this.theme.accent, 6); this.hitCombo(cn.x, cn.y, rushing ? 8 : 5); }
    for (const q of this.pu) if (!q.got && Math.abs(q.x - this.p.x) < q.s + this.r && Math.abs(q.y - (this.p.y - this.r)) < q.s + this.r) { q.got = true; this.grantPower(q.type); }
    this.addScore(dt * 6 * D * (rushing ? 2 : 1));
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax();
    if (this.rush > 0) { c.save(); c.globalAlpha = 0.25; c.strokeStyle = this.theme.accent; c.lineWidth = 2; for (let i = 0; i < 8; i++) { const y = (i * 53 + this.scroll * 0.6) % this.H; c.beginPath(); c.moveTo(this.W, y); c.lineTo(this.W - 60, y); c.stroke(); } c.restore(); }
    for (const q of this.pu) { c.save(); c.shadowColor = POWERS[q.type].color; c.shadowBlur = 16; this.glyph(POWERS[q.type].icon, q.x, q.y + Math.sin(this.time * 4) * 6, q.s); c.restore(); }
    for (const cn of this.coins) this.glyph(cn.ch, cn.x, cn.y, cn.s);
    for (const o of this.obs) if (!o.hit) { if (o.kind === 'high') { c.fillStyle = shade(this.theme.primary, -20); rr2(c, o.x - o.s * 0.5, o.band[0], o.s, o.band[1] - o.band[0], 6); c.fill(); this.glyph(o.ch, o.x, o.band[0] + (o.band[1] - o.band[0]) / 2, o.s * 0.7); } else this.glyph(o.ch, o.x, o.band[1] - o.s * 0.5, o.s); }
    this.hero(this.p.x, this.p.y - this.r * (this.p.duck ? 0.5 : 0.95), this.r * 2.2, { run: this.p.onGround, squash: this.p.duck ? 0.5 : (this.p.onGround ? 0 : -0.3), expr: this.p.onGround ? 'smile' : 'wow' });
    this.drawFx(); c.restore();
  }
}

/* ============================================================ FLAPPY */

class Flappy extends Base {
  instructions() { return 'Tap / Space to flap through the gaps. Some pillars drift up & down — thread the ✨ bonus rings for extra points!'; }
  reset() {
    this.r = Math.max(22, this.W * 0.06); this.p = { x: this.W * 0.28, y: this.H / 2, vy: 0 };
    this.pipes = []; this.gap = this.H * 0.34; this.spawnX = 0; this.gapMin = this.H * 0.24; this.n = 0;
  }
  flap() { this.p.vy = -Math.max(360, this.H * 0.55); this.sound.jump(); this.burst(this.p.x - this.r, this.p.y + this.r * 0.4, this.theme.belly, 4); }
  update(dt) {
    if (this.pointer.tapped || this.keys[' '] || this.keys['arrowup'] || this.keys['w']) { this.flap(); this.keys[' '] = this.keys['w'] = false; }
    this.p.vy += 1500 * dt; this.p.y += this.p.vy * dt; this.scroll += (this.W * 0.42) * dt;
    if (this.p.y > this.H - this.r) { this.p.y = this.H - this.r; this.loseLife(); this.p.vy = -300; }
    if (this.p.y < this.r) { this.p.y = this.r; this.p.vy = 0; }
    const speed = this.W * 0.42 * this.difficulty();
    this.spawnX -= speed * dt;
    if (this.spawnX <= 0) { this.spawnX = this.W * 0.62; const g = Math.max(this.gapMin, this.gap - this.time * 1.2);
      this.n++; const moving = this.time > 12 && this.n % 3 === 0, ring = this.n % 4 === 0;
      const cy0 = this.H * 0.25 + Math.random() * this.H * 0.45;
      this.pipes.push({ x: this.W + 40, cy0, cy: cy0, g, w: Math.max(46, this.W * 0.13), scored: false, coin: !ring && Math.random() < 0.6, moving, amp: this.H * 0.14, ph: Math.random() * 7, ring, rgot: false }); }
    for (const p of this.pipes) { p.x -= speed * dt; if (p.moving) p.cy = p.cy0 + Math.sin(this.time * 1.6 + p.ph) * p.amp; }
    for (const p of this.pipes) {
      if (Math.abs(p.x - this.p.x) < p.w * 0.5 + this.r * 0.7 && (this.p.y - this.r * 0.6 < p.cy - p.g / 2 || this.p.y + this.r * 0.6 > p.cy + p.g / 2)) { if (!p.hit) { p.hit = true; this.burst(this.p.x, this.p.y, '#ff4f6d', 14); this.loseLife(); this.p.vy = -200; } }
      if (!p.scored && p.x < this.p.x) { p.scored = true; this.hitCombo(this.p.x, this.p.y - this.r, 4); }
      if (p.coin && !p.gc && Math.abs(p.x - this.p.x) < this.r + 10 && Math.abs(p.cy - this.p.y) < p.g / 2) { p.gc = true; this.sound.coin(); this.burst(this.p.x, this.p.y, this.theme.accent, 8); this.hitCombo(this.p.x, this.p.y, 3); }
      if (p.ring && !p.rgot && Math.abs(p.x - this.p.x) < this.r && Math.abs(p.cy - this.p.y) < p.g * 0.4) { p.rgot = true; this.sound.power(); this.ring(p.x, p.cy, this.theme.accent); this.confetti(p.x, p.cy); this.hitCombo(p.x, p.cy, 15); }
    }
    this.pipes = this.pipes.filter(p => p.x > -80);
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax();
    for (const p of this.pipes) {
      const topH = p.cy - p.g / 2, botY = p.cy + p.g / 2;
      if (p.ring) { if (!p.rgot) { c.save(); c.strokeStyle = this.theme.accent; c.lineWidth = 5; c.shadowColor = this.theme.accent; c.shadowBlur = 14; c.beginPath(); c.ellipse(p.x, p.cy, p.w * 0.5, p.g * 0.4, 0, 0, 7); c.stroke(); c.restore(); this.glyph('✨', p.x, p.cy, Math.max(22, this.W * 0.06)); } continue; }
      c.fillStyle = this.theme.primary; c.strokeStyle = shade(this.theme.primary, -30); c.lineWidth = 3;
      c.fillRect(p.x - p.w / 2, 0, p.w, topH); c.strokeRect(p.x - p.w / 2, 0, p.w, topH);
      c.fillRect(p.x - p.w / 2, botY, p.w, this.H - botY); c.strokeRect(p.x - p.w / 2, botY, p.w, this.H - botY);
      c.fillRect(p.x - p.w * 0.6, topH - 14, p.w * 1.2, 14); c.fillRect(p.x - p.w * 0.6, botY, p.w * 1.2, 14);
      if (p.moving) { c.save(); c.fillStyle = this.theme.accent; c.globalAlpha = 0.8; this.glyph('↕', p.x, topH - 26, Math.max(16, this.W * 0.04)); c.restore(); }
      if (p.coin && !p.gc) this.glyph(this.theme.items[0], p.x, p.cy, Math.max(22, this.W * 0.055));
    }
    const tilt = Math.max(-0.5, Math.min(0.6, this.p.vy / 600));
    c.save(); c.translate(this.p.x, this.p.y); c.rotate(tilt); this.hero(0, 0, this.r * 2.2, { t: this.time, run: true }); c.restore();
    this.drawFx(); c.restore();
  }
}

/* ============================================================ PLATFORMER */

class Platformer extends Base {
  instructions() { return 'Auto-bounce up the platforms — tilt / ← → to steer your landing. Springs launch you high, crumbling tiles vanish, dodge the spikes!'; }
  reset() {
    this.r = Math.max(22, this.W * 0.06); this.p = { x: this.W / 2, y: this.H - 120, vy: 0, vx: 0 };
    this.plats = []; this.height = 0; this.camY = 0;
    for (let i = 0; i < 8; i++) this.plats.push(this._mkPlat(this.H - i * (this.H / 7), i === 0));
  }
  _mkPlat(y, safe) {
    const roll = Math.random(); let type = 'normal';
    if (!safe) { const spikeChance = 0.12 + this.time * 0.0015; if (roll < spikeChance) type = 'spike'; else if (roll < spikeChance + 0.12) type = 'spring'; else if (roll < spikeChance + 0.24) type = 'crumble'; else if (roll < spikeChance + 0.42) type = 'moving'; }
    return { x: Math.random() * (this.W - 80) + 40, y, w: Math.max(60, this.W * (type === 'moving' ? 0.19 : 0.22)), coin: Math.random() < 0.45, got: false, type, vx: (Math.random() < 0.5 ? -1 : 1) * this.W * 0.28, gone: false, fall: 0 };
  }
  update(dt) {
    const accel = this.W * 3;
    if (this.keys['arrowleft'] || this.keys['a']) this.p.vx -= accel * dt;
    if (this.keys['arrowright'] || this.keys['d']) this.p.vx += accel * dt;
    if (this.pointer.down) this.p.vx += ((this.pointer.x - this.p.x) > 0 ? 1 : -1) * accel * 0.8 * dt;
    this.p.vx *= 0.9; this.p.x += this.p.vx * dt;
    if (this.p.x < 0) this.p.x = this.W; if (this.p.x > this.W) this.p.x = 0;
    this.p.vy += 1900 * dt; this.p.y += this.p.vy * dt;
    for (const pl of this.plats) {
      if (pl.type === 'moving' && !pl.gone) { pl.x += pl.vx * dt; if (pl.x < pl.w / 2) { pl.x = pl.w / 2; pl.vx *= -1; } if (pl.x > this.W - pl.w / 2) { pl.x = this.W - pl.w / 2; pl.vx *= -1; } }
      if (pl.crumbling) { pl.fall += dt; pl.y += 600 * pl.fall * dt; if (pl.fall > 0.25) pl.gone = true; }
      const py = pl.y - this.camY;
      if (!pl.gone && this.p.vy > 0 && Math.abs(this.p.x - pl.x) < pl.w / 2 + this.r * 0.4 && Math.abs(this.p.y + this.r - py) < 18) {
        if (pl.type === 'spike') { this.burst(this.p.x, py, '#ff4f6d', 12); this.loseLife(); this.p.vy = -Math.max(700, this.H); }
        else {
          this.p.vy = -(pl.type === 'spring' ? Math.max(1080, this.H * 1.55) : Math.max(720, this.H * 1.02));
          this.sound.jump(); if (pl.type === 'spring') { this.sound.power(); this.burst(pl.x, py, this.theme.accent, 10); }
          if (pl.type === 'crumble') pl.crumbling = true;
          if (pl.coin && !pl.got) { pl.got = true; this.sound.coin(); this.hitCombo(pl.x, py, 5); this.burst(pl.x, py, this.theme.accent, 8); }
        }
      }
    }
    const target = this.H * 0.45;
    if (this.p.y - this.camY < target) { const d = target - (this.p.y - this.camY); this.camY -= d; this.height += d; this.addScore(d * 0.02); }
    for (const pl of this.plats) if (pl.gone || pl.y - this.camY > this.H + 60) {
      let topY = Infinity; for (const p of this.plats) if (p !== pl && !p.gone) topY = Math.min(topY, p.y);
      Object.assign(pl, this._mkPlat((isFinite(topY) ? topY : this.camY) - this.H / 7, false));
    }
    if (this.p.y - this.camY > this.H + 60) { this.loseLife(); if (this.lives > 0) { this.p.y = this.camY + this.H * 0.3; this.p.vy = -400; } }
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(this.height * 0.4);
    for (const pl of this.plats) { if (pl.gone) continue; const py = pl.y - this.camY; if (py < -20 || py > this.H + 20) continue;
      const col = pl.type === 'spike' ? '#ff4f6d' : pl.type === 'spring' ? '#3ad07a' : pl.type === 'crumble' ? shade(this.theme.primary, 30) : this.theme.primary;
      c.save(); if (pl.crumbling) c.globalAlpha = Math.max(0.2, 1 - pl.fall * 3);
      c.fillStyle = col; c.strokeStyle = shade(col, -25); c.lineWidth = 3;
      const rx = pl.x - pl.w / 2; c.beginPath(); c.roundRect ? c.roundRect(rx, py, pl.w, 16, 8) : c.rect(rx, py, pl.w, 16); c.fill(); c.stroke();
      if (pl.type === 'spike') for (let i = 0; i < pl.w; i += 12) { c.beginPath(); c.moveTo(rx + i, py); c.lineTo(rx + i + 6, py - 8); c.lineTo(rx + i + 12, py); c.fill(); }
      if (pl.type === 'spring') { c.strokeStyle = shade('#3ad07a', -30); c.lineWidth = 3; c.beginPath(); c.moveTo(pl.x - 8, py); c.lineTo(pl.x - 4, py - 9); c.lineTo(pl.x + 4, py); c.lineTo(pl.x + 8, py - 9); c.stroke(); }
      if (pl.type === 'crumble') { c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 2; c.beginPath(); c.moveTo(pl.x, py); c.lineTo(pl.x, py + 16); c.stroke(); }
      c.restore();
      if (pl.coin && !pl.got) this.glyph(this.theme.items[0], pl.x, py - 20, Math.max(20, this.W * 0.05)); }
    this.hero(this.p.x, this.p.y - this.camY, this.r * 2.2, { t: this.time, squash: this.p.vy < 0 ? -0.2 : 0.1, face: this.p.vx < 0 ? -1 : 1 });
    this.drawFx(); c.restore();
  }
}

/* ============================================================ DODGER */

class Dodger extends Base {
  instructions() { return 'Move to catch treats, grab power-ups, dodge hazards. Drag or use ← →. Watch for Treat Storms and golden jackpots!'; }
  reset() {
    this.r = Math.max(24, this.W * 0.07); this.p = { x: this.W / 2, y: this.H - Math.max(58, this.H * 0.13), squash: 0 };
    this.items = []; this.spawnT = 0.5; this.stormT = 14; this.storm = 0; this.jackpotT = 9;
  }
  update(dt) {
    const D = this.difficulty();
    this.p.y = this.H - Math.max(58, this.H * 0.13);
    const sp = Math.max(320, this.W * 0.95);
    if (this.keys['arrowleft'] || this.keys['a']) this.p.x -= sp * dt;
    if (this.keys['arrowright'] || this.keys['d']) this.p.x += sp * dt;
    if (this.pointer.down) this.p.x += (this.pointer.x - this.p.x) * Math.min(1, dt * 12);
    this.p.face = (this.pointer.down && this.pointer.x < this.p.x) || this.keys['arrowleft'] ? -1 : 1;
    this.p.x = Math.max(this.r, Math.min(this.W - this.r, this.p.x));
    this.p.squash = Math.max(0, this.p.squash - dt * 3);

    // Treat Storm: a short, telegraphed high-density bonus wave every ~14-20s
    this.stormT -= dt;
    if (this.storm > 0) { this.storm -= dt; if (this.storm <= 0) this.float(this.W / 2, this.H * 0.3, 'Storm over!', this.theme.accent); }
    else if (this.stormT <= 0) { this.storm = 3.5; this.stormT = 16 + Math.random() * 6; this.sound.power(); this.float(this.W / 2, this.H * 0.3, '🌟 Treat Storm!', this.theme.accent); this.ring(this.W / 2, this.H * 0.3, this.theme.accent); }
    // rare golden jackpot — big, slow, worth a lot, needs precise catch
    this.jackpotT -= dt;
    if (this.jackpotT <= 0 && !this.items.some(i => i.jackpot)) { this.jackpotT = 20 + Math.random() * 10;
      this.items.push({ x: 40 + Math.random() * (this.W - 80), y: -40, s: Math.max(34, this.W * 0.1), vy: this.H * 0.22 * D, kind: 'good', jackpot: true, ch: this.theme.items[0], drift: 0, amp: 0 }); }

    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = (this.storm > 0 ? 0.14 : Math.max(0.24, 0.8 - this.time * 0.01));
      const roll = Math.random();
      const kind = this.storm > 0 ? (roll < 0.08 ? 'bad' : roll < 0.2 ? 'power' : 'good') : (roll < 0.28 ? 'bad' : roll < 0.34 ? 'power' : 'good');
      const arr = kind === 'bad' ? this.theme.hazards : this.theme.items;
      const weave = Math.random() < 0.45;                 // some items curve as they fall — real dodge skill
      this.items.push({ x: 30 + Math.random() * (this.W - 60), y: -30, s: Math.max(24, this.W * 0.07), vy: (this.H * 0.32 + Math.random() * 120) * D, kind, ch: arr[Math.floor(Math.random() * arr.length)], ptype: Object.keys(POWERS)[Math.floor(Math.random() * 4)], drift: weave ? (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 90) : 0, amp: weave ? 1.5 + Math.random() * 2 : 0, ph: Math.random() * 7 }); }
    const mag = this.powers.magnet;
    for (const it of this.items) {
      it.y += it.vy * dt;
      if (it.drift) it.x += Math.sin(this.time * it.amp + it.ph) * it.drift * dt;
      it.x = Math.max(it.s * 0.5, Math.min(this.W - it.s * 0.5, it.x));
      if (mag && it.kind !== 'bad') { const dx = this.p.x - it.x, d = Math.abs(dx); if (d < this.W * 0.4) it.x += Math.sign(dx) * 300 * dt; }
    }
    for (const it of this.items) { if (it.done) continue;
      if (Math.abs(it.x - this.p.x) < it.s * 0.5 + this.r * 0.8 && Math.abs(it.y - this.p.y) < it.s * 0.5 + this.r * 0.8) { it.done = true; this.p.squash = 1;
        if (it.kind === 'bad') { this.burst(it.x, it.y, '#ff4f6d', 14); this.loseLife(); }
        else if (it.kind === 'power') { this.grantPower(it.ptype); }
        else if (it.jackpot) { this.sound.power(); this.confetti(it.x, it.y); this.hitCombo(it.x, it.y, 40); }
        else { this.sound.coin(); this.burst(it.x, it.y, this.theme.accent, 8); this.hitCombo(it.x, it.y, this.storm > 0 ? 5 : 3); } } }
    this.items = this.items.filter(i => !i.done && i.y < this.H + 60);
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(0);
    if (this.storm > 0) { c.save(); c.globalAlpha = 0.10 + Math.sin(this.time * 10) * 0.03; c.fillStyle = this.theme.accent; c.fillRect(0, 0, this.W, this.H); c.restore(); }
    for (const it of this.items) {
      if (it.kind === 'power') { c.save(); c.shadowColor = POWERS[it.ptype].color; c.shadowBlur = 16; this.glyph(POWERS[it.ptype].icon, it.x, it.y, it.s); c.restore(); }
      else if (it.jackpot) { c.save(); c.shadowColor = '#ffd166'; c.shadowBlur = 22; this.glyph(it.ch, it.x, it.y, it.s * (1 + Math.sin(this.time * 6) * 0.08)); c.restore(); }
      else this.glyph(it.ch, it.x, it.y, it.s);
    }
    this.hero(this.p.x, this.p.y, this.r * 2.2, { t: this.time, face: this.p.face, expr: 'smile', squash: -this.p.squash * 0.5 });
    this.drawFx(); c.restore();
  }
}

/* ============================================================ SHOOTER */

class Shooter extends Base {
  instructions() { return 'Move with ← → or drag. Auto-fire! Blast the swarm, dodge enemy fire, and take down the boss when it warps in.'; }
  reset() { this.r = Math.max(24, this.W * 0.07); this.p = { x: this.W / 2, y: this.H - Math.max(58, this.H * 0.13) }; this.foes = []; this.shots = []; this.ebul = []; this.pu = []; this.spawnT = 0.6; this.fireT = 0; this.puT = 10; this.boss = null; this.bossT = 22; this.swarmT = 11; }
  _spawnFoe(D, kind, x) {
    const base = Math.max(28, this.W * 0.075);
    if (kind === 'tank') this.foes.push({ x, y: -30, s: base * 1.4, vy: this.H * 0.06 * D, hp: 3, kind, dx: 0, ch: this.theme.hazards[2 % 3], ph: 0 });
    else if (kind === 'weaver') this.foes.push({ x, y: -30, s: base, vy: this.H * 0.13 * D, hp: 1, kind, dx: 0, amp: this.W * 0.22, ph: Math.random() * 7, x0: x, ch: this.theme.hazards[0] });
    else this.foes.push({ x, y: -30, s: base, vy: (this.H * 0.11 + Math.random() * 40) * D, hp: 1, kind: 'grunt', dx: (Math.random() - 0.5) * 60, ch: this.theme.hazards[1 % 3], ph: 0 });
  }
  update(dt) {
    const D = this.difficulty();
    this.p.y = this.H - Math.max(58, this.H * 0.13);
    const sp = Math.max(340, this.W);
    if (this.keys['arrowleft'] || this.keys['a']) this.p.x -= sp * dt;
    if (this.keys['arrowright'] || this.keys['d']) this.p.x += sp * dt;
    if (this.pointer.down) this.p.x += (this.pointer.x - this.p.x) * Math.min(1, dt * 14);
    this.p.x = Math.max(this.r, Math.min(this.W - this.r, this.p.x));
    this.fireT -= dt;
    const rate = this.powers.x2 ? 0.15 : 0.26;
    if (this.fireT <= 0) { this.fireT = rate; this.shots.push({ x: this.p.x, y: this.p.y - this.r }); if (this.powers.x2) { this.shots.push({ x: this.p.x - 16, y: this.p.y - this.r, vx: -60 }); this.shots.push({ x: this.p.x + 16, y: this.p.y - this.r, vx: 60 }); } this.sound.blip(760, 0.04, 'square', 0.06); }
    for (const s of this.shots) { s.y -= Math.max(560, this.H) * dt; if (s.vx) s.x += s.vx * dt; } this.shots = this.shots.filter(s => s.y > -20);

    // boss lifecycle — warps in, strafes, fires spreads, has a health bar
    this.bossT -= dt;
    if (!this.boss && this.bossT <= 0) { const hp = Math.round(14 + this.time * 0.5); this.boss = { x: this.W / 2, y: this.H * 0.14, s: Math.max(60, this.W * 0.2), hp, maxhp: hp, dir: Math.random() < 0.5 ? -1 : 1, fireT: 1.2, ch: this.theme.hazards[0] }; this.float(this.W / 2, this.H * 0.3, '⚠️ Boss!', '#ff4f6d'); this.sound.power(); }
    if (this.boss) {
      const b = this.boss; b.x += b.dir * this.W * 0.25 * dt; if (b.x < b.s * 0.5) { b.x = b.s * 0.5; b.dir = 1; } if (b.x > this.W - b.s * 0.5) { b.x = this.W - b.s * 0.5; b.dir = -1; }
      b.fireT -= dt; if (b.fireT <= 0) { b.fireT = Math.max(0.7, 1.6 - this.time * 0.01); const spd = this.H * 0.4; for (let a = -1; a <= 1; a++) this.ebul.push({ x: b.x, y: b.y + b.s * 0.4, vx: a * this.W * 0.14, vy: spd }); this.sound.blip(200, 0.1, 'sawtooth', 0.12); }
      for (const s of this.shots) if (!s.dead && Math.abs(s.x - b.x) < b.s * 0.5 && Math.abs(s.y - b.y) < b.s * 0.5) { s.dead = true; b.hp--; this.burst(s.x, s.y, this.theme.accent, 4); if (b.hp <= 0) { this.confetti(b.x, b.y); this.burst(b.x, b.y, this.theme.accent, 30, 1.8); this.shake = 1; this.hitCombo(b.x, b.y, 60); this.pu.push({ x: b.x, y: b.y, s: Math.max(26, this.W * 0.07), vy: this.H * 0.15, type: Object.keys(POWERS)[Math.floor(Math.random() * 4)] }); this.boss = null; this.bossT = 20 + Math.random() * 8; } }
    }

    // swarm wave: a synchronized line of grunts
    this.swarmT -= dt;
    if (this.swarmT <= 0) { this.swarmT = 13 + Math.random() * 8; const n = 4 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) this._spawnFoe(D, 'grunt', (i + 0.5) * this.W / n); this.float(this.W / 2, this.H * 0.28, 'Incoming!', this.theme.accent); }

    this.spawnT -= dt;
    if (this.spawnT <= 0) { this.spawnT = Math.max(0.4, 1.05 - this.time * 0.011); const roll = Math.random(); this._spawnFoe(D, roll < 0.18 ? 'tank' : roll < 0.5 ? 'weaver' : 'grunt', 30 + Math.random() * (this.W - 60)); }
    this.puT -= dt; if (this.puT <= 0) { this.puT = 12 + Math.random() * 6; this.pu.push({ x: 30 + Math.random() * (this.W - 60), y: -20, s: Math.max(26, this.W * 0.07), vy: this.H * 0.15, type: Object.keys(POWERS)[Math.floor(Math.random() * 4)] }); }

    for (const f of this.foes) { f.y += f.vy * dt; if (f.kind === 'weaver') f.x = f.x0 + Math.sin(this.time * 3 + f.ph) * f.amp; else { f.x += (f.dx || 0) * dt; if (f.x < f.s / 2 || f.x > this.W - f.s / 2) f.dx *= -1; } }
    for (const q of this.pu) q.y += q.vy * dt;
    for (const b of this.ebul) { b.x += b.vx * dt; b.y += b.vy * dt; }
    for (const f of this.foes) {
      for (const s of this.shots) if (!s.dead && Math.abs(s.x - f.x) < f.s * 0.5 && Math.abs(s.y - f.y) < f.s * 0.5) { s.dead = true; f.hp--; this.burst(s.x, s.y, this.theme.accent, 4);
        if (f.hp <= 0) { f.dead = true; this.sound.coin(); this.burst(f.x, f.y, this.theme.accent, f.kind === 'tank' ? 16 : 8, f.kind === 'tank' ? 1.4 : 1); this.hitCombo(f.x, f.y, f.kind === 'tank' ? 10 : 4); } }
      if (!f.dead && f.y > this.p.y - this.r && Math.abs(f.x - this.p.x) < f.s * 0.5 + this.r * 0.6) { f.dead = true; this.burst(f.x, f.y, '#ff4f6d', 12); this.loseLife(); }
    }
    for (const b of this.ebul) if (!b.dead && Math.abs(b.x - this.p.x) < this.r * 0.7 && Math.abs(b.y - this.p.y) < this.r * 0.7) { b.dead = true; this.burst(b.x, b.y, '#ff4f6d', 10); this.loseLife(); }
    for (const q of this.pu) if (!q.got && Math.abs(q.x - this.p.x) < q.s + this.r && Math.abs(q.y - this.p.y) < q.s + this.r) { q.got = true; this.grantPower(q.type); }
    this.shots = this.shots.filter(s => !s.dead); this.foes = this.foes.filter(f => !f.dead && f.y < this.H + 60); this.ebul = this.ebul.filter(b => !b.dead && b.y < this.H + 20 && b.x > -20 && b.x < this.W + 20); this.pu = this.pu.filter(q => !q.got && q.y < this.H + 40);
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(0);
    c.fillStyle = this.theme.accent; for (const s of this.shots) { c.save(); c.shadowColor = this.theme.accent; c.shadowBlur = 8; c.fillRect(s.x - 3, s.y - 10, 6, 16); c.restore(); }
    for (const b of this.ebul) { c.save(); c.fillStyle = '#ff5b6e'; c.shadowColor = '#ff5b6e'; c.shadowBlur = 8; c.beginPath(); c.arc(b.x, b.y, this.r * 0.28, 0, 7); c.fill(); c.restore(); }
    for (const q of this.pu) { c.save(); c.shadowColor = POWERS[q.type].color; c.shadowBlur = 16; this.glyph(POWERS[q.type].icon, q.x, q.y, q.s); c.restore(); }
    for (const f of this.foes) { this.glyph(f.ch, f.x, f.y, f.s); if (f.kind === 'tank' && f.hp < 3) { c.fillStyle = '#ff4f6d'; c.fillRect(f.x - f.s / 2, f.y - f.s / 2 - 6, f.s * (f.hp / 3), 3); } }
    if (this.boss) { const b = this.boss; this.glyph(b.ch, b.x, b.y, b.s * (1 + Math.sin(this.time * 6) * 0.04));
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(this.W * 0.15, 12, this.W * 0.7, 8); c.fillStyle = '#ff4f6d'; c.fillRect(this.W * 0.15, 12, this.W * 0.7 * (b.hp / b.maxhp), 8); }
    if (this.powers.shield) { c.strokeStyle = POWERS.shield.color; c.globalAlpha = 0.6; c.lineWidth = 3; c.beginPath(); c.arc(this.p.x, this.p.y, this.r * 1.5, 0, 7); c.stroke(); c.globalAlpha = 1; }
    this.hero(this.p.x, this.p.y, this.r * 2.2, { t: this.time, expr: 'smile' });
    this.drawFx(); c.restore();
  }
}

/* ============================================================ WHACK */

class Whack extends Base {
  instructions() { return 'Tap the treats as they pop up — fast! Avoid the hazards. Build big combos.'; }
  reset() { this.cols = 3; this.rows = 3; this.holes = []; this.spawnT = 0.5; this._layout(); this.lives = 3; this.frenzy = 0; this.frenzyT = 12; }
  onResize() { if (this.holes && this.holes.length) this._layout(); }
  _layout() {
    const top = this.H * 0.16, bot = this.H * 0.92, left = this.W * 0.14, right = this.W * 0.86;
    this.holes = [];
    for (let r = 0; r < this.rows; r++) for (let col = 0; col < this.cols; col++)
      this.holes.push({ x: left + (right - left) * (col / (this.cols - 1)), y: top + (bot - top) * (r / (this.rows - 1)), up: 0, kind: null, ch: '', life: 0 });
    this.rad = Math.max(26, this.W * 0.09);
  }
  update(dt) {
    this.frenzyT -= dt;
    if (this.frenzy > 0) this.frenzy -= dt;
    else if (this.frenzyT <= 0) { this.frenzy = 3.5; this.frenzyT = 15 + Math.random() * 6; this.sound.power(); this.float(this.W / 2, this.H * 0.1, '⚡ Frenzy!', this.theme.accent); }
    this.spawnT -= dt;
    if (this.spawnT <= 0) { this.spawnT = this.frenzy > 0 ? 0.22 : Math.max(0.35, 0.9 - this.time * 0.012);
      const free = this.holes.filter(h => h.up <= 0); if (free.length) { const h = free[Math.floor(Math.random() * free.length)];
        const roll = Math.random(), bad = this.frenzy > 0 ? roll < 0.14 : roll < 0.28, gold = !bad && roll > 0.92;
        h.kind = bad ? 'bad' : gold ? 'gold' : 'good'; h.ch = bad ? this.theme.hazards[Math.floor(Math.random() * 3)] : gold ? '⭐' : this.theme.items[Math.floor(Math.random() * this.theme.items.length)];
        h.up = 0.01; h.life = gold ? 0.85 : Math.max(0.7, 1.4 - this.time * 0.01); } }
    for (const h of this.holes) { if (h.up > 0) { h.up = Math.min(1, h.up + dt * 6); h.life -= dt; if (h.life <= 0) { if (h.kind === 'good' || h.kind === 'gold') { this.combo = 0; this.mult = 1; this.comboEl.textContent = ''; } h.up = 0; h.kind = null; } } }
    if (this.pointer.tapped) { for (const h of this.holes) { if (h.up > 0.5 && Math.hypot(this.pointer.x - h.x, this.pointer.y - h.y) < this.rad) {
      if (h.kind === 'gold') { this.sound.power(); this.confetti(h.x, h.y); this.hitCombo(h.x, h.y, 15); }
      else if (h.kind === 'good') { this.sound.coin(); this.burst(h.x, h.y, this.theme.accent, 10); this.hitCombo(h.x, h.y, 4); }
      else { this.burst(h.x, h.y, '#ff4f6d', 12); this.loseLife(); }
      h.up = 0; h.kind = null; break; } } }
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.sky();
    c.fillStyle = this.theme.ground; c.fillRect(0, 0, this.W, this.H); c.globalAlpha = 0.12; this.parallaxDecor && this.parallaxDecor(); c.globalAlpha = 1;
    for (const h of this.holes) {
      c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(h.x, h.y + this.rad * 0.4, this.rad, this.rad * 0.45, 0, 0, 7); c.fill();
      if (h.up > 0) { const off = (1 - h.up) * this.rad; c.save(); c.beginPath(); c.ellipse(h.x, h.y + this.rad * 0.4, this.rad, this.rad * 0.5, 0, 0, 7); c.clip();
        if (h.kind === 'good') this.hero(h.x, h.y + off, this.rad * 1.9, { t: this.time }); else { if (h.kind === 'gold') { c.shadowColor = '#ffd166'; c.shadowBlur = 16; } this.glyph(h.ch, h.x, h.y + off, this.rad * 1.4); c.shadowBlur = 0; }
        c.restore(); }
      c.fillStyle = shade(this.theme.ground, -22); c.beginPath(); c.ellipse(h.x, h.y + this.rad * 0.4, this.rad * 1.02, this.rad * 0.5, 0, 0, Math.PI); c.fill();
    }
    this.drawFx(); c.restore();
  }
}

/* ============================================================ MATCH3 */

class Match3 extends Base {
  instructions() { return 'Swap two touching tiles to line up 3+. Line up 4 for a Rocket, 5 for a Bomb — chain combos and beat the clock!'; }
  reset() {
    this.N = 8; this.symbols = this.theme.items.slice(0, 5); this.grid = []; this.sp = []; this.sel = null; this.busy = false;
    this.timeLeft = 60; this.lives = 999; this.livesEl.innerHTML = '⏱️'; this.beams = []; this._layout();
    do { this._fill(); } while (this._runs().length || !this._anyMove());
  }
  onResize() { if (this.grid && this.grid.length) this._layout(); }
  _layout() { const pad = Math.max(8, this.W * 0.03), a = Math.min(this.W, this.H) - pad * 2; this.cell = Math.floor(a / this.N); this.ox = Math.floor((this.W - this.cell * this.N) / 2); this.oy = Math.floor((this.H - this.cell * this.N) / 2) + 10; }
  _fill() { for (let r = 0; r < this.N; r++) { this.grid[r] = []; this.sp[r] = []; for (let col = 0; col < this.N; col++) { this.grid[r][col] = Math.floor(Math.random() * this.symbols.length); this.sp[r][col] = null; } } }
  _cell(px, py) { const col = Math.floor((px - this.ox) / this.cell), r = Math.floor((py - this.oy) / this.cell); return (col < 0 || r < 0 || col >= this.N || r >= this.N) ? null : { r, col }; }
  _cx(col) { return this.ox + col * this.cell + this.cell / 2; }
  _cy(r) { return this.oy + r * this.cell + this.cell / 2; }
  _swap(a, b) { let t = this.grid[a.r][a.col]; this.grid[a.r][a.col] = this.grid[b.r][b.col]; this.grid[b.r][b.col] = t; t = this.sp[a.r][a.col]; this.sp[a.r][a.col] = this.sp[b.r][b.col]; this.sp[b.r][b.col] = t; }
  _swapRaw(a, b) { const t = this.grid[a.r][a.col]; this.grid[a.r][a.col] = this.grid[b.r][b.col]; this.grid[b.r][b.col] = t; }
  _runs() {                                        // contiguous same-colour runs of 3+
    const runs = [];
    for (let r = 0; r < this.N; r++) { let c0 = 0; while (c0 < this.N) { const v = this.grid[r][c0]; let c1 = c0; while (c1 + 1 < this.N && v != null && this.grid[r][c1 + 1] === v) c1++; if (v != null && c1 - c0 + 1 >= 3) { const cells = []; for (let c = c0; c <= c1; c++) cells.push([r, c]); runs.push({ cells, len: c1 - c0 + 1, dir: 'h' }); } c0 = c1 + 1; } }
    for (let col = 0; col < this.N; col++) { let r0 = 0; while (r0 < this.N) { const v = this.grid[r0][col]; let r1 = r0; while (r1 + 1 < this.N && v != null && this.grid[r1 + 1][col] === v) r1++; if (v != null && r1 - r0 + 1 >= 3) { const cells = []; for (let r = r0; r <= r1; r++) cells.push([r, col]); runs.push({ cells, len: r1 - r0 + 1, dir: 'v' }); } r0 = r1 + 1; } }
    return runs;
  }
  _matches() { return this._runs().flatMap(r => r.cells); }
  _key(r, c) { return r + ',' + c; }
  _blast(r, c, type, set) {                         // expand a special's clear area into `set`
    const add = (rr, cc) => { if (rr >= 0 && cc >= 0 && rr < this.N && cc < this.N) set.add(this._key(rr, cc)); };
    if (type === 'row') { for (let cc = 0; cc < this.N; cc++) add(r, cc); this.beams.push({ r, dir: 'h', life: 0.4 }); }
    else if (type === 'col') { for (let rr = 0; rr < this.N; rr++) add(rr, c); this.beams.push({ c, dir: 'v', life: 0.4 }); }
    else { for (let rr = r - 1; rr <= r + 1; rr++) for (let cc = c - 1; cc <= c + 1; cc++) add(rr, cc); this.burst(this._cx(c), this._cy(r), '#ffd166', 18, 1.4); this.shake = 0.55; }
    this.sound.power();
  }
  _resolve(cause) {
    this.busy = true; let combo = 0;
    const step = () => {
      const runs = this._runs();
      if (!runs.length) { this.busy = false; if (!this._anyMove()) this._shuffle(); return; }
      combo++;
      const toClear = new Set(), specials = [];
      for (const run of runs) {
        for (const [r, c] of run.cells) toClear.add(this._key(r, c));
        if (run.len >= 4) {                          // 4 → rocket, 5+ → bomb
          let cr = run.cells[Math.floor(run.len / 2)];
          if (cause) { const hit = run.cells.find(([r, c]) => r === cause.r && c === cause.col); if (hit) cr = hit; }
          specials.push({ r: cr[0], col: cr[1], type: run.len >= 5 ? 'bomb' : (run.dir === 'h' ? 'row' : 'col'), color: this.grid[cr[0]][cr[1]] });
        }
      }
      // chain: any special caught in the clear detonates too
      let grew = true;
      while (grew) { grew = false; for (const key of [...toClear]) { const [r, c] = key.split(',').map(Number); const s = this.sp[r][c]; if (s) { this.sp[r][c] = null; const before = toClear.size; this._blast(r, c, s, toClear); if (toClear.size > before) grew = true; } } }
      for (const sp of specials) toClear.delete(this._key(sp.r, sp.col));
      let cleared = 0;
      for (const key of toClear) { const [r, c] = key.split(',').map(Number); if (this.grid[r][c] != null) { this.grid[r][c] = null; this.sp[r][c] = null; cleared++; if (Math.random() < 0.6) this.burst(this._cx(c), this._cy(r), this.theme.accent, 5); } }
      for (const sp of specials) { this.sp[sp.r][sp.col] = sp.type; this.grid[sp.r][sp.col] = sp.color; this.ring(this._cx(sp.col), this._cy(sp.r), '#ffd166'); }
      const g = cleared * 10 * combo; this.addScore(g); this.sound.combo(combo);
      if (combo > 1) this.comboEl.textContent = combo + '× chain';
      this.timeLeft = Math.min(80, this.timeLeft + cleared * 0.3);
      for (let col = 0; col < this.N; col++) { let w = this.N - 1;
        for (let r = this.N - 1; r >= 0; r--) if (this.grid[r][col] != null) { this.grid[w][col] = this.grid[r][col]; this.sp[w][col] = this.sp[r][col]; if (w !== r) { this.grid[r][col] = null; this.sp[r][col] = null; } w--; }
        for (let r = w; r >= 0; r--) { this.grid[r][col] = Math.floor(Math.random() * this.symbols.length); this.sp[r][col] = null; } }
      cause = null;
      setTimeout(step, 130);
    };
    step();
  }
  _anyMove() {
    for (let r = 0; r < this.N; r++) for (let c = 0; c < this.N; c++) {
      if (this.sp[r][c]) return true;
      if (c + 1 < this.N) { const a = { r, col: c }, b = { r, col: c + 1 }; this._swapRaw(a, b); const ok = this._runs().length > 0; this._swapRaw(a, b); if (ok) return true; }
      if (r + 1 < this.N) { const a = { r, col: c }, b = { r: r + 1, col: c }; this._swapRaw(a, b); const ok = this._runs().length > 0; this._swapRaw(a, b); if (ok) return true; }
    }
    return false;
  }
  _shuffle() { do { this._fill(); } while (this._runs().length || !this._anyMove()); this.float(this.W / 2, this.H * 0.5, 'Shuffle!', this.theme.accent); this.sound.power(); }
  update(dt) {
    this.timeLeft -= dt; if (this.timeLeft <= 0) { this.timeLeft = 0; return this.showOver(); }
    this.scoreEl.textContent = Math.floor(this.score); this.comboEl.textContent = Math.ceil(this.timeLeft) + 's';
    for (const b of this.beams) b.life -= dt; this.beams = this.beams.filter(b => b.life > 0);
    if (this.pointer.tapped && !this.busy) { const cc = this._cell(this.pointer.x, this.pointer.y); if (cc) {
      if (!this.sel) this.sel = cc; else { const d = Math.abs(this.sel.r - cc.r) + Math.abs(this.sel.col - cc.col);
        if (d === 1) {
          this._swap(this.sel, cc);
          const hasSp = this.sp[this.sel.r][this.sel.col] || this.sp[cc.r][cc.col];
          if (this._runs().length || hasSp) {
            this.sound.jump();
            if (hasSp && !this._runs().length) {       // player swapped a special into place → detonate it now
              const set = new Set();
              for (const p of [this.sel, cc]) if (this.sp[p.r][p.col]) { this._blast(p.r, p.col, this.sp[p.r][p.col], set); this.sp[p.r][p.col] = null; }
              for (const key of set) { const [r, c] = key.split(',').map(Number); if (this.grid[r][c] != null) { this.grid[r][c] = null; this.sp[r][c] = null; } }
              this.addScore(set.size * 12);
            }
            this._resolve(cc);
          } else { this._swap(this.sel, cc); this.sound.blip(220, 0.1, 'sine', 0.1); }
          this.sel = null;
        } else this.sel = cc; } } }
  }
  render() {
    const c = this.ctx; this.sky();
    c.fillStyle = this.theme.dark ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.5)'; rr2(c, this.ox - 8, this.oy - 8, this.cell * this.N + 16, this.cell * this.N + 16, 18); c.fill();
    for (let r = 0; r < this.N; r++) for (let col = 0; col < this.N; col++) { const v = this.grid[r][col]; if (v == null) continue;
      const x = this.ox + col * this.cell, y = this.oy + r * this.cell, sel = this.sel && this.sel.r === r && this.sel.col === col, sp = this.sp[r][col];
      c.fillStyle = sel ? this.theme.accent : (sp ? '#fff3c4' : (this.theme.dark ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.82)')); rr2(c, x + 3, y + 3, this.cell - 6, this.cell - 6, 12); c.fill();
      if (sp) { c.save(); c.strokeStyle = '#ffb703'; c.lineWidth = 2.5;
        if (sp === 'row') { for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(x + 6, y + this.cell / 2 + i * 7); c.lineTo(x + this.cell - 6, y + this.cell / 2 + i * 7); c.stroke(); } }
        else if (sp === 'col') { for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(x + this.cell / 2 + i * 7, y + 6); c.lineTo(x + this.cell / 2 + i * 7, y + this.cell - 6); c.stroke(); } }
        else { c.shadowColor = '#ffd166'; c.shadowBlur = 12; c.beginPath(); c.arc(x + this.cell / 2, y + this.cell / 2, this.cell * 0.36, 0, 7); c.stroke(); } c.restore(); }
      this.glyph(this.symbols[v], x + this.cell / 2, y + this.cell / 2, this.cell * (sp === 'bomb' ? 0.5 : 0.62)); }
    for (const b of this.beams) { c.save(); c.globalAlpha = Math.max(0, b.life * 2); c.fillStyle = '#ffe89a'; c.shadowColor = '#ffd166'; c.shadowBlur = 14;
      if (b.dir === 'h') c.fillRect(this.ox, this._cy(b.r) - 5, this.cell * this.N, 10); else c.fillRect(this._cx(b.c) - 5, this.oy, 10, this.cell * this.N); c.restore(); }
    this.drawFx();
  }
}

/* ============================================================ SERVE */

class Serve extends Base {
  instructions() { return 'Serve every item on each customer\'s ticket before patience runs out. Fast serves earn bigger tips — brace for Rush Hour!'; }
  reset() { this.menu = this.theme.items.slice(0, 4); this.queue = []; this.spawnT = 0; this.maxQ = 4; this.rush = 0; this.rushT = 16; this._btns(); }
  onResize() { this._btns(); }
  _btns() { if (!this.menu) return; const n = this.menu.length, bw = Math.min(this.W / n - 10, 96); this.btns = this.menu.map((ch, i) => ({ ch, x: (this.W / n) * i + (this.W / n) / 2, y: this.H - Math.max(50, this.H * 0.1), r: Math.max(30, bw * 0.5), press: 0 })); }
  _spawn() {
    const nItems = Math.min(3, 1 + Math.floor(Math.random() * (1 + this.time / 40)));
    const items = []; for (let i = 0; i < nItems; i++) items.push(Math.floor(Math.random() * this.menu.length));
    this.queue.push({ items, served: items.map(() => false), patience: 1, decay: (0.05 + this.time * 0.001 + Math.random() * 0.02) * (this.rush > 0 ? 1.15 : 1) + nItems * 0.006, face: Math.floor(Math.random() * 6) });
  }
  update(dt) {
    this.rushT -= dt;
    if (this.rush > 0) this.rush -= dt;
    else if (this.rushT <= 0) { this.rush = 6; this.rushT = 18 + Math.random() * 8; this.sound.power(); this.float(this.W / 2, this.H * 0.2, '⏰ Rush Hour!', this.theme.accent); this.ring(this.W / 2, this.H * 0.2, this.theme.accent); }
    this.spawnT -= dt;
    const cap = this.rush > 0 ? this.maxQ : this.maxQ - 1;
    if (this.spawnT <= 0 && this.queue.length < cap) { this.spawnT = this.rush > 0 ? 0.7 : Math.max(0.9, 2.1 - this.time * 0.02); this._spawn(); }
    for (const q of this.queue) { q.patience -= q.decay * dt; if (q.patience <= 0 && !q.done) { q.done = true; this.combo = 0; this.mult = 1; this.comboEl.textContent = ''; this.loseLife(); } }
    this.queue = this.queue.filter(q => !q.done);
    if (this.pointer.tapped) for (const b of this.btns) if (Math.hypot(this.pointer.x - b.x, this.pointer.y - b.y) < b.r) {
      const idx = this.menu.indexOf(b.ch);
      // serve the front-most customer that still needs this dish
      let target = null; for (const q of this.queue) { const k = q.items.findIndex((it, j) => it === idx && !q.served[j]); if (k >= 0) { target = { q, k }; break; } }
      if (target) { target.q.served[target.k] = true; this.sound.coin(); this.burst(b.x, b.y - 40, this.theme.accent, 6);
        if (target.q.served.every(Boolean)) { target.q.done = true; const tip = Math.round(target.q.patience * 10); this.hitCombo(b.x, b.y - 60, 6 + target.q.items.length * 2 + tip); if (tip >= 6) this.float(b.x, b.y - 90, '💰 Big Tip!', '#ffd166'); }
      } else { this.sound.blip(200, 0.12, 'sine', 0.1); this.combo = 0; this.mult = 1; this.comboEl.textContent = ''; }
      b.press = 1; this.queue = this.queue.filter(q => !q.done); }
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(0);
    if (this.rush > 0) { c.save(); c.globalAlpha = 0.08 + Math.sin(this.time * 8) * 0.03; c.fillStyle = this.theme.accent; c.fillRect(0, 0, this.W, this.H); c.restore(); }
    c.fillStyle = shade(this.theme.ground, -10); c.fillRect(0, this.H - Math.max(96, this.H * 0.2), this.W, this.H);
    const faces = ['🧒', '👧', '🧑', '👵', '👴', '🧙'];
    this.queue.forEach((q, i) => { const x = (this.W / this.maxQ) * i + (this.W / this.maxQ) / 2, y = this.H * 0.36;
      this.glyph(faces[q.face], x, y, Math.max(40, this.W * 0.11));
      const n = q.items.length, iw = 30, tw = n * iw + 12;
      c.fillStyle = this.theme.dark ? 'rgba(255,255,255,.16)' : '#fff'; rr2(c, x - tw / 2, y - 88, tw, 46, 12); c.fill();
      q.items.forEach((it, j) => { c.save(); if (q.served[j]) c.globalAlpha = 0.28; this.glyph(this.menu[it], x - tw / 2 + 12 + j * iw + iw / 2 - 6, y - 64, 26); if (q.served[j]) { c.strokeStyle = '#3ad07a'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - tw / 2 + 6 + j * iw + 4, y - 64); c.lineTo(x - tw / 2 + 6 + j * iw + 12, y - 58); c.lineTo(x - tw / 2 + 6 + j * iw + 24, y - 74); c.stroke(); } c.restore(); });
      c.fillStyle = 'rgba(0,0,0,.16)'; c.fillRect(x - 28, y + 36, 56, 7); c.fillStyle = q.patience > 0.4 ? '#3ad07a' : '#ff5b6e'; c.fillRect(x - 28, y + 36, 56 * Math.max(0, q.patience), 7); });
    for (const b of this.btns) { c.save(); c.globalAlpha = b.press ? 0.7 : 1; c.fillStyle = this.theme.primary; c.shadowColor = this.theme.primary; c.shadowBlur = 12; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill(); c.restore(); this.glyph(b.ch, b.x, b.y, b.r * 1.1); if (b.press) b.press -= 0.08; }
    this.hero(this.W - Math.max(40, this.W * 0.12), this.H - Math.max(96, this.H * 0.2) - Math.max(30, this.W * 0.08), Math.max(60, this.W * 0.16), { t: this.time });
    this.drawFx(); c.restore();
  }
}

/* ============================================================ MAZE */

class Maze extends Base {
  instructions() { return 'Collect every treat and clear the maze — dodge the guards! Arrow keys, WASD or swipe to steer. Grab a ✨ to turn the tables.'; }
  reset() { this.level = 1; this._gen(); }
  onResize() { if (this.wall) this._layout(); }
  _gen() {
    let C = 7 + this.level * 2; if (C % 2 === 0) C++; C = Math.min(C, 15);
    let R = Math.round(C * (this.H / this.W)); if (R % 2 === 0) R++; R = Math.max(9, Math.min(R, 21));
    this.cols = C; this.rows = R;
    const g = []; for (let y = 0; y < R; y++) { g[y] = []; for (let x = 0; x < C; x++) g[y][x] = 1; }
    const st = [[1, 1]]; g[1][1] = 0;
    while (st.length) {
      const [x, y] = st[st.length - 1]; const o = [];
      for (const [dx, dy] of [[0, -2], [0, 2], [-2, 0], [2, 0]]) { const nx = x + dx, ny = y + dy; if (nx > 0 && ny > 0 && nx < C - 1 && ny < R - 1 && g[ny][nx] === 1) o.push([nx, ny, dx, dy]); }
      if (!o.length) { st.pop(); continue; }
      const [nx, ny, dx, dy] = o[Math.floor(Math.random() * o.length)]; g[y + dy / 2][x + dx / 2] = 0; g[ny][nx] = 0; st.push([nx, ny]);
    }
    // braid: knock out some dead-end walls so corridors loop (less trap-y)
    for (let y = 1; y < R - 1; y++) for (let x = 1; x < C - 1; x++) if (g[y][x] === 0) {
      const ws = []; for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) if (g[y + dy][x + dx] === 1) ws.push([x + dx, y + dy]);
      if (ws.length >= 3 && Math.random() < 0.35) { const w = ws[Math.floor(Math.random() * ws.length)]; if (w[0] > 0 && w[1] > 0 && w[0] < C - 1 && w[1] < R - 1) g[w[1]][w[0]] = 0; }
    }
    this.wall = g; this.pellets = []; this.total = 0;
    for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) if (g[y][x] === 0 && !(x === 1 && y === 1)) { this.pellets.push({ x, y, got: false, power: Math.random() < 0.05 }); this.total++; }
    this.eaten = 0; this.fear = 0; this.fruit = null; this.fruitT = 6;
    this.pl = { cx: 1, cy: 1, tx: 1, ty: 1, dir: [0, 0], want: [0, 0], moving: false };
    this.guards = []; const ng = Math.min(3, 1 + Math.floor(this.level / 2) + (this.level >= 2 ? 1 : 0));
    for (let i = 0; i < ng; i++) { const p = this._corner(i); this.guards.push({ cx: p[0], cy: p[1], tx: p[0], ty: p[1], dir: [0, 0], moving: false, ch: this.theme.hazards[i % 3] }); }
    this._layout();
  }
  _corner(i) { return [[this.cols - 2, this.rows - 2], [1, this.rows - 2], [this.cols - 2, 1]][i % 3]; }
  _layout() {
    const pad = 8; this.cell = Math.floor(Math.min((this.W - pad * 2) / this.cols, (this.H - pad * 2) / this.rows));
    this.ox = Math.round((this.W - this.cell * this.cols) / 2); this.oy = Math.round((this.H - this.cell * this.rows) / 2);
    const set = o => { o.px = this._px(o.cx); o.py = this._py(o.cy); };
    if (this.pl) set(this.pl); if (this.guards) this.guards.forEach(set);
  }
  _open(x, y) { return x >= 0 && y >= 0 && x < this.cols && y < this.rows && this.wall[y][x] === 0; }
  _px(cx) { return this.ox + cx * this.cell + this.cell / 2; }
  _py(cy) { return this.oy + cy * this.cell + this.cell / 2; }
  _step(o, dt, speed, choose) {
    if (!o.moving) {
      choose(o);
      if ((o.dir[0] || o.dir[1]) && this._open(o.cx + o.dir[0], o.cy + o.dir[1])) { o.tx = o.cx + o.dir[0]; o.ty = o.cy + o.dir[1]; o.moving = true; }
      else { o.dir = [0, 0]; return; }
    }
    const tx = this._px(o.tx), ty = this._py(o.ty), dx = tx - o.px, dy = ty - o.py, step = speed * dt;
    if (Math.hypot(dx, dy) <= step) { o.px = tx; o.py = ty; o.cx = o.tx; o.cy = o.ty; o.moving = false; }
    else { o.px += Math.sign(dx) * Math.min(step, Math.abs(dx)); o.py += Math.sign(dy) * Math.min(step, Math.abs(dy)); }
  }
  update(dt) {
    if (this.keys['arrowleft'] || this.keys['a']) this.pl.want = [-1, 0];
    else if (this.keys['arrowright'] || this.keys['d']) this.pl.want = [1, 0];
    else if (this.keys['arrowup'] || this.keys['w']) this.pl.want = [0, -1];
    else if (this.keys['arrowdown'] || this.keys['s']) this.pl.want = [0, 1];
    if (this.pointer.down) { const dx = this.pointer.x - this.pl.px, dy = this.pointer.y - this.pl.py; if (Math.max(Math.abs(dx), Math.abs(dy)) > this.cell * 0.3) { if (Math.abs(dx) > Math.abs(dy)) this.pl.want = [Math.sign(dx), 0]; else this.pl.want = [0, Math.sign(dy)]; } }
    this._step(this.pl, dt, Math.max(90, this.cell * 5.2), (o) => {
      if ((o.want[0] || o.want[1]) && this._open(o.cx + o.want[0], o.cy + o.want[1])) o.dir = o.want.slice();
      else if (!(o.dir[0] || o.dir[1]) || !this._open(o.cx + o.dir[0], o.cy + o.dir[1])) o.dir = [0, 0];
    });
    this.fear = Math.max(0, this.fear - dt);
    const gsp = Math.max(70, this.cell * (3.5 + this.level * 0.14));
    for (const gd of this.guards) this._step(gd, dt, gsp, (o) => this._guardDir(o));
    for (const p of this.pellets) if (!p.got && p.x === this.pl.cx && p.y === this.pl.cy) {
      p.got = true; this.eaten++; this.burst(this.pl.px, this.pl.py, this.theme.accent, 5);
      if (p.power) { this.fear = 6; this.grantPower('shield'); this.float(this.pl.px, this.pl.py, 'Cloak!', POWERS.shield.color); }
      else { this.sound.coin(); this.hitCombo(this.pl.px, this.pl.py, 3); }
    }
    // bonus fruit — appears for a limited time at a random open cell, worth a lot
    this.fruitT -= dt;
    if (!this.fruit && this.fruitT <= 0) { const open = []; for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) if (this.wall[y][x] === 0 && !(x === this.pl.cx && y === this.pl.cy)) open.push([x, y]); if (open.length) { const p = open[Math.floor(Math.random() * open.length)]; this.fruit = { x: p[0], y: p[1], life: 6 }; } }
    if (this.fruit) { this.fruit.life -= dt; if (this.fruit.life <= 0) this.fruit = null; else if (this.fruit.x === this.pl.cx && this.fruit.y === this.pl.cy) { this.sound.power(); this.confetti(this.pl.px, this.pl.py); this.hitCombo(this.pl.px, this.pl.py, 25); this.fruit = null; this.fruitT = 9 + Math.random() * 5; } }
    for (const gd of this.guards) if (Math.hypot(gd.px - this.pl.px, gd.py - this.pl.py) < this.cell * 0.72) {
      if (this.fear > 0) { this.sound.power(); this.hitCombo(gd.px, gd.py, 15); this.burst(gd.px, gd.py, this.theme.accent, 16); const p = this._corner(0); gd.cx = gd.tx = p[0]; gd.cy = gd.ty = p[1]; gd.moving = false; gd.px = this._px(p[0]); gd.py = this._py(p[1]); }
      else { this.burst(this.pl.px, this.pl.py, '#ff4f6d', 16); this.loseLife(); this._respawn(); return; }
    }
    if (this.eaten >= this.total) { this.level++; this.addScore(150); this.confetti(this.W / 2, this.H * 0.4); this._gen(); }
  }
  _guardDir(o) {
    const opts = [];
    for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (this._open(o.cx + d[0], o.cy + d[1])) { if ((o.dir[0] || o.dir[1]) && d[0] === -o.dir[0] && d[1] === -o.dir[1]) continue; opts.push(d); }
    if (!opts.length) { o.dir = [-o.dir[0], -o.dir[1]]; return; }
    let pick = opts[Math.floor(Math.random() * opts.length)];
    if (Math.random() < 0.75) {
      let best = null, bv = this.fear > 0 ? -1 : 1e9;
      for (const d of opts) { const dist = Math.abs(o.cx + d[0] - this.pl.cx) + Math.abs(o.cy + d[1] - this.pl.cy); if (this.fear > 0 ? (best === null || dist > bv) : (dist < bv)) { bv = dist; best = d; } }
      if (best) pick = best;
    }
    o.dir = pick;
  }
  _respawn() {
    this.pl.cx = this.pl.tx = 1; this.pl.cy = this.pl.ty = 1; this.pl.dir = [0, 0]; this.pl.want = [0, 0]; this.pl.moving = false; this.pl.px = this._px(1); this.pl.py = this._py(1);
    this.guards.forEach((gd, i) => { const p = this._corner(i); gd.cx = gd.tx = p[0]; gd.cy = gd.ty = p[1]; gd.moving = false; gd.dir = [0, 0]; gd.px = this._px(p[0]); gd.py = this._py(p[1]); });
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.sky();
    const bx = this.ox - this.cell * 0.4, by = this.oy - this.cell * 0.4, bw = this.cell * this.cols + this.cell * 0.8, bh = this.cell * this.rows + this.cell * 0.8;
    c.fillStyle = this.theme.dark ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.35)'; rr2(c, bx, by, bw, bh, 14); c.fill();
    c.fillStyle = this.theme.dark ? 'rgba(130,100,210,.30)' : 'rgba(255,255,255,.72)';
    for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) if (this.wall[y][x] === 0) { const px = this.ox + x * this.cell, py = this.oy + y * this.cell; rr2(c, px + 2, py + 2, this.cell - 4, this.cell - 4, 5); c.fill(); }
    for (const p of this.pellets) { if (p.got) continue; const px = this._px(p.x), py = this._py(p.y);
      if (p.power) { c.save(); c.shadowColor = POWERS.shield.color; c.shadowBlur = 12; this.glyph(this.theme.items[0], px, py, this.cell * 0.66 * (1 + Math.sin(this.time * 5) * 0.08)); c.restore(); }
      else { c.fillStyle = this.theme.accent; c.beginPath(); c.arc(px, py, Math.max(2, this.cell * 0.11), 0, 7); c.fill(); } }
    if (this.fruit) { c.save(); c.globalAlpha = this.fruit.life < 1.5 ? (0.4 + 0.6 * Math.abs(Math.sin(this.time * 8))) : 1; c.shadowColor = '#ffd166'; c.shadowBlur = 14; this.glyph('🍒', this._px(this.fruit.x), this._py(this.fruit.y), this.cell * 0.8 * (1 + Math.sin(this.time * 4) * 0.06)); c.restore(); }
    for (const gd of this.guards) { c.save(); if (this.fear > 0) c.globalAlpha = 0.85; this.glyph(this.fear > 0 ? '😱' : gd.ch, gd.px, gd.py, this.cell * 0.95); c.restore(); }
    this.hero(this.pl.px, this.pl.py, this.cell * 1.55, { t: this.time, face: this.pl.dir[0] < 0 ? -1 : 1, expr: this.fear > 0 ? 'wow' : 'smile' });
    this.drawFx(); c.restore();
  }
}

/* ============================================================ MEMORY */

class Memory extends Base {
  instructions() { return 'Flip two cards to find matching pairs. Clear the board before the timer runs out — chain matches for big combos! One golden pair hides a bonus power.'; }
  reset() { this.level = 1; this.timeLeft = 70; this.lives = 999; this.livesEl.innerHTML = '⏱️'; this._clearing = false; this.reveal = 0; this._deal(); }
  onResize() { if (this.cards) this._layout(); }
  _deal() {
    const pairs = Math.min(12, 4 + this.level), syms = this.theme.items, bonusIdx = Math.floor(Math.random() * pairs), deck = [];
    for (let i = 0; i < pairs; i++) { const s = syms[i % syms.length], bonus = i === bonusIdx; deck.push({ s, bonus }, { s, bonus }); }
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    this.cards = deck.map(d => ({ s: d.s, bonus: d.bonus, flip: 0, face: false, done: false })); this.pairs = pairs; this.matched = 0; this.first = null; this.lock = 0; this._pending = null; this._layout();
  }
  _layout() {
    const n = this.cards.length; this.cols = Math.min(6, Math.max(2, Math.round(Math.sqrt(n * this.W / (this.H * 0.8))))); this.rows = Math.ceil(n / this.cols);
    const top = this.H * 0.22, availH = this.H * 0.74, availW = this.W * 0.92, gap = Math.max(5, this.W * 0.015);
    this.csz = Math.min((availW - (this.cols - 1) * gap) / this.cols, (availH - (this.rows - 1) * gap) / this.rows); this.gap = gap;
    const gw = this.cols * this.csz + (this.cols - 1) * gap, gh = this.rows * this.csz + (this.rows - 1) * gap;
    this.gx = (this.W - gw) / 2; this.gy = top + (availH - gh) / 2;
    this.cards.forEach((cd, i) => { const r = Math.floor(i / this.cols), col = i % this.cols; cd.px = this.gx + col * (this.csz + gap) + this.csz / 2; cd.py = this.gy + r * (this.csz + gap) + this.csz / 2; });
  }
  _hit(x, y) { for (const cd of this.cards) if (!cd.done && Math.abs(x - cd.px) < this.csz / 2 && Math.abs(y - cd.py) < this.csz / 2) return cd; return null; }
  _bonus(cd) {
    const types = ['x2', 'slow', 'shield', 'magnet'], type = types[Math.floor(Math.random() * types.length)];
    this.grantPower(type);
    if (type === 'magnet') { this.reveal = 1.1; for (const c2 of this.cards) if (!c2.done) c2.face = true; this.float(cd.px, cd.py - this.csz * 0.6, 'Peek!', POWERS.magnet.color); }
    if (type === 'shield') this.float(cd.px, cd.py - this.csz * 0.6, 'Safety Net!', POWERS.shield.color);
  }
  update(dt) {
    for (const cd of this.cards) { const tgt = (cd.face || cd.done) ? 1 : 0; cd.flip += (tgt - cd.flip) * Math.min(1, dt * 12); }
    if (this._clearing) { this.clearT -= dt; if (this.clearT <= 0) { this._deal(); this._clearing = false; } return; }
    if (this.reveal > 0) { this.reveal -= dt; if (this.reveal <= 0) for (const c2 of this.cards) if (!c2.done) c2.face = false; }
    this.timeLeft -= dt; if (this.timeLeft <= 0) { this.timeLeft = 0; return this.showOver(); }
    this.comboEl.textContent = Math.ceil(this.timeLeft) + 's';
    this.lock = Math.max(0, this.lock - dt);
    if (this.lock <= 0 && this._pending) { this._pending.forEach(cd => cd.face = false); this._pending = null; }
    if (this.pointer.tapped && this.lock <= 0 && this.reveal <= 0) {
      const cd = this._hit(this.pointer.x, this.pointer.y);
      if (cd && !cd.done && !cd.face) {
        cd.face = true; this.sound.blip(520, 0.06, 'sine', 0.12);
        if (!this.first) this.first = cd;
        else if (this.first !== cd) {
          if (this.first.s === cd.s) {
            cd.done = this.first.done = true; this.matched++; this.sound.coin(); this.hitCombo(cd.px, cd.py, 8); this.burst(cd.px, cd.py, this.theme.accent, 12); this.timeLeft = Math.min(99, this.timeLeft + 2.5);
            if (cd.bonus) this._bonus(cd);
            this.first = null;
            if (this.matched >= this.pairs) { this.level++; this.addScore(120); this.confetti(this.W / 2, this.H * 0.5); this._clearing = true; this.clearT = 1.1; }
          } else if (this.powers.shield) { delete this.powers.shield; this.sound.blip(300, 0.2, 'sine', 0.2); this.ring(cd.px, cd.py, POWERS.shield.color); this.float(cd.px, cd.py - this.csz * 0.6, 'Saved!', POWERS.shield.color); this._pending = [this.first, cd]; this.lock = 0.5; this.first = null;
          } else { this._pending = [this.first, cd]; this.lock = 0.8; this.combo = 0; this.mult = 1; this.comboEl.textContent = ''; this.sound.blip(200, 0.12, 'sine', 0.1); this.first = null; }
        }
      }
    }
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(0);
    this.hero(this.W / 2, this.H * 0.12, Math.max(56, this.W * 0.17), { t: this.time, expr: 'smile' });
    for (const cd of this.cards) {
      const f = Math.min(1, Math.max(0, cd.flip)), a = f * Math.PI, sx = Math.max(0.05, Math.abs(Math.cos(a))), front = Math.cos(a) < 0, s = this.csz;
      c.save(); c.translate(cd.px, cd.py); c.scale(sx, 1); if (cd.done) c.globalAlpha = 0.5;
      if (front) { c.fillStyle = this.theme.dark ? 'rgba(255,255,255,.94)' : '#ffffff'; rr2(c, -s / 2, -s / 2, s, s, s * 0.16); c.fill();
        if (cd.bonus) { c.save(); c.strokeStyle = '#ffd166'; c.lineWidth = 3; c.shadowColor = '#ffd166'; c.shadowBlur = 10; rr2(c, -s / 2 + 3, -s / 2 + 3, s - 6, s - 6, s * 0.13); c.stroke(); c.restore(); }
        this.glyph(cd.s, 0, 0, s * 0.6); }
      else { c.fillStyle = this.theme.primary; rr2(c, -s / 2, -s / 2, s, s, s * 0.16); c.fill(); c.strokeStyle = this.theme.accent; c.lineWidth = 2; rr2(c, -s / 2 + 4, -s / 2 + 4, s - 8, s - 8, s * 0.12); c.stroke(); c.globalAlpha = 0.5; this.glyph('✨', 0, 0, s * 0.34); }
      c.restore(); c.globalAlpha = 1;
    }
    this.drawFx(); c.restore();
  }
}

/* ============================================================ STACKER */

class Stacker extends Base {
  instructions() { return 'Tap / Space to drop each block onto the stack. Overhang is sliced off — nail perfect drops to stay wide and build sky-high!'; }
  reset() { this.bh = Math.max(22, this.H * 0.052); this.bw0 = this.W * 0.44; this.tower = [{ x: this.W / 2, w: this.bw0 }]; this.slices = []; this.camY = 0; this.perfectStreak = 0; this.lives = 3; this.drawLives(); this._spawn(); }
  _spawn() { const top = this.tower[this.tower.length - 1]; const from = Math.random() < 0.5 ? -1 : 1; this.cur = { w: top.w, x: from < 0 ? top.w / 2 : this.W - top.w / 2, dir: from < 0 ? 1 : -1 }; this.speed = Math.min(this.W * 1.15, Math.max(150, this.W * 0.55) + this.tower.length * 7); }
  _screenY(level) { return this.groundY - level * this.bh + this.camY; }
  _col(i) { return `hsl(${(i * 16 + 200) % 360},68%,${this.theme.dark ? 60 : 66}%)`; }
  update(dt) {
    this.groundY = this.H - this.bh * 1.4;
    const topLevel = this.tower.length - 1, naturalTop = this.groundY - topLevel * this.bh, targetCam = this.H * 0.42 - naturalTop;
    this.camY += (targetCam - this.camY) * Math.min(1, dt * 4);
    const c = this.cur; c.x += c.dir * this.speed * dt;
    // gusts of wind kick in high up — nudge the sliding block for extra challenge
    if (this.tower.length >= 8) c.x += Math.sin(this.time * 1.7) * this.W * 0.06 * dt * (this.tower.length - 7);
    if (c.x > this.W - c.w / 2) { c.x = this.W - c.w / 2; c.dir = -1; } if (c.x < c.w / 2) { c.x = c.w / 2; c.dir = 1; }
    if (this.pointer.tapped || this.keys[' ']) { this.keys[' '] = false; this._drop(); }
    for (const s of this.slices) { s.vy += 900 * dt; s.y += s.vy * dt; s.life -= dt; s.rot = (s.rot || 0) + (s.vr || 0) * dt; }
    this.slices = this.slices.filter(s => s.life > 0);
  }
  _drop() {
    const top = this.tower[this.tower.length - 1], c = this.cur;
    const left = Math.max(c.x - c.w / 2, top.x - top.w / 2), right = Math.min(c.x + c.w / 2, top.x + top.w / 2), overlap = right - left, dropY = this._screenY(this.tower.length);
    if (overlap <= 0) { this.slices.push({ x: c.x, w: c.w, y: dropY, vy: -30, vr: (Math.random() - .5) * 6, rot: 0, life: 1.6, color: this._col(this.tower.length) }); this.shake = 1; this.perfectStreak = 0; this.combo = 0; this.mult = 1; this.comboEl.textContent = ''; this.loseLife(); if (this.lives > 0) this._spawn(); return; }
    const perfect = Math.abs(c.x - top.x) < Math.max(5, this.bw0 * 0.03);
    let nw, nx;
    if (perfect) {
      this.perfectStreak++; nw = this.perfectStreak >= 3 ? Math.min(this.bw0, c.w + this.bh * 0.5) : c.w; nx = top.x;
      this.sound.power(); this.float(top.x, dropY - this.bh, this.perfectStreak > 1 ? `PERFECT ×${this.perfectStreak}` : 'PERFECT', this.theme.accent); this.hitCombo(top.x, dropY, 10);
    } else {
      this.perfectStreak = 0; this.combo = 0; this.mult = 1; this.comboEl.textContent = ''; nw = overlap; nx = (left + right) / 2;
      if (c.x < top.x) { const ow = (c.x + c.w / 2) - right; if (ow > 0) this.slices.push({ x: right + ow / 2, w: ow, y: dropY, vy: 0, vr: 6, rot: 0, life: 1.6, color: this._col(this.tower.length) }); }
      else { const ow = left - (c.x - c.w / 2); if (ow > 0) this.slices.push({ x: (c.x - c.w / 2) - ow / 2, w: ow, y: dropY, vy: 0, vr: -6, rot: 0, life: 1.6, color: this._col(this.tower.length) }); }
      this.sound.coin(); this.addScore(5); this.burst(nx, dropY, this.theme.accent, 6);
    }
    this.tower.push({ x: nx, w: nw }); this._spawn();
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(this.tower.length * 0.4);
    for (let i = 0; i < this.tower.length; i++) { const b = this.tower[i], y = this._screenY(i); if (y > this.H + this.bh || y < -this.bh) continue;
      c.fillStyle = this._col(i); c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 2; rr2(c, b.x - b.w / 2, y - this.bh, b.w, this.bh, 6); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(b.x - b.w / 2 + 3, y - this.bh + 3, b.w - 6, this.bh * 0.22); }
    for (const s of this.slices) { c.save(); c.globalAlpha = Math.max(0, s.life / 1.6); c.translate(s.x, s.y - this.bh / 2); c.rotate(s.rot || 0); c.fillStyle = s.color; rr2(c, -s.w / 2, -this.bh / 2, s.w, this.bh, 5); c.fill(); c.restore(); }
    c.globalAlpha = 1;
    const cy = this._screenY(this.tower.length), cur = this.cur;
    c.fillStyle = this._col(this.tower.length); c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 2; rr2(c, cur.x - cur.w / 2, cy - this.bh, cur.w, this.bh, 6); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(cur.x - cur.w / 2 + 3, cy - this.bh + 3, cur.w - 6, this.bh * 0.22);
    const top = this.tower[this.tower.length - 1], ty = this._screenY(this.tower.length - 1);
    this.hero(top.x, ty - this.bh - Math.max(20, this.W * 0.06), Math.max(52, this.W * 0.15), { t: this.time, expr: 'smile' });
    this.drawFx(); c.restore();
  }
}

function rr2(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

/* ============================================================ Entry */

const MODES = { runner: Runner, flappy: Flappy, platformer: Platformer, dodger: Dodger, shooter: Shooter, whack: Whack, match3: Match3, serve: Serve, maze: Maze, memory: Memory, stacker: Stacker };
const sound = new Sound();
let current = null;

export function startGame(mount, game) {
  if (!mount || !game) return;
  if (current) { try { current.destroy(); } catch (e) {} current = null; }
  const theme = themeFor(game);
  sprites.get(theme.slug);                       // warm sprite cache
  const Cls = MODES[modeFor(game)] || Dodger;
  current = new Cls(mount, game, theme, sound);
  return current;
}
export { themeFor, modeFor };
