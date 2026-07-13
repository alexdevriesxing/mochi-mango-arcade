// Mochi Mango Arcade shared game-quality layer.
// Adds persistent mastery goals, title-specific signature abilities,
// anonymous quality telemetry and robust fallbacks for shared-runtime games.

const FLAGSHIP = {
  'puddle-pip-meadow-dash': ['Meadow Guardian', 'Glide through three danger zones', 'meadow-glide'],
  'puddles-pancake-panic': ['Golden Rush', 'Serve a perfect breakfast streak', 'golden-rush'],
  'mushmoos-moonlit-match': ['Moon Bloom', 'Build a five-match combo', 'moon-bloom'],
  'bloop-bubble-rescue': ['Bubble Beacon', 'Clear a rescue formation', 'bubble-beacon'],
  'nine-gates-mahjong-trails': ['Jade Insight', 'Complete a calm tile chain', 'jade-insight'],
  'snackstreet-rush': ['Rush Hour', 'Serve every customer in one wave', 'rush-hour'],
  'crownlight-chess': ['Crownlight Focus', 'Win material without losing a piece', 'crownlight-focus'],
  'starling-signal-patrol': ['Signal Overdrive', 'Clear a patrol wave', 'signal-overdrive'],
  'glitch-garden': ['Debug Bloom', 'Cleanse a corrupted garden sector', 'debug-bloom'],
  'boot-sector': ['Perfect Boot', 'Complete a flawless rhythm phrase', 'perfect-boot'],
  'rooftop-rocket-rumble': ['Skyline Burst', 'Survive a full rooftop assault', 'skyline-burst'],
  'tower-of-floppy': ['Disk Fortress', 'Build beyond the danger line', 'disk-fortress'],
  'super-seans-racing-rally': ['S1 Turbo', 'Finish a clean racing section', 's1-turbo'],
  'super-seans-soccer-showdown': ['Golden Glove', 'Score three precision goals', 'golden-glove'],
  'super-seans-pinball-party': ['Sean Multiball', 'Trigger a high-score sequence', 'sean-multiball'],
  'comet-quarry-crew': ['Quarry Shield', 'Clear an asteroid sector', 'quarry-shield'],
  'floppy-flap': ['Disk Glide', 'Pass ten gates without damage', 'disk-glide'],
  'baos-jade-dragon-rescue': ['Dragon Path', 'Complete a jade rescue chain', 'dragon-path'],
  'the-donut-dragon-derby': ['Sugar Drift', 'Maintain a full-speed streak', 'sugar-drift'],
  'tika-tiger-traffic-tango': ['Tiger Shortcut', 'Complete a perfect delivery route', 'tiger-shortcut'],
  'pixel-prawn-deep-sea-debugger': ['Deep Debug', 'Clear a corrupted ocean sector', 'deep-debug'],
  'pixel-panda-parkour': ['Pixel Flow', 'Chain precision parkour moves', 'pixel-flow'],
  'boom-bap-cannon': ['Bank Shot Beat', 'Clear a target wave with rebound shots', 'bank-shot'],
  'super-seans-merge-madness': ['Sean Merge', 'Create a 512 tile', 'sean-merge'],
  'super-seans-pipe-puzzle': ['Clean Sheet Flow', 'Complete three pipe networks', 'clean-sheet-flow']
};

const MODE = {
  runner: ['Distance Star', 'Reach 1,500 points', 'rush'],
  match3: ['Combo Crafter', 'Build a six-match chain', 'x2'],
  serve: ['Happy Customers', 'Complete a full service rush', 'rush'],
  memory: ['Perfect Recall', 'Clear a board without a mismatch streak', 'freeze'],
  rhythm: ['Beat Keeper', 'Land a long timing combo', 'x2'],
  shooter: ['Wave Breaker', 'Clear an enemy wave', 'mega'],
  board: ['Tactical Mind', 'Complete a strategic match', 'guardian'],
  tower: ['Fortress Keeper', 'Survive five waves', 'guardian'],
  flappy: ['Sky Threader', 'Pass ten gates', 'shield'],
  stacker: ['Sky Builder', 'Build a twelve-piece tower', 'mega'],
  racing: ['Clean Racer', 'Maintain a long clean run', 'rush'],
  sports: ['Precision Player', 'Score a three-hit streak', 'x2'],
  cannon: ['Master Gunner', 'Clear a target set', 'mega'],
  merge: ['Merge Master', 'Create a 512 tile', 'x2'],
  pipeline: ['Flow Engineer', 'Complete three networks', 'freeze'],
  bubbleshooter: ['Bubble Hero', 'Clear a formation', 'bomb'],
  platformer: ['Secret Seeker', 'Reach the next checkpoint', 'shield'],
  asteroids: ['Sector Defender', 'Clear an asteroid sector', 'shield'],
  pinball: ['Table Wizard', 'Build a major score streak', 'mega'],
  dodger: ['Hazard Dancer', 'Survive a full danger phase', 'slow'],
  whack: ['Reflex Hero', 'Build a long target streak', 'rush'],
  maze: ['Pathfinder', 'Complete a maze section', 'freeze'],
  snake: ['Trail Master', 'Grow through a full objective', 'magnet'],
  breakout: ['Brick Breaker', 'Clear a brick formation', 'mega'],
  fishing: ['Rare Catch', 'Land a rare fish', 'magnet'],
  archery: ['Bullseye', 'Land three precision hits', 'x2'],
  pong: ['Rally King', 'Win a long rally', 'mega'],
  helix: ['Deep Drop', 'Clear a tower section', 'shield'],
  doodlejump: ['Cloud Climber', 'Reach a height checkpoint', 'rush'],
  gallery: ['Sharp Shooter', 'Complete a high-accuracy round', 'x2'],
  idleclicker: ['Arcade Tycoon', 'Reach the next milestone', 'rush']
};

