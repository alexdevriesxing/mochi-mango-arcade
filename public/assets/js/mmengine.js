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
import { sprites, atlases, atlasFrame, drawVectorChar, speciesOf, shade, tint } from './mmchar.js';
import { createBoardArena } from './boardgames.js';

/* ============================================================ Theme */

const UNIVERSE = {
  cozyverse:  { primary: '#ff8eb3', accent: '#ffd166', belly: '#fff0f6', sky: ['#ffe9f2', '#ffd0e2'], ground: '#8bd17c', dark: false, scene: 'meadow' },
  astromochi: { primary: '#8a5cff', accent: '#25d8ff', belly: '#d9ccff', sky: ['#160f38', '#3a2a7a'], ground: '#3a2f66', dark: true,  scene: 'space' },
  ninegates:  { primary: '#19c39c', accent: '#f7c948', belly: '#d8fff4', sky: ['#0a5c4d', '#0fbf9f'], ground: '#0b8f78', dark: true,  scene: 'temple' },
  snackstreet:{ primary: '#ff6b35', accent: '#ffd100', belly: '#ffe4c9', sky: ['#2a1030', '#7a2a52'], ground: '#3a2138', dark: true,  scene: 'city' },
  oracle:     { primary: '#a24dff', accent: '#ff4f9a', belly: '#e9d6ff', sky: ['#140a2e', '#3a1060'], ground: '#241246', dark: true,  scene: 'night' },
  retroverse:  { primary: '#ff3cac', accent: '#39ffde', belly: '#ffebf5', sky: ['#0a0520', '#2a1050'], ground: '#1a0d3a', dark: true,  scene: 'retro' },
  standalone: { primary: '#ffbd2e', accent: '#ff4f9a', belly: '#fff2cf', sky: ['#fff2d6', '#ffd9e6'], ground: '#7fd6c2', dark: false, scene: 'candy' }
};

const ITEMS = {
  cozyverse: ['🍓', '🍯', '🌸', '🍄', '🌰'], astromochi: ['⭐', '🪐', '🌟', '☄️', '🛸'],
  ninegates: ['🀄', '🏮', '🪙', '🎋', '🥮'], snackstreet: ['🍜', '🍔', '🍤', '🌮', '🧋'],
  oracle: ['🔮', '🌙', '🃏', '✨', '🕯️'], retroverse: ['🕹️', '👾', '💾', '📼', '🖲️'],
  standalone: ['🍬', '🍭', '⭐', '🎈', '🧁']
};
const HAZ = {
  cozyverse: ['🐝', '🌧️', '🪨'], astromochi: ['☄️', '👾', '🌑'], ninegates: ['💣', '🐍', '🌩️'],
  snackstreet: ['🌶️', '🔥', '💣'], oracle: ['💀', '🕷️', '⚡'], retroverse: ['💥', '⚡', '📟'],
  standalone: ['💣', '🌩️', '🪨']
};

const EXPLICIT_MODES = new Set([
  'sports', 'racing', 'breakout', 'snake', 'rhythm', 'tower', 'pinball',
  'fishing', 'archery', 'pong', 'bubbleshooter', 'cannon', 'merge', 'helix',
  'doodlejump', 'asteroids', 'pipeline', 'gallery', 'idleclicker', 'flappy',
  'platformer', 'shooter', 'whack', 'match3', 'serve', 'maze', 'memory',
  'stacker', 'dodger', 'board',
]);

function themeFor(g) {
  const u = UNIVERSE[g.universe] || UNIVERSE.standalone;
  return { ...u, items: ITEMS[g.universe] || ITEMS.standalone, hazards: HAZ[g.universe] || HAZ.standalone,
    slug: (g.mascot || g.title).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    species: speciesOf(g.mascot + ' ' + g.title) };
}

function modeFor(g) {
  // read title + slug too, so genre-generic games still play their real genre
  const s = (g.genre + ' ' + g.engine + ' ' + (g.title || '') + ' ' + (g.slug || '')).toLowerCase();
  if (EXPLICIT_MODES.has(g.engine)) return g.engine;
  if (/(soccer|football|kick|penalty|goal|sport|basketball|hoop|penalty|score|shoot-out|stadium|league|club|team)/.test(s)) return 'sports';
  if (/(racing|racer|driv|kart|speed|grand.prix|circuit|track|\bdrag\b|drift|moto|\bcar\b|vehicle|wheels|race|derby)/.test(s)) return 'racing';
  if (/(breakout|brick|smash|block.blast|blocky|bouncer|paddle|wall.break|brick.break)/.test(s)) return 'breakout';
  if (/(snake|slither|serpent|worm|noodle|crawler|coil|conda)/.test(s)) return 'snake';
  if (/(rhythm|beat|dance|music|tempo|groove|jam|jukebox|drumline|drum|bongo|concert|melody|tune|harmony|band)/.test(s)) return 'rhythm';
  if (/(tower|defense|defence|guard|fortress|castle.defense|wave|siege|bastion|warden)/.test(s)) return 'tower';
  if (/(pinball|flipper|bumper|arcade.ball|plunger|tilt)/.test(s)) return 'pinball';
  if (/(fish|fishing|angle|angler|cast|reel|hook|pond|lake|tide|aquarium|ocean|whale|submarine|deep)/.test(s)) return 'fishing';
  if (/(pong|tennis|paddle|racket|ping.pong|table.tennis)/.test(s)) return 'pong';
  if (/(bubble|pop|shoot.bubble|burst|color.match|balloon)/.test(s)) return 'bubbleshooter';
  if (/(cannon|artillery|launch|projectile|catapult|mortar|howitzer)/.test(s)) return 'cannon';
  if (/(merge|2048|combine|grow|evolve|synthesize|fuse|combine.tile)/.test(s)) return 'merge';
  if (/(helix|spiral|spin|fall|descent|tunnel|vortex|whirl|rotating)/.test(s)) return 'helix';
  if (/(doodle|doodle.jump|bounce.up|spring|jump.climb|vertical.climb|ascend|flap.up)/.test(s)) return 'doodlejump';
  if (/(asteroid|space.shoot|meteor|alien.invader|space.battle|cosmic|shooter.space)/.test(s)) return 'asteroids';
  if (/(pipe|pipeline|connect|plumb|flow|route|tube|pipe.puzzle|water.pipe)/.test(s)) return 'pipeline';
  if (/(gallery|shooting.gallery|shoot.gallery|target.range|aim.bonus|sharpshooter|fair.shoot)/.test(s)) return 'gallery';
  if (/(idle|clicker|tap|farm|mine|earn|incremental|collect|grind|tapper|auto.click)/.test(s)) return 'idleclicker';
  if (/(archery|arrow|bow|target|aim|bullseye|dart|crossbow|sharpshoot|hunter|snipe)/.test(s)) return 'archery';
  if (/(parcel|kite|airlift|balloon|glide|flight|flying|aerial|paraglide|sky-diner|sky diner)/.test(s)) return 'flappy';
  if (/(maze|labyrinth|heist)/.test(s)) return 'maze';
  if (/(memory|mirror|hidden|detective|solitaire|concentration|mooncat|tarot|matching)/.test(s)) return 'memory';
  if (/(\bstack\b|\bfort\b|blanket|pillow|sleepover|snowflake|honey-rescue)/.test(s)) return 'stacker';
  if (/(defen|patrol|survival|boss|arena|shooter|bullet|battler|tactic)/.test(s)) return 'shooter';
  if (/(whack|reaction|coordination|emergency|reflex|cleanup)/.test(s)) return 'whack';
  if (/(match|tile|mahjong|sort|flow|logic|gravity|deduction|slide)/.test(s)) return 'match3';
  if (/(manage|cook|serv|shop|hotel|tavern|farm|sim|cafe|kitchen|bakery|time management|market|salon|dress|diner|restaurant)/.test(s)) return 'serve';
  if (/(platform|jump|hop|bounce|climb|parkour|wall)/.test(s)) return 'platformer';
  if (/(runner|lane|dash|sprint|drift|run)/.test(s)) return 'runner';
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
  slow:   { icon: '🐌', color: '#8affc1', dur: 6, tip: 'Slow-mo' },
  bomb:   { icon: '💣', color: '#ff6b35', dur: 0.1, tip: 'Bomb' },
  freeze: { icon: '❄️', color: '#7fd6ff', dur: 5, tip: 'Freeze' },
  mega:   { icon: '🌟', color: '#ffd166', dur: 6, tip: 'Mega Mode' },
  rush:   { icon: '🚀', color: '#ff4f9a', dur: 5, tip: 'Speed Rush' }
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
    this.scroll = 0; this._timers = [];
    this.rewardUsed = false; this.rewardPending = false;
    this._resumeAfterReward = false; this._armedBoost = null; this._selectedBoostId = 'mode-special';
    this.challenge = ['cozy', 'arcade', 'legend'].includes(localStorage.getItem(`mma_challenge_${game.slug}`))
      ? localStorage.getItem(`mma_challenge_${game.slug}`) : 'arcade';
    this._build();
    this._rewardPendingHandler = (event) => {
      if (!this._matchesReward(event.detail)) return;
      this.rewardPending = true;
      this._resumeAfterReward = this.running;
      this.running = false;
      this._updateRewardMenu('pending', 'Sponsor opened. Return after the short visit to arm your boost.');
    };
    this._rewardGrantedHandler = (event) => {
      if (!this._matchesReward(event.detail)) return;
      this.armReward(event.detail);
    };
    this._rewardBlockedHandler = (event) => {
      if (!this._matchesReward(event.detail)) return;
      this.rewardPending = false;
      this.running = this._resumeAfterReward && !this.over;
      this.last = performance.now();
      const reason = event.detail?.reason;
      this._updateRewardMenu('blocked', reason === 'popup-blocked'
        ? 'Pop-up blocked. Allow sponsor pop-ups, or play normally.'
        : 'Boost was not unlocked. You can retry or play normally.');
    };
    this._rewardProgressHandler = (event) => {
      if (!this._matchesReward(event.detail)) return;
      const seconds = Math.max(1, Math.ceil((event.detail?.remainingMs || 0) / 1000));
      this._updateRewardMenu('pending', `Almost there — keep the sponsor page open about ${seconds}s longer, then return.`);
    };
    addEventListener('mma:reward-pending', this._rewardPendingHandler);
    addEventListener('mma:reward-granted', this._rewardGrantedHandler);
    addEventListener('mma:reward-blocked', this._rewardBlockedHandler);
    addEventListener('mma:reward-progress', this._rewardProgressHandler);
    const restoredBoost = window.MochiMangoRewards?.peekReady?.(this.game.slug);
    if (restoredBoost) this.armReward(restoredBoost, true);
  }

  _build() {
    this.mount.innerHTML = ''; this.mount.classList.add('mma-stage');
    this.canvas = document.createElement('canvas'); this.canvas.className = 'mma-canvas';
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('role', 'application');
    this.canvas.setAttribute('aria-label', `${this.game.title}. ${this.instructions()} Press F for fullscreen.`);
    this.ctx = this.canvas.getContext('2d'); this.mount.appendChild(this.canvas);

    this.hud = document.createElement('div'); this.hud.className = 'mma-hud';
    this.hud.setAttribute('role', 'status'); this.hud.setAttribute('aria-label', 'Game status');
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
      if (k === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey && !/input|textarea|select/i.test(document.activeElement?.tagName || '')) {
        e.preventDefault();
        if (document.fullscreenElement) document.exitFullscreen?.();
        else this.mount.requestFullscreen?.();
      }
      if ((!this.started || this.over) && (k === ' ' || k === 'enter')) this.start(Boolean(this._armedBoost));
    });
    addEventListener('keyup', this._ku = (e) => { this.keys[e.key.toLowerCase()] = false; });

    const rect = () => this.canvas.getBoundingClientRect();
    this.canvas.addEventListener('pointerdown', (e) => {
      const r = rect(); this.pointer.x = e.clientX - r.left; this.pointer.y = e.clientY - r.top;
      this.pointer.down = true; this.pointer.tapped = true; this.sound.ensure(); this.canvas.focus({ preventScroll: true });
      if (!this.started || this.over) this.start(Boolean(this._armedBoost));
      if (this.running && this._pointerDown) this._pointerDown(this.pointer.x, this.pointer.y, e);
    });
    this.canvas.addEventListener('pointermove', (e) => {
      const r = rect(); this.pointer.x = e.clientX - r.left; this.pointer.y = e.clientY - r.top;
      if (this._pointerMove) this._pointerMove(this.pointer.x, this.pointer.y, e);
    });
    addEventListener('pointerup', this._pu = (e) => {
      if (this.pointer.down && this._pointerUp) this._pointerUp(this.pointer.x, this.pointer.y, e);
      this.pointer.down = false;
    });
    addEventListener('fullscreenchange', this._fs = () => this._resize());

    this.showPreroll();
  }

  _resize() {
    const previousW = this.W, previousH = this.H;
    const w = this.mount.clientWidth || 360, h = this.mount.clientHeight || Math.round(w * 1.2);
    this.W = w; this.H = h;
    this.canvas.width = Math.round(w * this.dpr); this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.started && !this.over && previousW && previousH) this._preserveRunOnResize(previousW, previousH);
    else if (this.onResize) this.onResize(previousW, previousH);
  }

  _preserveRunOnResize(previousW, previousH) {
    const sx = this.W / previousW, sy = this.H / previousH, ss = Math.min(sx, sy);
    if (!Number.isFinite(sx) || !Number.isFinite(sy) || (Math.abs(sx - 1) < 0.001 && Math.abs(sy - 1) < 0.001)) return;

    if (modeFor(this.game) === 'snake') {
      this.cell = Math.max(16, Math.min(this.W, this.H) / 18);
      this.cols = Math.max(8, Math.floor(this.W / this.cell));
      this.rows = Math.max(8, Math.floor(this.H / this.cell));
      const clampCell = (cell) => {
        if (!cell) return;
        cell.x = Math.max(0, Math.min(this.cols - 1, Math.round(cell.x)));
        cell.y = Math.max(0, Math.min(this.rows - 1, Math.round(cell.y)));
      };
      (this.snake || []).forEach(clampCell); clampCell(this.food); clampCell(this.powerFood); (this.gates || []).forEach(clampCell);
      return;
    }

    const visited = new WeakSet();
    const scaleState = (value, depth = 0) => {
      if (!value || typeof value !== 'object' || visited.has(value) || depth > 3) return;
      visited.add(value);
      if (Number.isFinite(value.x)) value.x *= sx;
      if (Number.isFinite(value.y)) value.y *= sy;
      if (Number.isFinite(value.px)) value.px *= sx;
      if (Number.isFinite(value.py)) value.py *= sy;
      if (Number.isFinite(value.vx)) value.vx *= sx;
      if (Number.isFinite(value.vy)) value.vy *= sy;
      if (Number.isFinite(value.w)) value.w *= sx;
      if (Number.isFinite(value.h)) value.h *= sy;
      if (Number.isFinite(value.r)) value.r *= ss;
      if (Number.isFinite(value.s)) value.s *= ss;
      if (Number.isFinite(value.size)) value.size *= ss;
      if (Number.isFinite(value.maxR)) value.maxR *= ss;
      if (Number.isFinite(value.range)) value.range *= ss;
      if (Number.isFinite(value.speed)) value.speed *= ss;
      for (const child of Object.values(value)) if (child && typeof child === 'object') scaleState(child, depth + 1);
    };
    [
      this.p, this.pl, this.player, this.ship, this.ball, this.hook, this.arrow, this.target, this.goalie,
      this.paddle, this.ai, this.spinner, this.obs, this.foes, this.enemies, this.targets, this.coins,
      this.pu, this.pellets, this.towers, this.bubbles, this.pipes, this.fish, this.notes, this.bricks,
      this.balls, this.platforms, this.cards, this.orders, this.queue, this.path, this.bumpers, this.falling,
      this.bullets, this.ballTrail, this.sparks, this.ripples, this.arrowsHit, this.hitRings, this.particles,
      this.floats, this.rings, this.weather,
    ].forEach((value) => scaleState(value));

    for (const key of ['cx', 'goalL', 'goalR', 'goalW', 'trackW', 'flipLx', 'flipRx', 'flipLen', 'pw', 'ox']) {
      if (Number.isFinite(this[key])) this[key] *= sx;
    }
    for (const key of ['cy', 'goalY', 'waterLine', 'flipY', 'gy', 'groundY', 'oy']) {
      if (Number.isFinite(this[key])) this[key] *= sy;
    }
    if (Number.isFinite(this.trackR)) this.trackR *= ss;
    if (Number.isFinite(this.maxSpeed)) this.maxSpeed *= ss;
    if (typeof this.onPreservedResize === 'function') this.onPreservedResize(previousW, previousH);
  }

  boostOptions() {
    return [
      { id: 'mode-special', icon: '⚡', name: 'Signature boost', description: this.rewardLabel() },
      { id: 'guardian', icon: '🛡️', name: 'Guardian start', description: 'Extra life + 18-second shield' },
      { id: 'score-spark', icon: '✨', name: 'Score spark', description: '20 seconds of double score + 250 points' },
    ];
  }
  /**
   * Sponsored slate shown once per game per session, before the start panel.
   *
   * Deliberately not a hard gate: the countdown can be skipped immediately, and
   * anything that goes wrong (no loader, ad blocked, promise never settles)
   * falls through to the normal start panel. A player must never be stuck
   * staring at a broken pre-roll.
   */
  showPreroll() {
    const rewards = window.MochiMangoRewards;
    if (!rewards?.preroll || rewards.prerollShown?.(this.game.slug)) { this.showStart(); return; }

    let done = false;
    const proceed = () => { if (done) return; done = true; this.showStart(); };

    let left = 3;
    this.overlay.innerHTML = `<div class="mma-panel mma-preroll-panel">
      <div class="mma-preroll-kicker">Sponsored break</div>
      <h2>${this.game.title}</h2>
      <p class="mma-preroll-note">Your game starts in <b data-preroll-count>${left}</b>s — ads keep every game free to play.</p>
      <button class="mma-btn mma-btn-secondary" type="button" data-preroll-skip>Skip &amp; play now</button>
    </div>`;
    this.overlay.classList.add('show');
    this.overlay.querySelector('[data-preroll-skip]').onclick = proceed;

    const counter = this.overlay.querySelector('[data-preroll-count]');
    const tick = setInterval(() => {
      left -= 1;
      if (counter) counter.textContent = String(Math.max(0, left));
      if (left <= 0) { clearInterval(tick); proceed(); }
    }, 1000);

    // Belt and braces: if the ad call hangs, the countdown above still starts
    // the game, and this clears the timer either way.
    Promise.resolve(rewards.preroll({ slug: this.game.slug }))
      .catch(() => {})
      .finally(() => { clearInterval(tick); proceed(); });
  }
  showStart() {
    const card=this.game.image||'';
    this.overlay.innerHTML=`<div class="mma-panel mma-start-panel">
      ${card?`<img class="mma-keyart" src="${card}" alt="${this.game.title} key art" decoding="async" onerror="this.remove()">`:''}
      <h2>${this.game.title}</h2><p class="mma-instructions">${this.instructions()}</p>
      <div class="mma-difficulty" aria-label="Challenge level"><span>Challenge</span>
      ${[['cozy','Cozy'],['arcade','Arcade'],['legend','Legend']].map(([id,label])=>`<button type="button" data-challenge="${id}" aria-pressed="${this.challenge===id}" class="${this.challenge===id?'is-selected':''}">${label}</button>`).join('')}</div>
      ${this.rewardMenuMarkup()}
      <button class="mma-btn mma-play-normal" type="button">▶ Play</button>
      <div class="mma-best">Best: ${this.best} · Press F for fullscreen</div></div>`;
    this.overlay.classList.add('show');
    this.overlay.querySelectorAll('[data-challenge]').forEach(button=>button.addEventListener('click',()=>{this.challenge=button.dataset.challenge;localStorage.setItem(`mma_challenge_${this.game.slug}`,this.challenge);this.showStart()}));
    this.bindRewardMenu();
    this.overlay.querySelector('.mma-play-normal').onclick=()=>this.start(Boolean(this._armedBoost));
  }

  /**
   * The pre-game boost offer: pick a boost, watch a sponsor, start armed.
   *
   * Returns nothing when rewards are unavailable (loader blocked, already used
   * this run) so the panel simply falls back to a plain Play button rather than
   * advertising something that cannot be delivered.
   */
  rewardMenuMarkup() {
    if (!window.MochiMangoRewards?.request) return '';
    const armed = this._armedBoost;
    const selected = armed?.boosterId || this._selectedBoostId || 'mode-special';
    const options = this.boostOptions().map((option) => `
      <button type="button" class="mma-boost-choice ${option.id === selected ? 'is-selected' : ''}"
        data-boost="${option.id}" aria-pressed="${option.id === selected}">
        <span class="mma-boost-icon" aria-hidden="true">${option.icon}</span>
        <b>${option.name}</b><small>${option.description}</small>
      </button>`).join('');
    return `<div class="mma-boost-picker">
      <div class="mma-boost-heading"><span>Free boost</span><small>Optional · sponsored</small></div>
      <div class="mma-boost-options">${options}</div>
      <div class="mma-reward-status" data-reward-status>${armed
        ? 'Boost armed. Start whenever you are ready.'
        : 'Pick a boost, visit our sponsor, then return to start armed.'}</div>
      <button class="mma-btn mma-reward-btn" type="button" ${armed ? 'disabled' : ''}>${armed ? 'Boost ready ✓' : 'Unlock selected boost'}</button>
    </div>`;
  }

  /** Wire the boost picker inside whichever overlay is currently shown. */
  bindRewardMenu() {
    this.overlay.querySelectorAll('[data-boost]').forEach((button) => {
      button.addEventListener('click', () => {
        if (this._armedBoost) return;         // already paid for; do not switch under them
        this._selectedBoostId = button.dataset.boost;
        this.overlay.querySelectorAll('[data-boost]').forEach((other) => {
          const on = other === button;
          other.classList.toggle('is-selected', on);
          other.setAttribute('aria-pressed', String(on));
        });
      });
    });
    const unlock = this.overlay.querySelector('.mma-reward-btn');
    if (unlock) unlock.addEventListener('click', () => this.requestReward(unlock, 'start-panel', this._selectedBoostId));
  }
  showOver() {
    if(this.over)return;this.over=true;this.running=false;this.sound.over();
    const outcome=this.outcome||this.raceResult||(this.completed||this.won?'win':'loss');
    const nb=this.score>this.best;if(nb){this.best=Math.floor(this.score);localStorage[this.bestKey]=this.best}
    window.dispatchEvent(new CustomEvent('mma:game-over',{detail:{slug:this.game.slug,score:Math.floor(this.score),combo:this.combo,outcome,challenge:this.challenge,level:this.level,wave:this.wave}}));
    // A fresh run may be armed with a boost, so the reward menu is offered here
    // too -- game over is the moment a player most wants the next run helped.
    this.rewardUsed=false;
    this.overlay.innerHTML=`<div class="mma-panel mma-start-panel"><div class="mma-medal">${nb?'🏆':'⭐'}</div><h2>${nb?'New Best!':outcome==='win'?'Victory!':'Run Complete'}</h2><p class="mma-final">Score <b>${Math.floor(this.score)}</b></p><div class="mma-best">Best: ${this.best}</div>${this.rewardMenuMarkup()}<div class="mma-over-actions"><button class="mma-btn mma-btn-secondary">↻ Play again</button></div></div>`;
    this.overlay.classList.add('show');
    this.bindRewardMenu();
    this.overlay.querySelector('.mma-btn-secondary').onclick=()=>this.start(Boolean(this._armedBoost));
  }

  start(useArmedBoost = false) {
    const armedBoost = useArmedBoost
      ? (this._armedBoost || window.MochiMangoRewards?.peekReady?.(this.game.slug) || null)
      : null;
    this.overlay.classList.remove('show'); this.overlay.innerHTML = '';
    this.score = 0; this.lives = 3; this.over = false; this.outcome = ''; this.started = true; this.running = true;
    this.particles = []; this.floats = []; this.rings = []; this._timers = []; this.time = 0; this.shake = 0;
    this.combo = 0; this.comboT = 0; this.mult = 1; this.powers = {}; this.scroll = 0;
    this.rewardUsed = false; this.rewardPending = false; this._resumeAfterReward = false;
    this.setScore(0); this.drawLives(); this.drawPowers(); this.comboEl.textContent = '';
    if (this.reset) this.reset();
    window.dispatchEvent(new CustomEvent('mma:run-started', { detail: {
      slug: this.game.slug, challenge: this.challenge, boosted: Boolean(armedBoost),
    } }));
    if (armedBoost) {
      this._armedBoost = null;
      this.applyReward(armedBoost);
      this.drawLives(); this.drawPowers();
    }
    this.last = performance.now();
    if (!this._raf) this.loop(this.last);
  }

  loop(now) {
    this._raf = requestAnimationFrame((t) => this.loop(t));
    let dt = (now - this.last) / 1000; this.last = now; if (dt > 0.05) dt = 0.05;
    if (this.powers.slow) dt *= 0.55;
    if (this.powers.freeze) dt *= 0.15;
    if (this.powers.rush) dt *= 1.4;
    if (this.running) { this.time += dt; this.stepMeta(dt); this._updateWeather(dt); this.update(dt); }
    this.render();
    // Board-style modes never draw a hero, so the mascot would be absent
    // entirely. Give those a reacting sidekick instead. The flag is sticky
    // rather than per-frame because some modes (whack) draw their hero only on
    // certain frames, and a per-frame test would flicker the sidekick in and
    // out; the short grace period lets those modes register first.
    if (!this._heroEver && this.time > 0.5) this.sidekick();
    this._drawFlash(); this._drawLevelBanner(); this.pointer.tapped = false;
  }

  stepMeta(dt) {
    for (const timer of this._timers) timer.remaining -= dt;
    const dueTimers = this._timers.filter((timer) => timer.remaining <= 0);
    this._timers = this._timers.filter((timer) => timer.remaining > 0);
    for (const timer of dueTimers) try { timer.callback(); } catch (error) { console.error('Game timer failed', error); }
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
    if (this._rewardPaddleUntil && this.time >= this._rewardPaddleUntil && this.p1 && this.pw) {
      this.p1.w = this.pw;
      this._rewardPaddleUntil = 0;
    }
  }

  difficulty() {
    const smoothRamp = Math.min(1.05, this.time / 75);
    const tierRamp = Math.min(0.35, Math.floor(this.time / 35) * 0.07);
    const challengeFactor = this.challenge === 'cozy' ? 0.82 : this.challenge === 'legend' ? 1.18 : 1;
    return Math.max(0.72, Math.min(2.65, (1 + smoothRamp + tierRamp) * challengeFactor));
  }

  difficultyTier() { return Math.min(5, 1 + Math.floor(this.time / 35)); }

  schedule(delaySeconds, callback) {
    if (typeof callback !== 'function') return;
    this._timers.push({ remaining: Math.max(0, Number(delaySeconds) || 0), callback });
  }

  hitCombo(x, y, base) {
    this.combo++; this.comboT = 2.2;
    this.mult = this.combo >= 12 ? 4 : this.combo >= 6 ? 3 : this.combo >= 3 ? 2 : 1;
    const challengeScore = this.challenge === 'cozy' ? 0.9 : this.challenge === 'legend' ? 1.35 : 1;
    const g = Math.max(1, Math.round(base * this.mult * (this.powers.x2 ? 2 : 1) * challengeScore));
    this.addScore(g);
    if (this.mult > 1) { this.comboEl.textContent = `${this.mult}× combo`; this.sound.combo(this.combo); }
    this.float(x, y, '+' + g, this.theme.accent);
    // Cheer on a multiplier, otherwise a smaller acknowledgement. Frame 0 of the
    // emote row is reliably an upbeat pose across the delivered sheets.
    this.react(this.mult > 1 ? 'emote' : 'action', 0, this.mult > 1 ? 1.1 : 0.6);
    return g;
  }

  setScore(v) { this.score = v; this.scoreEl.textContent = Math.floor(v); }
  addScore(v) { this.setScore(this.score + v); }
  drawLives() { this.livesEl.innerHTML = '❤️'.repeat(Math.max(0, this.lives)); }
  drawPowers() { this.powersEl.innerHTML = Object.keys(this.powers).filter(k=>k!=='bomb').map(k => `<span class="mma-pw" title="${POWERS[k]?.tip || k}">${POWERS[k]?.icon || '⭐'}</span>`).join(''); }
  loseLife() {
    if (this.powers.shield) { delete this.powers.shield; this.ring(this.W / 2, this.H / 2, POWERS.shield.color); this.sound.blip(300, 0.2, 'sine', 0.2); this.shake = 0.5; return; }
    this.lives--; this.drawLives(); this.sound.hit(); this.shake = 1; this.combo = 0; this.mult = 1; this.comboEl.textContent = '';
    // The downcast poses sit at the end of the emote row on these sheets.
    this.react('emote', -1, 1.2);
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

  /* -------- Sidekick mascot --------
   * Board-style modes (match3, merge, board, idleclicker and friends) have no
   * player avatar, so the mascot has nowhere to live inside the play area.
   * Instead it stands beside the board and reacts to what happens: idle by
   * default, celebrating on a scoring combo, dismayed on a lost life.
   * Reactions fire from hitCombo()/loseLife(), which every mode already routes
   * through, so a mode gets this by calling sidekick() in its draw() and
   * nothing else.
   */

  /** Hold a one-off reaction pose for `hold` seconds. */
  react(anim, frame, hold = 0.9) {
    this._reactAnim = anim; this._reactFrame = frame; this._reactUntil = this.time + hold;
  }

  /**
   * How much fine detail sits in a box, in device pixels. Used to tell a busy
   * play area apart from flat background.
   */
  _detailAt(cx, cy, size) {
    const d = this.dpr, cw = this.canvas.width, ch = this.canvas.height;
    const half = (size * d) / 2;
    const x0 = Math.max(0, Math.round(cx * d - half)), y0 = Math.max(0, Math.round(cy * d - half));
    const x1 = Math.min(cw - 1, Math.round(cx * d + half)), y1 = Math.min(ch - 1, Math.round(cy * d + half));
    if (x1 <= x0 || y1 <= y0) return Infinity;
    let px;
    try { px = this.ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data; } catch (e) { return Infinity; }
    const w = x1 - x0;
    let edges = 0, n = 0;
    for (let y = 0; y < y1 - y0; y++) {
      for (let x = 0; x < w - 1; x++) {
        const i = (y * w + x) * 4, j = i + 4; n++;
        if (Math.abs(px[i] - px[j]) + Math.abs(px[i + 1] - px[j + 1]) + Math.abs(px[i + 2] - px[j + 2]) > 60) edges++;
      }
    }
    return edges / Math.max(1, n);
  }

  /**
   * Pick the quietest corner, once per layout.
   *
   * The lower-left is free in most board-style modes, but not all -- an idle
   * clicker stacks its upgrade buttons exactly there, and the mascot would sit
   * on top of them. Rather than special-casing modes, sample the corners of a
   * already-rendered frame and take the emptiest.
   */
  _sidekickSpot(size) {
    const key = `${this.W}x${this.H}`;
    if (this._skSpot && this._skSpotKey === key) return this._skSpot;
    const m = Math.max(10, size * 0.12), half = size / 2;
    const candidates = [
      { x: m + half, y: this.H - m - half },
      { x: this.W - m - half, y: this.H - m - half },
      { x: m + half, y: m + half },
      { x: this.W - m - half, y: m + half },
    ];
    let best = candidates[0], bestScore = Infinity;
    for (const c of candidates) {
      const score = this._detailAt(c.x, c.y, size);
      if (score < bestScore) { bestScore = score; best = c; }
    }
    this._skSpot = best; this._skSpotKey = key;
    return best;
  }

  /** Draw the mascot as a bystander, in the quietest corner of the stage. */
  sidekick(x = null, y = null, size = Math.max(56, this.W * 0.13)) {
    if (x == null || y == null) { const s = this._sidekickSpot(size); x = s.x; y = s.y; }
    const reacting = this.time < (this._reactUntil || 0);
    this.hero(x, y, size, {
      t: this.time,
      sidekick: true,
      anim: reacting ? this._reactAnim : 'idle',
      frame: reacting ? this._reactFrame : null,
      expr: reacting && this._reactAnim === 'emote' ? 'wow' : 'smile',
    });
  }

  // True while the player is actively steering. Several modes move the mascot
  // straight from input without keeping a velocity around, so this is what they
  // use to decide between a walk cycle and standing still.
  steering() { const k = this.keys; return !!(k['arrowleft'] || k['arrowright'] || k['a'] || k['d'] || this.pointer.down); }

  // draw mascot: animated atlas > single-pose sprite > vector fallback
  hero(x, y, size, o = {}) {
    // Marks this mode as one that shows the mascot itself; see loop().
    if (!o.sidekick) this._heroEver = true;
    const atlas = atlases.get(this.theme.slug);
    if (atlas.ready) {
      // Callers may name a pose outright; otherwise infer one from the motion
      // flags the modes already pass, so existing call sites animate for free.
      const anim = o.anim || (o.jump ? 'jump' : o.run ? 'run' : o.walk ? 'walk' : 'idle');
      const cell = atlas.manifest.cell;
      const src = atlasFrame(atlas.manifest, anim, o.t ?? this.time, o.frame ?? null);
      if (src) {
        const h = size, w = size * (cell.w / cell.h);
        const c = this.ctx;
        c.save();
        c.translate(x, y);
        if (o.face) c.scale(o.face, 1);
        const sq = o.squash || 0;
        c.scale(1 + sq * 0.15, 1 - sq * 0.2);
        c.globalAlpha = 0.18; c.fillStyle = '#000';
        c.beginPath(); c.ellipse(0, h * 0.46, w * 0.3, h * 0.07, 0, 0, 7); c.fill();
        c.globalAlpha = 1;
        c.drawImage(atlas.img, src.sx, src.sy, src.sw, src.sh, -w / 2, -h / 2, w, h);
        c.restore();
        return;
      }
    }

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
    // weather overlay
    this._drawWeather();
  }

  applyShake(c) { if (this.shake > 0) c.translate((Math.random() - 0.5) * 12 * this.shake, (Math.random() - 0.5) * 12 * this.shake); }

  destroy() { this.running = false; if (this._raf) cancelAnimationFrame(this._raf); this._raf = null;
    removeEventListener('keydown', this._kd); removeEventListener('keyup', this._ku); removeEventListener('pointerup', this._pu);
    removeEventListener('fullscreenchange', this._fs);
    removeEventListener('mma:reward-pending', this._rewardPendingHandler);
    removeEventListener('mma:reward-granted', this._rewardGrantedHandler);
    removeEventListener('mma:reward-blocked', this._rewardBlockedHandler);
    removeEventListener('mma:reward-progress', this._rewardProgressHandler);
    if (this._ro) this._ro.disconnect(); }

  /* -------- Weather system -------- */
  _weatherType() {
    const sc = this.theme.scene;
    if (sc === 'space') return 'stars';
    if (sc === 'temple' || sc === 'city') return 'petals';
    if (sc === 'night') return 'fireflies';
    return Math.random() < 0.5 ? 'leaves' : 'butterflies';
  }
  _initWeather() {
    this.weather = [];
    const wt = this._weatherType();
    const n = 24;
    for (let i = 0; i < n; i++) {
      this.weather.push({
        x: Math.random() * this.W, y: Math.random() * this.H,
        vx: (Math.random() - 0.5) * 30, vy: 10 + Math.random() * 30,
        size: 3 + Math.random() * 5, phase: Math.random() * 7,
        type: wt, alpha: 0.3 + Math.random() * 0.4
      });
    }
  }
  _updateWeather(dt) {
    if (!this.weather) this._initWeather();
    for (const w of this.weather) {
      w.x += w.vx * dt + Math.sin(this.time * 2 + w.phase) * 8 * dt;
      w.y += w.vy * dt;
      if (w.y > this.H + 10) { w.y = -10; w.x = Math.random() * this.W; }
      if (w.x < -10) w.x = this.W + 10;
      if (w.x > this.W + 10) w.x = -10;
    }
  }
  _drawWeather() {
    if (!this.weather) return;
    const c = this.ctx;
    for (const w of this.weather) {
      c.globalAlpha = w.alpha;
      if (w.type === 'stars') { c.fillStyle = '#fff'; c.beginPath(); c.arc(w.x, w.y, w.size * 0.5, 0, 7); c.fill(); }
      else if (w.type === 'petals') { c.fillStyle = '#ffb3cf'; c.save(); c.translate(w.x, w.y); c.rotate(this.time + w.phase); c.fillRect(-w.size, -w.size * 0.4, w.size * 2, w.size * 0.8); c.restore(); }
      else if (w.type === 'fireflies') { c.fillStyle = '#ffd166'; c.globalAlpha = w.alpha * (0.5 + 0.5 * Math.sin(this.time * 3 + w.phase)); c.beginPath(); c.arc(w.x, w.y, w.size * 0.6, 0, 7); c.fill(); }
      else if (w.type === 'leaves') { c.fillStyle = ['#4fe0a0', '#ffd166', '#ff9f1c'][Math.floor(w.phase) % 3]; c.save(); c.translate(w.x, w.y); c.rotate(this.time * 0.5 + w.phase); c.fillRect(-w.size, -w.size * 0.4, w.size * 2, w.size * 0.8); c.restore(); }
      else { c.fillStyle = '#ff8ec7'; c.save(); c.translate(w.x, w.y); c.scale(Math.sin(this.time * 4 + w.phase) > 0 ? 1 : -1, 1); c.beginPath(); c.ellipse(-w.size * 0.5, 0, w.size * 0.5, w.size * 0.7, 0, 0, 7); c.ellipse(w.size * 0.5, 0, w.size * 0.5, w.size * 0.7, 0, 0, 7); c.fill(); c.restore(); }
    }
    c.globalAlpha = 1;
  }

  /* -------- Level / stage transition -------- */
  showLevel(num, label) {
    this._levelBanner = { text: label || `Level ${num}`, life: 1.5, max: 1.5 };
    this.sound.power();
  }
  _drawLevelBanner() {
    if (!this._levelBanner) return;
    const b = this._levelBanner;
    const c = this.ctx;
    const t = b.life / b.max;
    const slide = t > 0.7 ? (1 - (t - 0.7) / 0.3) * 1.0 : t < 0.3 ? (t / 0.3) * 1.0 : 1.0;
    c.save();
    c.globalAlpha = slide;
    c.fillStyle = 'rgba(0,0,0,.5)';
    c.fillRect(0, this.H * 0.4, this.W, this.H * 0.2);
    c.fillStyle = this.theme.accent;
    c.font = '900 32px Fredoka, Outfit, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(b.text, this.W / 2, this.H * 0.5);
    c.restore();
    b.life -= 0.016;
    if (b.life <= 0) this._levelBanner = null;
  }

  /* -------- Daily challenge -------- */
  _dailyMod() {
    const day = Math.floor(Date.now() / 86400000);
    const mods = [
      { name: 'Mega Mode', desc: 'Everything bigger!', scoreMult: 2, sizeMult: 1.3 },
      { name: 'Speed Demon', desc: '2× speed!', speedMult: 1.5, scoreMult: 1.5 },
      { name: 'Glass Cannon', desc: '1 life only!', maxLives: 1, scoreMult: 3 },
      { name: 'Treasure Hunter', desc: '2× coins!', coinMult: 2 },
      { name: 'Tiny Mode', desc: 'Everything smaller!', sizeMult: 0.7, scoreMult: 1.5 },
      { name: 'Slow & Steady', desc: 'Half speed!', speedMult: 0.6, scoreMult: 1.5 },
    ];
    return mods[day % mods.length];
  }

  /* -------- Screen flash -------- */
  flash(color, dur = 0.3) { this._flash = { color, life: dur, max: dur }; }
  _drawFlash() {
    if (!this._flash) return;
    const c = this.ctx;
    c.globalAlpha = (this._flash.life / this._flash.max) * 0.4;
    c.fillStyle = this._flash.color;
    c.fillRect(0, 0, this.W, this.H);
    c.globalAlpha = 1;
    this._flash.life -= 0.016;
    if (this._flash.life <= 0) this._flash = null;
  }

  /* -------- Achievement popup -------- */
  achievement(text, icon = '🏆') {
    this.float(this.W / 2, this.H * 0.25, `${icon} ${text}`, this.theme.accent);
    this.confetti(this.W / 2, this.H * 0.25);
    this.ring(this.W / 2, this.H * 0.25, this.theme.accent);
    this.flash(this.theme.accent, 0.2);
  }

  _matchesReward(detail) {
    return !detail?.slug || detail.slug === this.game.slug;
  }

  _updateRewardMenu(state, message) {
    const status = this.overlay?.querySelector('[data-reward-status]');
    const button = this.overlay?.querySelector('.mma-reward-btn');
    if (status && message) status.textContent = message;
    if (button) {
      button.disabled = state === 'pending' || state === 'ready';
      button.textContent = state === 'pending' ? 'Sponsor opened — return to unlock'
        : state === 'ready' ? 'Boost ready ✓' : 'Unlock selected boost';
    }
    if (this.overlay) this.overlay.dataset.rewardState = state;
  }

  armReward(detail = {}, restored = false) {
    if (!this._matchesReward(detail)) return false;
    if (this._armedBoost?.requestId && this._armedBoost.requestId === detail.requestId) return false;
    this._armedBoost = { ...detail, boosterId: detail.boosterId || this._selectedBoostId || 'mode-special' };
    this._selectedBoostId = this._armedBoost.boosterId;
    this.rewardPending = false;
    const shouldResume = this._resumeAfterReward && this.started && !this.over;
    this.running = shouldResume || this.running;
    this._resumeAfterReward = false;
    this.last = performance.now();
    if (!this.started || this.over || !this.running) {
      this.showStart();
      this._updateRewardMenu('ready', 'Boost armed. Start whenever you are ready.');
    } else {
      const option = this.boostOptions().find((item) => item.id === this._armedBoost.boosterId);
      this.float(this.W / 2, this.H * 0.3, `${option?.icon || '⚡'} Boost ready for your next run`, this.theme.accent);
      this.sound.power();
    }
    window.dispatchEvent(new CustomEvent('mma:reward-armed', { detail: {
      ...this._armedBoost, restored, slug: this.game.slug,
    } }));
    return true;
  }

  requestReward(button, source = 'game', boosterId = this._selectedBoostId) {
    if (this.rewardUsed || this.rewardPending || this._armedBoost || !window.MochiMangoRewards?.request) return false;
    const originalText = button?.textContent;
    const accepted = window.MochiMangoRewards.request({
      slug: this.game.slug,
      source,
      boosterId,
      intent: 'next-run',
      onRewardFailed: () => {
        if (button) {
          button.disabled = false;
          button.textContent = originalText;
        }
      },
    });
    if (accepted && button) {
      button.disabled = true;
      button.textContent = 'Sponsor opened — return to unlock';
    }
    return accepted;
  }

  rewardLabel() {
    const mode = modeFor(this.game);
    if (Number.isFinite(this.timeLeft)) return '+20 seconds + double score';
    if (mode === 'gallery') return '+10 seconds + double score';
    if (mode === 'sports' || mode === 'archery') return '+3 attempts + power shield';
    if (mode === 'tower') return '+100 coins + one life';
    if (mode === 'idleclicker') return '90 seconds of bonus earnings';
    if (mode === 'bubbleshooter' || mode === 'cannon') return 'Extra shots + double score';
    if (mode === 'serve') return 'Full patience + Rush Hour boost';
    if (mode === 'racing') return 'Turbo boost + double score';
    if (mode === 'pong') return 'Mega paddle + double score';
    return '+1 life + shield + double score';
  }

  applyReward(detail = {}) {
    if (this.rewardUsed) return false;
    if (!this.started || this.over) return this.armReward(detail);

    const mode = modeFor(this.game);
    const boosterId = detail.boosterId || 'mode-special';
    let label = this.rewardLabel();

    if (boosterId === 'guardian') {
      if (Number.isFinite(this.lives) && this.lives < 100) this.lives = Math.min(7, Math.max(1, this.lives) + 1);
      this.powers.shield = Math.max(this.powers.shield || 0, 18);
      this.addScore(50);
      label = 'Guardian start: extra life + 18-second shield';
    } else if (boosterId === 'score-spark') {
      this.powers.x2 = Math.max(this.powers.x2 || 0, 20);
      this.addScore(250);
      label = 'Score spark: 20 seconds of double score + 250 points';
    } else {
      const handledByMode = typeof this.applyModeBoost === 'function' && this.applyModeBoost(detail);
      if (handledByMode) {
        label = detail.label || this.rewardLabel();
      } else if (Number.isFinite(this.timeLeft)) {
        this.timeLeft = Math.min(180, this.timeLeft + 20);
      } else if (mode === 'gallery' && Number.isFinite(this.roundTimer)) {
        this.roundTimer = Math.min((this.roundDuration || 30) + 15, this.roundTimer + 10);
      } else if ((mode === 'sports' || mode === 'archery') && Number.isFinite(this.shotsLeft)) {
        this.shotsLeft += 3;
      } else if (mode === 'tower') {
        this.coins = (this.coins || 0) + 100;
        this.lives = Math.min(7, Math.max(1, this.lives) + 1);
      } else if (mode === 'idleclicker') {
        const bonus = Math.max(250, Math.floor((this.autoEarn || 0) * 90), Math.floor((this.clickPower || 1) * 100));
        this.coins = (this.coins || 0) + bonus;
        this.totalCoins = (this.totalCoins || 0) + bonus;
        label = `+${bonus.toLocaleString()} bonus coins`;
      } else if (mode === 'bubbleshooter') {
        this.shotLimit = (this.shotLimit || 0) + 10;
      } else if (mode === 'cannon') {
        this.maxShots = (this.maxShots || 0) + 5;
      } else if (mode === 'serve') {
        for (const order of this.queue || []) order.patience = 1;
        this.rush = Math.max(this.rush || 0, 10);
      } else if (mode === 'racing') {
        this.powers.rush = 12;
      } else if (mode === 'pong' && this.p1 && this.pw) {
        this.p1.w = Math.max(this.p1.w, this.pw * 1.8);
        this._rewardPaddleUntil = this.time + 12;
      } else if (Number.isFinite(this.lives) && this.lives < 100) {
        this.lives = Math.min(5, Math.max(1, this.lives) + 1);
      }
      this.powers.shield = Math.max(this.powers.shield || 0, 12);
      this.powers.x2 = Math.max(this.powers.x2 || 0, 12);
      this.addScore(100);
    }

    this.rewardUsed = true;
    this.rewardPending = false;
    this._resumeAfterReward = false;
    this.last = performance.now();
    window.MochiMangoRewards?.consumeReady?.(this.game.slug, detail.requestId);
    this.drawLives(); this.drawPowers();
    this.sound.power();
    this.achievement(label, '🎁');
    this.flash(this.theme.accent, 0.35);

    const appliedDetail = { ...detail, boosterId, slug: this.game.slug, mode, label };
    window.dispatchEvent(new CustomEvent('mma:reward-applied', { detail: appliedDetail }));
    return true;
  }

  renderText() {
    const point = (value) => value && typeof value === 'object' && Number.isFinite(value.x) && Number.isFinite(value.y)
      ? { x: Math.round(value.x), y: Math.round(value.y), vx: Math.round(value.vx || 0), vy: Math.round(value.vy || 0) }
      : null;
    const entityArrays = [
      'obs', 'foes', 'enemies', 'targets', 'coins', 'pu', 'pellets', 'towers', 'bubbles', 'pipes',
      'fish', 'notes', 'bricks', 'balls', 'platforms', 'gates', 'cards', 'orders', 'queue', 'snake',
    ];
    const entities = [];
    for (const key of entityArrays) {
      const values = this[key];
      if (!Array.isArray(values)) continue;
      for (const value of values.slice(0, 8)) {
        const position = point(value);
        if (position) entities.push({ group: key, ...position, kind: value.kind || value.type || undefined });
      }
      if (entities.length >= 16) break;
    }

    return JSON.stringify({
      coordinateSystem: 'origin top-left; x increases right; y increases down; canvas units are CSS pixels',
      slug: this.game.slug,
      mode: modeFor(this.game),
      phase: this.over ? 'gameover' : this.started ? (this.running ? 'playing' : 'paused') : 'menu',
      challenge: this.challenge,
      difficultyTier: this.difficultyTier(),
      score: Math.floor(this.score),
      best: Math.floor(this.best),
      lives: this.lives < 100 ? this.lives : null,
      elapsedSeconds: +this.time.toFixed(2),
      timeLeft: Number.isFinite(this.timeLeft) ? +this.timeLeft.toFixed(2) : undefined,
      roundTimer: Number.isFinite(this.roundTimer) ? +this.roundTimer.toFixed(2) : undefined,
      coins: typeof this.coins === 'number' ? Math.floor(this.coins) : undefined,
      level: this.level,
      wave: this.wave,
      shotsLeft: this.shotsLeft,
      goals: this.goals,
      caught: this.totalCatch,
      hookState: this.hook?.state,
      turn: this.turn,
      status: this.status,
      activePowers: Object.fromEntries(Object.entries(this.powers).map(([key, value]) => [key, +value.toFixed(2)])),
      reward: {
        pending: this.rewardPending,
        armed: Boolean(this._armedBoost),
        boosterId: this._armedBoost?.boosterId,
        usedThisRun: this.rewardUsed,
        benefit: this.rewardLabel(),
      },
      player: point(this.p) || point(this.pl) || point(this.player) || point(this.ship) || point(this.ball) || point(this.hook) || point(this.arrow),
      entities,
    });
  }

  advanceTime(ms) {
    if (!this.started) {
      this.parallax(0);
      return this.renderText();
    }
    const steps = Math.max(1, Math.min(600, Math.round(Number(ms || 0) / (1000 / 60))));
    for (let i = 0; i < steps; i++) {
      const dt = 1 / 60;
      if (this.running) {
        this.time += dt;
        this.stepMeta(dt);
        this._updateWeather(dt);
        this.update(dt);
      }
    }
    // Mirror loop(): the sidekick is part of a rendered frame, so the
    // deterministic stepping path has to draw it too or automated captures
    // disagree with what a player actually sees.
    this.render();
    if (!this._heroEver && this.time > 0.5) this.sidekick();
    this._drawFlash(); this._drawLevelBanner();
    this.pointer.tapped = false;
    return this.renderText();
  }

  /* -------- Enhanced power-up handling -------- */
  grantPower(type) {
    if (type === 'bomb') {
      // Instant screen clear — destroy all hazards on screen
      this.sound.power(); this.flash('#ff6b35', 0.4); this.shake = 1;
      this.ring(this.W / 2, this.H / 2, '#ff6b35');
      if (this._bombClear) this._bombClear();
      else { this.burst(this.W / 2, this.H / 2, '#ff6b35', 30, 2); }
      return;
    }
    this.powers[type] = POWERS[type]?.dur || 6;
    this.sound.power();
    this.float(this.W / 2, this.H * 0.4, (POWERS[type]?.tip || type) + '!', POWERS[type]?.color || '#fff');
    this.ring(this.W / 2, this.H * 0.4, POWERS[type]?.color || '#fff');
    if (type === 'mega') { this.flash('#ffd166', 0.3); this.shake = 0.5; }
    if (type === 'rush') { this.flash('#ff4f9a', 0.3); }
  }

  /* -------- Random power-up spawner -------- */
  randomPower() {
    const types = ['shield', 'magnet', 'x2', 'slow', 'freeze', 'mega', 'rush', 'bomb'];
    return types[Math.floor(Math.random() * types.length)];
  }

  instructions() { return 'Tap or press Space to play.'; }
  reset() {} update() {} render() { this.sky(); }
}

