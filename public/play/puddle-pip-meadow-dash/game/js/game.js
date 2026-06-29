(() => {
  'use strict';

  if (window.self !== window.top) {
    document.body.classList.add('is-embedded');
  }

  const VERSION = '2.0.0-stunning';
  const GAME_SLUG = 'puddle-and-pip-meadow-dash';
  const STORAGE_KEY = 'mma_puddle_pip_meadow_dash_best_v2';
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  const $ = (id) => document.getElementById(id);
  const ui = {
    loading: $('loading'), start: $('startScreen'), how: $('howScreen'), pause: $('pauseScreen'), gameOver: $('gameOverScreen'),
    play: $('playBtn'), howBtn: $('howBtn'), howClose: $('howClose'), howPlay: $('howPlay'), resume: $('resumeBtn'), restartPause: $('restartFromPause'),
    pauseBtn: $('pauseBtn'), soundBtn: $('soundBtn'), revive: $('reviveBtn'), restart: $('restartBtn'),
    jumpTouch: $('jumpTouch'), rollTouch: $('rollTouch'),
    score: $('hudScore'), coins: $('hudCoins'), combo: $('hudCombo'), finalScore: $('finalScore'), finalCoins: $('finalCoins'), bestScore: $('bestScore'), scoreLine: $('scoreLine')
  };

  const TAU = Math.PI * 2;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const rand = (min, max) => min + Math.random() * (max - min);
  const choose = (arr) => arr[(Math.random() * arr.length) | 0];
  const hypot = Math.hypot;

  let dpr = 1;
  let W = 1280;
  let H = 720;
  let groundY = 548;
  let lastT = performance.now();
  let accumulator = 0;
  let bestScore = Number(localStorage.getItem(STORAGE_KEY) || 0);
  let muted = false;
  let audioCtx = null;
  let pointerStartY = 0;
  let pointerIsDown = false;
  let bgSeed = Math.random() * 1000;

  const state = {
    mode: 'loading',
    time: 0,
    runTime: 0,
    distance: 0,
    score: 0,
    fuzzies: 0,
    combo: 1,
    comboTimer: 0,
    speed: 360,
    targetSpeed: 360,
    difficulty: 1,
    spawnObstacle: 0,
    spawnFuzzy: 0,
    spawnSpark: 0,
    shake: 0,
    flash: 0,
    magnet: 0,
    shield: 0,
    fever: 0,
    worldPulse: 0,
    biome: 0
  };

  const player = {
    x: 0, y: 0, r: 38, vy: 0, rot: 0,
    grounded: true, coyote: 0, jumpHeld: false, gliding: false,
    rolling: false, rollTimer: 0, invincible: 0, squash: 0, stretch: 0,
    face: 0, blink: 1, blinkTimer: rand(1, 4), alive: true,
    cape: []
  };

  const pip = { x: 0, y: 0, wing: 0, bob: 0, trail: [] };
  const objects = [];
  const particles = [];
  const floaters = [];
  const pollen = [];
  const foregroundGrass = [];

  const cloudPalette = ['#ffffff', '#fff9e8', '#f3fdff'];
  const flowerPalette = ['#ff65a3', '#ffd166', '#7aef8b', '#67d7ff', '#b05cff', '#fff59b'];
  const clouds = Array.from({ length: 15 }, (_, i) => ({
    x: Math.random(), y: rand(.06, .42), scale: rand(.55, 1.9), speed: rand(.009, .035), alpha: rand(.33, .82), seed: i * 37.31, color: choose(cloudPalette)
  }));
  const mountains = Array.from({ length: 10 }, (_, i) => ({ x: i / 8 + rand(-.08, .08), h: rand(.18, .43), w: rand(.18, .34), hue: rand(170, 215), p: rand(.08, .22) }));
  const hills = Array.from({ length: 18 }, (_, i) => ({ x: i / 12 + rand(-.15, .15), y: rand(.58, .76), s: rand(.55, 1.4), hue: rand(90, 150), layer: i % 3 }));
  const stars = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random() * .54, r: rand(.5, 2.5), tw: rand(0, TAU), a: rand(.25, .95) }));
  const flowers = Array.from({ length: 120 }, () => ({ x: Math.random(), y: Math.random(), s: rand(.45, 1.45), c: choose(flowerPalette), tw: rand(0, TAU), layer: Math.random() }));

  function initMeadowDetails() {
    foregroundGrass.length = 0;
    pollen.length = 0;
    for (let i = 0; i < 170; i++) foregroundGrass.push({ x: Math.random(), y: rand(.82, 1.01), h: rand(8, 30), w: rand(1, 3), a: rand(.45, .95), hue: rand(100, 145), phase: rand(0, TAU) });
    for (let i = 0; i < 80; i++) pollen.push({ x: Math.random(), y: Math.random(), s: rand(.7, 2.8), a: rand(.15, .55), v: rand(.008, .035), phase: rand(0, TAU), color: choose(['#fff2a7', '#ffffff', '#ffd166', '#b8fff0']) });
  }

  const portal = {
    emit(name, payload = {}) {
      const message = { source: 'mochi-mango-arcade', version: VERSION, game: GAME_SLUG, event: name, payload };
      window.dispatchEvent(new CustomEvent('MMA_GAME_EVENT', { detail: message }));
      try { parent.postMessage(message, '*'); } catch (_) { /* no-op */ }
    },
    async rewardedAd(reason) {
      portal.emit('ad-request', { type: 'rewarded', reason });
      if (window.MochiMangoSDK && typeof window.MochiMangoSDK.showRewardedAd === 'function') {
        return !!(await window.MochiMangoSDK.showRewardedAd({ game: GAME_SLUG, reason }));
      }
      ui.revive.textContent = 'Loading reward…';
      await new Promise((resolve) => setTimeout(resolve, 700));
      ui.revive.textContent = 'Watch ad to revive';
      return true;
    }
  };

  class Synth {
    ensure() {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    }
    beep(freq = 440, dur = .08, type = 'sine', gain = .04, slide = 0) {
      if (muted) return;
      const ac = this.ensure();
      const t = ac.currentTime;
      const o = ac.createOscillator();
      const g = ac.createGain();
      const f = o.frequency;
      o.type = type;
      f.setValueAtTime(freq, t);
      if (slide) f.exponentialRampToValueAtTime(Math.max(24, freq + slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + .012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + dur + .03);
    }
    chord(root = 440) { this.beep(root, .12, 'triangle', .026, 80); setTimeout(() => this.beep(root * 1.25, .12, 'triangle', .022, 90), 55); setTimeout(() => this.beep(root * 1.5, .16, 'triangle', .022, 110), 115); }
    fuzzy() { this.beep(720 + Math.random() * 80, .055, 'triangle', .028, 210); }
    jump() { this.beep(260, .13, 'sine', .04, 260); }
    land() { this.beep(126, .055, 'sine', .035, -18); }
    hit() { this.beep(90, .20, 'sawtooth', .04, -36); }
    power() { this.chord(530); }
    bounce() { this.beep(390, .11, 'square', .025, 340); }
  }
  const sfx = new Synth();

  function show(name) {
    [ui.loading, ui.start, ui.how, ui.pause, ui.gameOver].forEach((el) => el && el.classList.remove('is-active'));
    if (name && ui[name]) ui[name].classList.add('is-active');
  }

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    W = Math.max(360, Math.round(rect.width));
    H = Math.max(320, Math.round(rect.height));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    groundY = H * (W < 640 ? .79 : .765);
    player.r = clamp(H * .052, 25, 43);
    player.x = W * (W < 680 ? .24 : .205);
    if (state.mode !== 'playing') {
      player.y = groundY - player.r;
      pip.x = player.x + player.r * 2.4;
      pip.y = player.y - player.r * 2.15;
    }
  }

  function resetRun() {
    objects.length = 0;
    particles.length = 0;
    floaters.length = 0;
    bgSeed = Math.random() * 1000;
    Object.assign(state, {
      mode: 'playing', time: state.time, runTime: 0, distance: 0, score: 0, fuzzies: 0, combo: 1, comboTimer: 0,
      speed: clamp(W * .35, 320, 480), targetSpeed: clamp(W * .35, 320, 480), difficulty: 1,
      spawnObstacle: .8, spawnFuzzy: .16, spawnSpark: .05, shake: 0, flash: 0, magnet: 0, shield: 0, fever: 0, worldPulse: 0,
      biome: Math.random()
    });
    Object.assign(player, {
      x: W * (W < 680 ? .24 : .205), y: groundY - player.r, vy: 0, rot: 0, grounded: true, coyote: .12,
      jumpHeld: false, gliding: false, rolling: false, rollTimer: 0, invincible: 1.5, squash: 0, stretch: 0, face: 0, blink: 1, blinkTimer: rand(1, 3), alive: true,
      cape: []
    });
    pip.x = player.x + player.r * 2.2;
    pip.y = player.y - player.r * 2.25;
    pip.trail.length = 0;
    for (let i = 0; i < 8; i++) addFuzzy(W + i * 92, groundY - rand(90, 185), true);
    show(null);
    updateHud();
    portal.emit('start', { bestScore });
    sfx.chord(420);
  }

  function pauseGame() {
    if (state.mode !== 'playing') return;
    state.mode = 'paused';
    show('pause');
    portal.emit('pause', { score: Math.floor(state.score) });
  }

  function resumeGame() {
    if (state.mode !== 'paused') return;
    state.mode = 'playing';
    show(null);
    lastT = performance.now();
    portal.emit('resume');
  }

  function gameOver() {
    if (state.mode === 'gameover') return;
    state.mode = 'gameover';
    player.alive = false;
    bestScore = Math.max(bestScore, Math.floor(state.score));
    localStorage.setItem(STORAGE_KEY, String(bestScore));
    ui.finalScore.textContent = Math.floor(state.score).toLocaleString();
    ui.finalCoins.textContent = state.fuzzies.toLocaleString();
    ui.bestScore.textContent = bestScore.toLocaleString();
    ui.scoreLine.textContent = `Score ${Math.floor(state.score).toLocaleString()} · Fuzzies ${state.fuzzies.toLocaleString()} · Combo ×${state.combo}`;
    show('gameOver');
    portal.emit('gameover', { score: Math.floor(state.score), fuzzies: state.fuzzies, bestScore });
    state.shake = .35;
    state.flash = .35;
    sfx.hit();
  }

  function revive() {
    player.alive = true;
    player.invincible = 3;
    player.y = groundY - player.r;
    player.vy = -H * .36;
    player.grounded = false;
    state.mode = 'playing';
    state.shake = 0;
    state.flash = .45;
    state.shield = Math.max(state.shield, 4);
    objects.forEach((o) => { if (o.x < player.x + player.r * 7) o.dead = true; });
    burst(player.x, player.y, '#fff6a5', 72, 6);
    floatText(player.x, player.y - player.r * 2, 'REVIVED!', '#fff6a5');
    show(null);
    portal.emit('revive', { score: Math.floor(state.score) });
    sfx.power();
  }

  function jump() {
    if (state.mode === 'menu') { resetRun(); return; }
    if (state.mode !== 'playing') return;
    player.jumpHeld = true;
    if (player.coyote > 0) {
      player.vy = -H * .64;
      player.grounded = false;
      player.coyote = 0;
      player.rollTimer = 0;
      player.rolling = false;
      player.squash = .42;
      player.stretch = .22;
      puff(player.x - player.r * .25, groundY + 1, '#d4ff89', 18);
      sfx.jump();
    }
  }

  function releaseJump() { player.jumpHeld = false; player.gliding = false; }

  function roll() {
    if (state.mode !== 'playing') return;
    if (player.grounded) {
      player.rollTimer = .55;
      player.rolling = true;
      player.squash = .36;
      dust(player.x, groundY, 22);
    }
  }

  function addObject(type, props = {}) {
    const obj = { type, x: W + 120, y: groundY, w: 50, h: 50, r: 24, vx: 0, value: 1, spin: rand(0, TAU), pulse: rand(0, TAU), dead: false, ...props };
    objects.push(obj);
    return obj;
  }
  function addFuzzy(x, y, line = false) { return addObject('fuzzy', { x, y, r: line ? rand(12, 17) : rand(13, 19), value: 1, pulse: rand(0, TAU) }); }

  function spawnObstacle() {
    const roll = Math.random();
    const hard = state.difficulty;
    let type;
    if (roll < .17) type = 'mushroom';
    else if (roll < .32 && hard > 1.15) type = 'branch';
    else if (roll < .50) type = 'snail';
    else if (roll < .66) type = 'puddle';
    else if (roll < .84) type = 'log';
    else type = 'bramble';

    if (type === 'log') addObject('log', { y: groundY - 20, w: rand(64, 94), h: rand(32, 44), r: 27 });
    if (type === 'snail') addObject('snail', { y: groundY - 25, w: 66, h: 42, r: 30, vx: rand(-22, -8) });
    if (type === 'puddle') addObject('puddle', { y: groundY + 2, w: rand(98, 150), h: 30, r: 42 });
    if (type === 'branch') addObject('branch', { y: groundY - player.r * 2.15, w: rand(120, 170), h: 34, r: 38 });
    if (type === 'bramble') addObject('bramble', { y: groundY - 34, w: rand(72, 112), h: 68, r: 36 });
    if (type === 'mushroom') addObject('mushroom', { y: groundY - 28, w: 76, h: 58, r: 38 });

    if (Math.random() < .28) {
      const pick = choose(['shield', 'magnet', 'fever']);
      addObject('power', { x: W + rand(220, 380), y: groundY - rand(140, 245), r: 22, power: pick, value: 1 });
    }
  }

  function spawnFuzzies(dt) {
    state.spawnFuzzy -= dt;
    if (state.spawnFuzzy > 0) return;
    state.spawnFuzzy = rand(.18, .36) / clamp(state.difficulty, 1, 2.8);
    const pattern = Math.random();
    const startX = W + rand(40, 120);
    const baseY = groundY - rand(88, 220);
    if (pattern < .48) {
      for (let i = 0; i < 5; i++) addFuzzy(startX + i * 48, baseY + Math.sin(i * .9 + state.time) * 28, true);
    } else if (pattern < .78) {
      for (let i = 0; i < 7; i++) addFuzzy(startX + i * 34, baseY - i * 10 + Math.sin(i) * 18, true);
    } else {
      for (let i = 0; i < 8; i++) addFuzzy(startX + Math.cos(i / 8 * TAU) * 54 + 80, baseY + Math.sin(i / 8 * TAU) * 38, true);
    }
  }

  function update(dt) {
    state.time += dt;
    updateAmbient(dt);
    if (state.mode !== 'playing') {
      updateMenu(dt);
      return;
    }

    state.runTime += dt;
    state.distance += state.speed * dt;
    state.difficulty = 1 + state.runTime * .018 + state.fuzzies * .0025;
    state.targetSpeed = clamp((W * .35) + state.runTime * 5.2, 340, 780);
    state.speed = lerp(state.speed, state.targetSpeed * (state.fever > 0 ? 1.13 : 1), dt * .8);
    state.score += dt * state.speed * .065 * state.combo;
    state.comboTimer = Math.max(0, state.comboTimer - dt);
    if (state.comboTimer <= 0 && state.combo > 1) state.combo = Math.max(1, state.combo - 1);
    state.shake = Math.max(0, state.shake - dt * 1.8);
    state.flash = Math.max(0, state.flash - dt * 1.8);
    state.magnet = Math.max(0, state.magnet - dt);
    state.shield = Math.max(0, state.shield - dt);
    state.fever = Math.max(0, state.fever - dt);
    state.worldPulse = Math.max(0, state.worldPulse - dt);

    updatePlayer(dt);
    updatePip(dt);
    updateObjects(dt);
    updateParticles(dt);
    spawnFuzzies(dt);
    state.spawnObstacle -= dt;
    if (state.spawnObstacle <= 0) {
      spawnObstacle();
      state.spawnObstacle = rand(.74, 1.32) / clamp(state.difficulty * .72, .9, 2.25);
    }
    updateHud();
  }

  function updateAmbient(dt) {
    for (const p of pollen) {
      p.x -= p.v * dt * 8;
      p.y += Math.sin(state.time * .55 + p.phase) * dt * .006;
      if (p.x < -0.04) { p.x = 1.04; p.y = Math.random(); }
    }
    if (state.mode === 'playing') {
      state.spawnSpark -= dt;
      if (state.spawnSpark <= 0) {
        state.spawnSpark = .045;
        if (Math.random() < .55) particles.push({ kind: 'sparkle', x: W + rand(0, 20), y: rand(40, groundY - 10), vx: -state.speed * rand(.12, .35), vy: rand(-8, 8), life: rand(1.4, 2.8), max: 2.8, r: rand(1, 3), color: choose(['#fff7a8', '#ffffff', '#b8fffb', '#ffabd0']) });
      }
    }
  }

  function updateMenu(dt) {
    player.blinkTimer -= dt;
    if (player.blinkTimer <= 0) { player.blink = 0; player.blinkTimer = rand(2.2, 5.2); }
    player.blink = lerp(player.blink, 1, dt * 12);
    player.y = lerp(player.y, groundY - player.r + Math.sin(state.time * 2) * 4, dt * 4);
    player.rot = Math.sin(state.time * 1.2) * .05;
    pip.x = lerp(pip.x, player.x + player.r * 2.15 + Math.sin(state.time * 1.8) * 10, dt * 4);
    pip.y = lerp(pip.y, player.y - player.r * 2.05 + Math.cos(state.time * 2.4) * 12, dt * 5);
    pip.wing += dt * 9;
    updateParticles(dt);
  }

  function updatePlayer(dt) {
    player.blinkTimer -= dt;
    if (player.blinkTimer <= 0) { player.blink = .05; player.blinkTimer = rand(1.6, 4.4); }
    player.blink = lerp(player.blink, 1, dt * 14);
    player.invincible = Math.max(0, player.invincible - dt);
    player.coyote = player.grounded ? .12 : Math.max(0, player.coyote - dt);
    player.rollTimer = Math.max(0, player.rollTimer - dt);
    player.rolling = player.rollTimer > 0 && player.grounded;

    const gravity = H * 1.72;
    player.gliding = !player.grounded && player.jumpHeld && player.vy > -H * .06;
    if (player.gliding) player.vy += gravity * .18 * dt;
    else player.vy += gravity * dt;

    if (!player.jumpHeld && player.vy < -H * .16) player.vy += gravity * 1.15 * dt;
    player.y += player.vy * dt;
    if (player.y >= groundY - player.r) {
      if (!player.grounded && player.vy > 180) { dust(player.x, groundY, 18); sfx.land(); player.squash = .32; }
      player.y = groundY - player.r;
      player.vy = 0;
      player.grounded = true;
      player.gliding = false;
    } else {
      player.grounded = false;
    }
    player.rot += (player.grounded ? state.speed / 850 : .65) * dt * (player.rolling ? 4.2 : 1.4);
    player.squash = lerp(player.squash, 0, dt * 7);
    player.stretch = lerp(player.stretch, 0, dt * 7);
    player.cape.unshift({ x: player.x - player.r * .4, y: player.y + player.r * .15, t: state.time, a: 1 });
    if (player.cape.length > 9) player.cape.pop();
  }

  function updatePip(dt) {
    const targetX = player.x + player.r * (player.gliding ? 1.6 : 2.35);
    const targetY = player.y - player.r * (player.gliding ? 1.45 : 2.2) + Math.sin(state.time * 6) * 7;
    pip.x = lerp(pip.x, targetX, dt * 8.2);
    pip.y = lerp(pip.y, targetY, dt * 7.3);
    pip.wing += dt * (player.gliding ? 22 : 12);
    pip.bob += dt * 5;
    pip.trail.unshift({ x: pip.x, y: pip.y, a: .72, r: rand(3, 7), c: choose(['#67d7ff', '#fff2a7', '#ff8ab0']) });
    if (pip.trail.length > 16) pip.trail.pop();
  }

  function updateObjects(dt) {
    const scroll = state.speed * dt;
    for (const o of objects) {
      const typeSpeed = o.type === 'snail' ? state.speed + Math.abs(o.vx) : state.speed;
      o.x -= typeSpeed * dt;
      o.spin += dt * (o.type === 'fuzzy' ? 2.8 : 1.2);
      o.pulse += dt * 4;
      if (o.type === 'fuzzy' || o.type === 'power') {
        o.y += Math.sin(state.time * 2.7 + o.pulse) * 9 * dt;
        if (state.magnet > 0 && o.type === 'fuzzy') {
          const dx = player.x - o.x, dy = player.y - o.y;
          const d = hypot(dx, dy);
          if (d < player.r * 7.5) {
            o.x += dx / Math.max(1, d) * state.speed * dt * 1.15;
            o.y += dy / Math.max(1, d) * state.speed * dt * 1.15;
          }
        }
      }
      if (o.x < -240) o.dead = true;
      collide(o);
    }
    objects.sort((a, b) => (a.y + a.h) - (b.y + b.h));
    for (let i = objects.length - 1; i >= 0; i--) if (objects[i].dead) objects.splice(i, 1);

    for (const f of floaters) {
      f.y += f.vy * dt; f.x += f.vx * dt; f.life -= dt; f.a = Math.max(0, f.life / f.max);
    }
    for (let i = floaters.length - 1; i >= 0; i--) if (floaters[i].life <= 0) floaters.splice(i, 1);
  }

  function collide(o) {
    if (o.dead) return;
    const hitR = player.rolling ? player.r * .65 : player.r * .88;
    const px = player.x;
    const py = player.y + (player.rolling ? player.r * .28 : 0);
    if (o.type === 'fuzzy') {
      const d = hypot(px - o.x, py - o.y);
      if (d < hitR + o.r) collectFuzzy(o);
      return;
    }
    if (o.type === 'power') {
      const d = hypot(px - o.x, py - o.y);
      if (d < hitR + o.r) collectPower(o);
      return;
    }
    if (o.type === 'mushroom') {
      if (Math.abs(px - o.x) < player.r + o.w * .42 && py + hitR > o.y - o.h && py < o.y) {
        player.vy = -H * .67;
        player.grounded = false;
        player.squash = .42;
        player.stretch = .28;
        o.bounce = .5;
        addCombo(2);
        burst(o.x, o.y - o.h, '#ff7fb0', 36, 4);
        floatText(o.x, o.y - 80, 'BOING!', '#ff7fb0');
        sfx.bounce();
      }
      return;
    }
    const box = obstacleBox(o);
    if (circleRect(px, py, hitR, box.x, box.y, box.w, box.h)) {
      if (player.invincible > 0 || state.shield > 0) {
        o.dead = true;
        state.shield = Math.max(0, state.shield - .75);
        state.shake = .16;
        burst(box.x + box.w / 2, box.y + box.h / 2, '#fff6a5', 34, 5);
        floatText(box.x + box.w / 2, box.y - 18, 'SHIELD!', '#fff6a5');
        sfx.power();
      } else {
        gameOver();
      }
    }
  }

  function obstacleBox(o) {
    if (o.type === 'branch') return { x: o.x - o.w * .5, y: o.y - o.h * .5, w: o.w, h: o.h };
    if (o.type === 'puddle') return { x: o.x - o.w * .5, y: groundY - 9, w: o.w, h: 26 };
    if (o.type === 'log') return { x: o.x - o.w * .5, y: groundY - o.h, w: o.w, h: o.h };
    if (o.type === 'snail') return { x: o.x - o.w * .5, y: groundY - o.h, w: o.w, h: o.h };
    if (o.type === 'bramble') return { x: o.x - o.w * .45, y: groundY - o.h, w: o.w * .9, h: o.h };
    return { x: o.x - o.r, y: o.y - o.r, w: o.r * 2, h: o.r * 2 };
  }

  function circleRect(cx, cy, cr, rx, ry, rw, rh) {
    const tx = clamp(cx, rx, rx + rw);
    const ty = clamp(cy, ry, ry + rh);
    return hypot(cx - tx, cy - ty) < cr;
  }

  function collectFuzzy(o) {
    o.dead = true;
    state.fuzzies += state.fever > 0 ? 2 : 1;
    state.score += 40 * state.combo;
    addCombo(1);
    burst(o.x, o.y, '#fff3a3', 16, 3.5);
    if (state.fuzzies % 35 === 0) {
      state.fever = 7;
      state.worldPulse = 1.1;
      floatText(player.x + 80, player.y - 80, 'FUZZY FEVER!', '#fff3a3');
      sfx.power();
    } else {
      sfx.fuzzy();
    }
  }

  function collectPower(o) {
    o.dead = true;
    if (o.power === 'shield') { state.shield = 8; floatText(o.x, o.y, 'SHIELD', '#7efcff'); }
    if (o.power === 'magnet') { state.magnet = 8; floatText(o.x, o.y, 'MAGNET', '#b05cff'); }
    if (o.power === 'fever') { state.fever = 9; state.worldPulse = 1.2; floatText(o.x, o.y, 'FEVER', '#ffd166'); }
    state.score += 260;
    addCombo(3);
    burst(o.x, o.y, o.power === 'shield' ? '#7efcff' : o.power === 'magnet' ? '#b05cff' : '#ffd166', 58, 5.5);
    sfx.power();
  }

  function addCombo(n) { state.combo = clamp(state.combo + n, 1, 25); state.comboTimer = 3.2; }

  function updateParticles(dt) {
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.gravity || 0) * dt;
      p.life -= dt;
      p.a = Math.max(0, p.life / p.max);
      if (p.spin) p.rot = (p.rot || 0) + p.spin * dt;
    }
    for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);
  }

  function dust(x, y, count = 14) { for (let i = 0; i < count; i++) particles.push({ kind: 'dust', x: x + rand(-25, 20), y: y + rand(-12, 4), vx: rand(-110, 20), vy: rand(-80, -10), gravity: 220, life: rand(.32, .68), max: .68, r: rand(3, 11), color: choose(['#cdf58a', '#a7e66f', '#fff3a3']) }); }
  function puff(x, y, color, count = 12) { for (let i = 0; i < count; i++) particles.push({ kind: 'puff', x: x + rand(-18, 18), y: y + rand(-14, 8), vx: rand(-95, 35), vy: rand(-72, -5), gravity: 125, life: rand(.25, .55), max: .55, r: rand(4, 14), color }); }
  function burst(x, y, color, count = 24, speed = 3) { for (let i = 0; i < count; i++) { const a = rand(0, TAU); const v = rand(80, 210) * speed / 3; particles.push({ kind: Math.random() < .55 ? 'star' : 'sparkle', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, gravity: rand(30, 150), life: rand(.45, 1), max: 1, r: rand(2, 7), color, rot: rand(0, TAU), spin: rand(-7, 7) }); } }
  function floatText(x, y, text, color) { floaters.push({ x, y, text, color, vx: rand(-20, 20), vy: -60, life: 1.15, max: 1.15, a: 1 }); }

  function updateHud() {
    ui.score.textContent = Math.floor(state.score).toLocaleString();
    ui.coins.textContent = state.fuzzies.toLocaleString();
    ui.combo.textContent = `×${state.combo}`;
  }

  function draw() {
    const sx = state.shake > 0 ? rand(-1, 1) * state.shake * 18 : 0;
    const sy = state.shake > 0 ? rand(-1, 1) * state.shake * 14 : 0;
    ctx.save();
    ctx.translate(sx, sy);
    drawBackground();
    drawWorld();
    drawObjectsBehindPlayer();
    drawPlayer();
    drawPip();
    drawObjectsFront();
    drawParticles();
    drawFloaters();
    drawForeground();
    drawPost();
    ctx.restore();
  }

  function drawBackground() {
    const t = (Math.sin(state.time * .035 + bgSeed) + 1) / 2;
    const fever = state.fever > 0 ? .18 + Math.sin(state.time * 7) * .05 : 0;
    const sky = ctx.createLinearGradient(0, 0, W, H);
    sky.addColorStop(0, mix('#78dfff', '#4a5bff', t * .32));
    sky.addColorStop(.34, mix('#fff3ab', '#ffb6d2', t * .45 + fever));
    sky.addColorStop(.72, mix('#ffd5a1', '#b884ff', t * .32 + fever));
    sky.addColorStop(1, '#f5ffdf');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    const sunX = W * (.18 + .62 * t);
    const sunY = H * (.14 + .16 * Math.sin(state.time * .03 + 1));
    const sunG = ctx.createRadialGradient(sunX, sunY, 1, sunX, sunY, H * .35);
    sunG.addColorStop(0, 'rgba(255,255,197,.95)'); sunG.addColorStop(.12, 'rgba(255,210,102,.78)'); sunG.addColorStop(.52, 'rgba(255,210,102,.16)'); sunG.addColorStop(1, 'rgba(255,210,102,0)');
    ctx.fillStyle = sunG;
    ctx.beginPath(); ctx.arc(sunX, sunY, H * .36, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff8a5'; ctx.beginPath(); ctx.arc(sunX, sunY, clamp(H * .075, 32, 68), 0, TAU); ctx.fill();

    ctx.save();
    ctx.globalAlpha = clamp(t * .75, .05, .45);
    for (const s of stars) {
      ctx.globalAlpha = s.a * clamp(t * .7, .03, .55) * (.58 + .42 * Math.sin(state.time * 2 + s.tw));
      drawStar(s.x * W, s.y * H, s.r * 2, s.r * .72, 5);
      ctx.fillStyle = '#fff'; ctx.fill();
    }
    ctx.restore();

    drawClouds();
    drawMountains();
  }

  function drawClouds() {
    for (const c of clouds) {
      let x = ((c.x + state.time * c.speed) % 1.25 - .12) * W;
      const y = c.y * H + Math.sin(state.time * .4 + c.seed) * 8;
      const s = c.scale * clamp(W / 1000, .7, 1.4);
      ctx.save(); ctx.globalAlpha = c.alpha; ctx.fillStyle = c.color;
      cloud(x, y, 56 * s, 24 * s);
      ctx.fill();
      ctx.globalAlpha = c.alpha * .22; ctx.fillStyle = '#67d7ff'; cloud(x + 8 * s, y + 10 * s, 52 * s, 18 * s); ctx.fill();
      ctx.restore();
    }
  }

  function drawMountains() {
    ctx.save();
    for (const m of mountains) {
      const x = ((m.x - (state.distance * m.p / W)) % 1.35 + 1.35) % 1.35 * W - W * .15;
      const base = groundY - H * .19;
      const w = W * m.w;
      const h = H * m.h;
      const grad = ctx.createLinearGradient(0, base - h, 0, base);
      grad.addColorStop(0, `hsla(${m.hue}, 70%, 84%, .72)`);
      grad.addColorStop(1, `hsla(${m.hue - 40}, 74%, 62%, .36)`);
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.moveTo(x - w, base); ctx.quadraticCurveTo(x, base - h * 1.08, x + w, base); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function drawWorld() {
    drawHills();
    drawTrees();
    drawGround();
    drawMeadowDetails();
  }

  function drawHills() {
    for (let layer = 0; layer < 3; layer++) {
      ctx.save();
      ctx.globalAlpha = [.43, .62, .82][layer];
      for (const h of hills.filter((p) => p.layer === layer)) {
        const speed = [.055, .09, .14][layer];
        const x = ((h.x - state.distance * speed / W) % 1.35 + 1.35) % 1.35 * W - W * .15;
        const y = groundY - H * (.13 - layer * .035) + Math.sin(h.x * 8 + state.time * .2) * 3;
        const w = W * .22 * h.s;
        const tall = H * .15 * h.s;
        const grad = ctx.createLinearGradient(0, y - tall, 0, y + tall);
        grad.addColorStop(0, `hsla(${h.hue}, 76%, 69%, .92)`); grad.addColorStop(1, `hsla(${h.hue - 18}, 72%, 42%, .92)`);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.ellipse(x, y + tall * .55, w, tall, 0, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawTrees() {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const par = .22;
      const x = ((i / count * 1.6 - state.distance * par / W) % 1.6 + 1.6) % 1.6 * W - W * .25;
      const y = groundY - H * .07 + Math.sin(i * 2.7) * 20;
      const s = (.65 + (i % 4) * .12) * clamp(W / 1000, .75, 1.25);
      drawTree(x, y, s, i);
    }
  }

  function drawGround() {
    const g = ctx.createLinearGradient(0, groundY - 35, 0, H);
    g.addColorStop(0, '#9cff77'); g.addColorStop(.28, '#35cd72'); g.addColorStop(1, '#0b9c66');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, groundY - 7);
    for (let x = 0; x <= W + 40; x += 38) {
      const y = groundY + Math.sin((x + state.distance * .22) * .018) * 8 + Math.sin((x + state.distance * .1) * .041) * 4;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();

    ctx.save();
    ctx.globalAlpha = .38;
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = i % 2 ? '#e8ff9e' : '#1bba6e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const yy = groundY + 20 + i * 28;
      for (let x = -40; x <= W + 50; x += 35) {
        const y = yy + Math.sin((x + state.distance * (.18 + i * .03)) * .02 + i) * 5;
        if (x === -40) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMeadowDetails() {
    for (const f of flowers) {
      const depth = .42 + f.layer * .25;
      const x = ((f.x - state.distance * depth / W) % 1.15 + 1.15) % 1.15 * W - W * .06;
      const y = groundY + f.y * (H - groundY - 10) + 8;
      if (y > H - 6) continue;
      drawFlower(x, y, f.s * clamp(W / 1100, .65, 1.25), f.c, f.tw);
    }
    ctx.save();
    for (const p of pollen) {
      const x = p.x * W + Math.sin(state.time + p.phase) * 16;
      const y = p.y * groundY + 20;
      ctx.globalAlpha = p.a * (.75 + (state.fever > 0 ? .25 : 0));
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(x, y, p.s, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function drawObjectsBehindPlayer() {
    for (const o of objects) if (o.type === 'fuzzy' || o.type === 'power' || o.type === 'branch') drawObject(o);
  }
  function drawObjectsFront() {
    for (const o of objects) if (!(o.type === 'fuzzy' || o.type === 'power' || o.type === 'branch')) drawObject(o);
  }

  function drawObject(o) {
    if (o.type === 'fuzzy') drawFuzzy(o.x, o.y, o.r, o.pulse);
    else if (o.type === 'power') drawPower(o.x, o.y, o.power, o.pulse);
    else if (o.type === 'log') drawLog(o);
    else if (o.type === 'snail') drawSnail(o);
    else if (o.type === 'puddle') drawPuddle(o);
    else if (o.type === 'branch') drawBranch(o);
    else if (o.type === 'bramble') drawBramble(o);
    else if (o.type === 'mushroom') drawMushroom(o);
  }

  function drawFuzzy(x, y, r, t) {
    ctx.save();
    const pulse = 1 + Math.sin(t) * .12 + (state.fever > 0 ? .12 : 0);
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 1, x, y, r * 4.2);
    g.addColorStop(0, 'rgba(255,247,150,.9)'); g.addColorStop(.22, 'rgba(255,214,102,.38)'); g.addColorStop(1, 'rgba(255,214,102,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 4, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.translate(x, y); ctx.rotate(t * .22);
    for (let i = 0; i < 9; i++) {
      ctx.rotate(TAU / 9);
      ctx.fillStyle = i % 2 ? '#fff9b8' : '#ffd166';
      ctx.beginPath(); ctx.ellipse(r * .58, 0, r * .58 * pulse, r * .18, 0, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#fffbe0'; ctx.beginPath(); ctx.arc(0, 0, r * .58 * pulse, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff9f3f'; ctx.beginPath(); ctx.arc(0, 0, r * .23, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawPower(x, y, type, t) {
    const colors = type === 'shield' ? ['#7efcff', '#2279ff'] : type === 'magnet' ? ['#f3a6ff', '#8d68ff'] : ['#fff375', '#ff7e2f'];
    ctx.save();
    ctx.translate(x, y); ctx.rotate(Math.sin(t) * .15);
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 80);
    g.addColorStop(0, colors[0] + 'ee'); g.addColorStop(.55, colors[1] + '33'); g.addColorStop(1, colors[1] + '00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 80, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = colors[1]; ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
    roundRect(ctx, -24, -24, 48, 48, 15); ctx.fill(); ctx.stroke();
    ctx.fillStyle = colors[0];
    if (type === 'shield') { ctx.beginPath(); ctx.moveTo(0, -16); ctx.quadraticCurveTo(18, -12, 15, 4); ctx.quadraticCurveTo(10, 18, 0, 22); ctx.quadraticCurveTo(-10, 18, -15, 4); ctx.quadraticCurveTo(-18, -12, 0, -16); ctx.fill(); }
    if (type === 'magnet') { ctx.lineWidth = 8; ctx.strokeStyle = colors[0]; ctx.beginPath(); ctx.arc(0, 0, 15, Math.PI * .15, Math.PI * .85, true); ctx.stroke(); ctx.fillRect(-19, -3, 8, 13); ctx.fillRect(11, -3, 8, 13); }
    if (type === 'fever') { drawStar(0, 0, 18, 8, 6); ctx.fill(); }
    ctx.restore();
  }

  function drawLog(o) {
    ctx.save(); ctx.translate(o.x, groundY - o.h / 2);
    const g = ctx.createLinearGradient(-o.w / 2, -o.h / 2, o.w / 2, o.h / 2); g.addColorStop(0, '#9c552a'); g.addColorStop(.5, '#d78942'); g.addColorStop(1, '#6b351c');
    ctx.fillStyle = g; ctx.strokeStyle = '#5e2f1b'; ctx.lineWidth = 3;
    roundRect(ctx, -o.w / 2, -o.h / 2, o.w, o.h, o.h / 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f4c072'; ctx.beginPath(); ctx.ellipse(-o.w / 2 + 8, 0, 16, o.h * .42, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#8b4b25'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-o.w / 2 + 8, 0, 7, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  function drawSnail(o) {
    ctx.save(); ctx.translate(o.x, groundY - 22);
    ctx.fillStyle = '#95f09a'; ctx.beginPath(); ctx.ellipse(0, 10, 34, 16, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7bd67e'; ctx.beginPath(); ctx.ellipse(30, 4, 20, 12, -.15, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#376e42'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(41, -6); ctx.lineTo(50, -22); ctx.moveTo(31, -6); ctx.lineTo(34, -20); ctx.stroke();
    ctx.fillStyle = '#24304a'; ctx.beginPath(); ctx.arc(50, -23, 3, 0, TAU); ctx.arc(34, -21, 3, 0, TAU); ctx.fill();
    const shellG = ctx.createRadialGradient(-10, 0, 2, -10, 0, 30); shellG.addColorStop(0, '#ffd166'); shellG.addColorStop(.55, '#ff7e9b'); shellG.addColorStop(1, '#8d68ff');
    ctx.fillStyle = shellG; ctx.beginPath(); ctx.arc(-10, -2, 25, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#fff7c9'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-10, -2, 16, .2, TAU * .9); ctx.stroke();
    ctx.restore();
  }

  function drawPuddle(o) {
    ctx.save(); ctx.translate(o.x, groundY + 6);
    ctx.globalCompositeOperation = 'multiply';
    const g = ctx.createRadialGradient(0, 0, 5, 0, 0, o.w * .55); g.addColorStop(0, 'rgba(76,208,255,.72)'); g.addColorStop(1, 'rgba(38,126,255,.2)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, o.w / 2, 16, 0, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = .8; ctx.strokeStyle = '#e6ffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(8, -2, o.w * .28, 7, -.12, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  function drawBranch(o) {
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(Math.sin(o.pulse) * .03);
    ctx.strokeStyle = '#7a492c'; ctx.lineWidth = 15; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-o.w / 2, 0); ctx.bezierCurveTo(-o.w * .22, -16, o.w * .18, 18, o.w / 2, -4); ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const lx = -o.w / 2 + i * o.w / 5;
      drawLeaf(lx, Math.sin(i) * 10 - 12, 16, i % 2 ? '#58d36c' : '#8eef68', i % 2 ? .7 : -1);
    }
    ctx.restore();
  }

  function drawBramble(o) {
    ctx.save(); ctx.translate(o.x, groundY);
    ctx.strokeStyle = '#5e2f50'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) { const x = -o.w * .45 + i * o.w * .23; ctx.beginPath(); ctx.moveTo(x, -4); ctx.quadraticCurveTo(x + 12, -o.h * .6, x + 4, -o.h); ctx.stroke(); }
    ctx.fillStyle = '#ff62a5'; for (let i = 0; i < 7; i++) { const x = -o.w * .42 + i * o.w * .14; ctx.beginPath(); ctx.arc(x, -rand(o.h*.25, o.h*.8), 5, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  function drawMushroom(o) {
    const b = o.bounce || 0; o.bounce = Math.max(0, b - .08);
    ctx.save(); ctx.translate(o.x, groundY); ctx.scale(1 + b * .25, 1 - b * .25);
    ctx.fillStyle = '#ffe8bb'; roundRect(ctx, -14, -42, 28, 42, 12); ctx.fill();
    const cap = ctx.createLinearGradient(0, -90, 0, -38); cap.addColorStop(0, '#ff5f93'); cap.addColorStop(1, '#b05cff');
    ctx.fillStyle = cap; ctx.beginPath(); ctx.ellipse(0, -48, 43, 28, 0, Math.PI, TAU); ctx.lineTo(43, -48); ctx.quadraticCurveTo(0, -22, -43, -48); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff8d8'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(-25 + i * 10 + Math.sin(i) * 5, -55 - Math.cos(i) * 8, 5 + (i % 2) * 2, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  function drawPlayer() {
    ctx.save();
    const alphaPulse = player.invincible > 0 ? .68 + Math.sin(state.time * 32) * .22 : 1;
    ctx.globalAlpha = alphaPulse;
    const rollingScaleY = player.rolling ? .68 : 1;
    const squashY = 1 - player.squash + player.stretch * .2;
    const squashX = 1 + player.squash * .8 - player.stretch * .2;
    ctx.translate(player.x, player.y + player.r);
    ctx.rotate(player.rot * (player.rolling ? 1.4 : .18));
    ctx.scale(squashX, squashY * rollingScaleY);

    // Dynamic shadow
    ctx.save(); ctx.globalAlpha = .25; ctx.fillStyle = '#276b38'; ctx.beginPath(); ctx.ellipse(3, player.r * .88, player.r * 1.2, player.r * .26, 0, 0, TAU); ctx.fill(); ctx.restore();

    // cape / leaves trail
    ctx.save(); ctx.rotate(-player.rot * (player.rolling ? 1.4 : .18));
    for (let i = player.cape.length - 1; i >= 0; i--) {
      const c = player.cape[i]; const a = (1 - i / player.cape.length) * .7;
      ctx.globalAlpha = a; ctx.fillStyle = i % 2 ? '#58d36c' : '#ff9f3f';
      ctx.beginPath(); ctx.ellipse(c.x - player.x - i * 7, c.y - player.y - player.r + Math.sin(state.time*8+i)*4, 14 - i, 7 - i*.35, -.3, 0, TAU); ctx.fill();
    }
    ctx.restore();

    const g = ctx.createRadialGradient(-player.r * .35, -player.r * .55, 2, 0, 0, player.r * 1.35);
    g.addColorStop(0, '#fff3cf'); g.addColorStop(.5, '#d99d58'); g.addColorStop(1, '#8f552b');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-player.r * .85, -player.r * .22);
    ctx.bezierCurveTo(-player.r * 1.05, -player.r * .9, -player.r * .35, -player.r * 1.32, player.r * .18, -player.r * 1.25);
    ctx.bezierCurveTo(player.r * 1.05, -player.r * 1.15, player.r * 1.16, -player.r * .25, player.r * .88, player.r * .38);
    ctx.bezierCurveTo(player.r * .5, player.r * 1.05, -player.r * .45, player.r * 1.1, -player.r * .88, player.r * .42);
    ctx.bezierCurveTo(-player.r * 1.04, player.r * .15, -player.r * .96, -.02, -player.r * .85, -player.r * .22);
    ctx.fill();

    // leaf cape behind head
    drawLeaf(-player.r * .92, -player.r * .76, player.r * .58, '#58d36c', -.7);
    drawLeaf(player.r * .92, -player.r * .64, player.r * .48, '#7ef078', .8);

    // cheeks, eyes, face
    ctx.fillStyle = 'rgba(255,125,154,.72)'; ctx.beginPath(); ctx.arc(-player.r * .57, -player.r * .08, player.r * .22, 0, TAU); ctx.arc(player.r * .62, -player.r * .08, player.r * .22, 0, TAU); ctx.fill();
    ctx.fillStyle = '#322214';
    ctx.beginPath(); ctx.ellipse(-player.r * .34, -player.r * .38, player.r * .12, player.r * .15 * player.blink, 0, 0, TAU); ctx.ellipse(player.r * .38, -player.r * .38, player.r * .12, player.r * .15 * player.blink, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; if (player.blink > .45) { ctx.beginPath(); ctx.arc(-player.r * .39, -player.r * .43, player.r * .035, 0, TAU); ctx.arc(player.r * .33, -player.r * .43, player.r * .035, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#4b2d1a'; ctx.lineWidth = clamp(player.r * .08, 3, 5); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-player.r * .18, player.r * .03); ctx.quadraticCurveTo(0, player.r * .20, player.r * .22, player.r * .03); ctx.stroke();
    // feet
    ctx.fillStyle = '#6d3d1e'; ctx.beginPath(); ctx.ellipse(-player.r * .44, player.r * .82, player.r * .25, player.r * .12, -.08, 0, TAU); ctx.ellipse(player.r * .44, player.r * .82, player.r * .25, player.r * .12, .08, 0, TAU); ctx.fill();
    ctx.restore();

    if (state.shield > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .34 + Math.sin(state.time * 8) * .08; ctx.strokeStyle = '#7efcff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(player.x, player.y + player.r * .02, player.r * 1.55, 0, TAU); ctx.stroke(); ctx.restore();
    }
    if (state.magnet > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .26; ctx.strokeStyle = '#b05cff'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(player.x, player.y, player.r * (2.5 + i * 1.4) + Math.sin(state.time * 4 + i) * 8, 0, TAU); ctx.stroke(); } ctx.restore();
    }
  }

  function drawPip() {
    ctx.save();
    for (let i = pip.trail.length - 1; i >= 0; i--) { const tr = pip.trail[i]; ctx.globalAlpha = tr.a * (1 - i / pip.trail.length); ctx.fillStyle = tr.c; ctx.beginPath(); ctx.arc(tr.x - i * 2, tr.y, tr.r, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
    ctx.translate(pip.x, pip.y); ctx.rotate(Math.sin(state.time * 3) * .12);
    const s = clamp(player.r / 36, .75, 1.18);
    ctx.scale(s, s);
    ctx.fillStyle = '#32c7ff'; ctx.beginPath(); ctx.ellipse(0, 0, 24, 21, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2279ff';
    const wing = Math.sin(pip.wing) * 18;
    ctx.beginPath(); ctx.ellipse(-18, 4 + wing * .08, 21, 9, -0.7 + wing * .018, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(12, 6 - wing * .06, 18, 8, 0.65 - wing * .014, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(21, -2); ctx.lineTo(42, -10); ctx.lineTo(30, 7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#24304a'; ctx.beginPath(); ctx.arc(9, -8, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(11, -10, 1.8, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff7e9b'; ctx.beginPath(); ctx.ellipse(-6, 12, 14, 5, .15, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.save(); ctx.globalAlpha = p.a; ctx.translate(p.x, p.y); if (p.rot) ctx.rotate(p.rot); ctx.fillStyle = p.color;
      if (p.kind === 'star') { drawStar(0, 0, p.r * 1.8, p.r * .78, 5); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
  }

  function drawFloaters() {
    ctx.save(); ctx.font = `900 ${clamp(W * .024, 16, 30)}px ui-rounded, Trebuchet MS, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const f of floaters) { ctx.globalAlpha = f.a; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(36,48,74,.55)'; ctx.strokeText(f.text, f.x, f.y); ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y); }
    ctx.restore();
  }

  function drawForeground() {
    ctx.save();
    for (const g of foregroundGrass) {
      const x = ((g.x - state.distance * .4 / W) % 1.2 + 1.2) % 1.2 * W - W * .08;
      const y = g.y * H;
      ctx.globalAlpha = g.a;
      ctx.strokeStyle = `hsl(${g.hue}, 75%, ${35 + g.a * 20}%)`;
      ctx.lineWidth = g.w;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.sin(state.time * 2 + g.phase) * 8, y - g.h * .55, x + Math.sin(state.time * 3 + g.phase) * 12, y - g.h); ctx.stroke();
    }
    ctx.restore();
  }

  function drawPost() {
    if (state.fever > 0 || state.worldPulse > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = clamp((state.fever > 0 ? .22 : 0) + state.worldPulse * .18, 0, .38);
      const g = ctx.createRadialGradient(W * .5, H * .48, 1, W * .5, H * .48, W * .72);
      g.addColorStop(0, '#fff6a5'); g.addColorStop(.45, '#ff7eb0'); g.addColorStop(1, '#8d68ff00');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    ctx.save();
    const vg = ctx.createRadialGradient(W * .5, H * .46, H * .16, W * .5, H * .5, W * .74);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(65,32,12,.18)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (state.flash > 0) { ctx.globalAlpha = state.flash * .45; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  }

  function drawTree(x, y, s, seed) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#7b4b29'; roundRect(ctx, -9, -65, 18, 72, 8); ctx.fill();
    const colors = seed % 2 ? ['#5bdd72', '#1cae61', '#a4f35f'] : ['#6be789', '#23b86b', '#d4ff75'];
    for (let i = 0; i < 4; i++) { ctx.fillStyle = colors[i % colors.length]; ctx.beginPath(); ctx.ellipse(Math.sin(seed + i) * 16, -76 - i * 18, 45 - i * 4, 32, Math.sin(i) * .2, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  function drawFlower(x, y, s, c, tw) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(Math.sin(state.time * 1.8 + tw) * .05);
    ctx.strokeStyle = '#208d48'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(3, -10, 0, -20); ctx.stroke();
    ctx.fillStyle = c; for (let i = 0; i < 5; i++) { ctx.rotate(TAU / 5); ctx.beginPath(); ctx.ellipse(0, -25, 5, 10, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#fff7a5'; ctx.beginPath(); ctx.arc(0, -20, 5, 0, TAU); ctx.fill(); ctx.restore();
  }

  function drawLeaf(x, y, size, color, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, -size); ctx.bezierCurveTo(size * .75, -size * .55, size * .75, size * .55, 0, size); ctx.bezierCurveTo(-size * .75, size * .55, -size * .75, -size * .55, 0, -size); ctx.fill(); ctx.restore();
  }

  function cloud(x, y, w, h) {
    ctx.beginPath(); ctx.ellipse(x - w * .42, y + h * .10, w * .32, h * .63, 0, 0, TAU); ctx.ellipse(x - w * .12, y - h * .18, w * .38, h * .82, 0, 0, TAU); ctx.ellipse(x + w * .25, y, w * .43, h * .72, 0, 0, TAU); ctx.ellipse(x + w * .55, y + h * .18, w * .25, h * .48, 0, 0, TAU); ctx.rect(x - w * .56, y, w * 1.16, h * .52);
  }

  function mix(a, b, t) {
    const A = hex(a), B = hex(b); t = clamp(t, 0, 1);
    return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
  }
  function hex(str) { const v = str.replace('#', ''); return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]; }

  function roundRect(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function drawStar(x, y, outer, inner, points) { ctx.beginPath(); for (let i = 0; i < points * 2; i++) { const r = i % 2 ? inner : outer; const a = -Math.PI / 2 + i * Math.PI / points; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.closePath(); }

  function loop(t) {
    const raw = Math.min(.05, (t - lastT) / 1000 || 0);
    lastT = t;
    accumulator += raw;
    const step = 1 / 60;
    while (accumulator >= step) { update(step); accumulator -= step; }
    draw();
    requestAnimationFrame(loop);
  }

  function bindControls() {
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => { if (document.hidden && state.mode === 'playing') pauseGame(); });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); jump(); }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); roll(); }
      if (e.code === 'Escape' || e.code === 'KeyP') { e.preventDefault(); state.mode === 'playing' ? pauseGame() : resumeGame(); }
    });
    window.addEventListener('keyup', (e) => { if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) releaseJump(); });
    canvas.addEventListener('pointerdown', (e) => { pointerIsDown = true; pointerStartY = e.clientY; canvas.setPointerCapture?.(e.pointerId); jump(); });
    canvas.addEventListener('pointermove', (e) => { if (pointerIsDown && e.clientY - pointerStartY > 45) { roll(); pointerIsDown = false; } });
    canvas.addEventListener('pointerup', () => { pointerIsDown = false; releaseJump(); });
    canvas.addEventListener('pointercancel', () => { pointerIsDown = false; releaseJump(); });
    ui.jumpTouch.addEventListener('pointerdown', (e) => { e.preventDefault(); jump(); });
    ui.jumpTouch.addEventListener('pointerup', (e) => { e.preventDefault(); releaseJump(); });
    ui.rollTouch.addEventListener('pointerdown', (e) => { e.preventDefault(); roll(); });
    ui.play.addEventListener('click', resetRun);
    ui.howPlay.addEventListener('click', resetRun);
    ui.howBtn.addEventListener('click', () => show('how'));
    ui.howClose.addEventListener('click', () => show('start'));
    ui.pauseBtn.addEventListener('click', () => state.mode === 'playing' ? pauseGame() : resumeGame());
    ui.resume.addEventListener('click', resumeGame);
    ui.restartPause.addEventListener('click', resetRun);
    ui.restart.addEventListener('click', resetRun);
    ui.soundBtn.addEventListener('click', () => { muted = !muted; ui.soundBtn.textContent = muted ? '×' : '♪'; ui.soundBtn.setAttribute('aria-pressed', String(!muted)); if (!muted) sfx.power(); });
    ui.revive.addEventListener('click', async () => { if (state.mode !== 'gameover') return; const ok = await portal.rewardedAd('revive'); if (ok) revive(); });
  }

  function init() {
    initMeadowDetails();
    resize();
    bindControls();
    player.y = groundY - player.r;
    pip.x = player.x + player.r * 2.2; pip.y = player.y - player.r * 2.2;
    portal.emit('ready', { version: VERSION, slug: GAME_SLUG });
    requestAnimationFrame(loop);
    setTimeout(() => { state.mode = 'menu'; show('start'); }, 850);
  }

  init();
})();