const safeJson = (value, fallback) => {
  try { return JSON.parse(value); } catch { return fallback; }
};

const gameMode = game => {
  const explicit = String(game.engine || '').toLowerCase();
  if (MODE[explicit]) return explicit;
  const text = `${game.genre || ''} ${game.title || ''} ${game.slug || ''}`.toLowerCase();
  if (/merge|2048/.test(text)) return 'merge';
  if (/pipe|flow/.test(text)) return 'pipeline';
  if (/cannon|catapult/.test(text)) return 'cannon';
  if (/runner|dash|run/.test(text)) return 'runner';
  if (/match|tile|mahjong|puzzle/.test(text)) return 'match3';
  if (/serve|cafe|diner|shop|cook/.test(text)) return 'serve';
  return explicit || 'dodger';
};

function profileFor(game) {
  const mode = gameMode(game);
  const special = FLAGSHIP[game.slug] || MODE[mode] || ['Arcade Mastery', 'Beat your personal best', 'x2'];
  return { mode, name: special[0], goal: special[1], ability: special[2] };
}

function telemetry(event, game, detail = {}) {
  const body = {
    event,
    game: game.slug,
    mode: gameMode(game),
    viewport: innerWidth < 700 ? 'mobile' : 'desktop',
    value: Number.isFinite(detail.value) ? Math.round(detail.value) : undefined,
    outcome: detail.outcome,
    version: 'quality-1'
  };
  Object.keys(body).forEach(key => body[key] === undefined && delete body[key]);
  try {
    navigator.sendBeacon?.('/api/telemetry', new Blob([JSON.stringify(body)], { type: 'application/json' })) ||
      fetch('/api/telemetry', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).catch(() => {});
  } catch {}
}

function stateFor(game) {
  const key = `mma_mastery_${game.slug}`;
  const data = safeJson(localStorage.getItem(key) || '{}', {});
  return { key, best: Number(data.best) || 0, runs: Number(data.runs) || 0, stars: Number(data.stars) || 0, completed: Boolean(data.completed) };
}

function persist(state) {
  localStorage.setItem(state.key, JSON.stringify({ best: state.best, runs: state.runs, stars: state.stars, completed: state.completed }));
}

function masteryPanel(stage, game, state, profile) {
  const panel = document.createElement('section');
  panel.className = 'mma-quality-panel';
  panel.innerHTML = `
    <div class="mma-quality-copy">
      <span class="mma-quality-kicker">Mastery mission</span>
      <strong>${profile.name}</strong>
      <span>${profile.goal}</span>
    </div>
    <div class="mma-quality-stats">
      <span data-quality-best>Best ${state.best.toLocaleString()}</span>
      <span data-quality-stars>${'★'.repeat(state.stars)}${'☆'.repeat(Math.max(0, 3 - state.stars))}</span>
    </div>
    <button class="mma-quality-ability" type="button">⚡ Signature ability</button>`;
  stage.parentElement?.insertAdjacentElement('afterend', panel);
  return panel;
}