const BoardArena = createBoardArena(Base);

/* ============================================================ RUNNER */

class Runner extends Base {
  instructions() { return 'Jump (↑/Space) & duck (↓) through hazards. Grab coins, dodge obstacles, watch for Sugar Rush. Distance milestones = bonus points!'; }
  reset() {
    this.gy = this.H - Math.max(78, this.H * 0.17);
    this.r = Math.max(26, this.W * 0.075);
    this.p = { x: this.W * 0.24, y: this.gy, vy: 0, onGround: true, jumps: 0, duck: false };
    this.obs = []; this.coins = []; this.pu = []; this.spawnT = 0.7; this.coinT = 0.5; this.puT = 8;
    this.speed = Math.max(280, this.W * 0.6); this.rush = 0; this.rushT = 15; this.distMilestone = 0; this.nextMilestone = 500;
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
    // Distance milestone
    if (this.scroll >= this.nextMilestone) {
      this.distMilestone++; this.nextMilestone += 500 + this.distMilestone * 200;
      this.addScore(25 * this.distMilestone); this.sound.power();
      this.flash(this.theme.accent, 0.2); this.confetti(this.W / 2, this.H * 0.3);
      this.float(this.W / 2, this.H * 0.2, this.distMilestone * 100 + 'm!', this.theme.accent);
    }
    this.rushT -= dt;
    if (rushing) { this.rush -= dt; if (this.rush <= 0) this.float(this.W / 2, this.H * 0.28, 'Rush over!', this.theme.accent); }
    else if (this.rushT <= 0) { this.rush = 4; this.rushT = 17 + Math.random() * 7; this.powers.x2 = Math.max(this.powers.x2 || 0, 4); this.powers.magnet = Math.max(this.powers.magnet || 0, 4); this.sound.power(); this.float(this.W / 2, this.H * 0.28, 'Sugar Rush!', this.theme.accent); this.ring(this.W / 2, this.H * 0.28, this.theme.accent); }
    this.spawnT -= dt;
    if (this.spawnT <= 0 && !rushing) {
      this.spawnT = Math.max(0.55, 0.95 - this.time * 0.008) + Math.random() * 0.25;
      const roll = Math.random(), kind = roll < 0.4 ? 'low' : roll < 0.7 ? 'high' : 'tall';
      if (this.scroll > 2000 && this.distMilestone > 2) {
        this.obs.push({ x: this.W + 50, kind: 'moving', s: Math.max(30, this.W * 0.08), band: [this.gy - this.r * 2.3, this.gy], moving: true, mx: this.W * 0.3, ph: Math.random() * 7, ch: this.theme.hazards[2 % 3] });
      } else {
        const s = Math.max(30, this.W * 0.08);
        if (kind === 'high') this.obs.push({ x: this.W + 50, kind, s, band: [this.gy - this.r * 2.3, this.gy - this.r * 1.15], ch: this.theme.hazards[0] });
        else if (kind === 'tall') this.obs.push({ x: this.W + 50, kind, s: s * 1.15, band: [this.gy - this.r * 1.9, this.gy], ch: this.theme.hazards[2 % 3] });
        else this.obs.push({ x: this.W + 50, kind, s, band: [this.gy - this.r * 0.95, this.gy], ch: this.theme.hazards[1 % 3] });
      }
    }
    this.coinT -= dt;
    if (this.coinT <= 0) { this.coinT = rushing ? 0.18 : (0.4 + Math.random() * 0.5);
      if (!rushing && Math.random() < 0.4) this._coinArc(this.W + 40, 5, this.H * 0.26);
      else this.coins.push({ x: this.W + 30, y: this.gy - (rushing ? 30 + Math.random() * this.H * 0.35 : 36 + Math.random() * this.H * 0.28), s: Math.max(22, this.W * 0.058), ch: this.theme.items[Math.floor(Math.random() * this.theme.items.length)] }); }
    this.puT -= dt;
    if (this.puT <= 0) { this.puT = 11 + Math.random() * 6; const t = Object.keys(POWERS)[Math.floor(Math.random() * 4)];
      this.pu.push({ x: this.W + 40, y: this.gy - this.H * 0.24, s: Math.max(26, this.W * 0.07), type: t }); }
    const mv = this.speed * dt, mag = this.powers.magnet;
    for (const o of this.obs) {
      if (o.moving) { o.x -= mv * 0.3; o.band[0] += Math.sin(this.time + o.ph) * o.mx * dt; o.band[1] = o.band[0] + this.r * 1.15; }
      else o.x -= mv;
    }
    for (const cn of this.coins) { cn.x -= mv; if (mag) { const dx = this.p.x - cn.x, dy = this.p.y - this.r - cn.y, d = Math.hypot(dx, dy); if (d < this.W * 0.5) { cn.x += dx / d * 460 * dt; cn.y += dy / d * 460 * dt; } } }
    for (const q of this.pu) q.x -= mv;
    this.obs = this.obs.filter(o => o.x > -60); this.coins = this.coins.filter(c => c.x > -60 && !c.got); this.pu = this.pu.filter(q => q.x > -60 && !q.got);
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
    for (const o of this.obs) if (!o.hit) { if (o.moving) { c.fillStyle = shade(this.theme.primary, -30); rr2(c, o.x - o.s * 0.5, o.band[0], o.s, o.band[1] - o.band[0], 6); c.fill(); c.fillStyle = this.theme.accent; c.globalAlpha = 0.6; c.fillRect(o.x - o.s * 0.5, o.band[0], o.s, 4); c.globalAlpha = 1; } else if (o.kind === 'high') { c.fillStyle = shade(this.theme.primary, -20); rr2(c, o.x - o.s * 0.5, o.band[0], o.s, o.band[1] - o.band[0], 6); c.fill(); this.glyph(o.ch, o.x, o.band[0] + (o.band[1] - o.band[0]) / 2, o.s * 0.7); } else this.glyph(o.ch, o.x, o.band[1] - o.s * 0.5, o.s); }
    this.hero(this.p.x, this.p.y - this.r * (this.p.duck ? 0.5 : 0.95), this.r * 2.2, { run: this.p.onGround, squash: this.p.duck ? 0.5 : (this.p.onGround ? 0 : -0.3), expr: this.p.onGround ? 'smile' : 'wow',
      anim: !this.p.onGround ? 'jump' : this.p.duck ? 'action' : 'run' });
    this.drawFx(); c.restore();
  }
}

/* ============================================================ FLAPPY */

class Flappy extends Base {
  instructions() { return 'Tap/Space to flap! Thread gaps, grab coins, hit rings for bonus. Consecutive ring combos multiply score. Watch for moving pipes!'; }
  reset() {
    this.r = Math.max(22, this.W * 0.06); this.p = { x: this.W * 0.28, y: this.H / 2, vy: 0 };
    this.pipes = []; this.gap = this.H * 0.34; this.spawnX = 0; this.gapMin = this.H * 0.24; this.n = 0;
    this.ringStreak = 0; this.flapPowers = [];
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
      if (p.ring && !p.rgot && Math.abs(p.x - this.p.x) < this.r && Math.abs(p.cy - this.p.y) < p.g * 0.4) {
        p.rgot = true; this.ringStreak++;
        const ringBonus = 15 * this.ringStreak;
        this.sound.power(); this.ring(p.x, p.cy, this.theme.accent); this.confetti(p.x, p.cy);
        this.hitCombo(p.x, p.cy, ringBonus);
        if (this.ringStreak > 1) this.float(p.x, p.cy - 30, this.ringStreak + 'x ring!', '#ffd166');
      }
    }
    this.pipes = this.pipes.filter(p => p.x > -80);
    // Power-up spawns occasionally
    if (this.n > 0 && this.n % 8 === 0 && !this.flapPowers.length) {
      const t = Object.keys(POWERS)[Math.floor(Math.random() * 4)];
      this.flapPowers.push({ x: this.W + 20, y: this.H * 0.2 + Math.random() * this.H * 0.6, type: t, got: false });
    }
    for (const f of this.flapPowers) f.x -= this.W * 0.42 * this.difficulty() * dt;
    for (const f of this.flapPowers) if (!f.got && Math.abs(f.x - this.p.x) < 20 && Math.abs(f.y - this.p.y) < 30) { f.got = true; this.grantPower(f.type); }
    this.flapPowers = this.flapPowers.filter(f => !f.got && f.x > -60);
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax();
    for (const f of this.flapPowers) { c.save(); c.shadowColor = POWERS[f.type].color; c.shadowBlur = 14; this.glyph(POWERS[f.type].icon, f.x, f.y + Math.sin(this.time * 4) * 5, Math.max(20, this.W * 0.055)); c.restore(); }
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
    if (this.ringStreak > 0) { c.fillStyle = '#ffd166'; c.font = 'bold 12px Outfit'; c.textAlign = 'center'; c.textBaseline = 'top'; c.fillText(this.ringStreak + 'x ring streak!', this.W / 2, 60); }
    const tilt = Math.max(-0.5, Math.min(0.6, this.p.vy / 600));
    // Flapping is airborne by definition, so the jump row reads far better here than a run cycle.
    c.save(); c.translate(this.p.x, this.p.y); c.rotate(tilt); this.hero(0, 0, this.r * 2.2, { t: this.time, run: true, anim: 'jump' }); c.restore();
    this.drawFx(); c.restore();
  }
}

/* ============================================================ PLATFORMER */

class Platformer extends Base {
  instructions() { return 'Auto-bounce up! Steer left/right with arrows or drag. Springs launch high, crumbling tiles vanish, moving platforms drift, avoid spikes! Height milestones reward big jumps!'; }
  reset() {
    this.r = Math.max(22, this.W * 0.06); this.p = { x: this.W / 2, y: this.H - 120, vy: 0, vx: 0 };
    this.plats = []; this.height = 0; this.camY = 0;
    for (let i = 0; i < 8; i++) this.plats.push(this._mkPlat(this.H - i * (this.H / 7), i === 0));
    this.heightMilestone = 0; this.nextHm = 500;
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
    // Height milestone
    if (this.height >= this.nextHm) {
      this.heightMilestone++; this.nextHm += 500 + this.heightMilestone * 300;
      this.addScore(30 * this.heightMilestone); this.sound.power();
      this.flash(this.theme.accent, 0.2); this.confetti(this.W / 2, this.H * 0.3);
      this.float(this.W / 2, this.H * 0.25, this.heightMilestone * 50 + 'm!', this.theme.accent);
      const t = Object.keys(POWERS)[Math.floor(Math.random() * 4)];
      this.grantPower(t);
    }
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
    this.hero(this.p.x, this.p.y - this.camY, this.r * 2.2, { t: this.time, squash: this.p.vy < 0 ? -0.2 : 0.1, face: this.p.vx < 0 ? -1 : 1,
      anim: !this.p.onGround ? 'jump' : Math.abs(this.p.vx) > 40 ? 'run' : 'idle' });
    this.drawFx(); c.restore();
  }
}

/* ============================================================ DODGER */

class Dodger extends Base {
  instructions() { return 'Move to catch treats, grab power-ups, dodge hazards. Drag or use ← →. Watch for Treat Storms and golden jackpots!'; }
  reset() {
    this.r = Math.max(24, this.W * 0.07); this.p = { x: this.W / 2, y: this.H - Math.max(58, this.H * 0.13), squash: 0 };
    this.items = []; this.spawnT = 0.5; this.stormT = 14; this.storm = 0; this.jackpotT = 9; this.dodgerCatchCount = 0; this.dodgerCatchMilestone = 50;
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
        else { this.sound.coin(); this.burst(it.x, it.y, this.theme.accent, 8); this.hitCombo(it.x, it.y, this.storm > 0 ? 5 : 3);
          this.dodgerCatchCount++;
          if (this.dodgerCatchCount >= this.dodgerCatchMilestone) {
            this.dodgerCatchMilestone += 50; this.addScore(50); this.sound.power(); this.flash('#ffd166', 0.3);
            this.float(this.W / 2, this.H * 0.25, this.dodgerCatchCount + ' catches!', '#ffd166');
          }
        } } }
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
    this.hero(this.p.x, this.p.y, this.r * 2.2, { t: this.time, face: this.p.face, expr: 'smile', squash: -this.p.squash * 0.5,
      anim: this.p.squash > 0.1 ? 'action' : this.steering() ? 'walk' : 'idle' });
    this.drawFx(); c.restore();
  }
}

/* ============================================================ SHOOTER */

class Shooter extends Base {
  instructions() { return 'Move ← → or drag, auto-fire! Blast swarms, dodge enemy fire, defeat bosses. Chain kills for combo multiplier. Watch for shield enemies!'; }
  reset() { this.r = Math.max(24, this.W * 0.07); this.p = { x: this.W / 2, y: this.H - Math.max(58, this.H * 0.13) }; this.foes = []; this.shots = []; this.ebul = []; this.pu = []; this.spawnT = 0.6; this.fireT = 0; this.puT = 10; this.boss = null; this.bossT = 22; this.swarmT = 11; this.killStreak = 0; this.weaponLvl = 1; }
  _spawnFoe(D, kind, x) {
    const base = Math.max(28, this.W * 0.075);
    if (kind === 'tank') this.foes.push({ x, y: -30, s: base * 1.4, vy: this.H * 0.06 * D, hp: 3, kind, dx: 0, ch: this.theme.hazards[2 % 3], ph: 0 });
    else if (kind === 'weaver') this.foes.push({ x, y: -30, s: base, vy: this.H * 0.13 * D, hp: 1, kind, dx: 0, amp: this.W * 0.22, ph: Math.random() * 7, x0: x, ch: this.theme.hazards[0] });
    else if (kind === 'shield') this.foes.push({ x, y: -30, s: base * 1.1, vy: this.H * 0.09 * D, hp: 2, kind, dx: 0, ch: this.theme.hazards[1 % 3], ph: 0, shielded: true });
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
    const rate = this.powers.x2 ? 0.12 : Math.max(0.12, 0.26 - this.weaponLvl * 0.02);
    if (this.fireT <= 0) { this.fireT = rate; this.shots.push({ x: this.p.x, y: this.p.y - this.r }); if (this.powers.x2 || this.weaponLvl >= 3) { this.shots.push({ x: this.p.x - 16, y: this.p.y - this.r, vx: -60 }); this.shots.push({ x: this.p.x + 16, y: this.p.y - this.r, vx: 60 }); } this.sound.blip(760, 0.04, 'square', 0.06); }
    for (const s of this.shots) { s.y -= Math.max(560, this.H) * dt; if (s.vx) s.x += s.vx * dt; } this.shots = this.shots.filter(s => s.y > -20);
    this.bossT -= dt;
    if (!this.boss && this.bossT <= 0) { const hp = Math.round(14 + this.time * 0.5); this.boss = { x: this.W / 2, y: this.H * 0.14, s: Math.max(60, this.W * 0.2), hp, maxhp: hp, dir: Math.random() < 0.5 ? -1 : 1, fireT: 1.2, ch: this.theme.hazards[0] }; this.float(this.W / 2, this.H * 0.3, 'Boss!', '#ff4f6d'); this.sound.power(); }
    if (this.boss) {
      const b = this.boss; b.x += b.dir * this.W * 0.25 * dt; if (b.x < b.s * 0.5) { b.x = b.s * 0.5; b.dir = 1; } if (b.x > this.W - b.s * 0.5) { b.x = this.W - b.s * 0.5; b.dir = -1; }
      const rage = b.hp <= b.maxhp * 0.5;
      if (rage && !b.raging) { b.raging = true; b.fireT = 0.3; this.flash('#ff4f6d', 0.3); this.float(b.x, b.y - b.s * 0.6, 'Rage!', '#ff4f6d'); }
      b.fireT -= dt; if (b.fireT <= 0) { b.fireT = rage ? 0.5 : Math.max(0.7, 1.6 - this.time * 0.01); const spd = this.H * 0.4; for (let a = (rage ? -2 : -1); a <= (rage ? 2 : 1); a++) this.ebul.push({ x: b.x, y: b.y + b.s * 0.4, vx: a * this.W * 0.13, vy: spd }); this.sound.blip(rage ? 150 : 200, 0.1, 'sawtooth', 0.12); }
      for (const s of this.shots) if (!s.dead && Math.abs(s.x - b.x) < b.s * 0.5 && Math.abs(s.y - b.y) < b.s * 0.5) { s.dead = true; b.hp--; this.burst(s.x, s.y, this.theme.accent, 6); if (b.hp <= 0) { this.confetti(b.x, b.y); this.burst(b.x, b.y, this.theme.accent, 30, 1.8); this.shake = 1.2; this.flash('#fff', 0.4); this.hitCombo(b.x, b.y, 60); this.weaponLvl = Math.min(5, this.weaponLvl + 1); this.float(this.W / 2, this.H * 0.25, 'Weapon Lv.' + this.weaponLvl + '!', '#ffd166'); this.pu.push({ x: b.x, y: b.y, s: Math.max(26, this.W * 0.07), vy: this.H * 0.15, type: Object.keys(POWERS)[Math.floor(Math.random() * 4)] }); this.boss = null; this.bossT = 20 + Math.random() * 8; } }
    }
    this.swarmT -= dt;
    if (this.swarmT <= 0) { this.swarmT = 13 + Math.random() * 8; const n = 4 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) this._spawnFoe(D, 'grunt', (i + 0.5) * this.W / n); this.float(this.W / 2, this.H * 0.28, 'Incoming!', this.theme.accent); }
    this.spawnT -= dt;
    if (this.spawnT <= 0) { this.spawnT = Math.max(0.4, 1.05 - this.time * 0.011); const roll = Math.random(); this._spawnFoe(D, roll < 0.12 ? 'tank' : roll < 0.35 ? 'weaver' : roll < 0.5 ? 'shield' : 'grunt', 30 + Math.random() * (this.W - 60)); }
    this.puT -= dt; if (this.puT <= 0) { this.puT = 12 + Math.random() * 6; this.pu.push({ x: 30 + Math.random() * (this.W - 60), y: -20, s: Math.max(26, this.W * 0.07), vy: this.H * 0.15, type: Object.keys(POWERS)[Math.floor(Math.random() * 4)] }); }
    for (const f of this.foes) { f.y += f.vy * dt; if (f.kind === 'weaver') f.x = f.x0 + Math.sin(this.time * 3 + f.ph) * f.amp; else { f.x += (f.dx || 0) * dt; if (f.x < f.s / 2 || f.x > this.W - f.s / 2) f.dx *= -1; } }
    for (const q of this.pu) q.y += q.vy * dt;
    for (const b of this.ebul) { b.x += b.vx * dt; b.y += b.vy * dt; }
    for (const f of this.foes) {
      for (const s of this.shots) if (!s.dead && Math.abs(s.x - f.x) < f.s * 0.5 && Math.abs(s.y - f.y) < f.s * 0.5) {
        if (f.shielded && s.y > f.y) continue; // must hit from above for shielded
        s.dead = true; f.hp--; this.burst(s.x, s.y, this.theme.accent, 4);
        if (f.hp <= 0) { f.dead = true; this.killStreak++; this.sound.coin(); this.burst(f.x, f.y, this.theme.accent, f.kind === 'tank' ? 16 : 8, f.kind === 'tank' ? 1.4 : 1); this.hitCombo(f.x, f.y, f.kind === 'tank' ? 10 : 4); } }
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
    for (const f of this.foes) {
      if (f.shielded) { c.save(); c.strokeStyle = '#3ad0ff'; c.lineWidth = 3; c.shadowColor = '#3ad0ff'; c.shadowBlur = 10; c.beginPath(); c.arc(f.x, f.y, f.s * 0.7, 0, 7); c.stroke(); c.restore(); }
      this.glyph(f.ch, f.x, f.y, f.s); if (f.kind === 'tank' && f.hp < 3) { c.fillStyle = '#ff4f6d'; c.fillRect(f.x - f.s / 2, f.y - f.s / 2 - 6, f.s * (f.hp / 3), 3); }
    }
    if (this.boss) { const b = this.boss; this.glyph(b.ch, b.x, b.y, b.s * (1 + Math.sin(this.time * 6) * 0.04));
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(this.W * 0.15, 12, this.W * 0.7, 8); c.fillStyle = '#ff4f6d'; c.fillRect(this.W * 0.15, 12, this.W * 0.7 * (b.hp / b.maxhp), 8); }
    if (this.powers.shield) { c.strokeStyle = POWERS.shield.color; c.globalAlpha = 0.6; c.lineWidth = 3; c.beginPath(); c.arc(this.p.x, this.p.y, this.r * 1.5, 0, 7); c.stroke(); c.globalAlpha = 1; }
    c.fillStyle = 'rgba(255,255,255,.2)'; c.font = 'bold 12px Outfit'; c.textAlign = 'right'; c.textBaseline = 'top'; c.fillText('Lv.' + this.weaponLvl, this.W - 16, 50);
    this.hero(this.p.x, this.p.y, this.r * 2.2, { t: this.time, expr: 'smile', anim: this.steering() ? 'walk' : 'idle' });
    this.drawFx(); c.restore();
  }
}

/* ============================================================ WHACK */

class Whack extends Base {
  instructions() { return 'Tap treats as they pop! ⭐=big points, 💀=BAD. Chain good hits for combo bonus. Speed rounds every 20s — act fast!'; }
  reset() { this.cols = 3; this.rows = 3; this.holes = []; this.spawnT = 0.5; this._layout(); this.lives = 3; this.frenzy = 0; this.frenzyT = 12; this.whackStreak = 0; this.speedRound = 0; this.speedRoundT = 18; }
  onResize() { if (this.holes && this.holes.length) this._layout(); }
  _layout() {
    const top = this.H * 0.16, bot = this.H * 0.92, left = this.W * 0.14, right = this.W * 0.86;
    this.holes = [];
    for (let r = 0; r < this.rows; r++) for (let col = 0; col < this.cols; col++)
      this.holes.push({ x: left + (right - left) * (col / (this.cols - 1)), y: top + (bot - top) * (r / (this.rows - 1)), up: 0, kind: null, ch: '', life: 0 });
    this.rad = Math.max(26, this.W * 0.09);
  }
  update(dt) {
    this.speedRoundT -= dt;
    if (this.speedRound > 0) this.speedRound -= dt;
    else if (this.speedRoundT <= 0 && this.speedRound <= 0) { this.speedRound = 4; this.speedRoundT = 22 + Math.random() * 5; this.sound.power(); this.flash(this.theme.accent, 0.4); this.float(this.W / 2, this.H * 0.1, 'Speed Round!', '#ff4f6d'); }
    this.frenzyT -= dt;
    if (this.frenzy > 0) this.frenzy -= dt;
    else if (this.frenzyT <= 0) { this.frenzy = 3.5; this.frenzyT = 15 + Math.random() * 6; this.sound.power(); this.float(this.W / 2, this.H * 0.1, 'Frenzy!', this.theme.accent); }
    this.spawnT -= dt;
    const speedMul = this.speedRound > 0 ? 0.6 : (this.frenzy > 0 ? 0.85 : 1);
    if (this.spawnT <= 0) { this.spawnT = (this.speedRound > 0 ? 0.18 : (this.frenzy > 0 ? 0.22 : Math.max(0.35, 0.9 - this.time * 0.012))) * speedMul;
      const free = this.holes.filter(h => h.up <= 0); if (free.length) { const h = free[Math.floor(Math.random() * free.length)];
        const roll = Math.random(), bad = roll < 0.22, gold = !bad && roll > 0.88, bomb = !bad && !gold && roll > 0.72;
        h.kind = bad ? 'bad' : gold ? 'gold' : bomb ? 'bomb' : 'good'; h.ch = bad ? this.theme.hazards[Math.floor(Math.random() * 3)] : gold ? '⭐' : bomb ? '💣' : this.theme.items[Math.floor(Math.random() * this.theme.items.length)];
        h.up = 0.01; h.life = gold ? 0.85 : (bomb ? 1.2 : Math.max(0.7, 1.4 - this.time * 0.01)); } }
    for (const h of this.holes) { if (h.up > 0) { h.up = Math.min(1, h.up + dt * 6); h.life -= dt; if (h.life <= 0) { if (h.kind !== 'bad') { this.whackStreak = 0; this.combo = 0; this.mult = 1; this.comboEl.textContent = ''; } h.up = 0; h.kind = null; } } }
    if (this.pointer.tapped) { for (const h of this.holes) { if (h.up > 0.5 && Math.hypot(this.pointer.x - h.x, this.pointer.y - h.y) < this.rad) {
      if (h.kind === 'gold') { this.whackStreak++; this.sound.power(); this.confetti(h.x, h.y); this.hitCombo(h.x, h.y, 20); }
      else if (h.kind === 'bomb') { this.whackStreak++; this.sound.power(); this.burst(h.x, h.y, '#ff4f6d', 20, 1.5); this.shake = 0.25; for (const n of this.holes) { if (n.kind === 'bad') { n.up = 0; n.kind = null; this.burst(n.x, n.y, '#ffd166', 8); this.hitCombo(n.x, n.y, 5); } } }
      else if (h.kind === 'good') { this.whackStreak++; this.sound.coin(); this.burst(h.x, h.y, this.theme.accent, 10); this.hitCombo(h.x, h.y, 4 + Math.min(6, Math.floor(this.whackStreak / 3))); }
      else { this.burst(h.x, h.y, '#ff4f6d', 12); this.whackStreak = 0; this.loseLife(); }
      if (this.whackStreak > 1 && h.kind !== 'bad' && h.kind !== null) this.comboEl.textContent = this.whackStreak + '×';
      h.up = 0; h.kind = null; break; } } }
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.sky();
    c.fillStyle = this.theme.ground; c.fillRect(0, 0, this.W, this.H); c.globalAlpha = 0.12; this.parallaxDecor && this.parallaxDecor(); c.globalAlpha = 1;
    if (this.speedRound > 0) { c.save(); c.globalAlpha = 0.07 + Math.sin(this.time * 12) * 0.03; c.fillStyle = '#ff4f6d'; c.fillRect(0, 0, this.W, this.H); c.restore(); }
    for (const h of this.holes) {
      c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(h.x, h.y + this.rad * 0.4, this.rad, this.rad * 0.45, 0, 0, 7); c.fill();
      if (h.up > 0) { const off = (1 - h.up) * this.rad; c.save(); c.beginPath(); c.ellipse(h.x, h.y + this.rad * 0.4, this.rad, this.rad * 0.5, 0, 0, 7); c.clip();
        if (h.kind === 'good') this.hero(h.x, h.y + off, this.rad * 1.9, { t: this.time }); else { if (h.kind === 'gold') { c.shadowColor = '#ffd166'; c.shadowBlur = 16; } if (h.kind === 'bomb') c.shadowBlur = 20; this.glyph(h.ch, h.x, h.y + off, this.rad * 1.4); c.shadowBlur = 0; }
        c.restore(); }
      c.fillStyle = shade(this.theme.ground, -22); c.beginPath(); c.ellipse(h.x, h.y + this.rad * 0.4, this.rad * 1.02, this.rad * 0.5, 0, 0, Math.PI); c.fill();
    }
    // Streak bar
    if (this.whackStreak > 0) { c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(this.W / 2 - 40, this.H - 16, 80, 8); c.fillStyle = '#ffd166'; c.fillRect(this.W / 2 - 40, this.H - 16, Math.min(80, this.whackStreak * 6), 8); c.fillStyle = '#fff'; c.font = 'bold 8px Outfit'; c.textAlign = 'center'; c.fillText(this.whackStreak + '×', this.W / 2, this.H - 22); }
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
      const base = cleared * 10, mul = combo * (1 + Math.floor(cleared / 8)), g = base * mul; this.addScore(g); this.sound.combo(combo);
      if (combo > 1) this.comboEl.textContent = combo + '× cascade ' + g + 'pts';
      if (combo >= 3) this.float(this.W / 2, this.H * 0.5, 'Cascade ' + combo + '×!', '#ffd166');
      this.timeLeft = Math.min(80, this.timeLeft + cleared * 0.3);
      for (let col = 0; col < this.N; col++) { let w = this.N - 1;
        for (let r = this.N - 1; r >= 0; r--) if (this.grid[r][col] != null) { this.grid[w][col] = this.grid[r][col]; this.sp[w][col] = this.sp[r][col]; if (w !== r) { this.grid[r][col] = null; this.sp[r][col] = null; } w--; }
        for (let r = w; r >= 0; r--) { this.grid[r][col] = Math.floor(Math.random() * this.symbols.length); this.sp[r][col] = null; } }
      cause = null;
      this.schedule(0.13, step);
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
  instructions() { return 'Tap menu buttons to serve customers before patience runs out. Fast = big tips! Rush Hour = double customers. Chain serves = combo bonus!'; }
  reset() { this.menu = this.theme.items.slice(0, 4); this.queue = []; this.spawnT = 0; this.maxQ = 4; this.rush = 0; this.rushT = 16; this.serveStreak = 0; this._btns(); }
  onResize() { this._btns(); }
  _btns() { if (!this.menu) return; const n = this.menu.length, bw = Math.min(this.W / n - 10, 96); this.btns = this.menu.map((ch, i) => ({ ch, x: (this.W / n) * i + (this.W / n) / 2, y: this.H - Math.max(50, this.H * 0.1), r: Math.max(30, bw * 0.5), press: 0 })); }
  _spawn() {
    const nItems = Math.min(4, 1 + Math.floor(Math.random() * (1 + Math.min(3, this.time / 30))));
    const items = []; for (let i = 0; i < nItems; i++) items.push(Math.floor(Math.random() * this.menu.length));
    this.queue.push({ items, served: items.map(() => false), patience: 1, decay: (0.05 + this.time * 0.001 + Math.random() * 0.02) * (this.rush > 0 ? 1.15 : 1) + nItems * 0.006, face: Math.floor(Math.random() * 6) });
  }
  update(dt) {
    this.rushT -= dt;
    if (this.rush > 0) this.rush -= dt;
    else if (this.rushT <= 0) { this.rush = 6; this.rushT = 18 + Math.random() * 8; this.sound.power(); this.float(this.W / 2, this.H * 0.2, 'Rush Hour!', this.theme.accent); this.ring(this.W / 2, this.H * 0.2, this.theme.accent); }
    this.spawnT -= dt;
    const cap = this.rush > 0 ? this.maxQ : this.maxQ - 1;
    if (this.spawnT <= 0 && this.queue.length < cap) { this.spawnT = this.rush > 0 ? 0.7 : Math.max(0.9, 2.1 - this.time * 0.02); this._spawn(); }
    for (const q of this.queue) { q.patience -= q.decay * dt; if (q.patience <= 0 && !q.done) { q.done = true; this.serveStreak = 0; this.combo = 0; this.mult = 1; this.comboEl.textContent = ''; this.loseLife(); } }
    this.queue = this.queue.filter(q => !q.done);
    if (this.pointer.tapped) for (const b of this.btns) if (Math.hypot(this.pointer.x - b.x, this.pointer.y - b.y) < b.r) {
      const idx = this.menu.indexOf(b.ch);
      let target = null; for (const q of this.queue) { const k = q.items.findIndex((it, j) => it === idx && !q.served[j]); if (k >= 0) { target = { q, k }; break; } }
      if (target) { target.q.served[target.k] = true; this.sound.coin(); this.burst(b.x, b.y - 40, this.theme.accent, 6);
        if (target.q.served.every(Boolean)) { target.q.done = true; this.serveStreak++; const tip = Math.round(target.q.patience * 10); this.hitCombo(b.x, b.y - 60, 6 + target.q.items.length * 2 + tip + this.serveStreak * 2); if (tip >= 6) this.float(b.x, b.y - 90, 'Big Tip!', '#ffd166'); }
      } else { this.sound.blip(200, 0.12, 'sine', 0.1); this.serveStreak = 0; this.combo = 0; this.mult = 1; this.comboEl.textContent = ''; }
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
    if (this.serveStreak > 0) { c.fillStyle = '#ffd166'; c.font = 'bold 11px Outfit'; c.textAlign = 'center'; c.textBaseline = 'bottom'; c.fillText(this.serveStreak + 'x streak', this.W / 2, this.H - Math.max(96, this.H * 0.2) - 8); }
    this.hero(this.W - Math.max(40, this.W * 0.12), this.H - Math.max(96, this.H * 0.2) - Math.max(30, this.W * 0.08), Math.max(60, this.W * 0.16), { t: this.time });
    this.drawFx(); c.restore();
  }
}

/* ============================================================ MAZE */

class Maze extends Base {
  instructions() { return 'Collect every treat and clear the maze — dodge the guards! Arrow keys, WASD or swipe to steer. Grab a ✨ to turn the tables.'; }
  reset() { this.level = 1; this.speedBoost = 0; this._gen(); }
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
    const plSpeed = this.speedBoost > 0 ? Math.max(90, this.cell * 9) : Math.max(90, this.cell * 5.2);
    this._step(this.pl, dt, plSpeed, (o) => {
      if ((o.want[0] || o.want[1]) && this._open(o.cx + o.want[0], o.cy + o.want[1])) o.dir = o.want.slice();
      else if (!(o.dir[0] || o.dir[1]) || !this._open(o.cx + o.dir[0], o.cy + o.dir[1])) o.dir = [0, 0];
    });
    this.fear = Math.max(0, this.fear - dt);
    this.speedBoost = Math.max(0, this.speedBoost - dt);
    const gsp = Math.max(70, this.cell * (3.5 + this.level * 0.14));
    for (const gd of this.guards) this._step(gd, dt, gsp, (o) => this._guardDir(o));
    for (const p of this.pellets) if (!p.got && p.x === this.pl.cx && p.y === this.pl.cy) {
      p.got = true; this.eaten++; this.burst(this.pl.px, this.pl.py, this.theme.accent, 5);
      if (p.power) {
        const r2 = Math.random();
        if (r2 < 0.4) { this.fear = 6; this.grantPower('shield'); this.float(this.pl.px, this.pl.py, 'Cloak!', POWERS.shield.color); }
        else { this.speedBoost = 3.5; this.float(this.pl.px, this.pl.py, 'Speed Shoes!', '#ffd166'); this.flash('#ffd166', 0.3); }
      }
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
    if (this.eaten >= this.total) { this.level++; this.addScore(150); this.flash('#fff', 0.5); this.confetti(this.W / 2, this.H * 0.4); this.float(this.W / 2, this.H * 0.35, 'Level ' + (this.level - 1) + ' Clear!', '#ffd166'); this._gen(); }
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
    this.hero(this.pl.px, this.pl.py, this.cell * 1.55, { t: this.time, face: this.pl.dir[0] < 0 ? -1 : 1, expr: this.fear > 0 ? 'wow' : 'smile',
      anim: (this.pl.dir[0] || this.pl.dir[1]) ? 'walk' : 'idle' });
    this.drawFx(); c.restore();
  }
}

/* ============================================================ MEMORY */

class Memory extends Base {
  instructions() { return 'Flip cards to find matching pairs! Clear the board before time runs out. Consecutive matches build combo multiplier. Golden card = bonus power!'; }
  reset() { this.level = 1; this.timeLeft = 70; this.lives = 999; this.livesEl.innerHTML = '⏱️'; this._clearing = false; this.reveal = 0; this.matchStreak = 0; this._deal(); }
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
            cd.done = this.first.done = true; this.matched++; this.matchStreak++; this.sound.coin(); this.hitCombo(cd.px, cd.py, 8 * this.matchStreak); this.burst(cd.px, cd.py, this.theme.accent, 12); this.timeLeft = Math.min(99, this.timeLeft + 2.5);
            if (this.matchStreak > 1) this.float(cd.px, cd.py - this.csz * 0.7, this.matchStreak + 'x streak!', '#ffd166');
            if (cd.bonus) this._bonus(cd);
            this.first = null;
            if (this.matched >= this.pairs) { this.level++; this.addScore(120 + this.matched * 5); this.confetti(this.W / 2, this.H * 0.5); this._clearing = true; this.clearT = 1.1; }
          } else if (this.powers.shield) { delete this.powers.shield; this.sound.blip(300, 0.2, 'sine', 0.2); this.ring(cd.px, cd.py, POWERS.shield.color); this.float(cd.px, cd.py - this.csz * 0.6, 'Saved!', POWERS.shield.color); this._pending = [this.first, cd]; this.lock = 0.5; this.first = null;
          } else { this._pending = [this.first, cd]; this.lock = 0.8; this.matchStreak = 0; this.combo = 0; this.mult = 1; this.comboEl.textContent = ''; this.sound.blip(200, 0.12, 'sine', 0.1); this.first = null; }
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
    if (this.matchStreak > 0) { c.fillStyle = '#ffd166'; c.font = 'bold 12px Outfit'; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(this.matchStreak + 'x streak', 16, 68); }
    this.drawFx(); c.restore();
  }
}

/* ============================================================ STACKER */

class Stacker extends Base {
  instructions() { return 'Tap/Space to drop blocks. Perfect drops = wider blocks! Stack high for height bonuses. Wind gusts above 8 blocks add challenge!'; }
  reset() { this.bh = Math.max(22, this.H * 0.052); this.bw0 = this.W * 0.44; this.tower = [{ x: this.W / 2, w: this.bw0 }]; this.slices = []; this.camY = 0; this.perfectStreak = 0; this.heightM = 0; this.lives = 3; this.drawLives(); this._spawn(); }
  _spawn() { const top = this.tower[this.tower.length - 1]; const from = Math.random() < 0.5 ? -1 : 1; this.cur = { w: top.w, x: from < 0 ? top.w / 2 : this.W - top.w / 2, dir: from < 0 ? 1 : -1 }; this.speed = Math.min(this.W * 1.15, Math.max(150, this.W * 0.55) + this.tower.length * 7); }
  _screenY(level) { return this.groundY - level * this.bh + this.camY; }
  _col(i) { return `hsl(${(i * 16 + 200) % 360},68%,${this.theme.dark ? 60 : 66}%)`; }
  update(dt) {
    this.groundY = this.H - this.bh * 1.4;
    const topLevel = this.tower.length - 1, naturalTop = this.groundY - topLevel * this.bh, targetCam = this.H * 0.42 - naturalTop;
    this.camY += (targetCam - this.camY) * Math.min(1, dt * 4);
    // Height milestone
    if (this.tower.length > 10 && this.tower.length > this.heightM + 10) {
      this.heightM = Math.floor(this.tower.length / 10) * 10;
      this.addScore(50 * (this.heightM / 10)); this.sound.power();
      this.flash(this.theme.accent, 0.2); this.confetti(this.W / 2, this.H * 0.3);
      this.float(this.W / 2, this.H * 0.2, this.heightM + ' blocks!', this.theme.accent);
    }
    const c = this.cur; c.x += c.dir * this.speed * dt;
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

/* ============================================================ SPORTS (Soccer/Kick) */

class Sports extends Base {
  instructions() { return 'Aim finger/mouse, release to kick! Beat the goalie, score consecutive goals for streak bonus. Power bar + angle guide help accuracy!'; }
  reset() {
    this.ball = { x: this.W * 0.5, y: this.H * 0.78, vx: 0, vy: 0, r: Math.max(14, this.W * 0.035), spin: 0, active: false, scored: false };
    this.goalie = { x: this.W * 0.5, y: this.H * 0.3, w: this.W * 0.08, h: this.H * 0.06, vx: 0, diveT: 0 };
    this.goalW = this.W * 0.45;
    this.goalL = this.W * 0.5 - this.goalW / 2;
    this.goalR = this.W * 0.5 + this.goalW / 2;
    this.goalY = this.H * 0.28;
    this.aiming = false;
    this.aimX = 0; this.aimY = 0;
    this.power = 0;
    this.round = 0;
    this.shotsLeft = 5;
    this.goals = 0;
    this.goalStreak = 0;
    this.gkSpeed = Math.max(120, this.W * 0.35);
    this.netFlash = 0;
    this.ballTrail = [];
  }
  onResize() { this.reset(); }
  update(dt) {
    const D = this.difficulty();
    this.gkSpeed = Math.max(120, this.W * 0.35) * (0.8 + D * 0.15);

    // Goalie AI — tracks ball x when active, wanders when idle
    if (this.ball.active) {
      const tgt = this.ball.x;
      const dx = tgt - this.goalie.x;
      this.goalie.vx = Math.sign(dx) * Math.min(Math.abs(dx) * 8, this.gkSpeed);
      this.goalie.x += this.goalie.vx * dt;
      this.goalie.x = Math.max(this.goalL + 20, Math.min(this.goalR - 20, this.goalie.x));
      if (this.ball.vy < 0 && Math.abs(this.ball.x - this.goalie.x) < this.W * 0.15 && this.ball.y < this.H * 0.5) {
        this.goalie.diveT = 0.35;
      }
    } else {
      this.goalie.x += Math.sin(this.time * 1.5) * this.gkSpeed * 0.3 * dt;
      this.goalie.x = Math.max(this.goalL + 20, Math.min(this.goalR - 20, this.goalie.x));
    }
    if (this.goalie.diveT > 0) this.goalie.diveT -= dt;

    // Ball physics
    if (this.ball.active) {
      this.ball.vy += 200 * dt; // gravity
      this.ball.x += this.ball.vx * dt;
      this.ball.y += this.ball.vy * dt;
      this.ball.spin += this.ball.vx * dt * 0.02;
      this.ballTrail.push({ x: this.ball.x, y: this.ball.y, life: 0.3 });
      if (this.ballTrail.length > 12) this.ballTrail.shift();

      // Goal check
      if (!this.ball.scored && this.ball.y < this.goalY + 10 && this.ball.vy < 0) {
        if (this.ball.x > this.goalL + 10 && this.ball.x < this.goalR - 10) {
          // Check goalie save
          const gy = this.goalie.y + (this.goalie.diveT > 0 ? 20 : 0);
          if (Math.abs(this.ball.x - this.goalie.x) < this.goalie.w * 0.6 && Math.abs(this.ball.y - gy) < this.goalie.h * 0.8) {
            // Saved!
            this.ball.vx = -this.ball.vx * 0.6 + (Math.random() - 0.5) * 100;
            this.ball.vy = Math.abs(this.ball.vy) * 0.5;
            this.sound.hit();
            this.burst(this.ball.x, this.ball.y, '#ff2a54', 8);
            this.shake = 0.5;
            this.ball.scored = true;
            this.float(this.ball.x, this.ball.y - 30, 'SAVED!', '#ff2a54');
          } else {
            this.ball.scored = true;
            this.goals++;
            this.goalStreak++;
            this.netFlash = 0.6;
            const streakBonus = this.goalStreak * 5;
            this.hitCombo(this.ball.x, this.goalY, 20 + streakBonus);
            this.confetti(this.W / 2, this.goalY);
            this.sound.power();
            this.float(this.W / 2, this.goalY + 30, 'GOAL!', this.theme.accent);
            if (this.goalStreak > 1) this.float(this.W / 2, this.goalY + 55, this.goalStreak + 'x streak!', '#ffd166');
          }
        }
      }

      // Off screen
      if (this.ball.y < -50 || this.ball.y > this.H + 50 || this.ball.x < -50 || this.ball.x > this.W + 50) {
        this._nextShot();
      }
    }

    // Power charge while aiming
    if (this.aiming) {
      this.power = Math.min(1, this.power + dt * 1.8);
    }

    // Trail life
    this.ballTrail.forEach(t => t.life -= dt);
    this.ballTrail = this.ballTrail.filter(t => t.life > 0);
    if (this.netFlash > 0) this.netFlash -= dt;
  }
  _nextShot() {
    this.round++;
    this.shotsLeft--;
    if (this.shotsLeft <= 0) { this.showOver(); return; }
    this.ball = { x: this.W * 0.5, y: this.H * 0.78, vx: 0, vy: 0, r: this.ball.r, spin: 0, active: false, scored: false };
    this.ballTrail = [];
    this.power = 0;
    this.aiming = false;
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(this.scroll);
    const gY = this.goalY, gL = this.goalL, gR = this.goalR;

    // Goal net
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(gL, gY + this.H * 0.08); c.lineTo(gL, gY); c.lineTo(gR, gY); c.lineTo(gR, gY + this.H * 0.08); c.stroke();
    // Net mesh
    c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1;
    for (let i = 0; i <= 8; i++) { const x = gL + (gR - gL) * i / 8; c.beginPath(); c.moveTo(x, gY); c.lineTo(x, gY + this.H * 0.08); c.stroke(); }
    for (let j = 0; j <= 3; j++) { const y = gY + this.H * 0.08 * j / 3; c.beginPath(); c.moveTo(gL, y); c.lineTo(gR, y); c.stroke(); }
    if (this.netFlash > 0) { c.fillStyle = `rgba(255,255,136,${this.netFlash * 0.4})`; c.fillRect(gL, gY - 5, gR - gL, this.H * 0.09); }

    // Goalie
    c.fillStyle = this.theme.dark ? '#4488ff' : '#3388dd';
    const gdive = this.goalie.diveT > 0 ? 15 : 0;
    c.save(); c.translate(this.goalie.x, this.goalie.y + gdive);
    c.beginPath(); c.ellipse(0, 0, this.goalie.w / 2, this.goalie.h / 2, 0, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.font = 'bold 14px Outfit'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🧤', 0, 0);
    c.restore();

    // Ground
    c.fillStyle = this.theme.dark ? 'rgba(60,50,80,.4)' : 'rgba(80,160,80,.3)';
    c.fillRect(0, this.H * 0.82, this.W, this.H * 0.18);
    c.strokeStyle = 'rgba(255,255,255,.15)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, this.H * 0.82); c.lineTo(this.W, this.H * 0.82); c.stroke();

    // Ball trail
    this.ballTrail.forEach(t => { c.globalAlpha = t.life / 0.3 * 0.5; c.fillStyle = this.theme.accent; c.shadowColor = this.theme.accent; c.shadowBlur = 8; c.beginPath(); c.arc(t.x, t.y, this.ball.r * 0.7 * (t.life / 0.3), 0, 7); c.fill(); c.shadowBlur = 0; });
    c.globalAlpha = 1;

    // Ball
    if (this.ball.y < this.H + 50) {
      c.save(); c.translate(this.ball.x, this.ball.y); c.rotate(this.ball.spin);
      c.fillStyle = '#fff'; c.strokeStyle = '#2b2340'; c.lineWidth = 2;
      c.beginPath(); c.arc(0, 0, this.ball.r, 0, 7); c.fill(); c.stroke();
      c.fillStyle = '#2b2340'; for (let i = 0; i < 5; i++) { const a = i * 2.4; c.beginPath(); c.arc(Math.cos(a) * this.ball.r * 0.5, Math.sin(a) * this.ball.r * 0.5, this.ball.r * 0.22, 0, 7); c.fill(); }
      c.restore();
    }

    // Aim line
    if (this.aiming && this.power > 0) {
      const dx = this.aimX - this.ball.x, dy = this.aimY - this.ball.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ang = Math.atan2(dy, dx);
      c.strokeStyle = `rgba(255,79,154,${this.power * 0.5})`; c.lineWidth = 4;
      c.setLineDash([8, 6]);
      c.beginPath(); c.moveTo(this.ball.x, this.ball.y); c.lineTo(this.ball.x + Math.cos(ang) * dist * this.power * 1.5, this.ball.y + Math.sin(ang) * dist * this.power * 1.5); c.stroke();
      c.setLineDash([]);
      // Power meter
      c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(this.W * 0.3, this.H - 30, this.W * 0.4, 16);
      c.fillStyle = `hsl(${(1 - this.power) * 120},80%,50%)`; c.fillRect(this.W * 0.3 + 2, this.H - 28, this.W * 0.4 * this.power - 4, 12);
    }

    // Hero behind ball
    this.hero(this.ball.x, this.H * 0.85, Math.max(48, this.W * 0.12), { t: this.time, expr: this.ball.active ? 'wow' : 'smile', anim: this.ball.active ? 'action' : 'idle' });

    // Score display
    c.fillStyle = '#fff'; c.font = 'bold 18px Outfit'; c.textAlign = 'left'; c.textBaseline = 'top';
    c.fillText(`Goals: ${this.goals}  |  Shots: ${this.shotsLeft}`, 16, 50);

    this.drawFx(); c.restore();
  }
  // Input handled via pointer
  _pointerDown(x, y) {
    if (!this.ball.active && x > this.ball.x - this.ball.r * 3 && x < this.ball.x + this.ball.r * 3 && y > this.ball.y - this.ball.r * 3 && y < this.ball.y + this.ball.r * 3) {
      this.aiming = true; this.aimX = x; this.aimY = y; this.power = 0;
    }
  }
  _pointerMove(x, y) { if (this.aiming) { this.aimX = x; this.aimY = y; } }
  _pointerUp() {
    if (this.aiming) {
      this.aiming = false;
      let dx = this.aimX - this.ball.x, dy = this.aimY - this.ball.y;
      if (Math.hypot(dx, dy) < 12) { dx = this.W * 0.5 - this.ball.x; dy = this.goalY - this.ball.y; }
      const dist = Math.max(20, Math.sqrt(dx * dx + dy * dy));
      const power = this.power * 600 + 200;
      this.ball.vx = (dx / dist) * power;
      this.ball.vy = (dy / dist) * power;
      this.ball.active = true;
      this.ball.scored = false;
      this.sound.jump();
      this.burst(this.ball.x, this.ball.y, this.theme.primary, 6);
    }
  }
}

/* ============================================================ RACING (Top-Down) */

class Racing extends Base {
  instructions() { return 'Steer with arrows or drag! Collect boosts, dodge cones, beat the AI rival! Fastest lap gets bonus points. Upgrade speed each lap!'; }
  reset() {
    this.trackR = Math.min(this.W, this.H) * 0.32;
    this.cx = this.W / 2; this.cy = this.H / 2;
    this.trackW = Math.max(60, this.W * 0.12);
    this.player = { x: this.cx, y: this.cy + this.trackR, angle: Math.PI, speed: 0, lap: 0 };
    this.ai = { x: this.cx, y: this.cy + this.trackR, angle: Math.PI, speed: 0, lap: 0, progress: Math.PI / 2 + 0.28 };
    this.cones = []; this.boosts = []; this.sparks = [];
    this.lapT = 0; this.lastQuad = 3; this.targetLaps = 3; this.raceResult = '';
    this._spawnCones();
    this._spawnBoosts();
    this.maxSpeed = Math.max(200, this.W * 0.5);
    this.accel = 180;
    this.lapTime = 0;
    this.fastestLap = 0;
  }
  onResize() { this.reset(); }
  _spawnCones() {
    this.cones = [];
    for (let i = 0; i < 8 + this.player.lap * 2; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = this.trackR + (Math.random() - 0.5) * this.trackW * 0.7;
      this.cones.push({ x: this.cx + Math.cos(a) * r, y: this.cy + Math.sin(a) * r, hit: false });
    }
  }
  _spawnBoosts() {
    this.boosts = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.3;
      const r = this.trackR + (Math.random() - 0.5) * this.trackW * 0.5;
      this.boosts.push({ x: this.cx + Math.cos(a) * r, y: this.cy + Math.sin(a) * r, used: false, pulse: 0 });
    }
  }
  update(dt) {
    const p = this.player;
    // Auto-accelerate
    p.speed = Math.min(this.maxSpeed, p.speed + this.accel * dt);
    // Steering
    const steer = (this.keys['arrowleft'] || this.keys['a'] ? -1 : 0) + (this.keys['arrowright'] || this.keys['d'] ? 1 : 0);
    if (this.pointer.down) {
      const dx = this.pointer.x - p.x, dy = this.pointer.y - p.y;
      if (Math.abs(dx) > 5) p.angle += Math.sign(dx) * 3 * dt;
    }
    p.angle += steer * 3 * dt;
    p.x += Math.cos(p.angle) * p.speed * dt;
    p.y += Math.sin(p.angle) * p.speed * dt;

    // Keep on track
    const dx = p.x - this.cx, dy = p.y - this.cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const outer = this.trackR + this.trackW / 2;
    const inner = this.trackR - this.trackW / 2;
    if (dist > outer) {
      const a = Math.atan2(dy, dx); p.x = this.cx + Math.cos(a) * outer; p.y = this.cy + Math.sin(a) * outer;
      p.speed *= 0.7; this.shake = 0.3; this.sound.hit();
    } else if (dist < inner) {
      const a = Math.atan2(dy, dx); p.x = this.cx + Math.cos(a) * inner; p.y = this.cy + Math.sin(a) * inner;
      p.speed *= 0.7; this.shake = 0.3;
    }

    // Lap detection — track angular position
    const ang = Math.atan2(dy, dx);
    const quad = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 4) % 4;
    if (this.lastQuad === 3 && quad === 0) {
      const completedLap = Math.max(0.1, this.lapTime);
      p.lap++;
      if (!this.fastestLap || completedLap < this.fastestLap) {
        this.fastestLap = completedLap;
        this.addScore(150);
        this.float(p.x, p.y - 54, 'FASTEST LAP!', '#ffd166');
      }
      this.addScore(Math.max(60, Math.floor(320 - completedLap * 8)));
      this.maxSpeed *= 1.06;
      this.lapTime = 0; this.confetti(p.x, p.y); this.sound.power();
      this.float(p.x, p.y - 30, `Lap ${p.lap}/${this.targetLaps}! Speed upgraded`, this.theme.accent);
      // Reshuffle cones and boosts
      this._spawnCones(); this._spawnBoosts();
      if (p.lap >= this.targetLaps) {
        this.raceResult = 'win'; this.addScore(500); this.achievement('Circuit champion', '🏁'); this.showOver(); return;
      }
    }
    this.lastQuad = quad;
    this.lapTime += dt;

    // Boost pads
    for (const b of this.boosts) {
      b.pulse += dt * 3;
      if (!b.used && Math.hypot(b.x - p.x, b.y - p.y) < 25) {
        b.used = true; p.speed = Math.min(this.maxSpeed * 1.5, p.speed + 150);
        this.sound.combo(3); this.burst(b.x, b.y, '#ffd166', 10);
        this.float(b.x, b.y - 20, 'BOOST!', '#ffd166');
      }
    }

    // Cones
    for (const cn of this.cones) {
      if (!cn.hit && Math.hypot(cn.x - p.x, cn.y - p.y) < 22) {
        cn.hit = true; p.speed *= 0.5; this.shake = 0.6; this.sound.hit();
        this.burst(cn.x, cn.y, '#ff2a54', 8); this.combo = 0; this.mult = 1; this.comboEl.textContent = '';
      }
    }

    // AI rival follows the racing line and gets slightly faster each lap.
    const ai = this.ai;
    ai.speed = this.maxSpeed * Math.min(0.92, 0.72 + ai.lap * 0.045 + (this.challenge === 'legend' ? 0.08 : 0));
    ai.progress += (ai.speed / Math.max(1, this.trackR)) * dt;
    ai.lap = Math.max(ai.lap, Math.floor((ai.progress - Math.PI / 2) / (Math.PI * 2)));
    const aiLine = this.trackR + Math.sin(ai.progress * 2.3) * this.trackW * 0.08;
    ai.x = this.cx + Math.cos(ai.progress) * aiLine;
    ai.y = this.cy + Math.sin(ai.progress) * aiLine;
    ai.angle = ai.progress + Math.PI / 2;
    if (ai.lap >= this.targetLaps) {
      this.raceResult = 'loss'; this.float(this.W / 2, this.H * 0.3, 'Rival wins — rematch!', '#ff8aa8'); this.showOver(); return;
    }

    // Passive score
    this.addScore(dt * 4 * (p.speed / this.maxSpeed));

    // Sparks trail
    if (p.speed > 100 && Math.random() < 0.3) {
      this.sparks.push({ x: p.x - Math.cos(p.angle) * 15, y: p.y - Math.sin(p.angle) * 15, life: 0.3, vx: -Math.cos(p.angle) * 30, vy: -Math.sin(p.angle) * 30 });
    }
    this.sparks.forEach(s => { s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; });
    this.sparks = this.sparks.filter(s => s.life > 0);
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(0);
    // Track — outer ring
    c.fillStyle = this.theme.dark ? '#2a2040' : '#666';
    c.beginPath(); c.arc(this.cx, this.cy, this.trackR + this.trackW / 2, 0, 7); c.arc(this.cx, this.cy, this.trackR - this.trackW / 2, 0, 7, true); c.fill();
    // Track surface
    c.fillStyle = this.theme.dark ? '#1a1530' : '#888';
    c.beginPath(); c.arc(this.cx, this.cy, this.trackR + this.trackW / 2 - 4, 0, 7); c.arc(this.cx, this.cy, this.trackR - this.trackW / 2 + 4, 0, 7, true); c.fill();
    // Center grass
    c.fillStyle = this.theme.dark ? 'rgba(60,50,80,.3)' : 'rgba(80,160,80,.25)';
    c.beginPath(); c.arc(this.cx, this.cy, this.trackR - this.trackW / 2 - 4, 0, 7); c.fill();
    // Lane markings
    c.strokeStyle = 'rgba(255,255,255,.15)'; c.lineWidth = 2; c.setLineDash([12, 12]);
    c.beginPath(); c.arc(this.cx, this.cy, this.trackR, 0, 7); c.stroke(); c.setLineDash([]);

    // Boost pads
    for (const b of this.boosts) {
      if (b.used) continue;
      const s = 18 + Math.sin(b.pulse) * 4;
      c.fillStyle = 'rgba(255,209,102,.3)'; c.beginPath(); c.arc(b.x, b.y, s + 6, 0, 7); c.fill();
      c.fillStyle = '#ffd166'; c.beginPath(); c.arc(b.x, b.y, s * 0.6, 0, 7); c.fill();
      this.glyph('⚡', b.x, b.y, 14);
    }
    // Cones
    for (const cn of this.cones) {
      if (cn.hit) continue;
      c.fillStyle = '#ff6b35'; c.beginPath(); c.moveTo(cn.x, cn.y - 12); c.lineTo(cn.x - 9, cn.y + 6); c.lineTo(cn.x + 9, cn.y + 6); c.closePath(); c.fill();
      c.fillStyle = '#fff'; c.fillRect(cn.x - 7, cn.y - 2, 14, 3);
    }
    // Sparks
    this.sparks.forEach(s => { c.globalAlpha = s.life / 0.3; c.fillStyle = '#ffd166'; c.beginPath(); c.arc(s.x, s.y, 3, 0, 7); c.fill(); });
    c.globalAlpha = 1;

    // AI rival car
    const rival = this.ai;
    c.save(); c.translate(rival.x, rival.y); c.rotate(rival.angle + Math.PI / 2);
    c.shadowColor = '#8a5cff'; c.shadowBlur = 10;
    c.fillStyle = '#8a5cff'; c.strokeStyle = '#efe7ff'; c.lineWidth = 2;
    rr2(c, -9, -15, 18, 30, 5); c.fill(); c.stroke();
    c.shadowBlur = 0; c.fillStyle = '#25d8ff'; c.fillRect(-6, -9, 12, 7); c.restore();

    // Player car
    const p = this.player;
    c.save(); c.translate(p.x, p.y); c.rotate(p.angle + Math.PI / 2);
    c.fillStyle = this.theme.primary; c.strokeStyle = '#2b2340'; c.lineWidth = 2;
    rr2(c, -10, -16, 20, 32, 5); c.fill(); c.stroke();
    c.fillStyle = this.theme.accent; c.fillRect(-7, -10, 14, 8);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(-8, 4, 16, 4);
    c.restore();

    // Hero in car
    this.hero(p.x, p.y, Math.max(30, this.W * 0.06), { t: this.time, run: p.speed > 50, expr: 'smile', anim: p.speed > 50 ? 'run' : p.speed > 5 ? 'walk' : 'idle' });

    // HUD: lap + time
    c.fillStyle = '#fff'; c.font = 'bold 16px Outfit'; c.textAlign = 'left'; c.textBaseline = 'top';
    c.fillText(`Lap: ${Math.min(this.targetLaps, p.lap + 1)}/${this.targetLaps}  |  ${this.lapTime.toFixed(1)}s${this.fastestLap ? `  |  Best ${this.fastestLap.toFixed(1)}s` : ''}`, 16, 50);

    this.drawFx(); c.restore();
  }
}

/* ============================================================ BREAKOUT */

class Breakout extends Base {
  instructions() { return 'Move paddle arrows/drag! Break bricks, catch falling power-ups. Hard bricks (2 hits), bomb bricks clear neighbors, speed bricks! Clear every level!'; }
  reset() {
    this.paddle = { x: this.W / 2, y: this.H * 0.88, w: Math.max(60, this.W * 0.16), h: 12 };
    this.ball = { x: this.W / 2, y: this.H * 0.7, vx: 0, vy: 0, r: 8, stuck: true };
    this.bricks = []; this.falling = []; this.level = 1;
    this._buildBricks();
    this.combo = 0;
    this.multiBall = null;
  }
  onResize() { this.reset(); }
  _buildBricks() {
    this.bricks = [];
    const cols = Math.min(8, Math.floor(this.W / 50));
    const rows = Math.min(6, 3 + Math.floor(this.level / 2));
    const bw = (this.W - 40) / cols - 4;
    const bh = 18;
    const startY = this.H * 0.15;
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const hp = r < 1 ? 2 : (Math.random() < 0.1 ? 2 : 1);
        const type = Math.random() < 0.08 ? 'bomb' : Math.random() < 0.10 ? 'power' : Math.random() < 0.08 ? 'speed' : 'normal';
        this.bricks.push({ x: 20 + col * (bw + 4), y: startY + r * (bh + 4), w: bw, h: bh, hp, maxhp: hp, type, hit: false });
      }
    }
  }
  update(dt) {
    const D = this.difficulty();
    // Paddle
    const steer = (this.keys['arrowleft'] ? -1 : 0) + (this.keys['arrowright'] ? 1 : 0);
    this.paddle.x += steer * 400 * dt;
    if (this.pointer.down || this.pointer.x) this.paddle.x = this.pointer.x;
    this.paddle.x = Math.max(this.paddle.w / 2, Math.min(this.W - this.paddle.w / 2, this.paddle.x));

    // Ball
    const b = this.ball;
    if (b.stuck) {
      b.x = this.paddle.x; b.y = this.paddle.y - 20;
      if (this.pointer.tapped || this.keys[' ']) { b.stuck = false; b.vx = (Math.random() - 0.5) * 200; b.vy = -320; this.sound.jump(); }
    } else {
      const sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      const target = 280 + D * 40;
      if (sp < target) { b.vx *= target / sp; b.vy *= target / sp; }
      b.x += b.vx * dt; b.y += b.vy * dt;
      // Wall bounce
      if (b.x < b.r) { b.x = b.r; b.vx = -b.vx; this.sound.blip(440, 0.04); }
      if (b.x > this.W - b.r) { b.x = this.W - b.r; b.vx = -b.vx; this.sound.blip(440, 0.04); }
      if (b.y < b.r) { b.y = b.r; b.vy = -b.vy; this.sound.blip(440, 0.04); }
      // Paddle bounce
      if (b.y > this.paddle.y - this.paddle.h / 2 - b.r && b.y < this.paddle.y + 10 && Math.abs(b.x - this.paddle.x) < this.paddle.w / 2 + b.r) {
        b.y = this.paddle.y - this.paddle.h / 2 - b.r;
        const off = (b.x - this.paddle.x) / (this.paddle.w / 2);
        const ang = -Math.PI / 2 + off * 0.6;
        const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        b.vx = Math.cos(ang) * spd; b.vy = Math.sin(ang) * spd;
        this.sound.blip(520, 0.06, 'square', 0.15);
        this.burst(b.x, b.y, this.theme.accent, 4);
      }
      // Lost ball
      if (b.y > this.H + 30) {
        this.loseLife();
        if (this.lives > 0) { b.stuck = true; b.vx = 0; b.vy = 0; }
      }
      // Brick collisions
      for (const br of this.bricks) {
        if (br.hit) continue;
        if (b.x + b.r > br.x && b.x - b.r < br.x + br.w && b.y + b.r > br.y && b.y - b.r < br.y + br.h) {
          // Determine bounce axis
          const overlapX = Math.min(b.x + b.r - br.x, br.x + br.w - (b.x - b.r));
          const overlapY = Math.min(b.y + b.r - br.y, br.y + br.h - (b.y - b.r));
          if (overlapX < overlapY) b.vx = -b.vx; else b.vy = -b.vy;
          br.hp--;
          if (br.hp <= 0) {
            br.hit = true;
            this.hitCombo(br.x + br.w / 2, br.y, 10);
            this.burst(br.x + br.w / 2, br.y + br.h / 2, this._brickColor(br), 8);
            if (br.type === 'bomb') {
              this.sound.hit(); this.shake = 0.8;
              for (const n of this.bricks) { if (!n.hit && Math.hypot(n.x - br.x, n.y - br.y) < 80) { n.hp = 0; n.hit = true; this.addScore(5); this.burst(n.x + n.w / 2, n.y + n.h / 2, '#ff6b35', 4); } }
            } else if (br.type === 'power') {
              this.falling.push({ x: br.x + br.w / 2, y: br.y + br.h / 2, vy: 80, type: ['shield', 'magnet', 'x2', 'slow', 'mega'][Math.floor(Math.random() * 5)] });
            } else if (br.type === 'speed') {
              const sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
              b.vx *= 1.3; b.vy *= 1.3;
              this.sound.blip(900, 0.06, 'square', 0.15);
              this.float(br.x + br.w / 2, br.y, 'SPEED!', '#ff6b35');
            }
          } else {
            this.sound.blip(300, 0.04, 'square', 0.1);
          }
        }
      }
      // Falling power-ups
      for (const f of this.falling) {
        f.y += f.vy * dt;
        if (f.y > this.paddle.y - 15 && f.y < this.paddle.y + 15 && Math.abs(f.x - this.paddle.x) < this.paddle.w / 2 + 15) {
          this.grantPower(f.type); f.y = this.H + 100;
        }
      }
      this.falling = this.falling.filter(f => f.y < this.H + 30);
    }
    // Level clear
    if (this.bricks.every(br => br.hit)) {
      this.level++; this.addScore(100); this.flash('#fff', 0.4); this.confetti(this.W / 2, this.H / 2); this.sound.power();
      this._buildBricks(); this.ball.stuck = true; this.ball.vx = 0; this.ball.vy = 0;
      this.float(this.W / 2, this.H * 0.4, `Level ${this.level}!`, this.theme.accent);
    }
  }
  _brickColor(br) {
    if (br.type === 'bomb') return '#ff6b35';
    if (br.type === 'power') return '#8a5cff';
    return `hsl(${(br.y * 3) % 360},65%,60%)`;
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(0);
    // Bricks
    for (const br of this.bricks) {
      if (br.hit) continue;
      const col = this._brickColor(br);
      c.fillStyle = col; c.strokeStyle = 'rgba(0,0,0,.15)'; c.lineWidth = 1;
      rr2(c, br.x, br.y, br.w, br.h, 4); c.fill(); c.stroke();
      if (br.maxhp > 1 && br.hp < br.maxhp) { c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(br.x + br.w * 0.5, br.y, br.w * 0.5, br.h); }
      c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(br.x + 2, br.y + 2, br.w - 4, 4);
      if (br.type !== 'normal') { c.fillStyle = 'rgba(255,255,255,.8)'; c.font = 'bold 10px Outfit'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(br.type === 'bomb' ? '💥' : '🎁', br.x + br.w / 2, br.y + br.h / 2); }
    }
    // Falling power-ups
    for (const f of this.falling) {
      const p = POWERS[f.type]; c.fillStyle = p.color; c.beginPath(); c.arc(f.x, f.y, 10, 0, 7); c.fill();
      this.glyph(p.icon, f.x, f.y, 12);
    }
    // Ball
    c.fillStyle = '#fff'; c.beginPath(); c.arc(this.ball.x, this.ball.y, this.ball.r, 0, 7); c.fill();
    // Paddle
    c.fillStyle = this.theme.primary; c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 2;
    rr2(c, this.paddle.x - this.paddle.w / 2, this.paddle.y - this.paddle.h / 2, this.paddle.w, this.paddle.h, 6); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(this.paddle.x - this.paddle.w / 2 + 2, this.paddle.y - this.paddle.h / 2 + 2, this.paddle.w - 4, 3);
    // Hero on paddle
    this.hero(this.paddle.x, this.paddle.y - 24, Math.max(28, this.W * 0.07), { t: this.time, run: !this.ball.stuck, expr: 'smile', anim: this.ball.stuck ? 'idle' : this.steering() ? 'walk' : 'idle' });
    // Level
    c.fillStyle = '#fff'; c.font = 'bold 14px Outfit'; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(`Level: ${this.level}`, 16, 50);
    this.drawFx(); c.restore();
  }
}