function grantAbility(instance, profile) {
  const aliases = {
    guardian: 'shield', 'golden-glove': 'shield', 'quarry-shield': 'shield', shield: 'shield',
    'meadow-glide': 'slow', 'pixel-flow': 'slow', 'tiger-shortcut': 'slow', slow: 'slow', freeze: 'freeze',
    'golden-rush': 'rush', 'rush-hour': 'rush', 'signal-overdrive': 'rush', 's1-turbo': 'rush',
    'sugar-drift': 'rush', 'disk-glide': 'rush', rush: 'rush',
    'moon-bloom': 'x2', 'jade-insight': 'x2', 'perfect-boot': 'x2', 'sean-merge': 'x2', x2: 'x2',
    'bubble-beacon': 'bomb', 'debug-bloom': 'bomb', 'deep-debug': 'bomb', bomb: 'bomb',
    'skyline-burst': 'mega', 'disk-fortress': 'mega', 'sean-multiball': 'mega', 'dragon-path': 'mega',
    'bank-shot': 'mega', mega: 'mega', magnet: 'magnet'
  };
  const power = aliases[profile.ability] || 'x2';
  if (typeof instance?.grantPower === 'function') instance.grantPower(power, power === 'bomb' ? 0.1 : 12);
  else if (instance) instance.powers = { ...(instance.powers || {}), [power]: 12 };
  instance?.sound?.power?.();
  instance?.confetti?.(instance.W / 2, instance.H * 0.35);
  instance?.float?.(instance.W / 2, instance.H * 0.28, `${profile.name}!`, instance.theme?.accent || '#ffd166');
}

export function enhanceShared(stage, game, instance) {
  if (!stage || !game || !instance || stage.dataset.qualityEnhanced === '1') return instance;
  stage.dataset.qualityEnhanced = '1';
  const state = stateFor(game);
  const profile = profileFor(game);
  const panel = masteryPanel(stage, game, state, profile);
  const bestEl = panel.querySelector('[data-quality-best]');
  const starsEl = panel.querySelector('[data-quality-stars]');
  const ability = panel.querySelector('.mma-quality-ability');
  let abilityUsed = false;
  ability.addEventListener('click', () => {
    if (abilityUsed) return;
    abilityUsed = true;
    ability.disabled = true;
    ability.textContent = `✓ ${profile.name}`;
    grantAbility(instance, profile);
    telemetry('ability', game);
  });

  const originalSetScore = typeof instance.setScore === 'function' ? instance.setScore.bind(instance) : null;
  if (originalSetScore) {
    instance.setScore = value => {
      originalSetScore(value);
      const score = Math.max(0, Math.floor(Number(value) || 0));
      if (score > state.best) {
        state.best = score;
        bestEl.textContent = `Best ${state.best.toLocaleString()}`;
        persist(state);
      }
      const nextStars = score >= 2500 ? 3 : score >= 1000 ? 2 : score >= 300 ? 1 : 0;
      if (nextStars > state.stars) {
        state.stars = nextStars;
        starsEl.textContent = `${'★'.repeat(state.stars)}${'☆'.repeat(3 - state.stars)}`;
        persist(state);
      }
    };
  }

  const originalStart = typeof instance.start === 'function' ? instance.start.bind(instance) : null;
  if (originalStart) {
    instance.start = (...args) => {
      state.runs += 1;
      persist(state);
      telemetry('start', game);
      return originalStart(...args);
    };
  }

  const originalOver = typeof instance.showOver === 'function' ? instance.showOver.bind(instance) : null;
  if (originalOver) {
    instance.showOver = (...args) => {
      const score = Math.max(0, Math.floor(Number(instance.score) || 0));
      state.completed = state.completed || score >= 1000;
      persist(state);
      telemetry('finish', game, { value: score, outcome: state.completed ? 'mastered' : 'ended' });
      return originalOver(...args);
    };
  }

  telemetry('runtime', game);
  return instance;
}