/* ============================================================ SNAKE */

class Snake extends Base {
  instructions() { return 'Arrows/swipe to steer! Eat food to grow. Portal gates teleport you across the board. Power food gives temporary abilities!'; }
  reset() {
    this.cell = Math.max(16, Math.min(this.W, this.H) / 18);
    this.cols = Math.floor(this.W / this.cell);
    this.rows = Math.floor(this.H / this.cell);
    this.snake = [{ x: Math.floor(this.cols / 2), y: Math.floor(this.rows / 2) }];
    this.dir = { x: 1, y: 0 }; this.nextDir = { x: 1, y: 0 };
    this.food = this._randCell();
    this.powerFood = null; this.powerT = 0;
    this.moveT = 0; this.moveInterval = Math.max(0.08, 0.18 - this.time * 0.001);
    this.growing = 0;
    this.gates = [];
    this._spawnGates();
  }
  onResize() { this.reset(); }
  _randCell() { return { x: Math.floor(Math.random() * this.cols), y: Math.floor(Math.random() * this.rows) }; }
  _spawnGates() {
    this.gates = [];
    if (this.cols < 6 || this.rows < 6) return;
    const g1 = this._randCell();
    let g2 = this._randCell();
    while (g2.x === g1.x && g2.y === g1.y) g2 = this._randCell();
    this.gates = [{ x: g1.x, y: g1.y, color: '#8a5cff' }, { x: g2.x, y: g2.y, color: '#ff4f9a' }];
  }
  update(dt) {
    // Direction from input
    if (this.keys['arrowup'] && this.dir.y === 0) this.nextDir = { x: 0, y: -1 };
    if (this.keys['arrowdown'] && this.dir.y === 0) this.nextDir = { x: 0, y: 1 };
    if (this.keys['arrowleft'] && this.dir.x === 0) this.nextDir = { x: -1, y: 0 };
    if (this.keys['arrowright'] && this.dir.x === 0) this.nextDir = { x: 1, y: 0 };
    if (this.pointer.tapped) {
      const dx = this.pointer.x - this.W / 2, dy = this.pointer.y - this.H / 2;
      if (Math.abs(dx) > Math.abs(dy)) { if (this.dir.x === 0) this.nextDir = { x: Math.sign(dx), y: 0 }; }
      else { if (this.dir.y === 0) this.nextDir = { x: 0, y: Math.sign(dy) }; }
    }

    this.moveT += dt;
    this.moveInterval = Math.max(0.06, 0.18 - this.time * 0.0015);
    if (this.moveT >= this.moveInterval) {
      this.moveT = 0;
      this.dir = this.nextDir;
      const head = this.snake[0];
      const nh = { x: head.x + this.dir.x, y: head.y + this.dir.y };
      // Wall collision
      if (nh.x < 0 || nh.x >= this.cols || nh.y < 0 || nh.y >= this.rows) {
        if (this.powers.shield) { delete this.powers.shield; this.sound.blip(300, 0.2); this.ring(nh.x * this.cell, nh.y * this.cell, POWERS.shield.color); }
        else { this.loseLife(); if (this.lives > 0) this.reset(); return; }
      }
      // Self collision
      for (const s of this.snake) {
        if (s.x === nh.x && s.y === nh.y) { this.loseLife(); if (this.lives > 0) this.reset(); return; }
      }
      this.snake.unshift(nh);
      // Portal gates
      if (this.gates.length === 2) {
        for (let gi = 0; gi < this.gates.length; gi++) {
          const g = this.gates[gi];
          if (nh.x === g.x && nh.y === g.y) {
            const other = this.gates[1 - gi];
            nh.x = other.x; nh.y = other.y;
            this.sound.power();
            this.ring(nh.x * this.cell + this.cell / 2, nh.y * this.cell + this.cell / 2, g.color);
            this.burst(nh.x * this.cell + this.cell / 2, nh.y * this.cell + this.cell / 2, g.color, 10);
            break;
          }
        }
      }
      // Food
      if (nh.x === this.food.x && nh.y === this.food.y) {
        this.hitCombo(nh.x * this.cell + this.cell / 2, nh.y * this.cell + this.cell / 2, 10);
        this.sound.coin(); this.burst(nh.x * this.cell + this.cell / 2, nh.y * this.cell + this.cell / 2, this.theme.accent, 6);
        this.food = this._randCell(); this.growing += 2;
        if (Math.random() < 0.2) this.powerFood = this._randCell();
      }
      // Power food
      if (this.powerFood && nh.x === this.powerFood.x && nh.y === this.powerFood.y) {
        this.grantPower(['shield', 'magnet', 'x2', 'slow'][Math.floor(Math.random() * 4)]);
        this.powerFood = null;
      }
      if (this.growing > 0) this.growing--; else this.snake.pop();
    }

    // Magnet attracts food
    if (this.powers.magnet) {
      const h = this.snake[0];
      const dx = this.food.x - h.x, dy = this.food.y - h.y;
      const d = Math.abs(dx) + Math.abs(dy);
      if (d < 6) { this.food.x += -Math.sign(dx); this.food.y += -Math.sign(dy); this.food.x = Math.max(0, Math.min(this.cols - 1, this.food.x)); this.food.y = Math.max(0, Math.min(this.rows - 1, this.food.y)); }
    }
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(0);
    const cs = this.cell;
    // Grid hint
    c.strokeStyle = 'rgba(255,255,255,.04)'; c.lineWidth = 1;
    for (let i = 0; i <= this.cols; i++) { c.beginPath(); c.moveTo(i * cs, 0); c.lineTo(i * cs, this.rows * cs); c.stroke(); }
    for (let j = 0; j <= this.rows; j++) { c.beginPath(); c.moveTo(0, j * cs); c.lineTo(this.cols * cs, j * cs); c.stroke(); }

    // Food
    c.fillStyle = this.theme.accent; c.beginPath(); c.arc(this.food.x * cs + cs / 2, this.food.y * cs + cs / 2, cs * 0.35, 0, 7); c.fill();
    this.glyph(this.theme.items[0], this.food.x * cs + cs / 2, this.food.y * cs + cs / 2, cs * 0.5);
    // Power food
    if (this.powerFood) {
      c.fillStyle = '#8a5cff'; c.beginPath(); c.arc(this.powerFood.x * cs + cs / 2, this.powerFood.y * cs + cs / 2, cs * 0.4 + Math.sin(this.time * 5) * 2, 0, 7); c.fill();
      this.glyph('✨', this.powerFood.x * cs + cs / 2, this.powerFood.y * cs + cs / 2, cs * 0.5);
    }
    // Gates
    if (this.gates.length === 2) {
      for (const g of this.gates) {
        c.save(); c.shadowColor = g.color; c.shadowBlur = 16;
        c.fillStyle = g.color; c.beginPath(); c.arc(g.x * cs + cs / 2, g.y * cs + cs / 2, cs * 0.45 + Math.sin(this.time * 3) * 2, 0, 7); c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(g.x * cs + cs / 2, g.y * cs + cs / 2, cs * 0.5, 0, 7); c.stroke();
        c.restore(); this.glyph('🌀', g.x * cs + cs / 2, g.y * cs + cs / 2, cs * 0.5);
      }
      // Portal beam
      const a = this.gates[0], b = this.gates[1];
      c.save(); c.globalAlpha = 0.1 + Math.sin(this.time * 2) * 0.05;
      c.strokeStyle = '#8a5cff'; c.lineWidth = 2; c.setLineDash([6, 8]);
      c.beginPath(); c.moveTo(a.x * cs + cs / 2, a.y * cs + cs / 2); c.lineTo(b.x * cs + cs / 2, b.y * cs + cs / 2); c.stroke();
      c.setLineDash([]); c.restore();
    }
    // Snake
    for (let i = 0; i < this.snake.length; i++) {
      const s = this.snake[i];
      c.fillStyle = i === 0 ? this.theme.primary : this.theme.dark ? shade(this.theme.primary, -i * 2) : tint(this.theme.primary, -i * 3);
      rr2(c, s.x * cs + 1, s.y * cs + 1, cs - 2, cs - 2, 4); c.fill();
    }
    // Hero head
    this.hero(this.snake[0].x * cs + cs / 2, this.snake[0].y * cs + cs / 2, Math.max(24, cs * 0.8), { t: this.time, expr: 'smile', face: this.dir.x, anim: 'walk' });
    // Length
    c.fillStyle = '#fff'; c.font = 'bold 14px Outfit'; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(`Length: ${this.snake.length}`, 16, 50);
    this.drawFx(); c.restore();
  }
}

/* ============================================================ RHYTHM */

class Rhythm extends Base {
  instructions() { return 'Tap shrinking circles when they match the target ring! Perfect = combo multiplier. Miss = streak lost. Chain perfects for bonus points!'; }
  reset() {
    this.notes = []; this.hitRings = []; this.spawnT = 0; this.spawnInterval = 1.2;
    this.perfectStreak = 0; this.totalHits = 0; this.misses = 0; this.maxStreak = 0;
    this.beatT = 0; this.beatPulse = 0;
    this.songProgress = 0; this.songDuration = 45; this.songEnded = false;
    this.lives = 5; this.drawLives();
  }
  onResize() { this.reset(); }
  update(dt) {
    const D = this.difficulty();
    this.spawnInterval = Math.max(0.48, 1.22 - this.time * 0.009) / Math.max(0.9, D * 0.78);
    this.beatT += dt;
    this.songProgress = Math.min(1, this.time / this.songDuration);
    if (this.beatT > 60 / 120) { this.beatT = 0; this.beatPulse = 1; this.sound.blip(200, 0.03, 'sine', 0.05); }
    if (this.beatPulse > 0) this.beatPulse -= dt * 3;

    this.spawnT += dt;
    if (this.time < this.songDuration && this.spawnT >= this.spawnInterval) {
      this.spawnT = 0;
      const x = this.W * (0.2 + Math.random() * 0.6);
      const y = this.H * (0.25 + Math.random() * 0.45);
      const type = Math.random() < 0.15 ? 'special' : 'normal';
      this.notes.push({ x, y, r: 0, maxR: Math.max(50, this.W * 0.1), life: 1.4, type, hit: false });
    }

    for (const n of this.notes) {
      n.life -= dt;
      n.r = n.maxR * (1 - n.life / 1.4);
      if (n.life <= 0 && !n.hit) {
        n.hit = true; this.misses++; this.perfectStreak = 0; this.combo = 0; this.mult = 1; this.comboEl.textContent = '';
        this.float(n.x, n.y, 'MISS', '#ff2a54'); this.sound.blip(150, 0.15, 'sawtooth', 0.1);
        this.shake = 0.3; this.loseLife();
        if (this.over) return;
      }
      // Check tap
      if (!n.hit && this.pointer.tapped) {
        const d = Math.hypot(this.pointer.x - n.x, this.pointer.y - n.y);
        const ringR = n.maxR * (1 - n.life / 1.4);
        const innerR = 20;
        if (d < Math.max(ringR, innerR) + 30) {
          const acc = Math.abs(ringR - innerR);
          n.hit = true;
          if (acc < 8) {
            this.perfectStreak++; this.totalHits++;
            if (this.perfectStreak > this.maxStreak) this.maxStreak = this.perfectStreak;
            const streakBonus = Math.floor(this.perfectStreak / 5) * 15;
            this.hitCombo(n.x, n.y, 20 + streakBonus);
            this.confetti(n.x, n.y); this.sound.power();
            this.hitRings.push({ x: n.x, y: n.y, r: 0, life: 0.5, color: '#ffd166' });
            this.float(n.x, n.y - 20, 'PERFECT!', '#ffd166');
            if (n.type === 'special') {
              this.powers.x2 = Math.max(this.powers.x2 || 0, 8);
              this.addScore(50); this.flash('#ffd166', 0.18);
              this.float(n.x, n.y + 38, 'STAR NOTE: DOUBLE SCORE!', '#fff3a0');
            }
            if (this.perfectStreak >= 5 && this.perfectStreak % 5 === 0) this.float(n.x, n.y - 45, this.perfectStreak + 'x streak!', '#ffd166');
          } else if (acc < 20) {
            this.totalHits++; this.hitCombo(n.x, n.y, 10);
            this.burst(n.x, n.y, this.theme.accent, 6); this.sound.coin();
            this.hitRings.push({ x: n.x, y: n.y, r: 0, life: 0.4, color: this.theme.accent });
            this.float(n.x, n.y - 20, 'GOOD!', this.theme.accent);
          } else {
            this.perfectStreak = 0; this.misses++; this.combo = 0; this.mult = 1; this.comboEl.textContent = '';
            this.float(n.x, n.y, 'EARLY', '#ff2a54'); this.sound.blip(150, 0.1, 'sawtooth', 0.08);
            this.loseLife();
            if (this.over) return;
          }
        }
      }
    }
    this.notes = this.notes.filter(n => !n.hit || n.life > -0.2);
    this.hitRings.forEach(r => { r.r += 200 * dt; r.life -= dt; });
    this.hitRings = this.hitRings.filter(r => r.life > 0);
    if (!this.songEnded && this.time >= this.songDuration && this.notes.every((note) => note.hit || note.life <= 0)) {
      this.songEnded = true;
      const attempts = this.totalHits + this.misses;
      const accuracy = attempts ? this.totalHits / attempts : 0;
      const clearBonus = Math.round(300 + accuracy * 700 + this.maxStreak * 12);
      this.addScore(clearBonus);
      this.achievement(accuracy >= 0.9 ? 'Platinum performance' : 'Song complete', accuracy >= 0.9 ? '💿' : '🎵');
      this.showOver();
    }
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(0);
    // Beat pulse background
    if (this.beatPulse > 0) { c.fillStyle = `rgba(255,79,154,${this.beatPulse * 0.06})`; c.fillRect(0, 0, this.W, this.H); }

    // Notes
    for (const n of this.notes) {
      if (n.hit && n.life <= 0) continue;
      const ringR = n.maxR * (1 - n.life / 1.4);
      // Outer shrinking ring
      c.strokeStyle = n.type === 'special' ? '#ffd166' : this.theme.primary; c.lineWidth = 3;
      c.globalAlpha = Math.min(1, n.life * 2);
      c.beginPath(); c.arc(n.x, n.y, Math.max(2, ringR), 0, 7); c.stroke();
      // Target ring (fixed)
      c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 2;
      c.beginPath(); c.arc(n.x, n.y, 20, 0, 7); c.stroke();
      // Center
      c.fillStyle = n.type === 'special' ? 'rgba(255,209,102,.2)' : 'rgba(255,79,154,.15)';
      c.beginPath(); c.arc(n.x, n.y, 18, 0, 7); c.fill();
      c.globalAlpha = 1;
    }
    // Hit rings
    this.hitRings.forEach(r => { c.globalAlpha = r.life / 0.5; c.strokeStyle = r.color; c.lineWidth = 4; c.beginPath(); c.arc(r.x, r.y, r.r, 0, 7); c.stroke(); });
    c.globalAlpha = 1;

    // Hero
    this.hero(this.W / 2, this.H * 0.9, Math.max(40, this.W * 0.1), { t: this.time, expr: this.beatPulse > 0.5 ? 'wow' : 'smile', anim: this.beatPulse > 0.5 ? 'action' : 'idle' });

    // Song progress bar
    c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(0, this.H - 4, this.W, 4);
    c.fillStyle = this.theme.accent; c.fillRect(0, this.H - 4, this.W * Math.min(1, this.songProgress), 4);
    // Stats
    c.fillStyle = '#fff'; c.font = 'bold 14px Outfit'; c.textAlign = 'left'; c.textBaseline = 'top';
    c.fillText(`Hits: ${this.totalHits}  Perfect: ${this.perfectStreak}×  Miss: ${this.misses}`, 16, 50);
    this.drawFx(); c.restore();
  }
}

/* ============================================================ TOWER DEFENSE */

class TowerDefense extends Base {
  instructions() { return 'Tap empty spots to build towers! Towers auto-fire at enemies. Survive the waves and earn coins for more towers!'; }
  reset() {
    this.path = this._buildPath();
    this.towers = []; this.enemies = []; this.bullets = [];
    this.coins = 80; this.wave = 0; this.waveT = 2; this.spawnIdx = 0; this.spawnT = 0;
    this.waveSize = 8; this.lives = 5; this.drawLives();
    this._startWave();
  }
  _buildPath() {
    const pts = [];
    const segs = 5;
    for (let i = 0; i <= segs; i++) {
      pts.push({ x: this.W * (i / segs), y: this.H * (0.3 + Math.sin(i * 1.3) * 0.15) });
    }
    return pts;
  }
  _startWave() {
    this.wave++; this.waveSize = 6 + this.wave * 2; this.spawnIdx = 0; this.spawnT = 0;
    this.float(this.W / 2, this.H * 0.15, `Wave ${this.wave}!`, this.theme.accent);
  }
  onResize() { this.reset(); }
  _pathPos(t) {
    const p = this.path; let acc = 0;
    for (let i = 0; i < p.length - 1; i++) {
      const d = Math.hypot(p[i + 1].x - p[i].x, p[i + 1].y - p[i].y);
      if (acc + d >= t) { const f = (t - acc) / d; return { x: p[i].x + (p[i + 1].x - p[i].x) * f, y: p[i].y + (p[i + 1].y - p[i].y) * f }; }
      acc += d;
    }
    return { x: p[p.length - 1].x, y: p[p.length - 1].y };
  }
  _pathLen() { let l = 0; for (let i = 0; i < this.path.length - 1; i++) l += Math.hypot(this.path[i + 1].x - this.path[i].x, this.path[i + 1].y - this.path[i].y); return l; }
  update(dt) {
    const D = this.difficulty();
    const plen = this._pathLen();

    // Spawn enemies
    if (this.spawnIdx < this.waveSize) {
      this.spawnT += dt;
      if (this.spawnT > 0.8) {
        this.spawnT = 0; this.spawnIdx++;
        const hp = 3 + Math.floor(this.wave * 1.5);
        const sp = (40 + this.wave * 5) * (0.85 + Math.random() * 0.3);
        this.enemies.push({ t: 0, hp, maxhp: hp, sp, x: this.path[0].x, y: this.path[0].y, dead: false, type: Math.random() < 0.15 ? 'tank' : 'normal' });
      }
    } else if (this.enemies.length === 0) {
      this._startWave(); this.coins += 30; this.addScore(50);
    }

    // Move enemies
    for (const e of this.enemies) {
      e.t += e.sp * dt * (e.type === 'tank' ? 0.6 : 1);
      const pos = this._pathPos(Math.min(e.t, plen));
      e.x = pos.x; e.y = pos.y;
      if (e.t >= plen) { e.dead = true; this.lives--; this.drawLives(); this.shake = 0.5; this.sound.hit(); if (this.lives <= 0) this.showOver(); }
    }

    // Towers fire
    for (const tw of this.towers) {
      tw.cd -= dt;
      if (tw.cd <= 0) {
        // Find nearest enemy
        let best = null, bestD = tw.range;
        for (const e of this.enemies) { if (e.dead) continue; const d = Math.hypot(e.x - tw.x, e.y - tw.y); if (d < bestD) { bestD = d; best = e; } }
        if (best) {
          tw.cd = tw.rate;
          this.bullets.push({ x: tw.x, y: tw.y, tx: best.x, ty: best.y, target: best, dmg: tw.dmg, life: 0.5 });
          this.sound.blip(600, 0.04, 'square', 0.1);
        }
      }
    }

    // Bullets
    for (const b of this.bullets) {
      b.life -= dt;
      if (b.target && !b.target.dead) { b.tx = b.target.x; b.ty = b.target.y; }
      const dx = b.tx - b.x, dy = b.ty - b.y; const d = Math.hypot(dx, dy);
      if (d < 10 || b.life <= 0) {
        b.life = 0;
        if (b.target && !b.target.dead) {
          b.target.hp -= b.dmg;
          this.burst(b.tx, b.ty, this.theme.accent, 4);
          if (b.target.hp <= 0) {
            b.target.dead = true; this.coins += 5;
            this.hitCombo(b.target.x, b.target.y, 8);
            this.confetti(b.target.x, b.target.y); this.sound.coin();
          }
        }
      } else { b.x += (dx / d) * 400 * dt; b.y += (dy / d) * 400 * dt; }
    }

    this.enemies = this.enemies.filter(e => !e.dead);
    this.bullets = this.bullets.filter(b => b.life > 0);

    // Place tower on tap (or upgrade existing)
    if (this.pointer.tapped && this.coins >= 40) {
      const tx = this.pointer.x, ty = this.pointer.y;
      const existing = this.towers.find(t => Math.hypot(t.x - tx, t.y - ty) < 30);
      if (existing && existing.lvl < 3 && this.coins >= 60) {
        this.coins -= 60; existing.lvl++; existing.dmg += 1; existing.range += 20; existing.rate = Math.max(0.15, existing.rate - 0.05);
        this.burst(tx, ty, this.theme.accent, 12); this.sound.power();
        this.float(tx, ty - 20, 'Upgrade Lv.' + existing.lvl + '!', '#ffd166');
      } else {
        let onPath = false;
        for (let i = 0; i < this.path.length - 1; i++) {
          const d = this._distToSeg(tx, ty, this.path[i], this.path[i + 1]);
          if (d < 30) { onPath = true; break; }
        }
        if (!onPath && !this.towers.some(t => Math.hypot(t.x - tx, t.y - ty) < 40)) {
          this.coins -= 40; this.towers.push({ x: tx, y: ty, range: 100, rate: 0.4, dmg: 1, cd: 0, lvl: 1 });
          this.burst(tx, ty, this.theme.primary, 8); this.sound.power();
        }
      }
    }
  }
  _distToSeg(px, py, a, b) { const dx = b.x - a.x, dy = b.y - a.y; const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(px - (a.x + dx * t), py - (a.y + dy * t)); }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(0);
    // Path
    c.strokeStyle = this.theme.dark ? 'rgba(100,80,140,.4)' : 'rgba(120,100,80,.3)'; c.lineWidth = 36; c.lineCap = 'round';
    c.beginPath(); c.moveTo(this.path[0].x, this.path[0].y); for (let i = 1; i < this.path.length; i++) c.lineTo(this.path[i].x, this.path[i].y); c.stroke();
    c.strokeStyle = this.theme.dark ? 'rgba(60,40,100,.5)' : 'rgba(100,80,60,.4)'; c.lineWidth = 30;
    c.beginPath(); c.moveTo(this.path[0].x, this.path[0].y); for (let i = 1; i < this.path.length; i++) c.lineTo(this.path[i].x, this.path[i].y); c.stroke();

    // Towers
    for (const tw of this.towers) {
      c.save(); if (tw.lvl > 1) { c.shadowColor = this.theme.accent; c.shadowBlur = 8 + tw.lvl * 4; }
      c.fillStyle = this.theme.primary; c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 2;
      c.beginPath(); c.arc(tw.x, tw.y, 14, 0, 7); c.fill(); c.stroke(); c.shadowBlur = 0;
      c.fillStyle = this.theme.accent; c.beginPath(); c.arc(tw.x, tw.y, 6, 0, 7); c.fill();
      if (tw.lvl > 1) { c.fillStyle = '#fff'; c.font = 'bold 9px Outfit'; c.textAlign = 'center'; c.textBaseline = 'bottom'; c.fillText('Lv.' + tw.lvl, tw.x, tw.y - 16); }
      c.restore();
      // Range indicator on hover
      if (Math.hypot(this.pointer.x - tw.x, this.pointer.y - tw.y) < 30) { c.strokeStyle = 'rgba(255,255,255,.15)'; c.lineWidth = 1; c.beginPath(); c.arc(tw.x, tw.y, tw.range, 0, 7); c.stroke(); }
    }

    // Enemies
    for (const e of this.enemies) {
      c.fillStyle = e.type === 'tank' ? '#8a5cff' : '#ff2a54'; c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 2;
      c.beginPath(); c.arc(e.x, e.y, 12 + (e.type === 'tank' ? 4 : 0), 0, 7); c.fill(); c.stroke();
      // HP bar
      c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(e.x - 12, e.y - 20, 24, 4);
      c.fillStyle = '#4fe0a0'; c.fillRect(e.x - 12, e.y - 20, 24 * (e.hp / e.maxhp), 4);
      this.glyph(e.type === 'tank' ? '👾' : '🔴', e.x, e.y, 12);
    }

    // Bullets
    c.fillStyle = this.theme.accent;
    for (const b of this.bullets) { c.beginPath(); c.arc(b.x, b.y, 4, 0, 7); c.fill(); }

    // Build hint
    if (this.coins >= 40) { c.fillStyle = 'rgba(255,255,255,.1)'; c.beginPath(); c.arc(this.pointer.x, this.pointer.y, 16, 0, 7); c.fill(); }

    // Hero at end of path
    const end = this.path[this.path.length - 1];
    this.hero(end.x + 30, end.y, Math.max(30, this.W * 0.08), { t: this.time, expr: 'smile' });

    // HUD
    c.fillStyle = '#fff'; c.font = 'bold 14px Outfit'; c.textAlign = 'left'; c.textBaseline = 'top';
    c.fillText(`🪙 ${this.coins}  |  Wave: ${this.wave}  |  Towers: ${this.towers.length}`, 16, 50);

    this.drawFx(); c.restore();
  }
}

/* ============================================================ PINBALL */

class Pinball extends Base {
  instructions() { return 'Flippers: ← / → or tap sides! Hit bumpers for points, clear targets, catch the spinner for bonus. Multi-ball mode activates at 50 bumper hits!'; }
  reset() {
    this.ball = { x: this.W / 2, y: this.H * 0.3, vx: 0, vy: 0, r: 10 };
    this.balls = [];
    this.gravity = 500;
    this.flipL = { angle: 0.4, target: 0.4, active: false };
    this.flipR = { angle: -0.4, target: -0.4, active: false };
    this.flipLen = Math.max(40, this.W * 0.12);
    this.flipY = this.H * 0.85;
    this.flipLx = this.W * 0.3; this.flipRx = this.W * 0.7;
    this.bumpers = [];
    this.targets = [];
    this.spinner = { x: this.W * 0.5, y: this.H * 0.45, r: 16, angle: 0, spin: 0, active: false };
    this.totalBumperHits = 0;
    this._buildBumpers();
    this._buildTargets();
    this.stuckT = 0;
  }
  onResize() { this.reset(); }
  _buildBumpers() {
    this.bumpers = [];
    for (let i = 0; i < 4; i++) {
      this.bumpers.push({ x: this.W * (0.25 + i * 0.17), y: this.H * (0.3 + (i % 2) * 0.12), r: 18, flash: 0, hits: 0 });
    }
  }
  _buildTargets() {
    this.targets = [];
    for (let i = 0; i < 5; i++) {
      this.targets.push({ x: this.W * 0.15 + i * (this.W * 0.7 / 4), y: this.H * 0.15, w: 30, h: 10, hit: false });
    }
  }
  update(dt) {
    // Flipper control
    this.flipL.active = this.keys['arrowleft'] || (this.pointer.down && this.pointer.x < this.W / 2);
    this.flipR.active = this.keys['arrowright'] || (this.pointer.down && this.pointer.x > this.W / 2);
    this.flipL.target = this.flipL.active ? -0.5 : 0.4;
    this.flipR.target = this.flipR.active ? 0.5 : -0.4;
    this.flipL.angle += (this.flipL.target - this.flipL.angle) * Math.min(1, dt * 20);
    this.flipR.angle += (this.flipR.target - this.flipR.angle) * Math.min(1, dt * 20);

    // Active balls (main + multi-ball)
    if (!this.balls.length) this.balls = [this.ball];
    for (const b of this.balls) {
      b.vy += this.gravity * dt;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.8; this.sound.blip(440, 0.04); }
      if (b.x > this.W - b.r) { b.x = this.W - b.r; b.vx = -Math.abs(b.vx) * 0.8; this.sound.blip(440, 0.04); }
      if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * 0.8; }

      // Bumpers
      for (const bp of this.bumpers) {
        const d = Math.hypot(b.x - bp.x, b.y - bp.y);
        if (d < bp.r + b.r) {
          const a = Math.atan2(b.y - bp.y, b.x - bp.x);
          b.x = bp.x + Math.cos(a) * (bp.r + b.r + 1);
          b.y = bp.y + Math.sin(a) * (bp.r + b.r + 1);
          const sp = Math.hypot(b.vx, b.vy);
          b.vx = Math.cos(a) * Math.max(sp * 1.3, 250);
          b.vy = Math.sin(a) * Math.max(sp * 1.3, 250);
          bp.flash = 0.4; bp.hits++; this.totalBumperHits++;
          this.hitCombo(bp.x, bp.y, 5);
          this.burst(bp.x, bp.y, this.theme.accent, 6); this.sound.combo(bp.hits);
        }
        if (bp.flash > 0) bp.flash -= dt;
      }

      // Targets
      for (const t of this.targets) {
        if (t.hit) continue;
        if (b.x + b.r > t.x && b.x - b.r < t.x + t.w && b.y + b.r > t.y && b.y - b.r < t.y + t.h) {
          t.hit = true; b.vy = Math.abs(b.vy) * 0.8;
          this.hitCombo(t.x + t.w / 2, t.y, 15); this.sound.power();
          this.burst(t.x + t.w / 2, t.y + t.h / 2, '#ffd166', 8);
        }
      }

      // Spinner
      const sp = this.spinner;
      if (Math.hypot(b.x - sp.x, b.y - sp.y) < sp.r + b.r) {
        const ang = Math.atan2(b.y - sp.y, b.x - sp.x);
        sp.spin += Math.abs(b.vx + b.vy) * 0.001;
        b.vx = Math.cos(ang) * 200; b.vy = Math.sin(ang) * 200;
        if (!sp.active) { sp.active = true; this.addScore(10); this.sound.coin(); }
      }
      sp.angle += sp.spin * dt;
      sp.spin *= 0.98;

      // Flippers
      this._flipperCollide(this.flipLx, this.flipY, this.flipLen, this.flipL.angle, this.flipL.active, b);
      this._flipperCollide(this.flipRx, this.flipY, this.flipLen, this.flipR.angle, this.flipR.active, b);

      // Drain
      b.lost = b.y > this.H + 30;
    }

    // Multi-ball: every 50 bumper hits spawn extra ball
    if (this.totalBumperHits >= 50 && this.balls.length < 3) {
      this.totalBumperHits = 0;
      const nb = { x: this.W / 2 + (Math.random() - 0.5) * 60, y: this.H * 0.3, vx: (Math.random() - 0.5) * 150, vy: -100, r: 10 };
      this.balls.push(nb);
      this.flash('#ffd166', 0.3);
      this.float(this.W / 2, this.H * 0.25, 'Multi-Ball!', '#ffd166');
    }
    this.balls = this.balls.filter(b => !b.lost);
    if (this.targets.every(t => t.hit)) { this.addScore(50); this.confetti(this.W / 2, this.H * 0.2); this._buildTargets(); this.float(this.W / 2, this.H * 0.2, 'Targets Cleared!', '#ffd166'); }

    if (this.balls.length === 0) {
      this.loseLife();
      if (this.lives > 0) { this.ball = { x: this.W / 2, y: this.H * 0.3, vx: (Math.random() - 0.5) * 100, vy: 0, r: 10 }; this.balls = [this.ball]; }
    }

    // Anti-stuck for main ball
    const b0 = this.balls[0];
    if (b0 && Math.abs(b0.vx) < 10 && Math.abs(b0.vy) < 30) { this.stuckT += dt; if (this.stuckT > 1) { b0.vx = (Math.random() - 0.5) * 200; b0.vy = -100; this.stuckT = 0; } }
    else this.stuckT = 0;
  }
  _flipperCollide(fx, fy, len, angle, active, b) {
    if (!b) b = this.ball;
    const tipX = fx + Math.cos(angle - Math.PI) * len;
    const tipY = fy + Math.sin(angle - Math.PI) * len;
    const d = this._distToSeg(b.x, b.y, { x: fx, y: fy }, { x: tipX, y: tipY });
    if (d < b.r + 6) {
      const a = Math.atan2(b.y - fy, b.x - fx);
      b.x = fx + Math.cos(a) * (b.r + 8);
      b.y = fy + Math.sin(a) * (b.r + 8);
      b.vy = -Math.max(Math.abs(b.vy), active ? 500 : 200);
      b.vx += (Math.random() - 0.5) * 50;
      if (active) { this.sound.blip(660, 0.08, 'square', 0.15); this.burst(b.x, b.y, this.theme.primary, 4); }
    }
  }
  _distToSeg(px, py, a, b) { const dx = b.x - a.x, dy = b.y - a.y; const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(px - (a.x + dx * t), py - (a.y + dy * t)); }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(0);
    // Bumpers
    for (const bp of this.bumpers) {
      c.fillStyle = bp.flash > 0 ? '#fff' : this.theme.primary; c.strokeStyle = this.theme.accent; c.lineWidth = 3;
      c.beginPath(); c.arc(bp.x, bp.y, bp.r, 0, 7); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.arc(bp.x - 4, bp.y - 4, bp.r * 0.4, 0, 7); c.fill();
    }
    // Targets
    for (const t of this.targets) {
      if (t.hit) continue;
      c.fillStyle = '#ffd166'; c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 2;
      rr2(c, t.x, t.y, t.w, t.h, 3); c.fill(); c.stroke();
    }
    // Spinner
    const sp = this.spinner;
    c.save(); c.translate(sp.x, sp.y); c.rotate(sp.angle);
    c.strokeStyle = sp.active ? '#ffd166' : 'rgba(255,255,255,.3)'; c.lineWidth = 4;
    c.beginPath(); c.arc(0, 0, sp.r, 0, 7); c.stroke();
    c.beginPath(); c.moveTo(-sp.r * 0.7, 0); c.lineTo(sp.r * 0.7, 0); c.stroke();
    c.beginPath(); c.moveTo(0, -sp.r * 0.7); c.lineTo(0, sp.r * 0.7); c.stroke();
    c.fillStyle = 'rgba(255,209,102,.15)'; c.beginPath(); c.arc(0, 0, sp.r * 0.3, 0, 7); c.fill();
    c.restore();
    // Flippers
    c.strokeStyle = this.theme.primary; c.lineWidth = 8; c.lineCap = 'round';
    c.beginPath(); c.moveTo(this.flipLx, this.flipY); c.lineTo(this.flipLx + Math.cos(this.flipL.angle - Math.PI) * this.flipLen, this.flipY + Math.sin(this.flipL.angle - Math.PI) * this.flipLen); c.stroke();
    c.beginPath(); c.moveTo(this.flipRx, this.flipY); c.lineTo(this.flipRx + Math.cos(this.flipR.angle - Math.PI) * this.flipLen, this.flipY + Math.sin(this.flipR.angle - Math.PI) * this.flipLen); c.stroke();
    // Flipper pivots
    c.fillStyle = this.theme.accent; c.beginPath(); c.arc(this.flipLx, this.flipY, 5, 0, 7); c.fill(); c.beginPath(); c.arc(this.flipRx, this.flipY, 5, 0, 7); c.fill();
    // Ball(s)
    for (const b of this.balls) {
      c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 2; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(b.x - 3, b.y - 3, 4, 0, 7); c.fill();
    }
    // Hero
    this.hero(this.W / 2, this.H * 0.95, Math.max(30, this.W * 0.08), { t: this.time, expr: 'smile' });
    this.drawFx(); c.restore();
  }
}

/* ============================================================ FISHING */

class Fishing extends Base {
  instructions() { return 'Hold to choose your cast depth, release to cast, then tap rapidly when a fish bites. Rare catches and streaks earn huge bonuses!'; }
  reset() {
    this.hook = { x: this.W / 2, y: this.H * 0.3, vy: 0, state: 'idle', depth: 0 };
    this.fish = []; this.castPower = 0; this.casting = false;
    this.bite = null; this.reelT = 0; this.reelProgress = 0;
    this.ripples = [];
    this._spawnFish();
    this.totalCatch = 0;
    this.catchStreak = 0;
    this.rareCount = 0;
    this.waterLine = this.H * 0.3;
  }
  onResize() { this.reset(); }
  _spawnFish() {
    this.fish = [];
    const types = [
      { name: 'common', color: '#88ccff', size: 14, points: 5, speed: 40, rarity: 0.5 },
      { name: 'rare', color: '#ffd166', size: 18, points: 15, speed: 60, rarity: 0.25 },
      { name: 'epic', color: '#8a5cff', size: 22, points: 30, speed: 80, rarity: 0.15 },
      { name: 'legendary', color: '#ff4f9a', size: 28, points: 60, speed: 100, rarity: 0.1 },
    ];
    for (let i = 0; i < 8; i++) {
      const r = Math.random();
      let acc = 0, type = types[0];
      for (const t of types) { acc += t.rarity; if (r < acc) { type = t; break; } }
      this.fish.push({
        x: Math.random() * this.W, y: this.waterLine + 50 + Math.random() * (this.H - this.waterLine - 80),
        vx: (Math.random() - 0.5) * type.speed, type, dir: 1, biteT: 0, hooked: false
      });
    }
  }
  update(dt) {
    const D = this.difficulty();
    // Cast power
    if (this.casting) this.castPower = Math.min(1, this.castPower + dt * 2);

    // Hook states
    if (this.hook.state === 'casting') {
      this.hook.vy += 300 * dt;
      this.hook.y += this.hook.vy * dt;
      if (this.hook.y >= this.waterLine + this.castPower * (this.H * 0.5)) {
        this.hook.y = this.waterLine + this.castPower * (this.H * 0.5);
        this.hook.state = 'waiting'; this.hook.depth = this.hook.y;
        this.sound.blip(300, 0.1, 'sine', 0.1);
        this.ripples.push({ x: this.hook.x, y: this.hook.y, r: 0, life: 0.6 });
      }
    } else if (this.hook.state === 'waiting') {
      // Gentle bob
      this.hook.y = this.hook.depth + Math.sin(this.time * 2) * 3;
      // Check fish bite
      for (const f of this.fish) {
        if (f.hooked) continue;
        if (Math.hypot(f.x - this.hook.x, f.y - this.hook.y) < 30) {
          f.hooked = true; this.bite = f; this.hook.state = 'bite';
          this.reelT = 0; this.reelProgress = 0;
          this.sound.blip(660, 0.15, 'square', 0.15); this.shake = 0.3;
          this.float(this.hook.x, this.hook.y - 20, 'BITE!', '#ffd166');
        }
      }
    } else if (this.hook.state === 'bite') {
      this.reelT += dt;
      // Fish escapes if not reeled in time
      if (this.reelT > 3) {
        if (this.bite) { this.bite.hooked = false; this.bite = null; }
        this.hook.state = 'idle'; this.hook.y = this.H * 0.3; this.combo = 0; this.mult = 1; this.comboEl.textContent = '';
        this.float(this.hook.x, this.hook.y, 'Got away...', '#ff2a54');
      }
      // Tap to reel
      if (this.pointer.tapped) {
        this.reelProgress += 0.15 + (this.bite ? 1 / this.bite.type.size : 0.1);
        this.sound.blip(800, 0.05, 'square', 0.1);
        this.burst(this.hook.x, this.hook.y, this.theme.accent, 3);
        if (this.bite) { this.bite.x = this.hook.x; this.bite.y = this.hook.y; }
        this.hook.y -= 10;
        if (this.reelProgress >= 1) {
          // Caught!
          const pts = this.bite ? this.bite.type.points : 5;
          this.catchStreak++;
          this.totalCatch++;
          if (this.bite && (this.bite.type.name === 'rare' || this.bite.type.name === 'epic' || this.bite.type.name === 'legendary')) this.rareCount++;
          const streakBonus = Math.floor(this.catchStreak / 3) * 5;
          this.hitCombo(this.hook.x, this.hook.y, pts + streakBonus);
          this.confetti(this.hook.x, this.hook.y); this.sound.power();
          this.float(this.hook.x, this.hook.y - 30, `${this.bite.type.name.toUpperCase()}! +${pts}`, this.bite.type.color);
          if (this.catchStreak > 1) this.float(this.hook.x + 40, this.hook.y - 20, this.catchStreak + 'x streak!', '#ffd166');
          if (this.bite) { this.bite.hooked = false; this.bite.y = -100; this.bite.x = Math.random() * this.W; this.bite.y = this.waterLine + 50 + Math.random() * (this.H - this.waterLine - 80); }
          this.bite = null;
          this.hook.state = 'idle'; this.hook.y = this.H * 0.3;
        }
      }
    }

    // Ripples
    for (const r of this.ripples) { r.life -= dt; r.r += dt * 40; }
    this.ripples = this.ripples.filter(r => r.life > 0);
    // Fish movement
    for (const f of this.fish) {
      if (f.hooked) continue;
      f.x += f.vx * dt;
      if (f.x < 0) { f.x = 0; f.vx = Math.abs(f.vx); f.dir = 1; }
      if (f.x > this.W) { f.x = this.W; f.vx = -Math.abs(f.vx); f.dir = -1; }
      // Wander toward hook sometimes
      if (this.hook.state === 'waiting' && Math.random() < 0.003) {
        const dx = this.hook.x - f.x;
        f.vx = Math.sign(dx) * f.type.speed * 0.5;
      }
    }
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(0);
    const wl = this.waterLine;
    // Sky/water
    c.fillStyle = this.theme.dark ? '#1a1530' : '#b3e0ff'; c.fillRect(0, 0, this.W, wl);
    const wg = c.createLinearGradient(0, wl, 0, this.H);
    wg.addColorStop(0, this.theme.dark ? 'rgba(40,60,120,.6)' : 'rgba(70,130,180,.5)');
    wg.addColorStop(1, this.theme.dark ? 'rgba(10,15,40,.8)' : 'rgba(30,60,100,.6)');
    c.fillStyle = wg; c.fillRect(0, wl, this.W, this.H - wl);
    // Water surface
    c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 2;
    c.beginPath(); for (let x = 0; x <= this.W; x += 10) c.lineTo(x, wl + Math.sin(x * 0.03 + this.time * 2) * 3); c.stroke();
    // Fish
    for (const f of this.fish) {
      if (f.hooked && this.hook.state !== 'bite') continue;
      c.fillStyle = f.type.color; c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1;
      c.save(); c.translate(f.x, f.y); c.scale(f.dir, 1);
      c.beginPath(); c.ellipse(0, 0, f.type.size, f.type.size * 0.6, 0, 0, 7); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-f.type.size, 0); c.lineTo(-f.type.size * 1.5, -f.type.size * 0.5); c.lineTo(-f.type.size * 1.5, f.type.size * 0.5); c.closePath(); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(f.type.size * 0.4, -f.type.size * 0.2, 3, 0, 7); c.fill();
      c.fillStyle = '#2b2340'; c.beginPath(); c.arc(f.type.size * 0.45, -f.type.size * 0.2, 1.5, 0, 7); c.fill();
      c.restore();
    }
    // Line + hook
    if (this.hook.state !== 'idle') {
      c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(this.hook.x, 0); c.lineTo(this.hook.x, this.hook.y); c.stroke();
      c.fillStyle = '#ccc'; c.beginPath(); c.arc(this.hook.x, this.hook.y, 4, 0, 7); c.fill();
      c.strokeStyle = '#999'; c.lineWidth = 2; c.beginPath(); c.arc(this.hook.x, this.hook.y + 4, 6, 0, Math.PI); c.stroke();
    }
    // Cast power meter
    if (this.casting) {
      c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(this.W * 0.3, this.H - 30, this.W * 0.4, 16);
      c.fillStyle = `hsl(${(1 - this.castPower) * 120},80%,50%)`; c.fillRect(this.W * 0.3 + 2, this.H - 28, this.W * 0.4 * this.castPower - 4, 12);
    }
    // Bite indicator
    if (this.hook.state === 'bite') {
      c.fillStyle = 'rgba(255,79,154,.3)'; c.beginPath(); c.arc(this.hook.x, this.hook.y, 20 + Math.sin(this.time * 10) * 5, 0, 7); c.fill();
      // Reel progress
      c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(this.W * 0.3, this.H - 30, this.W * 0.4, 16);
      c.fillStyle = this.theme.accent; c.fillRect(this.W * 0.3 + 2, this.H - 28, this.W * 0.4 * this.reelProgress - 4, 12);
      c.fillStyle = '#fff'; c.font = 'bold 12px Outfit'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TAP TO REEL!', this.W / 2, this.H - 22);
    }
    // Hero on dock
    this.hero(this.W * 0.5, wl - 20, Math.max(36, this.W * 0.1), { t: this.time, expr: this.hook.state === 'bite' ? 'wow' : 'smile', anim: this.hook.state === 'bite' ? 'action' : 'idle' });
    // Stats
    c.fillStyle = '#fff'; c.font = 'bold 14px Outfit'; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(`Caught: ${this.totalCatch}  Streak: ${this.catchStreak}  Rare: ${this.rareCount}`, 16, 50);
    this.drawFx(); c.restore();
  }
  _pointerDown(x) {
    if (this.hook.state !== 'idle') return;
    this.hook.x = Math.max(24, Math.min(this.W - 24, x));
    this.castPower = 0.18;
    this.casting = true;
  }
  _pointerMove(x) {
    if (this.casting) this.hook.x = Math.max(24, Math.min(this.W - 24, x));
  }
  _pointerUp() {
    if (!this.casting || this.hook.state !== 'idle') return;
    this.casting = false;
    this.castPower = Math.max(0.22, this.castPower);
    this.hook.y = this.waterLine;
    this.hook.vy = 45;
    this.hook.state = 'casting';
    this.sound.jump();
    this.ripples.push({ x: this.hook.x, y: this.waterLine, r: 0, life: 0.7 });
  }
}

/* ============================================================ ARCHERY (Aim & Shoot) */

class Archery extends Base {
  instructions() { return 'Hold to charge power, release to shoot! Hit the bullseye for maximum points. Mind the wind!'; }
  reset() {
    this.arrow = null; this.target = { x: this.W * 0.75, y: this.H * 0.5, vx: 0, r: Math.max(30, this.W * 0.05) };
    this.charging = false; this.charge = 0; this.aimX = 0; this.aimY = 0;
    this.wind = 0; this.windT = 0; this.shotsLeft = 8; this.scored = 0;
    this.arrowsHit = [];
  }
  onResize() { this.reset(); }
  update(dt) {
    const D = this.difficulty();
    // Wind
    this.windT += dt;
    if (this.windT > 3) { this.wind = (Math.random() - 0.5) * 80 * D; this.windT = 0; }
    // Target moves with difficulty
    this.target.y += this.target.vx * dt;
    if (this.target.y < this.H * 0.2 || this.target.y > this.H * 0.8) this.target.vx = -this.target.vx || (Math.random() - 0.5) * 60;
    if (Math.abs(this.target.vx) < 1) this.target.vx = (Math.random() - 0.5) * 40 * D;

    // Charge
    if (this.charging) this.charge = Math.min(1, this.charge + dt * 1.5);

    // Arrow flight
    if (this.arrow) {
      this.arrow.vy += 300 * dt; // gravity
      this.arrow.vx += this.wind * dt; // wind
      this.arrow.x += this.arrow.vx * dt;
      this.arrow.y += this.arrow.vy * dt;
      this.arrow.trail.push({ x: this.arrow.x, y: this.arrow.y, life: 0.3 });
      if (this.arrow.trail.length > 10) this.arrow.trail.shift();
      this.arrow.ang = Math.atan2(this.arrow.vy, this.arrow.vx);

      // Target hit
      const d = Math.hypot(this.arrow.x - this.target.x, this.arrow.y - this.target.y);
      if (d < this.target.r) {
        const acc = 1 - d / this.target.r;
        const pts = Math.floor(acc * 30) + 5;
        this.hitCombo(this.target.x, this.target.y, pts);
        this.confetti(this.target.x, this.target.y); this.sound.power();
        const label = acc > 0.85 ? 'BULLSEYE!' : acc > 0.5 ? 'GREAT!' : 'HIT!';
        this.float(this.target.x, this.target.y - 30, `${label} +${pts}`, acc > 0.85 ? '#ffd166' : this.theme.accent);
        this.arrowsHit.push({ x: this.arrow.x, y: this.arrow.y, life: 2 });
        this.arrow = null;
        this._nextShot();
      }

      // Off screen
      if (!this.arrow || this.arrow.x > this.W + 50 || this.arrow.y > this.H + 50) {
        this.arrow = null; this._nextShot();
      }
    }

    this.arrowsHit.forEach(a => a.life -= dt);
    this.arrowsHit = this.arrowsHit.filter(a => a.life > 0);
  }
  _nextShot() {
    this.shotsLeft--;
    if (this.shotsLeft <= 0) { this.showOver(); return; }
    this.charge = 0; this.charging = false;
    // Move target
    this.target.x = this.W * (0.55 + Math.random() * 0.3);
    this.target.y = this.H * (0.25 + Math.random() * 0.5);
    this.target.vx = (Math.random() - 0.5) * 40 * this.difficulty();
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(0);
    // Wind indicator
    c.fillStyle = 'rgba(255,255,255,.1)'; c.font = 'bold 14px Outfit'; c.textAlign = 'center'; c.textBaseline = 'top';
    c.fillText(`Wind: ${this.wind > 0 ? '→' : '←'} ${Math.abs(this.wind).toFixed(0)}`, this.W / 2, 12);

    // Target
    const t = this.target;
    const rings = [t.r, t.r * 0.75, t.r * 0.5, t.r * 0.25];
    const colors = ['#fff', '#fff', '#ffd166', '#ff4f9a'];
    for (let i = 0; i < rings.length; i++) { c.fillStyle = i % 2 ? '#2b2340' : '#fff'; c.beginPath(); c.arc(t.x, t.y, rings[i], 0, 7); c.fill(); }
    c.fillStyle = '#ff4f9a'; c.beginPath(); c.arc(t.x, t.y, t.r * 0.12, 0, 7); c.fill();

    // Stuck arrows
    this.arrowsHit.forEach(a => { c.globalAlpha = a.life / 2; c.strokeStyle = '#8b6644'; c.lineWidth = 3; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(a.x - 15, a.y - 5); c.stroke(); c.globalAlpha = 1; });

    // Arrow trail + arrow
    if (this.arrow) {
      this.arrow.trail.forEach(tr => { c.globalAlpha = tr.life / 0.3 * 0.3; c.fillStyle = '#fff'; c.beginPath(); c.arc(tr.x, tr.y, 3, 0, 7); c.fill(); });
      c.globalAlpha = 1;
      c.save(); c.translate(this.arrow.x, this.arrow.y); c.rotate(this.arrow.ang);
      c.strokeStyle = '#8b6644'; c.lineWidth = 3; c.beginPath(); c.moveTo(-20, 0); c.lineTo(5, 0); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(5, 0); c.lineTo(0, -4); c.lineTo(0, 4); c.closePath(); c.fill();
      c.fillStyle = '#ff4f9a'; c.beginPath(); c.moveTo(-20, 0); c.lineTo(-26, -3); c.lineTo(-26, 3); c.closePath(); c.fill();
      c.restore();
    }

    // Bow + charge meter
    const bx = this.W * 0.12, by = this.H * 0.5;
    c.strokeStyle = this.theme.primary; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.arc(bx, by, 25, -Math.PI * 0.4, Math.PI * 0.4); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(bx + Math.cos(-Math.PI * 0.4) * 25, by + Math.sin(-Math.PI * 0.4) * 25); c.lineTo(bx + Math.cos(Math.PI * 0.4) * 25, by + Math.sin(Math.PI * 0.4) * 25); c.stroke();
    if (this.charging) {
      c.fillStyle = `hsl(${(1 - this.charge) * 120},80%,50%)`; c.beginPath(); c.arc(bx, by, 6 + this.charge * 8, 0, 7); c.fill();
      // Aim line
      const dx = this.aimX - bx, dy = this.aimY - by; const dist = Math.sqrt(dx * dx + dy * dy); const ang = Math.atan2(dy, dx);
      c.strokeStyle = `rgba(255,79,154,${this.charge * 0.4})`; c.lineWidth = 3; c.setLineDash([6, 6]);
      c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + Math.cos(ang) * dist * this.charge * 2, by + Math.sin(ang) * dist * this.charge * 2); c.stroke(); c.setLineDash([]);
    }

    // Hero (archer)
    this.hero(bx, by, Math.max(36, this.W * 0.1), { t: this.time, expr: this.charging ? 'wow' : 'smile', face: 1, anim: this.charging ? 'action' : 'idle' });

    // Stats
    c.fillStyle = '#fff'; c.font = 'bold 14px Outfit'; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(`Arrows: ${this.shotsLeft}`, 16, 50);
    this.drawFx(); c.restore();
  }
  _pointerDown(x, y) {
    if (this.arrow || this.shotsLeft <= 0) return;
    this.charging = true;
    this.charge = 0.12;
    this.aimX = x; this.aimY = y;
  }
  _pointerMove(x, y) {
    if (this.charging) { this.aimX = x; this.aimY = y; }
  }
  _pointerUp() {
    if (!this.charging || this.arrow) return;
    this.charging = false;
    const bx = this.W * 0.12, by = this.H * 0.5;
    const dx = this.aimX - bx, dy = this.aimY - by;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const power = 360 + Math.max(0.18, this.charge) * 520;
    this.arrow = {
      x: bx + dx / dist * 28,
      y: by + dy / dist * 28,
      vx: dx / dist * power,
      vy: dy / dist * power,
      ang: Math.atan2(dy, dx),
      trail: [],
    };
    this.sound.jump();
    this.burst(bx, by, this.theme.accent, 7, 0.7);
  }
}