class RescueFallback {
  constructor(stage, game, mode = gameMode(game)) {
    this.stage = stage;
    this.game = game;
    this.mode = mode;
    this.score = 0;
    this.lives = 3;
    this.running = true;
    this.targets = [];
    this.pointer = { x: 0, y: 0 };
    this.startedAt = performance.now();
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'mma-canvas mma-fallback-canvas';
    this.canvas.tabIndex = 0;
    stage.innerHTML = '';
    stage.classList.add('mma-stage');
    stage.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(stage);
    this.canvas.addEventListener('pointerdown', event => this.hit(event));
    addEventListener('keydown', this.key = event => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        this.hit({ clientX: this.stage.getBoundingClientRect().left + this.W / 2, clientY: this.stage.getBoundingClientRect().top + this.H / 2 });
      }
    });
    this.seed();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
    telemetry('fallback', game);
  }
  resize() {
    const rect = this.stage.getBoundingClientRect();
    this.W = Math.max(320, rect.width || 720);
    this.H = Math.max(360, rect.height || Math.round(this.W * 0.62));
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.W * dpr);
    this.canvas.height = Math.round(this.H * dpr);
    this.canvas.style.width = `${this.W}px`;
    this.canvas.style.height = `${this.H}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  seed() {
    this.targets = Array.from({ length: 8 }, (_, index) => ({
      x: 60 + Math.random() * Math.max(100, this.W - 120),
      y: 110 + Math.random() * Math.max(100, this.H - 190),
      r: 18 + Math.random() * 14,
      vx: (Math.random() - 0.5) * 70,
      vy: (Math.random() - 0.5) * 50,
      hue: (index * 47 + 160) % 360
    }));
  }
  hit(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let hit = false;
    this.targets = this.targets.filter(target => {
      if (!hit && Math.hypot(x - target.x, y - target.y) <= target.r + 18) {
        hit = true;
        this.score += 100;
        return false;
      }
      return true;
    });
    if (!hit) this.lives = Math.max(0, this.lives - 1);
    if (!this.targets.length) {
      this.score += 500;
      this.seed();
    }
    if (!this.lives) {
      this.lives = 3;
      this.score = Math.max(0, this.score - 250);
    }
  }
  loop(now) {
    if (!this.running) return;
    const dt = Math.min(0.04, ((this.last || now) && now - (this.last || now)) / 1000);
    this.last = now;
    for (const target of this.targets) {
      target.x += target.vx * dt;
      target.y += target.vy * dt;
      if (target.x < target.r || target.x > this.W - target.r) target.vx *= -1;
      if (target.y < 100 + target.r || target.y > this.H - 45 - target.r) target.vy *= -1;
    }
    this.draw(now);
    this.raf = requestAnimationFrame(this.loop);
  }
  draw(now) {
    const c = this.ctx;
    const gradient = c.createLinearGradient(0, 0, 0, this.H);
    gradient.addColorStop(0, '#160b3d');
    gradient.addColorStop(1, '#3b145c');
    c.fillStyle = gradient;
    c.fillRect(0, 0, this.W, this.H);
    c.fillStyle = '#fff';
    c.font = '900 22px system-ui';
    c.textAlign = 'left';
    c.fillText(this.game.title, 18, 32);
    c.font = '700 14px system-ui';
    c.fillStyle = 'rgba(255,255,255,.75)';
    c.fillText('Tap moving targets · clear the wave · avoid misses', 18, 56);
    c.textAlign = 'right';
    c.fillStyle = '#ffd166';
    c.fillText(`Score ${this.score.toLocaleString()}   ${'❤️'.repeat(this.lives)}`, this.W - 18, 32);
    for (const target of this.targets) {
      c.save();
      c.translate(target.x, target.y);
      c.rotate(now / 700 + target.hue);
      c.shadowColor = `hsl(${target.hue} 90% 65%)`;
      c.shadowBlur = 18;
      c.fillStyle = `hsl(${target.hue} 80% 58%)`;
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 ? target.r * 0.48 : target.r;
        const angle = -Math.PI / 2 + i * Math.PI / 5;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        i ? c.lineTo(px, py) : c.moveTo(px, py);
      }
      c.closePath();
      c.fill();
      c.restore();
    }
    c.fillStyle = 'rgba(255,255,255,.16)';
    c.fillRect(18, this.H - 26, this.W - 36, 8);
    c.fillStyle = '#39ffde';
    c.fillRect(18, this.H - 26, (this.W - 36) * Math.min(1, this.score / 3000), 8);
  }
  grantPower() { this.score += 300; this.lives = Math.min(5, this.lives + 1); }
  destroy() { this.running = false; cancelAnimationFrame(this.raf); this.ro?.disconnect(); removeEventListener('keydown', this.key); }
}

class CannonFallback extends RescueFallback {
  seed() {
    this.targets = Array.from({ length: 6 }, (_, index) => ({
      x: this.W * (0.32 + Math.random() * 0.58),
      y: 115 + Math.random() * Math.max(100, this.H - 220),
      r: 20 + Math.random() * 16,
      vx: (index % 2 ? 1 : -1) * (24 + Math.random() * 45),
      vy: 0,
      hue: 25 + index * 46
    }));
  }
  draw(now) {
    super.draw(now);
    const c = this.ctx;
    c.fillStyle = '#ff6b35';
    c.beginPath();
    c.arc(54, this.H - 58, 28, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#fff';
    c.lineWidth = 7;
    c.beginPath();
    c.moveTo(54, this.H - 58);
    c.lineTo(96, this.H - 92);
    c.stroke();
  }
}

export function startFallback(stage, game) {
  const mode = gameMode(game);
  const instance = mode === 'cannon' ? new CannonFallback(stage, game, mode) : new RescueFallback(stage, game, mode);
  return enhanceShared(stage, game, instance);
}