/* ============================================================ PONG */
class Pong extends Base {
  instructions() { return 'Drag or arrow keys to move paddle. First to 7 wins! Catch power-ups for multi-ball, wide paddle, shrink opponent! Watch for ball trails!'; }
  reset() {
    this.pw = Math.max(80, this.W * 0.18); this.ph = 12; this.br = Math.max(8, this.W * 0.025);
    this.p1 = { x: this.W / 2, y: this.H - 30, w: this.pw };
    this.p2 = { x: this.W / 2, y: 30, w: this.pw };
    this.balls = []; this._spawnBall();
    this.p1Score = 0; this.p2Score = 0; this.winScore = 7;
    this.aiTarget = this.W / 2; this.aiReaction = 0.15; this.aiMiss = 0;
    this.falling = []; this.ballTrails = [];
    this.powerTimer = 0; this.comboCount = 0;
  }
  _spawnBall() {
    const ang = (Math.random() - 0.5) * 1.2 + (Math.random() < 0.5 ? 0 : Math.PI);
    const spd = 280 + this.difficulty() * 25;
    this.balls.push({ x: this.W / 2, y: this.H / 2, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, r: this.br, trail: [] });
  }
  update(dt) {
    const D = this.difficulty();
    // Player paddle
    const steer = (this.keys['arrowleft'] ? -1 : 0) + (this.keys['arrowright'] ? 1 : 0);
    this.p1.x += steer * 480 * dt;
    if (this.pointer.down) this.p1.x = this.pointer.x;
    this.p1.x = Math.max(this.p1.w / 2, Math.min(this.W - this.p1.w / 2, this.p1.x));
    // AI paddle — three difficulty tiers based on time
    const tier = this.time < 15 ? 0.12 : this.time < 40 ? 0.22 : 0.32;
    this.aiReaction = Math.max(0.03, 0.25 - tier);
    this.aiMiss = Math.sin(this.time * 0.7 + this.p2.x) * (this.time < 20 ? 0 : this.W * 0.04);
    let targetBall = null, minDist = Infinity;
    for (const b of this.balls) {
      if (b.vy < 0) { const d = Math.abs((b.x + b.vx * 0.3) - this.p2.x); if (d < minDist) { minDist = d; targetBall = b; } }
    }
    if (!targetBall) targetBall = this.balls[0];
    if (targetBall) {
      this.aiTarget += ((targetBall.x + targetBall.vx * 0.2 + this.aiMiss) - this.aiTarget) * this.aiReaction * 4 * dt;
      this.p2.x += (this.aiTarget - this.p2.x) * 2.8 * dt;
    }
    this.p2.x = Math.max(this.p2.w / 2, Math.min(this.W - this.p2.w / 2, this.p2.x));
    // Balls
    for (const b of this.balls) {
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (!b.trail) b.trail = [];
      b.trail.push({ x: b.x, y: b.y, life: 0.3 });
      for (const t of b.trail) t.life -= dt;
      b.trail = b.trail.filter(t => t.life > 0);
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); this.sound.blip(440, 0.04); }
      if (b.x > this.W - b.r) { b.x = this.W - b.r; b.vx = -Math.abs(b.vx); this.sound.blip(440, 0.04); }
      // Top wall (AI side)
      if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy); this.sound.blip(440, 0.04); }
      if (b.y > this.H + 40) { b.lost = true; }
      if (b.y < -40) { b.lost = true; }
      // P1 bounce
      if (b.vy > 0 && b.y > this.p1.y - this.ph / 2 - b.r && b.y < this.p1.y + 12 && Math.abs(b.x - this.p1.x) < this.p1.w / 2 + b.r) {
        b.y = this.p1.y - this.ph / 2 - b.r;
        const off = (b.x - this.p1.x) / (this.p1.w / 2);
        const ang = -Math.PI / 2 + off * 0.7;
        const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy) * 1.03;
        b.vx = Math.cos(ang) * spd; b.vy = Math.sin(ang) * spd;
        const pitch = 400 + Math.abs(off) * 300;
        this.sound.blip(pitch, 0.06, 'square', 0.15);
        this.burst(b.x, b.y, this.theme.primary, 5);
        this.comboCount++;
      }
      // P2 bounce
      if (b.vy < 0 && b.y < this.p2.y + this.ph / 2 + b.r && b.y > this.p2.y - 12 && Math.abs(b.x - this.p2.x) < this.p2.w / 2 + b.r) {
        b.y = this.p2.y + this.ph / 2 + b.r;
        const off = (b.x - this.p2.x) / (this.p2.w / 2);
        const ang = Math.PI / 2 + off * 0.7;
        const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy) * 1.03;
        b.vx = Math.cos(ang) * spd; b.vy = Math.sin(ang) * spd;
        this.sound.blip(380, 0.06, 'square', 0.1);
      }
    }
    // Check lost balls
    const before = this.balls.length;
    this.balls = this.balls.filter(b => !b.lost);
    const lost = before - this.balls.length;
    if (lost > 0) {
      this.comboCount = 0;
      if (this.balls.length === 0) {
        this.p2Score++;
        this.shake = 0.6;
        this.sound.hit();
        this.burst(this.W / 2, this.H / 2, '#ff4f9a', 20);
        this._checkWin();
        if (!this.over) { this._spawnBall(); }
      }
    }
    // Power-ups spawn from center
    this.powerTimer -= dt;
    if (this.powerTimer <= 0 && this.balls.length > 0) {
      this.powerTimer = 4 + Math.random() * 3;
      const types = ['mega', 'shield', 'slow', 'bomb'];
      this.falling.push({ x: this.W * 0.3 + Math.random() * this.W * 0.4, y: this.H / 2, vy: 50 + Math.random() * 30, type: types[Math.floor(Math.random() * 4)] });
    }
    for (const f of this.falling) {
      f.y += f.vy * dt;
      // Player catch
      if (f.y > this.p1.y - 15 && Math.abs(f.x - this.p1.x) < this.p1.w / 2 + 18) {
        if (f.type === 'mega') { this.p1.w = this.pw * 1.7; this.schedule(5, () => { this.p1.w = this.pw; }); }
        else if (f.type === 'shield') { this.grantPower('shield'); }
        else if (f.type === 'slow') {
          for (const b of this.balls) { b.vx *= 0.5; b.vy *= 0.5; }
          this.schedule(4, () => { for (const b of this.balls) { b.vx *= 2; b.vy *= 2; } });
        }
        else if (f.type === 'bomb') {
          // Multi-ball!
          for (const b of [...this.balls]) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 250 + this.difficulty() * 20;
            this.balls.push({ x: b.x + Math.cos(ang) * 20, y: b.y + Math.sin(ang) * 20, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, r: this.br, trail: [] });
          }
          this.sound.power();
          this.flash('#ff6b35', 0.2);
        }
        this.burst(f.x, f.y, POWERS[f.type]?.color || '#fff', 8);
        f.y = this.H + 100;
      }
      // AI catch
      if (f.y < this.p2.y + 15 && Math.abs(f.x - this.p2.x) < this.p2.w / 2 + 18) {
        f.y = -100;
      }
    }
    this.falling = this.falling.filter(f => f.y < this.H + 30);
  }
  _checkWin() {
    if (this.p2Score >= this.winScore) {
      this.addScore(Math.floor(this.comboCount * 5));
      this.showOver();
    }
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(0);
    // Center line
    c.setLineDash([8, 12]); c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, this.H / 2); c.lineTo(this.W, this.H / 2); c.stroke(); c.setLineDash([]);
    // Ball trails
    for (const b of this.balls) {
      for (const t of b.trail || []) {
        c.globalAlpha = t.life / 0.3 * 0.3;
        c.fillStyle = this.theme.accent;
        c.beginPath(); c.arc(t.x, t.y, b.r * 0.5, 0, 7); c.fill();
      }
    }
    c.globalAlpha = 1;
    // Balls
    for (const b of this.balls) {
      c.fillStyle = '#fff'; c.shadowColor = '#fff'; c.shadowBlur = 12;
      c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill();
      c.shadowBlur = 0;
    }
    // Paddles with glow
    c.shadowColor = this.theme.accent; c.shadowBlur = 10;
    c.fillStyle = this.theme.accent; c.strokeStyle = 'rgba(0,0,0,.15)'; c.lineWidth = 2;
    rr2(c, this.p1.x - this.p1.w / 2, this.p1.y - this.ph / 2, this.p1.w, this.ph, 6); c.fill(); c.stroke();
    c.shadowColor = this.theme.primary; c.shadowBlur = 10;
    c.fillStyle = this.theme.primary;
    rr2(c, this.p2.x - this.p2.w / 2, this.p2.y - this.ph / 2, this.p2.w, this.ph, 6); c.fill(); c.stroke();
    c.shadowBlur = 0;
    // Scores with animation
    c.fillStyle = 'rgba(255,255,255,.15)'; c.font = '900 56px Outfit'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(this.p2Score, this.W / 2, this.H * 0.22);
    c.fillStyle = 'rgba(255,255,255,.08)';
    c.fillText(this.p1Score, this.W / 2, this.H * 0.78);
    // Combo indicator
    if (this.comboCount > 1) {
      c.fillStyle = this.theme.accent; c.font = 'bold 16px Outfit'; c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText(this.comboCount + 'x rally!', this.W / 2, 16);
    }
    // Falling power-ups
    for (const f of this.falling) {
      const p = POWERS[f.type]; if (!p) continue;
      c.fillStyle = p.color; c.shadowColor = p.color; c.shadowBlur = 14;
      c.beginPath(); c.arc(f.x, f.y, 11, 0, 7); c.fill();
      c.shadowBlur = 0;
      this.glyph(p.icon, f.x, f.y, 13);
    }
    // Hero
    this.hero(this.p1.x, this.p1.y - 28, Math.max(30, this.W * 0.08), { t: this.time, expr: this.comboCount > 3 ? 'wow' : 'smile', anim: this.steering() ? 'walk' : 'idle' });
    this.drawFx(); c.restore();
  }
}

/* ============================================================ BUBBLE SHOOTER */
class BubbleShooter extends Base {
  instructions() { return 'Tap to aim, release to shoot! Match 3+ same-color to pop. Bomb bubbles explode neighbors, Rainbow matches any color, Stone needs 2 hits! Chain reactions for big combos!'; }
  reset() {
    this.rows = 7; this.cols = 9;
    this.br = Math.max(14, this.W / this.cols * 0.42);
    this.colors = ['#ff4f9a', '#3ad0ff', '#ffd166', '#8affc1', '#a24dff', '#ff6b35'];
    this.bubbles = []; this.shots = 0; this.shotLimit = 40;
    this.aim = { x: this.W / 2, y: this.H - 60 };
    this.currentColor = '';
    this.nextColor = '';
    this.chainCount = 0; this.comboMult = 1;
    this.level = 1;
    this._genBubbles();
    this._pickNext();
  }
  _genBubbles() {
    this.bubbles = [];
    const off = this.br + 2;
    for (let r = 0; r < this.rows; r++) {
      const n = r % 2 === 0 ? this.cols : this.cols - 1;
      for (let c = 0; c < n; c++) {
        const x = (r % 2 === 0 ? off : off + this.br) + c * (this.br * 2 + 2);
        const y = 40 + r * (this.br * 1.6);
        if (y < this.H * 0.55) {
          const roll = Math.random();
          let type = 'normal';
          if (roll < 0.06) type = 'bomb';
          else if (roll < 0.1) type = 'rainbow';
          else if (roll < 0.14) type = 'stone';
          this.bubbles.push({
            x, y, r: this.br,
            color: type === 'rainbow' ? '#fff' : this.colors[Math.floor(Math.random() * this.colors.length)],
            type, hp: type === 'stone' ? 2 : 1, maxHp: type === 'stone' ? 2 : 1,
            row: r, col: c
          });
        }
      }
    }
  }
  _pickNext() {
    this.currentColor = this.nextColor || this.colors[Math.floor(Math.random() * this.colors.length)];
    this.nextColor = this.colors[Math.floor(Math.random() * this.colors.length)];
  }
  update(dt) {
    if (this.pointer.down || this.pointer.x) {
      const dx = this.pointer.x - this.W / 2;
      const dy = this.pointer.y - this.H + 60;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) { this.aim.x = this.W / 2 + dx / len * this.W * 0.4; this.aim.y = this.H - 60 + dy / len * this.W * 0.4; }
    }
    if (this.pointer.tapped && this.shots < this.shotLimit) {
      const dx = this.aim.x - this.W / 2;
      const dy = this.aim.y - (this.H - 60);
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len >= 1) {
        const vx = dx / len * 600;
        const vy = dy / len * 600;
        this.bubbles.push({ x: this.W / 2, y: this.H - 60, r: this.br, color: this.currentColor, type: 'normal', hp: 1, maxHp: 1, vx, vy, flying: true, row: -1, col: -1 });
        this.shots++;
        this.chainCount = 0;
        this._pickNext();
        this.sound.blip(660, 0.06, 'triangle', 0.15);
      }
    }
    for (const b of this.bubbles) {
      if (!b.flying) continue;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < b.r) { b.x = b.r; b.vx = -b.vx; }
      if (b.x > this.W - b.r) { b.x = this.W - b.r; b.vx = -b.vx; }
      if (b.y < 20) { b.flying = false; b.y = 20; this._snapBubble(b); this._matchBubbles(b); }
      for (const o of this.bubbles) {
        if (o === b || o.flying) continue;
        if (Math.hypot(b.x - o.x, b.y - o.y) < this.br * 1.8) {
          b.flying = false; this._snapBubble(b); this._matchBubbles(b); break;
        }
      }
    }
  }
  _snapBubble(b) {
    const off = this.br + 2;
    let bestR = 0, bestC = 0, bestD = Infinity;
    for (let r = 0; r < this.rows + 2; r++) {
      const n = r % 2 === 0 ? this.cols : this.cols - 1;
      for (let c = 0; c < n; c++) {
        const x = (r % 2 === 0 ? off : off + this.br) + c * (this.br * 2 + 2);
        const y = 40 + r * (this.br * 1.6);
        const d = Math.hypot(b.x - x, b.y - y);
        if (d < bestD) { bestD = d; bestR = r; bestC = c; }
      }
    }
    b.x = (bestR % 2 === 0 ? off : off + this.br) + bestC * (this.br * 2 + 2);
    b.y = 40 + bestR * (this.br * 1.6);
    b.row = bestR; b.col = bestC;
  }
  _matchBubbles(src) {
    // Find connected same-color bubbles (rainbow matches any)
    const matched = new Set();
    const stack = [src];
    const matchColor = src.type === 'rainbow' ? null : src.color;
    while (stack.length > 0) {
      const b = stack.pop();
      if (matched.has(b)) continue;
      matched.add(b);
      for (const o of this.bubbles) {
        if (o === b || o.flying || matched.has(o)) continue;
        const colorMatch = matchColor === null || o.color === matchColor || o.type === 'rainbow';
        if (colorMatch && Math.hypot(o.x - b.x, o.y - b.y) < this.br * 2.4) {
          stack.push(o);
        }
      }
    }
    // Count non-stone, non-rainbow matches for explosion condition
    const popable = [...matched].filter(b => {
      if (b.type === 'stone') { b.hp--; if (b.hp <= 0) return true; return false; }
      if (b.type === 'bomb') return true;
      return true;
    });
    if (popable.length >= 3) {
      this.chainCount++;
      const chainBonus = Math.min(this.chainCount, 5);
      const baseScore = 10 * chainBonus;
      for (const b of popable) {
        if (b.type === 'bomb') this._bombBlast(b);
        this.burst(b.x, b.y, b.color, 10);
        this.addScore(baseScore);
      }
      this.bubbles = this.bubbles.filter(b => !popable.includes(b));
      this.sound.coin();
      if (this.chainCount >= 3) this.shake = 0.4;
      if (this.chainCount >= 5) {
        this.confetti(this.W / 2, this.rows * this.br);
        this.sound.power();
      }
      this._dropOrphans();
    } else {
      // Reset stone hp if not enough matched
      for (const b of matched) { if (b.type === 'stone') b.hp = b.maxHp; }
    }
    // Check win
    const colored = this.bubbles.filter(b => !b.flying);
    if (colored.length === 0) {
      this.sound.power();
      this.confetti(this.W / 2, this.H / 2);
      this.addScore(200 * this.level);
      this.level++;
      this.rows = Math.min(this.rows + 1, 12);
      this._genBubbles();
      this.shots = 0;
      this.shotLimit += 5;
      this.float(this.W / 2, this.H * 0.4, 'Level ' + this.level + '!', this.theme.accent);
    } else if (this.shots >= this.shotLimit) {
      this.loseLife();
      if (this.lives > 0) { this.shots = 0; this._genBubbles(); }
    }
  }
  _bombBlast(b) {
    for (const o of this.bubbles) {
      if (o === b || o.flying) continue;
      if (Math.hypot(o.x - b.x, o.y - b.y) < this.br * 4) {
        o.hp = 0;
      }
    }
    this.shake = 0.6;
    this.flash('#ff6b35', 0.15);
  }
  _dropOrphans() {
    const connected = new Set();
    const top = this.bubbles.filter(b => !b.flying && b.y < 60);
    const stack = [...top];
    while (stack.length > 0) {
      const b = stack.pop();
      if (connected.has(b)) continue;
      connected.add(b);
      for (const o of this.bubbles) {
        if (o === b || o.flying || connected.has(o)) continue;
        if (Math.hypot(o.x - b.x, o.y - b.y) < this.br * 2.4) stack.push(o);
      }
    }
    for (const b of [...this.bubbles]) {
      if (!b.flying && !connected.has(b)) {
        b.vy = 100 + Math.random() * 60;
        b.falling = true;
        this.burst(b.x, b.y, b.color, 6);
        this.addScore(5);
      }
    }
    this.bubbles = this.bubbles.filter(b => !b.falling || (b.y || 0) < this.H + 60);
    for (const b of this.bubbles) {
      if (b.falling) b.y += b.vy * 0.016;
    }
    this.bubbles = this.bubbles.filter(b => !b.falling || b.y < this.H + 60);
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(0);
    // Bubbles
    for (const b of this.bubbles) {
      if (b.flying) continue;
      const glow = b.type === 'bomb' ? '#ff6b35' : b.type === 'rainbow' ? '#fff' : b.type === 'stone' ? '#aaa' : '';
      if (glow) { c.shadowColor = glow; c.shadowBlur = 10; }
      c.fillStyle = b.color; c.strokeStyle = 'rgba(0,0,0,.1)'; c.lineWidth = 1;
      c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill(); c.stroke();
      c.shadowBlur = 0;
      c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(b.x - b.r * 0.25, b.y - b.r * 0.25, b.r * 0.3, 0, 7); c.fill();
      // Special bubble icons
      if (b.type === 'bomb') { c.fillStyle = '#fff'; c.font = 'bold 10px Outfit'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('X', b.x, b.y); }
      if (b.type === 'rainbow') { c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(b.x, b.y, b.r * 0.35, 0, 7); c.fill(); }
      if (b.type === 'stone' && b.hp < b.maxHp) { c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(b.x - b.r, b.y - b.r - 4, b.r * 2, 3); c.fillStyle = '#8affc1'; c.fillRect(b.x - b.r, b.y - b.r - 4, b.r * 2 * (b.hp / b.maxHp), 3); }
    }
    // Flying bubble
    for (const b of this.bubbles) {
      if (!b.flying) continue;
      c.fillStyle = b.color; c.shadowColor = b.color; c.shadowBlur = 12;
      c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill(); c.shadowBlur = 0;
    }
    // Shooter
    c.fillStyle = this.theme.primary; c.strokeStyle = 'rgba(0,0,0,.15)'; c.lineWidth = 2;
    c.beginPath(); c.arc(this.W / 2, this.H - 60, this.br + 6, 0, 7); c.fill(); c.stroke();
    c.fillStyle = this.currentColor; c.shadowColor = this.currentColor; c.shadowBlur = 8;
    c.beginPath(); c.arc(this.W / 2, this.H - 60, this.br, 0, 7); c.fill(); c.shadowBlur = 0;
    // Aim line with wall bounce preview
    c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; c.setLineDash([6, 6]);
    let ax = this.W / 2, ay = this.H - 60, avx = this.aim.x - ax, avy = this.aim.y - ay;
    const alen = Math.sqrt(avx * avx + avy * avy);
    if (alen > 0) { avx /= alen; avy /= alen; }
    for (let i = 0; i < 3; i++) {
      const nx = ax + avx * this.W * 0.3, ny = ay + avy * this.W * 0.3;
      c.beginPath(); c.moveTo(ax, ay); c.lineTo(Math.max(0, Math.min(this.W, nx)), Math.max(0, Math.min(this.H, ny))); c.stroke();
      if (nx < 0 || nx > this.W) avx = -avx;
      ax = Math.max(0, Math.min(this.W, nx)); ay = Math.max(0, Math.min(this.H, ny));
    }
    c.setLineDash([]);
    // Next color
    c.fillStyle = 'rgba(255,255,255,.4)'; c.font = '12px Outfit'; c.textAlign = 'center'; c.textBaseline = 'top';
    c.fillText('Next:', this.W / 2, this.H - 50);
    c.fillStyle = this.nextColor; c.beginPath(); c.arc(this.W / 2 + 24, this.H - 43, 8, 0, 7); c.fill();
    // Level & shots
    c.fillStyle = '#fff'; c.font = 'bold 14px Outfit'; c.textAlign = 'left'; c.textBaseline = 'top';
    c.fillText('Level ' + this.level + '  Shots: ' + this.shots + '/' + this.shotLimit, 16, 16);
    // Chain indicator
    if (this.chainCount >= 2) {
      c.fillStyle = this.theme.accent; c.font = 'bold 16px Outfit'; c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText('Chain x' + this.chainCount + '!', this.W / 2, this.H - 70);
    }
    this.drawFx(); c.restore();
  }
}

/* ============================================================ CANNON */
class Cannon extends Base {
  instructions() { return 'Drag back to aim and set power, release to fire! Destroy all targets — moving targets need leading! Explosive barrels chain damage. Star rating per level!'; }
  reset() {
    this.gun = { x: this.W * 0.12, y: this.H * 0.85, ang: -Math.PI / 3, power: 0.4 };
    this.ball = null;
    this.targets = []; this.barriers = [];
    this.shots = 0; this.maxShots = 20; this.stars = 3;
    this.wind = 0;
    this.level = 1;
    this._buildLevel();
    this.aiming = false; this.aimStart = { x: 0, y: 0 };
    this.shakeTimer = 0;
  }
  // Named _buildLevel, not _build: Base._build() creates the canvas, HUD and
  // overlay, and the constructor calls it. Shadowing that name meant no stage
  // was ever created and the mode could not start at all.
  _buildLevel() {
    this.targets = []; this.barriers = [];
    const n = 3 + Math.floor(this.level * 0.7);
    for (let i = 0; i < n; i++) {
      const roll = Math.random();
      const isMoving = roll < 0.25;
      const isArmored = roll > 0.85;
      this.targets.push({
        x: this.W * (0.45 + Math.random() * 0.4), y: this.H * (0.15 + Math.random() * 0.5),
        r: 12 + Math.random() * 18,
        hp: isArmored ? 3 : 1 + Math.floor(this.level / 4),
        maxHp: isArmored ? 3 : 1 + Math.floor(this.level / 4),
        moving: isMoving, vx: isMoving ? (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 60) : 0,
        phase: Math.random() * 7
      });
    }
    // Explosive barrels
    const numBarrels = Math.floor(this.level * 0.5);
    for (let i = 0; i < numBarrels; i++) {
      this.barriers.push({
        x: this.W * (0.3 + Math.random() * 0.55), y: this.H * (0.25 + Math.random() * 0.5),
        w: 24, h: 24, explosive: true
      });
    }
    this.wind = (Math.random() - 0.5) * 60;
    this.maxShots = 12 + Math.floor(this.level * 2);
    this.stars = 3;
  }
  update(dt) {
    this.wind += (Math.random() - 0.5) * 8 * dt;
    this.wind = Math.max(-100, Math.min(100, this.wind));
    // Move targets
    for (const t of this.targets) {
      if (t.moving) {
        t.x += t.vx * dt;
        t.vx += Math.sin(this.time * 0.5 + t.phase) * 20 * dt;
        t.x = Math.max(t.r + 10, Math.min(this.W - t.r - 10, t.x));
      }
    }
    // Aim
    if (this.pointer.down && !this.ball && !this.aiming) {
      this.aiming = true;
      this.aimStart.x = this.pointer.x; this.aimStart.y = this.pointer.y;
    }
    if (this.aiming && this.pointer.down) {
      const dx = this.pointer.x - this.gun.x;
      const dy = this.pointer.y - this.gun.y;
      this.gun.ang = Math.atan2(dy, dx);
      this.gun.ang = Math.max(-Math.PI * 0.88, Math.min(-0.05, this.gun.ang));
      const pull = Math.hypot(this.pointer.x - this.aimStart.x, this.pointer.y - this.aimStart.y);
      this.gun.power = Math.min(1, pull / (this.W * 0.35));
    }
    if (!this.pointer.down && this.aiming) {
      this._fire();
      this.aiming = false;
    }
    // Ball
    if (this.ball) {
      this.ball.x += this.ball.vx * dt;
      this.ball.vy += 600 * dt;
      this.ball.y += this.ball.vy * dt;
      this.ball.x += this.wind * dt;
      if (!this.ball.trail) this.ball.trail = [];
      this.ball.trail.push({ x: this.ball.x, y: this.ball.y, life: 0.5 });
      for (const t of this.ball.trail) t.life -= dt;
      this.ball.trail = this.ball.trail.filter(t => t.life > 0);
      // Hit targets
      for (const t of this.targets) {
        if (t.hit) continue;
        if (Math.hypot(this.ball.x - t.x, this.ball.y - t.y) < t.r + 10) {
          t.hp--;
          this.burst(this.ball.x, this.ball.y, '#ff6b35', 14);
          this.shake = 0.4;
          this.sound.hit();
          if (t.hp <= 0) {
            t.hit = true;
            this.hitCombo(t.x, t.y, 30);
            this.burst(t.x, t.y, '#ffd166', 18);
          }
          this.ball = null;
          break;
        }
      }
      // Explosive barrels
      if (this.ball) {
        for (const b of this.barriers) {
          if (b.explosive && Math.hypot(this.ball.x - b.x, this.ball.y - b.y) < 20) {
            this._barrelBlast(b);
            this.ball = null;
            break;
          }
        }
      }
      if (this.ball && (this.ball.y > this.H + 20 || this.ball.x > this.W + 20 || this.ball.x < -20)) {
        this.ball = null;
      }
    }
    // Check win
    const remainingTargets = this.targets.filter(t => !t.hit).length;
    if (remainingTargets === 0) {
      // Star rating based on shots used
      const maxStarShots = this.maxShots - 3;
      if (this.shots > maxStarShots + 2) this.stars = 1;
      else if (this.shots > maxStarShots) this.stars = 2;
      else this.stars = 3;
      this.addScore(this.stars * 50);
      this.level++;
      this.shots = 0;
      this._buildLevel();
      this.sound.power();
      this.showLevel(this.level, 'Level ' + this.level + ' - ' + '☆'.repeat(this.stars) + '★'.repeat(3 - this.stars));
    }
    // Lose condition
    if (this.ball === null && this.shots >= this.maxShots && remainingTargets > 0) {
      this.loseLife();
      if (this.lives > 0) { this.shots = 0; this._buildLevel(); }
    }
  }
  _barrelBlast(b) {
    b.explosive = false;
    this.shake = 0.8;
    this.flash('#ff6b35', 0.2);
    this.burst(b.x, b.y, '#ff6b35', 25);
    this.sound.hit();
    // Chain damage nearby targets
    for (const t of this.targets) {
      if (t.hit) continue;
      if (Math.hypot(t.x - b.x, t.y - b.y) < 80) {
        t.hp -= 2;
        this.burst(t.x, t.y, '#ff6b35', 10);
        if (t.hp <= 0) { t.hit = true; this.addScore(20); }
      }
    }
    // Chain nearby barrels
    for (const ob of this.barriers) {
      if (ob === b || !ob.explosive) continue;
      if (Math.hypot(ob.x - b.x, ob.y - b.y) < 100) {
        this.schedule(0.2, () => { if (ob.explosive) this._barrelBlast(ob); });
      }
    }
  }
  _fire() {
    if (this.ball) return;
    this.shots++;
    const spd = 350 + this.gun.power * 500;
    this.ball = {
      x: this.gun.x + Math.cos(this.gun.ang) * 30,
      y: this.gun.y + Math.sin(this.gun.ang) * 30,
      vx: Math.cos(this.gun.ang) * spd,
      vy: Math.sin(this.gun.ang) * spd,
      trail: []
    };
    this.sound.blip(440, 0.08, 'square', 0.22);
    this.burst(this.gun.x, this.gun.y, '#ffd166', 6);
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(0);
    // Targets
    for (const t of this.targets) {
      if (t.hit) continue;
      const hpRatio = t.hp / t.maxHp;
      const col = t.moving ? '#3ad0ff' : t.maxHp > 2 ? '#a24dff' : '#ff4f9a';
      c.fillStyle = col; c.strokeStyle = 'rgba(0,0,0,.15)'; c.lineWidth = 2;
      c.shadowColor = col; c.shadowBlur = 8;
      c.beginPath(); c.arc(t.x, t.y, t.r, 0, 7); c.fill(); c.stroke();
      c.shadowBlur = 0;
      c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.arc(t.x - t.r * 0.2, t.y - t.r * 0.2, t.r * 0.3, 0, 7); c.fill();
      if (t.maxHp > 1) {
        c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(t.x - t.r, t.y - t.r - 6, t.r * 2, 5);
        c.fillStyle = '#8affc1'; c.fillRect(t.x - t.r, t.y - t.r - 6, t.r * 2 * hpRatio, 5);
      }
      if (t.moving) {
        c.fillStyle = 'rgba(255,255,255,.4)'; c.font = '10px Outfit'; c.textAlign = 'center'; c.textBaseline = 'bottom';
        c.fillText('MOVING', t.x, t.y - t.r - 8);
      }
    }
    // Explosive barrels
    for (const b of this.barriers) {
      if (!b.explosive) continue;
      c.fillStyle = '#ff6b35'; c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 2;
      rr2(c, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 4); c.fill(); c.stroke();
      c.fillStyle = '#fff'; c.font = 'bold 12px Outfit'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('X', b.x, b.y);
      c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(b.x - b.w / 2 + 2, b.y - b.h / 2 + 2, b.w * 0.6, b.h * 0.2);
    }
    // Ball trail
    if (this.ball && this.ball.trail) {
      for (const t of this.ball.trail) {
        c.globalAlpha = (t.life / 0.5) * 0.4;
        c.fillStyle = '#ffd166';
        c.beginPath(); c.arc(t.x, t.y, 5, 0, 7); c.fill();
      }
      c.globalAlpha = 1;
    }
    // Ball
    if (this.ball) {
      c.fillStyle = '#ffd166'; c.shadowColor = '#ff6b35'; c.shadowBlur = 16;
      c.beginPath(); c.arc(this.ball.x, this.ball.y, 9, 0, 7); c.fill();
      c.shadowBlur = 0;
    }
    // Gun with power meter
    const gx = this.gun.x, gy = this.gun.y;
    c.fillStyle = '#555'; c.beginPath(); c.arc(gx, gy, 22, 0, 7); c.fill();
    c.fillStyle = this.theme.primary; c.beginPath(); c.arc(gx, gy, 18, 0, 7); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + Math.cos(this.gun.ang) * (30 + this.gun.power * 20), gy + Math.sin(this.gun.ang) * (30 + this.gun.power * 20)); c.stroke();
    if (this.aiming) {
      c.fillStyle = 'rgba(255,255,255,.15)'; c.font = 'bold 14px Outfit'; c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText('Power: ' + Math.round(this.gun.power * 100) + '%', this.W / 2, 16);
      // Trajectory preview
      c.setLineDash([4, 8]); c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 1;
      let px = gx + Math.cos(this.gun.ang) * 30, py = gy + Math.sin(this.gun.ang) * 30;
      let pvx = Math.cos(this.gun.ang) * (350 + this.gun.power * 400), pvy = Math.sin(this.gun.ang) * (350 + this.gun.power * 400);
      c.beginPath(); c.moveTo(px, py);
      for (let i = 0; i < 20; i++) { px += pvx * 0.03; pvy += 600 * 0.03; py += pvy * 0.03; px += this.wind * 0.03; c.lineTo(px, py); }
      c.stroke(); c.setLineDash([]);
    }
    // Wind
    c.fillStyle = 'rgba(255,255,255,.3)'; c.font = '13px Outfit'; c.textAlign = 'right'; c.textBaseline = 'top';
    c.fillText('Wind: ' + (this.wind > 0 ? '→' : '←') + Math.round(Math.abs(this.wind)), this.W - 16, 16);
    c.fillStyle = '#fff'; c.font = 'bold 14px Outfit'; c.textAlign = 'left'; c.textBaseline = 'top';
    c.fillText('Lv.' + this.level + '  Shots: ' + this.shots + '/' + this.maxShots, 16, 16);
    // Star rating
    if (this.targets.every(t => t.hit)) {
      c.fillStyle = '#ffd166'; c.font = '20px Outfit'; c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText('☆'.repeat(this.stars) + '★'.repeat(3 - this.stars), this.W / 2, this.H - 20);
    }
    this.drawFx(); c.restore();
  }
}

/* ============================================================ MERGE / 2048 */
class Merge extends Base {
  instructions() { return 'Swipe or arrow keys to slide. Same numbers merge! Undo with Z. Consecutive merges chain for bonus! Reach 2048 to win!'; }
  reset() {
    this.grid = [];
    this.size = 4;
    this.won = false;
    this.undoGrid = null;
    this.mergesInMove = 0;
    this.bestTile = 0;
    this.mergePops = [];
    for (let r = 0; r < this.size; r++) { this.grid[r] = []; for (let c = 0; c < this.size; c++) this.grid[r][c] = 0; }
    this._addRandom(); this._addRandom();
  }
  _addRandom() {
    const empty = [];
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) { if (this.grid[r][c] === 0) empty.push({ r, c }); }
    if (empty.length === 0) return;
    const cell = empty[Math.floor(Math.random() * empty.length)];
    const val = Math.random() < 0.1 ? 4 : 2;
    this.grid[cell.r][cell.c] = val;
    // Spawn animation
    this.mergePops.push({ r: cell.r, c: cell.c, val, life: 0.3, maxLife: 0.3, spawn: true });
  }
  _slideRow(row) {
    row = row.filter(v => v !== 0);
    const merged = [];
    let score = 0;
    let merges = 0;
    for (let i = 0; i < row.length; i++) {
      if (i + 1 < row.length && row[i] === row[i + 1]) {
        const newVal = row[i] * 2;
        merged.push(newVal);
        score += newVal;
        merges++;
        this.mergePops.push({ r: 0, c: merges, val: newVal, life: 0.4, maxLife: 0.4, merge: true });
        i++;
      } else {
        merged.push(row[i]);
      }
    }
    while (merged.length < this.size) merged.push(0);
    return { row: merged, score, merges };
  }
  _move(dir) {
    let moved = false;
    let totalScore = 0;
    let totalMerges = 0;
    const rot = (g) => { const n = g.length; const r = []; for (let i = 0; i < n; i++) { r[i] = []; for (let j = 0; j < n; j++) r[i][j] = g[n - j - 1][i]; } return r; };
    this.undoGrid = this.grid.map(r => [...r]);
    let g = this.grid.map(r => [...r]);
    const rots = { left: 0, up: 1, right: 2, down: 3 };
    const r = rots[dir] || 0;
    for (let i = 0; i < r; i++) g = rot(g);
    for (let i = 0; i < this.size; i++) {
      const res = this._slideRow(g[i]);
      if (res.row.join(',') !== g[i].join(',')) moved = true;
      totalScore += res.score;
      totalMerges += res.merges;
      g[i] = res.row;
    }
    for (let i = 0; i < (4 - r) % 4; i++) g = rot(g);
    if (moved) {
      this.grid = g;
      this.addScore(totalScore);
      // Chain bonus
      if (totalMerges >= 2) {
        const bonus = totalMerges * 10;
        this.addScore(bonus);
        this.sound.power();
        this.float(this.W / 2, this.H * 0.3, '+' + bonus + ' combo!', this.theme.accent);
      }
      this._addRandom();
      this.sound.blip(440 + totalMerges * 80, 0.06, 'triangle', 0.14);
      // Best tile
      for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] > this.bestTile) this.bestTile = this.grid[r][c];
      }
    }
    if (this.bestTile >= 2048 && !this.won) {
      this.won = true; this.confetti(this.W / 2, this.H / 2); this.sound.power();
    }
    if (!this._canMove()) { this.showOver(); }
  }
  _canMove() {
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) {
      if (this.grid[r][c] === 0) return true;
      if (c + 1 < this.size && this.grid[r][c] === this.grid[r][c + 1]) return true;
      if (r + 1 < this.size && this.grid[r][c] === this.grid[r + 1][c]) return true;
    }
    return false;
  }
  update(dt) {
    // Merge pop animations
    for (const p of this.mergePops) p.life -= dt;
    this.mergePops = this.mergePops.filter(p => p.life > 0);
    // Input
    if (this.keys['z'] || this.keys['Z']) {
      if (this.undoGrid) {
        this.grid = this.undoGrid.map(r => [...r]);
        this.undoGrid = null;
        this.sound.blip(300, 0.05, 'triangle', 0.1);
      }
      this.keys['z'] = this.keys['Z'] = false;
    }
    const dir = this.keys['arrowleft'] ? 'left' : this.keys['arrowright'] ? 'right' : this.keys['arrowup'] ? 'up' : this.keys['arrowdown'] ? 'down' : '';
    if (dir) { this._move(dir); this.keys['arrowleft'] = this.keys['arrowright'] = this.keys['arrowup'] = this.keys['arrowdown'] = false; }
    if (this.pointer.tapped) {
      if (this._swipe) {
        const dx = this.pointer.x - this._swipe.x;
        const dy = this.pointer.y - this._swipe.y;
        if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
          if (Math.abs(dx) > Math.abs(dy)) this._move(dx > 0 ? 'right' : 'left');
          else this._move(dy > 0 ? 'down' : 'up');
        }
        this._swipe = null;
      } else {
        this._swipe = { x: this.pointer.x, y: this.pointer.y };
      }
    }
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(0);
    const pad = this.W * 0.04;
    const cellSize = (this.W - pad * 2) / this.size;
    // Grid bg
    c.fillStyle = 'rgba(0,0,0,.15)'; rr2(c, pad, pad + this.H * 0.08, this.W - pad * 2, cellSize * this.size, 10); c.fill();
    // Tiles
    const tileColors = {
      0: 'transparent', 2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563', 32: '#f67c5f',
      64: '#f65e3b', 128: '#edcf72', 256: '#edcc61', 512: '#edc850', 1024: '#edc53f', 2048: '#edc22e',
      4096: '#ff4f9a', 8192: '#a24dff'
    };
    const textColors = { 2: '#776e65', 4: '#776e65', 8: '#f9f6f2', 16: '#f9f6f2', 32: '#f9f6f2', 64: '#f9f6f2', 128: '#f9f6f2', 256: '#f9f6f2', 512: '#f9f6f2', 1024: '#f9f6f2', 2048: '#f9f6f2', 4096: '#f9f6f2', 8192: '#f9f6f2' };
    for (let r = 0; r < this.size; r++) for (let colIndex = 0; colIndex < this.size; colIndex++) {
      const v = this.grid[r][colIndex];
      const x = pad + colIndex * cellSize, y = pad + r * cellSize + this.H * 0.08;
      // Check for merge pop animation
      const pop = this.mergePops.find(p => !p.spawn && Math.abs(p.r - r) + Math.abs(p.c - colIndex) < 1);
      const scale = pop ? (1 + (1 - pop.life / pop.maxLife) * 0.2) : 1;
      c.save();
      if (scale !== 1) { c.translate(x + cellSize / 2, y + cellSize / 2); c.scale(scale, scale); c.translate(-x - cellSize / 2, -y - cellSize / 2); }
      const bgCol = tileColors[v] || '#3c3a32';
      c.fillStyle = bgCol; c.strokeStyle = 'rgba(0,0,0,.08)'; c.lineWidth = 1;
      rr2(c, x + 2, y + 2, cellSize - 4, cellSize - 4, 6); c.fill(); c.stroke();
      // Shine
      c.fillStyle = 'rgba(255,255,255,.1)'; rr2(c, x + 4, y + 4, cellSize * 0.4, cellSize * 0.15, 3); c.fill();
      if (v > 0) {
        c.fillStyle = textColors[v] || '#f9f6f2';
        c.font = v < 100 ? 'bold 26px Outfit' : v < 1000 ? 'bold 20px Outfit' : 'bold 16px Outfit';
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(v, x + cellSize / 2, y + cellSize / 2);
      }
      c.restore();
      // Spawn pop animation
      const sp = this.mergePops.find(p => p.spawn && p.r === r && p.c === colIndex);
      if (sp) {
        c.globalAlpha = 1 - sp.life / sp.maxLife;
        c.fillStyle = '#fff'; c.beginPath(); c.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.5 * (1 + (1 - sp.life / sp.maxLife)), 0, 7); c.fill();
        c.globalAlpha = 1;
      }
    }
    // Info bar
    c.fillStyle = '#fff'; c.font = 'bold 16px Outfit'; c.textAlign = 'center'; c.textBaseline = 'top';
    c.fillText('Best: ' + this.bestTile, this.W / 2, 12);
    if (this.undoGrid) {
      c.fillStyle = 'rgba(255,255,255,.3)'; c.font = '12px Outfit'; c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText('[Z] Undo', 12, 12);
    }
    this.drawFx(); c.restore();
  }
}

/* ============================================================ HELIX */
class Helix extends Base {
  instructions() { return 'Tap left/right to rotate. Guide the ball down through gaps! Collect stars, hit boost rings for speed. Avoid spike rings!'; }
  reset() {
    this.ball = { x: this.W / 2, y: 40, r: Math.max(10, this.W * 0.03) };
    this.ball.vy = 0; this.ball.trail = [];
    this.rotation = 0; this.targetRot = 0;
    this.rings = []; this.stars = [];
    this.ringSpacing = this.H / 8;
    this.first = true;
    this.level = 1; this.fallSpeed = 0;
    this.combo = 0; this.consecutiveGaps = 0;
    this._buildRings();
  }
  _buildRings() {
    this.rings = []; this.stars = [];
    for (let i = 0; i < 12; i++) {
      const y = 60 + i * this.ringSpacing - (this.first ? this.ringSpacing * 0.3 : 0);
      const gaps = Math.min(4, 1 + Math.floor(this.level * 0.4));
      const gapAngles = [];
      for (let g = 0; g < gaps; g++) {
        gapAngles.push((g / gaps) * Math.PI * 2 + Math.random() * 0.6);
      }
      const roll = Math.random();
      const isSpike = roll < 0.12 && this.level > 1;
      const isBoost = roll > 0.85;
      this.rings.push({
        y, gaps: gapAngles, r: this.W * 0.42,
        phase: Math.random() * 7, moving: Math.random() < 0.2 + this.level * 0.03,
        isSpike, isBoost, cleared: false
      });
      // Stars between rings
      if (i % 2 === 0 && !isSpike) {
        this.stars.push({ x: this.W * (0.1 + Math.random() * 0.8), y: y - this.ringSpacing * 0.3, collected: false });
      }
    }
    this.first = false;
    this.consecutiveGaps = 0;
  }
  update(dt) {
    if (this.keys['arrowleft'] || this.keys['a']) this.targetRot += (2.5 + this.level * 0.15) * dt;
    if (this.keys['arrowright'] || this.keys['d']) this.targetRot -= (2.5 + this.level * 0.15) * dt;
    if (this.pointer.down) {
      if (this.pointer.x < this.W / 2) this.targetRot += (2.5 + this.level * 0.15) * dt;
      else this.targetRot -= (2.5 + this.level * 0.15) * dt;
    }
    this.rotation += (this.targetRot - this.rotation) * 6 * dt;
    // Ball physics
    this.ball.vy += (500 + this.level * 15) * dt;
    this.ball.y += this.ball.vy * dt;
    this.ball.x += (this.targetRot - this.rotation) * 30 * dt;
    // Ball trail
    if (this.ball.vy > 100) {
      this.ball.trail.push({ x: this.ball.x, y: this.ball.y, life: 0.3 });
      for (const t of this.ball.trail) t.life -= dt;
      this.ball.trail = this.ball.trail.filter(t => t.life > 0);
    }
    // Stars collection
    for (const s of this.stars) {
      if (s.collected) continue;
      if (Math.hypot(this.ball.x - s.x, this.ball.y - s.y) < 20) {
        s.collected = true;
        this.addScore(15);
        this.sound.coin();
        this.burst(s.x, s.y, '#ffd166', 8);
      }
    }
    // Ring collisions
    for (const ring of this.rings) {
      if (ring.cleared) continue;
      if (this.ball.y > ring.y - 12 && this.ball.y < ring.y + 12) {
        // Check gap
        const ballAngle = Math.atan2(0, this.ball.x - this.W / 2) + (this.ball.x < this.W / 2 ? Math.PI : 0);
        const safeGaps = Array.isArray(ring.gaps) ? ring.gaps : [];
        const effectiveAngles = safeGaps.map(g => ((g + this.rotation + (ring.moving ? Math.sin(this.time * 1.5 + ring.phase) * 0.5 : 0)) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2));
        const inGap = effectiveAngles.some(ga => {
          const diff = Math.abs((((this.rotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)) - ga);
          return diff < 0.5 || Math.abs(diff - Math.PI * 2) < 0.5;
        });
        if (ring.isSpike) { this.burst(this.ball.x, this.ball.y, '#ff4f6d', 15); this.shake = 0.6; this.loseLife(); if (this.lives > 0) { this.ball.y = 40; this.ball.vy = 0; this.ball.trail = []; this._buildRings(); } return; }
        if (!inGap) {
          this.ball.y = ring.y - 12; this.ball.vy = 0;
          this.consecutiveGaps = 0;
        } else {
          this.consecutiveGaps++;
          if (ring.isBoost) { this.ball.vy = -200; this.sound.power(); this.burst(this.ball.x, ring.y, '#8affc1', 8); ring.cleared = true; continue; }
          if (!ring.cleared) { ring.cleared = true; this.addScore(5 + this.consecutiveGaps * 2); this.sound.blip(660, 0.04, 'triangle', 0.1); }
        }
      }
    }
    // Fell off
    if (this.ball.y > this.H + 30) {
      this.loseLife();
      if (this.lives > 0) { this.ball.y = 40; this.ball.vy = 0; this.ball.trail = []; this.targetRot = 0; this.rotation = 0; this._buildRings(); }
      return;
    }
    // Reached bottom
    const lastRing = this.rings[this.rings.length - 1];
    if (lastRing && this.ball.y > lastRing.y + 30) {
      this.addScore(50 + this.level * 10);
      this.confetti(this.W / 2, this.H / 2);
      this.level++;
      this.ball.y = 40; this.ball.vy = 0; this.ball.trail = [];
      this.targetRot = 0; this.rotation = 0;
      this._buildRings();
      this.showLevel(this.level, 'Level ' + this.level + '!');
    }
    this.ball.x = Math.max(this.ball.r, Math.min(this.W - this.ball.r, this.ball.x));
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(0);
    const cx = this.W / 2;
    // Stars
    for (const s of this.stars) {
      if (s.collected) continue;
      c.fillStyle = '#ffd166'; c.shadowColor = '#ffd166'; c.shadowBlur = 8;
      c.beginPath(); c.arc(s.x, s.y + Math.sin(this.time * 3 + s.x) * 4, 6, 0, 7); c.fill();
      c.shadowBlur = 0;
    }
    // Rings
    for (const ring of this.rings) {
      if (ring.cleared) continue;
      const visible = Math.abs(this.ball.y - ring.y) < this.H * 0.5;
      if (!visible) continue;
      c.save(); c.translate(cx, ring.y);
      const baseColor = ring.isSpike ? '#ff4f6d' : ring.isBoost ? '#8affc1' : this.theme.primary;
      // Glow
      c.strokeStyle = baseColor; c.lineWidth = 10; c.globalAlpha = 0.15;
      c.beginPath(); c.arc(0, 0, ring.r + 6, 0, Math.PI * 2); c.stroke();
      c.globalAlpha = 1;
      // Ring bg
      c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 6;
      c.beginPath(); c.arc(0, 0, ring.r, 0, Math.PI * 2); c.stroke();
      // Segments
      const segs = 24;
      const moveOffset = ring.moving ? Math.sin(this.time * 1.5 + ring.phase) * 0.4 : 0;
      for (let i = 0; i < segs; i++) {
        const a1 = (i / segs) * Math.PI * 2 + this.rotation;
        const a2 = ((i + 1) / segs) * Math.PI * 2 + this.rotation;
        const safeGaps = Array.isArray(ring.gaps) ? ring.gaps : [];
        const inGap = safeGaps.some(g => {
          const ga = g + this.rotation + moveOffset;
          const cross = (a1 < ga && a2 > ga) || (a1 + Math.PI * 2 < ga && a2 + Math.PI * 2 > ga);
          return cross;
        });
        if (!inGap) {
          c.strokeStyle = baseColor; c.lineWidth = 8;
          c.shadowColor = baseColor; c.shadowBlur = 6;
          c.beginPath(); c.arc(0, 0, ring.r, a1, a2); c.stroke();
          c.shadowBlur = 0;
        }
      }
      // Spike/boost icon
      if (ring.isSpike) { c.fillStyle = '#fff'; c.font = 'bold 10px Outfit'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!!', 0, 0); }
      if (ring.isBoost) { c.fillStyle = '#fff'; c.font = 'bold 10px Outfit'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('>', 0, 0); }
      c.globalAlpha = 1;
      c.restore();
    }
    // Ball trail
    for (const t of this.ball.trail) {
      c.globalAlpha = (t.life / 0.3) * 0.3;
      c.fillStyle = this.theme.accent;
      c.beginPath(); c.arc(t.x, t.y, this.ball.r * 0.5, 0, 7); c.fill();
    }
    c.globalAlpha = 1;
    // Ball
    c.fillStyle = '#fff'; c.shadowColor = '#fff'; c.shadowBlur = 14;
    c.beginPath(); c.arc(this.ball.x, this.ball.y, this.ball.r, 0, 7); c.fill();
    c.shadowBlur = 0;
    // Level & score
    c.fillStyle = '#fff'; c.font = 'bold 14px Outfit'; c.textAlign = 'left'; c.textBaseline = 'top';
    c.fillText('Level ' + this.level, 16, 16);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.font = '12px Outfit';
    c.fillText('Combo: ' + this.consecutiveGaps, 16, 34);
    this.drawFx(); c.restore();
  }
}

/* ============================================================ DOODLE JUMP */
class DoodleJump extends Base {
  instructions() { return 'Tilt/drag/arrows to move. Bounce on platforms, avoid spikes and enemies! Grab jetpacks, coins, and shields. Height milestones give bonus points!'; }
  reset() {
    this.p = { x: this.W / 2, y: this.H - 80, vy: 0, vx: 0 };
    this.pr = Math.max(18, this.W * 0.05);
    this.plats = []; this.height = 0; this.camY = 0;
    this.jetpack = 0; this.shield = 0; this.magnet = 0;
    this.enemies = []; this.coins = [];
    this.heightBonus = 0;
    for (let i = 0; i < 8; i++) this._addPlat(this.H - i * (this.H / 8));
  }
  _addPlat(y) {
    const roll = Math.random();
    let type = 'normal';
    if (roll < 0.07) type = 'spring';
    else if (roll < 0.13) type = 'break';
    else if (roll < 0.18) type = 'moving';
    else if (roll < 0.21) type = 'spike';
    else if (roll < 0.24) type = 'rocket';
    const w = type === 'moving' ? Math.max(50, this.W * 0.16) : Math.max(55, this.W * 0.19);
    this.plats.push({
      x: Math.random() * (this.W - w - 16) + 8, y, w,
      type, vx: type === 'moving' ? (Math.random() < 0.5 ? -1 : 1) * this.W * 0.28 : 0,
      coin: Math.random() < 0.25, got: false
    });
    // Coins floating above
    if (Math.random() < 0.15) {
      this.coins.push({ x: Math.random() * this.W, y: y - 30 - Math.random() * 20, collected: false });
    }
    // Enemies on some platforms
    if (Math.random() < 0.08 && type !== 'spike' && type !== 'break') {
      this.enemies.push({ x: this.plats[this.plats.length - 1].x + w * 0.3, y: y - 16, vx: (Math.random() < 0.5 ? -1 : 1) * 40, r: 12, alive: true });
    }
  }
  update(dt) {
    const steer = (this.keys['arrowleft'] ? -1 : 0) + (this.keys['arrowright'] ? 1 : 0);
    if (steer) this.p.vx = steer * this.W * 0.5;
    else if (this.pointer.down) { const dx = this.pointer.x - this.W / 2; this.p.vx = dx * 0.9; }
    else this.p.vx *= 0.92;
    this.p.x += this.p.vx * dt;
    if (this.p.x < this.pr) this.p.x = this.W - this.pr;
    if (this.p.x > this.W - this.pr) this.p.x = this.pr;
    // Jetpack
    if (this.jetpack > 0) {
      this.p.vy = -380; this.jetpack -= dt;
      this.sound.blip(400, 0.04, 'triangle', 0.08);
    } else { this.p.vy += 950 * dt; }
    this.p.y += this.p.vy * dt;
    // Magnet
    if (this.magnet > 0) {
      this.magnet -= dt;
      for (const c of this.coins) {
        if (c.collected) continue;
        const dx = this.p.x - c.x, dy = this.p.y - c.y;
        const d = Math.hypot(dx, dy);
        if (d < this.W * 0.4) { c.x += dx / d * 300 * dt; c.y += dy / d * 300 * dt; }
      }
    }
    // Collision with enemies
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.x += e.vx * dt;
      if (e.x < e.r || e.x > this.W - e.r) e.vx = -e.vx;
      if (this.p.vy > 0 && Math.abs(this.p.x - e.x) < this.pr + e.r && Math.abs(this.p.y - e.y) < this.pr + e.r + 8) {
        if (this.shield > 0) { this.shield = 0; this.sound.hit(); this.burst(e.x, e.y, '#3ad0ff', 10); e.alive = false; }
        else { this.burst(this.p.x, this.p.y, '#ff4f6d', 15); this.loseLife(); if (this.lives > 0) { this.p.y = 80; this.p.vy = 0; } return; }
      }
    }
    // Platform collision
    if (this.p.vy > 0) {
      for (const pl of this.plats) {
        if (pl.gone) continue;
        if (pl.type === 'spike') {
          if (this.p.y + this.pr > pl.y - 4 && this.p.y - this.pr < pl.y + 8 && this.p.x + this.pr > pl.x && this.p.x - this.pr < pl.x + pl.w) {
            if (this.shield > 0) { this.shield = 0; this.burst(this.p.x, this.p.y, '#3ad0ff', 8); pl.gone = true; continue; }
            this.burst(this.p.x, this.p.y, '#ff4f6d', 12); this.loseLife();
            if (this.lives > 0) { this.p.y = 80; this.p.vy = 0; } return;
          } continue;
        }
        if (this.p.y + this.pr > pl.y - 2 && this.p.y - this.pr < pl.y + 10 && this.p.x + this.pr > pl.x + 4 && this.p.x - this.pr < pl.x + pl.w - 4) {
          this.p.y = pl.y - this.pr;
          if (pl.type === 'spring') { this.p.vy = -700; this.sound.jump(); this.burst(this.p.x, pl.y, this.theme.accent, 8); pl.gone = true; }
          else if (pl.type === 'break') { this.sound.blip(300, 0.06, 'square', 0.1); this.burst(pl.x + pl.w / 2, pl.y, '#8b4513', 6); pl.gone = true; }
          else if (pl.type === 'rocket') { this.jetpack = Math.max(this.jetpack, 2); this.sound.power(); this.burst(this.p.x, pl.y, '#ff6b35', 10); pl.gone = true; }
          else { this.p.vy = -400; this.sound.jump(); }
          if (pl.coin && !pl.got) { pl.got = true; this.addScore(5); this.sound.coin(); }
        }
      }
    }
    // Coin collection
    for (const c of this.coins) {
      if (c.collected) continue;
      if (Math.abs(this.p.x - c.x) < this.pr + 8 && Math.abs(this.p.y - c.y) < this.pr + 8) {
        c.collected = true; this.addScore(3); this.sound.blip(660, 0.04, 'triangle', 0.08);
      }
    }
    // Scroll
    if (this.p.y < this.H * 0.4) {
      const diff = this.H * 0.4 - this.p.y;
      this.height += diff; this.p.y = this.H * 0.4;
      for (const pl of this.plats) pl.y += diff;
      for (const c of this.coins) c.y += diff;
      for (const e of this.enemies) e.y += diff;
      this.plats = this.plats.filter(pl => pl.y < this.H + 30);
      this.coins = this.coins.filter(c => c.y < this.H + 30);
      this.enemies = this.enemies.filter(e => e.y < this.H + 30);
      while (this.plats.length < 8) this._addPlat(this.plats.length === 0 ? this.H - 20 : this.plats[this.plats.length - 1].y - this.H / 8);
      // Height milestone
      const newBonus = Math.floor(this.height / 500);
      if (newBonus > this.heightBonus) { this.heightBonus = newBonus; this.addScore(50); this.sound.power(); this.float(this.W / 2, this.H * 0.3, '+' + 50 + ' height bonus!', this.theme.accent); }
    }
    for (const pl of this.plats) { if (pl.type === 'moving') { pl.x += pl.vx * dt; if (pl.x < 0 || pl.x > this.W - pl.w) pl.vx = -pl.vx; } }
    if (this.p.y > this.H + 50) { this.addScore(Math.floor(this.height / 4)); this.showOver(); }
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(0);
    // Coins
    for (const cn of this.coins) {
      if (cn.collected) continue;
      c.fillStyle = '#ffd166'; c.shadowColor = '#ffd166'; c.shadowBlur = 8;
      c.beginPath(); c.arc(cn.x, cn.y + Math.sin(this.time * 3 + cn.x) * 3, 5, 0, 7); c.fill(); c.shadowBlur = 0;
    }
    // Enemies
    for (const e of this.enemies) {
      if (!e.alive) continue;
      c.fillStyle = '#ff4f6d'; c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1;
      c.beginPath(); c.arc(e.x, e.y, e.r, 0, 7); c.fill(); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(e.x - 4, e.y - 3, 3, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(e.x + 4, e.y - 3, 3, 0, 7); c.fill();
    }
    // Platforms
    for (const pl of this.plats) {
      if (pl.gone) continue;
      if (pl.type === 'spike') { c.fillStyle = '#ff4f6d'; c.beginPath(); c.moveTo(pl.x, pl.y + 8); c.lineTo(pl.x + pl.w / 2, pl.y); c.lineTo(pl.x + pl.w, pl.y + 8); c.closePath(); c.fill(); continue; }
      const col = pl.type === 'spring' ? '#ffd166' : pl.type === 'break' ? '#8b4513' : pl.type === 'rocket' ? '#ff6b35' : this.theme.primary;
      c.fillStyle = col; c.strokeStyle = 'rgba(0,0,0,.1)'; c.lineWidth = 1;
      rr2(c, pl.x, pl.y, pl.w, 8, 3); c.fill(); c.stroke();
      if (pl.type === 'spring') { c.fillStyle = '#fff'; c.font = 'bold 10px Outfit'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('^^', pl.x + pl.w / 2, pl.y + 4); }
      if (pl.type === 'rocket') { c.fillStyle = '#fff'; c.font = '10px Outfit'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('>>>', pl.x + pl.w / 2, pl.y + 4); }
      if (pl.coin && !pl.got) { c.fillStyle = '#ffd166'; c.font = '12px Outfit'; c.textAlign = 'center'; c.textBaseline = 'bottom'; c.fillText('$', pl.x + pl.w / 2, pl.y - 2); }
    }
    // Hero
    const squash = this.p.vy > 150 ? 0.15 : this.p.vy < -250 ? -0.12 : 0;
    // Doodle-jump style: the mascot is permanently mid-hop, so the jump row fits throughout.
    this.hero(this.p.x, this.p.y, Math.max(36, this.W * 0.09), { t: this.time, run: true, squash, expr: this.p.vy > 50 ? 'wow' : 'smile', anim: 'jump' });
    // Power-up indicators
    if (this.jetpack > 0) { c.fillStyle = '#ff6b35'; c.font = 'bold 14px Outfit'; c.textAlign = 'center'; c.textBaseline = 'bottom'; c.fillText('🚀 ' + this.jetpack.toFixed(1) + 's', this.W / 2, 50); }
    if (this.shield > 0) { c.fillStyle = '#3ad0ff'; c.font = 'bold 14px Outfit'; c.textAlign = 'center'; c.textBaseline = 'bottom'; c.fillText('🛡️ ' + this.shield.toFixed(1) + 's', this.W / 2, 34); }
    if (this.magnet > 0) { c.fillStyle = '#ff5b9a'; c.font = 'bold 14px Outfit'; c.textAlign = 'center'; c.textBaseline = 'bottom'; c.fillText('🧲 ' + this.magnet.toFixed(1) + 's', this.W / 2, 18); }
    c.fillStyle = '#fff'; c.font = 'bold 14px Outfit'; c.textAlign = 'left'; c.textBaseline = 'top';
    c.fillText('Height: ' + Math.floor(this.height), 16, 16);
    this.drawFx(); c.restore();
  }
}

/* ============================================================ ASTEROIDS */
class Asteroids extends Base {
  instructions() { return '← → rotate, ↑ thrust, Space to shoot! Power-ups: S=Spread, H=Homing, B=Shield. Watch for alien saucers that shoot back!'; }
  reset() {
    this.ship = { x: this.W / 2, y: this.H / 2, ang: -Math.PI / 2, vx: 0, vy: 0, r: 16, thrust: false };
    this.bullets = []; this.powerups = [];
    this.asteroids = []; this.saucers = [];
    this.level = 1;
    for (let i = 0; i < 4; i++) this._spawnAsteroid();
    this.shootCooldown = 0; this.saucerTimer = 8;
    this.weapon = 'normal'; this.weaponTimer = 0;
    this.invulnTimer = 0;
    this.killsInLevel = 0;
  }
  _spawnAsteroid() {
    const r = 18 + Math.random() * 32;
    let x, y;
    do { x = Math.random() * this.W; y = Math.random() * this.H; } while (Math.hypot(x - this.ship.x, y - this.ship.y) < 120);
    const ang = Math.random() * Math.PI * 2;
    this.asteroids.push({ x, y, r, vx: Math.cos(ang) * (30 + Math.random() * 50) * this.difficulty(), vy: Math.sin(ang) * (30 + Math.random() * 50) * this.difficulty() });
  }
  update(dt) {
    this.invulnTimer -= dt;
    if (this.keys['arrowleft']) this.ship.ang -= 3.5 * dt;
    if (this.keys['arrowright']) this.ship.ang += 3.5 * dt;
    this.ship.thrust = this.keys['arrowup'] || false;
    if (this.ship.thrust) {
      this.ship.vx += Math.cos(this.ship.ang) * 220 * dt;
      this.ship.vy += Math.sin(this.ship.ang) * 220 * dt;
      this.burst(this.ship.x - Math.cos(this.ship.ang) * 18, this.ship.y - Math.sin(this.ship.ang) * 18, '#ffd166', 1);
      this.sound.blip(200, 0.03, 'sawtooth', 0.06);
    }
    // Weapon switching
    if (this.keys['s'] || this.keys['S']) { this.weapon = 'spread'; this.weaponTimer = 5; this.keys['s'] = this.keys['S'] = false; }
    if (this.keys['h'] || this.keys['H']) { this.weapon = 'homing'; this.weaponTimer = 5; this.keys['h'] = this.keys['H'] = false; }
    if (this.keys['b'] || this.keys['B']) { this.grantPower('shield'); this.keys['b'] = this.keys['B'] = false; }
    this.weaponTimer -= dt;
    if (this.weaponTimer <= 0) this.weapon = 'normal';
    // Shoot
    this.shootCooldown -= dt;
    if ((this.keys[' '] || this.keys['z'] || this.pointer.tapped) && this.shootCooldown <= 0) {
      if (this.weapon === 'spread') {
        for (let i = -1; i <= 1; i++) {
          const a = this.ship.ang + i * 0.3;
          this.bullets.push({ x: this.ship.x + Math.cos(a) * 20, y: this.ship.y + Math.sin(a) * 20, vx: Math.cos(a) * 400, vy: Math.sin(a) * 400, life: 1.2, homing: false });
        }
      } else if (this.weapon === 'homing') {
        const target = this.asteroids.sort((a, b) => Math.hypot(a.x - this.ship.x, a.y - this.ship.y) - Math.hypot(b.x - this.ship.x, b.y - this.ship.y))[0];
        if (target) {
          const ha = Math.atan2(target.y - this.ship.y, target.x - this.ship.x);
          this.bullets.push({ x: this.ship.x + Math.cos(ha) * 20, y: this.ship.y + Math.sin(ha) * 20, vx: Math.cos(ha) * 350, vy: Math.sin(ha) * 350, life: 2, homing: true, target: target });
        }
      } else {
        this.bullets.push({ x: this.ship.x + Math.cos(this.ship.ang) * 20, y: this.ship.y + Math.sin(this.ship.ang) * 20, vx: Math.cos(this.ship.ang) * 400, vy: Math.sin(this.ship.ang) * 400, life: 1.5, homing: false });
      }
      this.shootCooldown = 0.12;
      this.sound.blip(880, 0.05, 'square', 0.12);
    }
    this.keys[' '] = false; this.keys['z'] = false;
    this.ship.x += this.ship.vx * dt; this.ship.y += this.ship.vy * dt;
    this.ship.vx *= 0.98; this.ship.vy *= 0.98;
    if (this.ship.x < -20) this.ship.x = this.W + 20;
    if (this.ship.x > this.W + 20) this.ship.x = -20;
    if (this.ship.y < -20) this.ship.y = this.H + 20;
    if (this.ship.y > this.H + 20) this.ship.y = -20;
    // Bullets
    for (const b of this.bullets) {
      if (b.homing && b.target) {
        if (b.target.hit) { b.target = null; continue; }
        const ha = Math.atan2(b.target.y - b.y, b.target.x - b.x);
        b.vx += (Math.cos(ha) * 300 - b.vx) * 0.05;
        b.vy += (Math.sin(ha) * 300 - b.vy) * 0.05;
      }
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    }
    this.bullets = this.bullets.filter(b => b.life > 0 && b.x > -20 && b.x < this.W + 20 && b.y > -20 && b.y < this.H + 20);
    // Asteroids
    for (const a of this.asteroids) {
      a.x += a.vx * dt; a.y += a.vy * dt;
      if (a.x < -a.r) a.x = this.W + a.r;
      if (a.x > this.W + a.r) a.x = -a.r;
      if (a.y < -a.r) a.y = this.H + a.r;
      if (a.y > this.H + a.r) a.y = -a.r;
    }
    // Collisions
    for (const b of this.bullets) {
      for (const a of this.asteroids) {
        if (a.hit) continue;
        if (Math.hypot(b.x - a.x, b.y - a.y) < a.r + 4) {
          b.life = -1; a.hit = true;
          this.burst(a.x, a.y, '#8a5cff', 14);
          this.shake = 0.3;
          this.sound.hit();
          this.killsInLevel++;
          this.hitCombo(a.x, a.y, 20 + this.killsInLevel * 2);
          if (a.r > 14) {
            const nr = a.r * 0.5;
            for (let i = 0; i < 2; i++) {
              const ang = Math.random() * Math.PI * 2;
              this.asteroids.push({ x: a.x + Math.cos(ang) * a.r, y: a.y + Math.sin(ang) * a.r, r: nr, vx: Math.cos(ang) * 90 + a.vx * 0.3, vy: Math.sin(ang) * 90 + a.vy * 0.3 });
            }
          }
          break;
        }
      }
    }
    this.asteroids = this.asteroids.filter(a => !a.hit);
    this.bullets = this.bullets.filter(b => b.life > 0);
    // Saucer spawn
    this.saucerTimer -= dt;
    if (this.saucerTimer <= 0 && this.asteroids.length > 2) {
      this.saucerTimer = 6 + Math.random() * 4;
      this.saucers.push({ x: Math.random() < 0.5 ? -30 : this.W + 30, y: Math.random() * this.H * 0.6 + 30, r: 16, vx: (Math.random() < 0.5 ? -1 : 1) * (60 + this.level * 10), vy: (Math.random() - 0.5) * 40, shootTimer: 1.5, alive: true });
    }
    // Saucers
    for (const s of this.saucers) {
      if (!s.alive) continue;
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.x < -40 || s.x > this.W + 40 || s.y < -40 || s.y > this.H + 40) { s.alive = false; continue; }
      s.shootTimer -= dt;
      if (s.shootTimer <= 0) {
        s.shootTimer = 1 + Math.random();
        const ha = Math.atan2(this.ship.y - s.y, this.ship.x - s.x);
        this.bullets.push({ x: s.x + Math.cos(ha) * 16, y: s.y + Math.sin(ha) * 16, vx: Math.cos(ha) * 200, vy: Math.sin(ha) * 200, life: 2, enemy: true, homing: false });
      }
    }
    // Ship damage from enemy bullets
    for (const b of this.bullets) {
      if (!b.enemy) continue;
      if (Math.hypot(b.x - this.ship.x, b.y - this.ship.y) < this.ship.r + 4) {
        b.life = -1;
        if (this.invulnTimer > 0) continue;
        this.burst(this.ship.x, this.ship.y, '#ff4f9a', 15);
        this.shake = 1; this.loseLife();
        if (this.lives > 0) { this.ship.x = this.W / 2; this.ship.y = this.H / 2; this.ship.vx = 0; this.ship.vy = 0; this.invulnTimer = 1.5; }
      }
    }
    // Bullet-saucer collisions
    for (const b of this.bullets) {
      if (b.enemy) continue;
      for (const s of this.saucers) {
        if (!s.alive) continue;
        if (Math.hypot(b.x - s.x, b.y - s.y) < s.r + 4) { b.life = -1; s.alive = false; this.burst(s.x, s.y, '#ffd166', 20); this.addScore(50); this.sound.power(); break; }
      }
    }
    this.bullets = this.bullets.filter(b => b.life > 0);
    // Ship-asteroid collision
    if (this.invulnTimer <= 0) {
      for (const a of this.asteroids) {
        if (Math.hypot(this.ship.x - a.x, this.ship.y - a.y) < this.ship.r + a.r) {
          this.burst(this.ship.x, this.ship.y, '#ff4f9a', 20);
          this.shake = 1.5; this.loseLife();
          if (this.lives > 0) { this.ship.x = this.W / 2; this.ship.y = this.H / 2; this.ship.vx = 0; this.ship.vy = 0; this.invulnTimer = 1.5; } break;
        }
      }
    }
    this.saucers = this.saucers.filter(s => s.alive);
    // Power-up spawn
    if (this.killsInLevel > 0 && this.killsInLevel % 5 === 0 && !this._powerSpawned) {
      this._powerSpawned = true;
      this.powerups.push({ x: this.W / 2, y: this.H / 2, type: ['spread', 'homing', 'shield'][Math.floor(Math.random() * 3)] });
    }
    for (const p of this.powerups) {
      if (Math.hypot(p.x - this.ship.x, p.y - this.ship.y) < 24) {
        if (p.type === 'shield') this.grantPower('shield');
        else { this.weapon = p.type; this.weaponTimer = 6; }
        this.sound.power(); this.burst(p.x, p.y, this.theme.accent, 8);
        p.collected = true;
      }
    }
    this.powerups = this.powerups.filter(p => !p.collected);
    // Level clear
    if (this.asteroids.length === 0) {
      this.level++; this.killsInLevel = 0; this._powerSpawned = false;
      this.addScore(100);
      this.sound.power();
      for (let i = 0; i < 2 + this.level; i++) this._spawnAsteroid();
      this.float(this.W / 2, this.H * 0.4, 'Level ' + this.level + '!', this.theme.accent);
    }
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(0);
    // Power-ups
    for (const p of this.powerups) {
      c.fillStyle = p.type === 'shield' ? '#3ad0ff' : p.type === 'spread' ? '#ffd166' : '#ff4f9a';
      c.shadowColor = c.fillStyle; c.shadowBlur = 12;
      c.beginPath(); c.arc(p.x, p.y + Math.sin(this.time * 3) * 4, 12, 0, 7); c.fill(); c.shadowBlur = 0;
      c.fillStyle = '#fff'; c.font = 'bold 10px Outfit'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(p.type === 'shield' ? 'S' : p.type === 'spread' ? 'W' : 'H', p.x, p.y + Math.sin(this.time * 3) * 4);
    }
    // Asteroids
    for (const a of this.asteroids) {
      c.strokeStyle = `hsl(${(a.x + a.y) % 360},50%,60%)`; c.lineWidth = 2.5;
      const pts = 8 + Math.floor(a.r / 6);
      c.beginPath();
      for (let i = 0; i < pts; i++) {
        const ang = (i / pts) * Math.PI * 2;
        const rOff = a.r * (0.8 + Math.sin(a.x * 0.1 + a.y * 0.1 + i * 3) * 0.2);
        const px = a.x + Math.cos(ang) * rOff, py = a.y + Math.sin(ang) * rOff;
        i === 0 ? c.moveTo(px, py) : c.lineTo(px, py);
      }
      c.closePath(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.06)'; c.fill();
    }
    // Saucers
    for (const s of this.saucers) {
      if (!s.alive) continue;
      c.fillStyle = '#ff4f9a'; c.strokeStyle = '#fff'; c.lineWidth = 1;
      c.beginPath(); c.ellipse(s.x, s.y, s.r, s.r * 0.5, 0, 0, 7); c.fill(); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(s.x, s.y - 4, 4, 0, 7); c.fill();
    }
    // Bullets
    for (const b of this.bullets) {
      c.fillStyle = b.enemy ? '#ff4f6d' : '#fff';
      c.beginPath(); c.arc(b.x, b.y, b.enemy ? 3 : 3, 0, 7); c.fill();
    }
    // Ship with invuln blink
    if (this.invulnTimer <= 0 || Math.floor(this.invulnTimer * 8) % 2) {
      c.save(); c.translate(this.ship.x, this.ship.y); c.rotate(this.ship.ang);
      const wColor = this.weapon === 'spread' ? '#ffd166' : this.weapon === 'homing' ? '#ff4f9a' : '#fff';
      c.strokeStyle = wColor; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(22, 0); c.lineTo(-14, -14); c.lineTo(-8, 0); c.lineTo(-14, 14); c.closePath(); c.stroke();
      if (this.ship.thrust) { c.fillStyle = '#ffd166'; c.beginPath(); c.moveTo(-10, -8); c.lineTo(-22, 0); c.lineTo(-10, 8); c.closePath(); c.fill(); }
      c.restore();
    }
    // Weapon indicator
    if (this.weapon !== 'normal') {
      c.fillStyle = this.weapon === 'spread' ? '#ffd166' : '#ff4f9a';
      c.font = 'bold 12px Outfit'; c.textAlign = 'right'; c.textBaseline = 'top';
      c.fillText(this.weapon.toUpperCase() + ' ' + this.weaponTimer.toFixed(1) + 's', this.W - 16, 16);
    }
    c.fillStyle = '#fff'; c.font = 'bold 14px Outfit'; c.textAlign = 'left'; c.textBaseline = 'top';
    c.fillText('Lv.' + this.level + '  Kills:' + this.killsInLevel, 16, 16);
    this.drawFx(); c.restore();
  }
}

/* ============================================================ PIPELINE */
class Pipeline extends Base {
  instructions() { return 'Tap pipes to rotate them! Connect START to END before time runs out. Cross pipes (4-way) help chain paths. Fast clear = time bonus!'; }
  reset() {
    this.rows = 5; this.cols = 5;
    this.level = 1;
    this._resizeGrid();
  }
  _resizeGrid() {
    this.cellSize = Math.min((this.W - 40) / this.cols, (this.H * 0.7) / this.rows);
    this._generate();
  }
  _generate() {
    this.grid = [];
    const types = ['straight', 'corner', 'tee', 'cross'];
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = {
          type: types[Math.floor(Math.random() * types.length)],
          rot: Math.floor(Math.random() * 4), fixed: false,
          connected: false, r, c, flow: 0
        };
      }
    }
    this.startX = 0; this.startY = Math.floor(this.rows / 2);
    this.endX = this.cols - 1; this.endY = Math.floor(this.rows / 2);
    this.grid[this.startY][this.startX].type = 'straight';
    this.grid[this.startY][this.startX].rot = 0;
    this.grid[this.startY][this.startX].fixed = true;
    this.grid[this.endY][this.endX].type = 'straight';
    this.grid[this.endY][this.endX].rot = 0;
    this.grid[this.endY][this.endX].fixed = true;
    this.timeLeft = Math.max(12, 28 - this.level * 2);
    this.completed = false; this.flowAnim = 0;
  }
  _checkPath() {
    const visited = new Set();
    const queue = [{ x: this.startX, y: this.startY, dist: 0 }];
    while (queue.length > 0) {
      const { x, y, dist } = queue.shift();
      const key = x + ',' + y;
      if (visited.has(key)) continue;
      visited.add(key);
      const cell = this.grid[y][x];
      if (!cell) continue;
      cell.flow = dist;
      const dirs = this._getDirs(cell.type, cell.rot);
      for (const d of dirs) {
        const nx = x + d.dx, ny = y + d.dy;
        if (nx < 0 || nx >= this.cols || ny < 0 || ny >= this.rows) continue;
        const nk = nx + ',' + ny;
        if (visited.has(nk)) continue;
        const ncell = this.grid[ny][nx];
        if (!ncell) continue;
        const ndirs = this._getDirs(ncell.type, ncell.rot);
        if (ndirs.some(nd => nd.dx === -d.dx && nd.dy === -d.dy)) {
          queue.push({ x: nx, y: ny, dist: dist + 1 });
        }
      }
    }
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      if (!visited.has(c + ',' + r)) this.grid[r][c].flow = -1;
    }
    return visited.has(this.endX + ',' + this.endY);
  }
  _getDirs(type, rot) {
    const base = {
      'straight': [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }],
      'corner': [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }],
      'tee': [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }],
      'cross': [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }]
    };
    const d = base[type] || base.straight;
    return d.map(dd => {
      let dx = dd.dx, dy = dd.dy;
      for (let i = 0; i < rot; i++) { const t = dx; dx = -dy; dy = t; }
      return { dx, dy };
    });
  }
  update(dt) {
    if (this.completed) return;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.loseLife();
      if (this.lives > 0) { this._generate(); return; }
      return;
    }
    if (this.pointer.tapped) {
      const r = Math.floor((this.pointer.y - this.H * 0.15) / this.cellSize);
      const c = Math.floor((this.pointer.x - 20) / this.cellSize);
      if (r >= 0 && r < this.rows && c >= 0 && c < this.cols && !this.grid[r][c].fixed) {
        this.grid[r][c].rot = (this.grid[r][c].rot + 1) % 4;
        this.sound.blip(440 + Math.random() * 100, 0.05, 'triangle', 0.12);
        if (this._checkPath()) {
          this.completed = true;
          const bonus = Math.max(10, Math.floor(this.timeLeft * 4));
          this.addScore(bonus + this.level * 20);
          this.sound.power();
          this.confetti(this.W / 2, this.H * 0.3);
          this.float(this.W / 2, this.H * 0.25, '+' + bonus + ' time bonus!', this.theme.accent);
          this.schedule(1.2, () => {
            this.rows = Math.min(8, 5 + Math.floor(this.level * 0.3));
            this.cols = this.rows;
            this.level++;
            this._resizeGrid();
            this.completed = false;
          });
        }
      }
    }
    // Flow animation
    if (!this.completed) this._checkPath();
    this.flowAnim += dt * 2;
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(0);
    const offX = 20, offY = this.H * 0.15;
    const cs = this.cellSize;
    c.fillStyle = 'rgba(0,0,0,.12)';
    c.fillRect(offX - 4, offY - 4, this.cols * cs + 8, this.rows * cs + 8);
    for (let r = 0; r < this.rows; r++) for (let colIndex = 0; colIndex < this.cols; colIndex++) {
      const cell = this.grid[r][colIndex];
      const x = offX + colIndex * cs + cs / 2, y = offY + r * cs + cs / 2;
      const isConnected = cell.flow >= 0;
      const col = isConnected ? this.theme.accent : 'rgba(255,255,255,.25)';
      const flowAlpha = isConnected ? (0.5 + 0.5 * Math.sin(this.flowAnim + cell.flow)) : 0;
      c.save(); c.translate(x, y);
      c.rotate(cell.rot * Math.PI / 2);
      c.strokeStyle = col; c.lineWidth = 5; c.lineCap = 'round';
      // Water flow overlay
      if (isConnected && cell.type !== 'cross') {
        c.strokeStyle = 'rgba(100,180,255,' + flowAlpha * 0.4 + ')'; c.lineWidth = 7;
        if (cell.type === 'straight') { c.beginPath(); c.moveTo(0, -cs * 0.35); c.lineTo(0, cs * 0.35); c.stroke(); }
        else if (cell.type === 'corner') { c.beginPath(); c.moveTo(0, -cs * 0.35); c.lineTo(0, 0); c.lineTo(cs * 0.35, 0); c.stroke(); }
        else if (cell.type === 'tee') { c.beginPath(); c.moveTo(0, -cs * 0.35); c.lineTo(0, cs * 0.35); c.stroke(); c.beginPath(); c.moveTo(0, 0); c.lineTo(cs * 0.35, 0); c.stroke(); }
      }
      c.strokeStyle = col; c.lineWidth = 4;
      if (cell.type === 'straight') { c.beginPath(); c.moveTo(0, -cs * 0.35); c.lineTo(0, cs * 0.35); c.stroke(); }
      else if (cell.type === 'corner') { c.beginPath(); c.moveTo(0, -cs * 0.35); c.lineTo(0, 0); c.lineTo(cs * 0.35, 0); c.stroke(); }
      else if (cell.type === 'tee') { c.beginPath(); c.moveTo(0, -cs * 0.35); c.lineTo(0, cs * 0.35); c.stroke(); c.beginPath(); c.moveTo(0, 0); c.lineTo(cs * 0.35, 0); c.stroke(); }
      else if (cell.type === 'cross') {
        c.beginPath(); c.moveTo(0, -cs * 0.35); c.lineTo(0, cs * 0.35); c.stroke();
        c.beginPath(); c.moveTo(-cs * 0.35, 0); c.lineTo(cs * 0.35, 0); c.stroke();
      }
      if (cell.fixed) { c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.arc(0, 0, 4, 0, 7); c.fill(); }
      c.restore();
    }
    // Flow particles on path
    if (!this.completed) {
      for (let r = 0; r < this.rows; r++) for (let colIndex = 0; colIndex < this.cols; colIndex++) {
        const cell = this.grid[r][colIndex];
        if (cell.flow < 0 || cell.type === 'cross') continue;
        const x = offX + colIndex * cs + cs / 2, y = offY + r * cs + cs / 2;
        const t = ((this.flowAnim + cell.flow * 0.3) % 1);
        c.fillStyle = 'rgba(100,200,255,' + (0.3 * (1 - t)) + ')';
        c.beginPath(); c.arc(x, y - cs * 0.35 + t * cs * 0.7, 3, 0, 7); c.fill();
      }
    }
    // Start/End markers
    c.fillStyle = '#8affc1'; c.font = 'bold 11px Outfit'; c.textAlign = 'center'; c.textBaseline = 'bottom';
    c.fillText('START', offX + this.startX * cs + cs / 2, offY + this.startY * cs - 4);
    c.fillStyle = '#ff4f9a';
    c.fillText('END', offX + this.endX * cs + cs / 2, offY + this.endY * cs - 4);
    const timerColor = this.timeLeft < 5 ? '#ff4f9a' : this.timeLeft < 10 ? '#ffd166' : '#fff';
    c.fillStyle = timerColor; c.font = 'bold 20px Outfit'; c.textAlign = 'center'; c.textBaseline = 'top';
    c.fillText('Time: ' + Math.ceil(this.timeLeft), this.W / 2, 16);
    c.fillStyle = '#fff'; c.font = 'bold 14px Outfit'; c.textAlign = 'left'; c.textBaseline = 'top';
    c.fillText('Lv.' + this.level + ' (' + this.rows + 'x' + this.cols + ')', 16, 16);
    this.drawFx(); c.restore();
  }
}

/* ============================================================ GALLERY / Shooting Gallery */
class Gallery extends Base {
  instructions() { return 'Click to shoot targets! Build combos for bonus. Ducks bob in cover, bombs end round! Gold = jackpot, small = hard. Perfect round = bonus!'; }
  reset() {
    this.targets = [];
    this.spawnTimer = 0;
    this.spawnInterval = 0.7;
    this.maxTargets = 5;
    this.hits = 0; this.misses = 0;
    this.combo = 0; this.maxCombo = 0;
    this.round = 1;
    this.roundDuration = 18;
    this.roundTimer = this.roundDuration;
    this.perfectRound = 0;
    this.crosshair = { x: this.W / 2, y: this.H / 2 };
    this.speedRound = false;
  }
  _spawnTarget() {
    if (this.targets.length >= this.maxTargets) return;
    const roll = Math.random();
    let type = 'normal', r = 22, score = 10, speed = 0, life = 2;
    if (this.round >= 3 && roll < 0.08) { type = 'bomb'; r = 26; score = -50; life = 4; }
    else if (this.round >= 2 && roll < 0.12) { type = 'gold'; r = 18; score = 50; life = 1.5; }
    else if (roll < 0.25) { type = 'moving'; r = 22; score = 25; life = 2.5; speed = 60 + Math.random() * 80; }
    else if (this.round >= 4 && roll < 0.35) { type = 'small'; r = 12; score = 35; life = 1.5; }
    else if (this.round >= 5 && roll < 0.45) { type = 'duck'; r = 24; score = 15; life = 3; }
    const sx = speed * (Math.random() < 0.5 ? -1 : 1);
    const sy = type === 'duck' ? 30 + Math.random() * 40 : speed * 0.3 * (Math.random() < 0.5 ? -1 : 1);
    this.targets.push({
      x: r + Math.random() * (this.W - r * 2),
      y: this.H * 0.15 + Math.random() * (this.H * 0.65),
      r, type, score, vx: sx, vy: sy,
      life, maxLife: life, hit: false, duckHidden: 0
    });
  }
  update(dt) {
    if (!this.running) return;
    if (this.pointer.x || this.pointer.y) {
      this.crosshair.x = this.pointer.x;
      this.crosshair.y = this.pointer.y;
    }
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this._spawnTarget();
      this.spawnTimer = (this.spawnInterval / this.difficulty()) * (this.speedRound ? 0.5 : 1);
    }
    for (const t of this.targets) {
      if (t.type === 'duck') {
        t.duckHidden += dt;
        t.y += Math.sin(t.duckHidden * 3) * 40 * dt; // bob up/down
      } else {
        if (t.vx) { t.x += t.vx * dt; if (t.x < t.r || t.x > this.W - t.r) t.vx = -t.vx; }
        if (t.vy) { t.y += t.vy * dt; if (t.y < this.H * 0.15 + t.r || t.y > this.H * 0.8) t.vy = -t.vy; }
      }
      t.life -= dt;
    }
    this.targets = this.targets.filter(t => t.life > 0 && !t.hit);
    if (this.pointer.tapped) {
      let hit = false;
      const sorted = [...this.targets].sort((a, b) => b.x - a.x);
      for (const t of sorted) {
        if (Math.hypot(this.crosshair.x - t.x, this.crosshair.y - t.y) < t.r + 10) {
          if (t.type === 'bomb') {
            this.shake = 0.5;
            this.burst(t.x, t.y, '#ff4f9a', 20);
            this.loseLife();
            this.combo = 0;
            this.sound.blip(100, 0.2, 'sawtooth', 0.3);
            t.hit = true;
            hit = true;
            break;
          }
          t.hit = true;
          this.hits++;
          hit = true;
          this.combo++;
          if (this.combo > this.maxCombo) this.maxCombo = this.combo;
          const comboBonus = Math.floor(this.combo / 5) * 10;
          this.hitCombo(t.x, t.y, t.score + comboBonus);
          this.burst(t.x, t.y, t.type === 'gold' ? '#ffd166' : this.theme.accent, 10);
          this.shake = 0.15;
          if (this.combo >= 5 && this.combo % 5 === 0) {
            this.float(t.x, t.y - 20, this.combo + 'x combo!', '#ffd166');
          }
          if (t.type === 'gold') { this.confetti(t.x, t.y); this.sound.power(); }
          else if (t.type === 'small') { this.sound.blip(1200, 0.06, 'sine', 0.12); }
          else { this.sound.coin(); }
          break;
        }
      }
      if (!hit) {
        this.misses++;
        this.combo = 0;
        this.sound.blip(200, 0.08, 'sawtooth', 0.1);
      }
    }
    // Speed round every 5 rounds
    if (this.round % 5 === 0 && !this.speedRound) {
      this.speedRound = true;
      this.spawnInterval *= 0.5;
      this.float(this.W / 2, this.H * 0.3, 'SPEED ROUND!', '#ff6b35');
    }
    if (this.round % 5 !== 0 && this.speedRound) {
      this.speedRound = false;
    }
    this.roundTimer -= dt;
    if (this.roundTimer <= 0) {
      // Check perfect round
      if (this.misses === 0 && this.hits > 0) {
        this.perfectRound++;
        this.addScore(100);
        this.float(this.W / 2, this.H * 0.35, 'Perfect Round! +100', '#ffd166');
      }
      this.round++;
      this.roundTimer = this.roundDuration;
      this.spawnInterval = Math.max(0.3, 0.7 - this.round * 0.03);
      this.maxTargets = Math.min(10, 5 + Math.floor(this.round / 2));
      this.sound.power();
      this.float(this.W / 2, this.H * 0.4, 'Round ' + this.round + '!', this.theme.accent);
    }
    this.targets = this.targets.filter(t => !t.hit);
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(0);
    for (const t of this.targets) {
      const alpha = Math.min(1, t.life / t.maxLife * 2);
      c.globalAlpha = alpha;
      if (t.type === 'bomb') {
        c.fillStyle = '#333'; c.shadowColor = '#ff4f9a'; c.shadowBlur = 20;
        c.beginPath(); c.arc(t.x, t.y, t.r, 0, 7); c.fill();
        c.fillStyle = '#ff4f9a'; c.font = 'bold 16px Outfit'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('💣', t.x, t.y);
        c.shadowBlur = 0;
      } else if (t.type === 'gold') {
        c.fillStyle = '#ffd166'; c.shadowColor = '#ffd166'; c.shadowBlur = 15;
        c.beginPath(); c.arc(t.x, t.y, t.r, 0, 7); c.fill();
        c.shadowBlur = 0;
        c.strokeStyle = 'rgba(255,209,102,.3)'; c.lineWidth = 2;
        c.beginPath(); c.arc(t.x, t.y, t.r * 1.2, 0, 7); c.stroke();
      } else if (t.type === 'duck') {
        c.fillStyle = '#8affc1';
        c.beginPath(); c.arc(t.x, t.y, t.r, 0, 7); c.fill();
        c.fillStyle = '#fff'; c.font = '14px Outfit'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('🦆', t.x, t.y);
      } else if (t.type === 'moving') {
        c.fillStyle = '#ff6b35'; c.shadowColor = '#ff6b35'; c.shadowBlur = 10;
        c.beginPath(); c.arc(t.x, t.y, t.r, 0, 7); c.fill();
        c.shadowBlur = 0;
      } else if (t.type === 'small') {
        c.fillStyle = '#3ad0ff'; c.shadowColor = '#3ad0ff'; c.shadowBlur = 10;
        c.beginPath(); c.arc(t.x, t.y, t.r, 0, 7); c.fill();
        c.shadowBlur = 0;
      } else {
        c.fillStyle = this.theme.primary;
        c.beginPath(); c.arc(t.x, t.y, t.r, 0, 7); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.15)'; c.lineWidth = 1;
        c.beginPath(); c.arc(t.x, t.y, t.r * 1.3, 0, 7); c.stroke();
      }
      if (t.type !== 'normal' && t.type !== 'duck' && t.type !== 'bomb') {
        c.fillStyle = '#fff'; c.font = 'bold 12px Outfit'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(t.score, t.x, t.y);
      }
      c.globalAlpha = 1;
    }
    const cx = this.crosshair.x, cy = this.crosshair.y;
    c.strokeStyle = 'rgba(255,50,50,.8)'; c.lineWidth = 2;
    c.beginPath(); c.arc(cx, cy, 14, 0, 7); c.stroke();
    c.beginPath(); c.moveTo(cx - 22, cy); c.lineTo(cx - 8, cy); c.moveTo(cx + 8, cy); c.lineTo(cx + 22, cy); c.stroke();
    c.beginPath(); c.moveTo(cx, cy - 22); c.lineTo(cx, cy - 8); c.moveTo(cx, cy + 8); c.lineTo(cx, cy + 22); c.stroke();
    c.fillStyle = 'rgba(255,50,50,.6)'; c.beginPath(); c.arc(cx, cy, 3, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.font = 'bold 14px Outfit'; c.textAlign = 'left'; c.textBaseline = 'top';
    c.fillText('R' + this.round, 16, 16);
    c.fillText('⏱' + Math.ceil(this.roundTimer) + 's', 16, 34);
    if (this.speedRound) { c.fillStyle = '#ff6b35'; c.fillText('⚡ SPEED ⚡', 16, 52); }
    else { c.fillStyle = 'rgba(255,255,255,.5)'; }
    c.font = '12px Outfit';
    c.fillText('H:' + this.hits + ' M:' + this.misses + ' C:' + this.combo, 16, this.speedRound ? 68 : 52);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.font = '11px Outfit'; c.textAlign = 'right';
    c.fillText('Perfect: ' + this.perfectRound, this.W - 16, 16);
    this.drawFx(); c.restore();
  }
}

/* ============================================================ IDLE CLICKER */
class IdleClicker extends Base {
  instructions() { return 'Tap to earn! 10 upgrade tiers, critical clicks for 3x damage, achievements, unlimited prestige. Buy auto-earn upgrades and watch coins flow!'; }
  reset() {
    this.coins = 0;
    this.totalCoins = 0;
    this.clickPower = 1;
    this.upgrades = [
      { name: 'Stronger Tap', cost: 10, power: 1, bought: 0, desc: '+1/tap' },
      { name: 'Auto Tapper', cost: 50, power: 1, bought: 0, desc: '+1/s' },
      { name: 'Coin Magnet', cost: 200, power: 5, bought: 0, desc: '+5/s' },
      { name: 'Golden Hands', cost: 1000, power: 10, bought: 0, desc: '+10/tap' },
      { name: 'Treasure Chest', cost: 5000, power: 50, bought: 0, desc: '+50/s' },
      { name: 'Diamond Mine', cost: 25000, power: 200, bought: 0, desc: '+200/s' },
      { name: 'Emerald Forge', cost: 100000, power: 1000, bought: 0, desc: '+1000/s' },
      { name: 'Ruby Throne', cost: 500000, power: 5000, bought: 0, desc: '+5000/s' },
      { name: 'Obsidian Tower', cost: 2000000, power: 25000, bought: 0, desc: '+25000/s' },
      { name: 'Cosmic Vault', cost: 10000000, power: 100000, bought: 0, desc: '+100k/s' },
    ];
    this.multiplier = 1;
    this.prestigeCount = 0;
    this.prestigeCost = 100000;
    this.autoEarn = 0;
    this.critChance = 0.05;
    this.critMult = 3;
    this.achievements = [];
    this.lastTapTime = 0;
    this.milestone = 0;
    this.milestones = [100, 1000, 10000, 50000, 100000, 500000, 1000000, 5000000, 25000000, 100000000];
    this._checkMilestone();
    this._checkAchievements();
  }
  _calcAuto() {
    this.autoEarn = 0;
    this.clickPower = 1;
    for (const u of this.upgrades) {
      if (u.name === 'Stronger Tap' || u.name === 'Golden Hands') {
        this.clickPower += this.upgrades[0].bought * this.upgrades[0].power + this.upgrades[3].bought * this.upgrades[3].power;
      } else {
        this.autoEarn += u.bought * u.power;
      }
    }
    this.autoEarn *= this.multiplier;
    this.clickPower *= this.multiplier;
    this.critChance = 0.05 + Math.min(0.25, this.prestigeCount * 0.02);
  }
  _checkMilestone() {
    for (let i = this.milestones.length - 1; i >= 0; i--) {
      if (this.totalCoins >= this.milestones[i] && i + 1 > this.milestone) {
        this.milestone = i + 1;
        this.confetti(this.W / 2, this.H * 0.3);
        this.sound.power();
        this.float(this.W / 2, this.H * 0.2, 'Milestone ' + this.milestone + '!', this.theme.accent);
        this._checkAchievements();
        break;
      }
    }
  }
  _checkAchievements() {
    if (this.totalCoins >= 100 && !this.achievements.includes('first100')) {
      this.achievements.push('first100');
      this.float(this.W / 2, this.H * 0.15, '🏆 First 100 Coins!', '#ffd166');
      this.addScore(50);
    }
    if (this.totalCoins >= 10000 && !this.achievements.includes('rich')) {
      this.achievements.push('rich');
      this.float(this.W / 2, this.H * 0.15, '🏆 Getting Rich!', '#ffd166');
      this.addScore(200);
    }
    if (this.totalCoins >= 1000000 && !this.achievements.includes('million')) {
      this.achievements.push('million');
      this.float(this.W / 2, this.H * 0.15, '🏆 Millionaire!', '#ffd166');
      this.addScore(5000);
    }
    if (this.prestigeCount >= 1 && !this.achievements.includes('prestige1')) {
      this.achievements.push('prestige1');
      this.float(this.W / 2, this.H * 0.15, '🏆 First Prestige!', '#ffd166');
    }
    if (this.prestigeCount >= 5 && !this.achievements.includes('prestige5')) {
      this.achievements.push('prestige5');
      this.float(this.W / 2, this.H * 0.15, '🏆 Prestige Master!', '#ffd166');
    }
  }
  update(dt) {
    if (this.autoEarn > 0) {
      this.coins += this.autoEarn * dt;
      this.totalCoins += this.autoEarn * dt;
    }
    if (this.pointer.tapped) {
      let earn = this.clickPower;
      let isCrit = false;
      if (Math.random() < this.critChance) {
        earn *= this.critMult;
        isCrit = true;
      }
      this.coins += earn;
      this.totalCoins += earn;
      if (isCrit) {
        this.sound.power();
        this.burst(this.pointer.x, this.pointer.y, '#ffd166', 12);
        this.float(this.pointer.x, this.pointer.y - 30, 'CRIT! +' + Math.floor(earn), '#ffd166');
      } else {
        this.sound.coin();
        this.burst(this.pointer.x, this.pointer.y, this.theme.accent, 5);
        this.float(this.pointer.x, this.pointer.y - 20, '+' + Math.floor(earn), this.theme.accent);
      }
      this._checkMilestone();
    }
    for (let i = 0; i < Math.min(this.upgrades.length, 9); i++) {
      if (this.keys[(i + 1).toString()]) {
        this._buy(i);
        this.keys[(i + 1).toString()] = false;
      }
    }
    if (this.keys['p'] || this.keys['P']) { this._prestige(); this.keys['p'] = this.keys['P'] = false; }
    this._calcAuto();
  }
  _buy(idx) {
    const u = this.upgrades[idx];
    if (!u) return;
    if (this.coins >= u.cost) {
      this.coins -= u.cost;
      u.bought++;
      u.cost = Math.floor(u.cost * 1.35);
      this.sound.blip(660 + u.bought * 10, 0.06, 'triangle', 0.15);
      if (u.bought >= 10 && !this.achievements.includes('maxed_' + idx)) {
        this.achievements.push('maxed_' + idx);
        this.float(this.W / 2, this.H * 0.15, '🏆 ' + u.name + ' Master!', '#ffd166');
      }
      this._calcAuto();
    }
  }
  _prestige() {
    if (this.totalCoins < this.prestigeCost) return;
    this.prestigeCount++;
    this.multiplier = 1 + this.prestigeCount * 0.5;
    this.coins = 0;
    this.totalCoins = 0;
    for (const u of this.upgrades) { u.bought = 0; u.cost = Math.floor(10 * Math.pow(1.35, this.upgrades.indexOf(u))); }
    this.clickPower = 1;
    this.autoEarn = 0;
    this.prestigeCost = Math.floor(100000 * Math.pow(2, this.prestigeCount));
    this.sound.power();
    this.confetti(this.W / 2, this.H / 2);
    this.float(this.W / 2, this.H * 0.3, 'Prestige ' + this.prestigeCount + '! ' + this.multiplier.toFixed(1) + 'x!', '#ffd166');
    this._checkAchievements();
  }
  render() {
    const c = this.ctx; c.save(); this.applyShake(c); this.parallax(0);
    c.fillStyle = '#fff'; c.font = '900 22px Outfit'; c.textAlign = 'center'; c.textBaseline = 'top';
    c.fillText(Math.floor(this.coins).toLocaleString(), this.W / 2, 8);
    c.font = '12px Outfit'; c.fillStyle = 'rgba(255,255,255,.4)';
    c.fillText('Total: ' + Math.floor(this.totalCoins).toLocaleString(), this.W / 2, 34);
    // Prestige / multiplier
    if (this.multiplier > 1) {
      c.fillStyle = '#ffd166'; c.font = 'bold 12px Outfit'; c.textAlign = 'right'; c.textBaseline = 'top';
      c.fillText(this.multiplier.toFixed(1) + 'x', this.W - 10, 8);
    }
    if (this.autoEarn > 0) {
      c.fillStyle = '#8affc1'; c.font = '14px Outfit'; c.textAlign = 'center';
      c.fillText('+' + Math.floor(this.autoEarn).toLocaleString() + '/s', this.W / 2, this.H - 84);
    }
    c.fillStyle = 'rgba(255,255,255,.15)'; c.font = '10px Outfit'; c.textAlign = 'center';
    c.fillText(Math.floor(this.critChance * 100) + '% crit chance (' + this.critMult + 'x)', this.W / 2, this.H - 68);
    // Upgrades panel
    const uy = this.H * 0.17;
    const uh = 40;
    c.fillStyle = 'rgba(0,0,0,.15)'; rr2(c, 8, uy, this.W - 16, this.upgrades.length * uh + this.H * 0.12, 8); c.fill();
    c.save();
    c.beginPath(); c.rect(8, uy, this.W - 16, this.upgrades.length * uh + this.H * 0.12); c.clip();
    for (let i = 0; i < this.upgrades.length; i++) {
      const u = this.upgrades[i];
      const bx = 12, by = uy + 6 + i * uh;
      const affordable = this.coins >= u.cost;
      c.fillStyle = affordable ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.2)';
      rr2(c, bx, by, this.W - 40, uh - 3, 4); c.fill();
      c.fillStyle = '#fff'; c.font = 'bold 12px Outfit'; c.textAlign = 'left'; c.textBaseline = 'middle';
      const icon = i < 3 ? '👆' : i < 6 ? '💰' : i < 9 ? '💎' : '🌌';
      c.fillText(icon + ' ' + u.name + ' x' + u.bought, bx + 6, by + uh / 2 - 5);
      c.fillStyle = affordable ? '#8affc1' : '#ff6b6b'; c.font = '10px Outfit';
      c.fillText(Math.floor(u.cost).toLocaleString(), bx + 6, by + uh / 2 + 10);
      c.fillStyle = 'rgba(255,255,255,.3)'; c.font = '10px Outfit'; c.textAlign = 'right';
      c.fillText(u.desc, this.W - 46, by + uh / 2);
    }
    c.restore();
    // Milestone progress
    const nextM = this.milestones[Math.min(this.milestones.length - 1, this.milestone)] || this.milestones[this.milestones.length - 1] * 10;
    const progress = Math.min(1, this.totalCoins / nextM);
    const my2 = this.H * 0.92;
    c.fillStyle = 'rgba(0,0,0,.15)'; rr2(c, 8, my2, this.W - 16, 16, 8); c.fill();
    c.fillStyle = this.theme.accent; rr2(c, 8, my2, (this.W - 16) * progress, 16, 8); c.fill();
    c.fillStyle = 'rgba(255,255,255,.5)'; c.font = '9px Outfit'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('Next: ' + Math.floor(nextM).toLocaleString(), this.W / 2, my2 + 8);
    // Achievements display
    if (this.achievements.length > 0) {
      c.fillStyle = 'rgba(255,255,255,.2)'; c.font = '9px Outfit'; c.textAlign = 'left';
      c.fillText('🏆 ' + this.achievements.length, 8, this.H - 20);
    }
    this.drawFx(); c.restore();
  }
}

function rr2(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

/* ============================================================ Entry */

const MODES = { runner: Runner, flappy: Flappy, platformer: Platformer, dodger: Dodger, shooter: Shooter, whack: Whack, match3: Match3, serve: Serve, maze: Maze, memory: Memory, stacker: Stacker, sports: Sports, racing: Racing, breakout: Breakout, snake: Snake, rhythm: Rhythm, tower: TowerDefense, pinball: Pinball, fishing: Fishing, archery: Archery, pong: Pong, bubbleshooter: BubbleShooter, cannon: Cannon, merge: Merge, helix: Helix, doodlejump: DoodleJump, asteroids: Asteroids, pipeline: Pipeline, gallery: Gallery, idleclicker: IdleClicker, board: BoardArena };
const sound = new Sound();
let current = null;

export function startGame(mount, game) {
  if (!mount || !game) return;
  if (current) { try { current.destroy(); } catch (e) {} current = null; }
  const theme = themeFor(game);
  sprites.get(theme.slug);                       // warm sprite cache
  atlases.get(theme.slug);                       // warm animated atlas
  const Cls = MODES[modeFor(game)] || Dodger;
  current = new Cls(mount, game, theme, sound);
  window.render_game_to_text = () => current ? current.renderText() : JSON.stringify({ phase: 'unmounted' });
  window.advanceTime = (ms) => current ? current.advanceTime(ms) : null;
  return current;
}

export function getCurrentGame() { return current; }
export function grantRewardToCurrent(detail) { return current?.applyReward(detail) || false; }
export { themeFor, modeFor };
