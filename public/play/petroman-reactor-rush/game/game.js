(() => {
  'use strict';

  const W = 960;
  const H = 540;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const loading = document.getElementById('loading');
  const loadBar = document.getElementById('loadBar');
  const loadText = document.getElementById('loadText');
  const muteButton = document.getElementById('muteButton');
  const pauseButton = document.getElementById('pauseButton');
  const touchControls = document.getElementById('touchControls');

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const choose = arr => arr[(Math.random() * arr.length) | 0];
  const rectsOverlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const displayW = Math.max(320, Math.floor(rect.width * DPR));
    const displayH = Math.max(180, Math.floor(rect.height * DPR));
    if (canvas.width !== displayW || canvas.height !== displayH) {
      canvas.width = displayW;
      canvas.height = displayH;
    }
  }
  window.addEventListener('resize', resizeCanvas, { passive: true });

  const assets = {};
  const assetList = {
    petroman: 'assets/sprites/petroman-spritesheet.png',
    enemies: 'assets/sprites/enemy-spritesheet.png',
    pickups: 'assets/sprites/pickups-atlas.png',
    platforms: 'assets/tiles/platform-tiles.png',
    ui: 'assets/ui/ui-atlas.png',
    vfx: 'assets/vfx/vfx-spritesheet.png',
    logo: 'assets/ui/logo.png',
    titleScreen: 'assets/ui/title-screen.png',
    victoryScreen: 'assets/ui/victory-screen.png',
    defeatScreen: 'assets/ui/defeat-screen.png',
    bg1: 'assets/backgrounds/background-1.png',
    bg2: 'assets/backgrounds/background-2.png',
    bg3: 'assets/backgrounds/background-3.png',
    bg4: 'assets/backgrounds/background-4.png',
    bg5: 'assets/backgrounds/background-5.png',
    bg6: 'assets/backgrounds/background-6.png',
    bg7: 'assets/backgrounds/background-7.png',
    bg8: 'assets/backgrounds/background-8.png'
  };

  const audio = {
    tracks: {
      title: new Audio('assets/audio/music-title.wav'),
      gameplay: new Audio('assets/audio/music-gameplay.wav'),
      victory: new Audio('assets/audio/music-victory.wav'),
      defeat: new Audio('assets/audio/music-defeat.wav')
    },
    paths: {
      jump: 'assets/audio/jump.wav', boost: 'assets/audio/boost.wav', collect: 'assets/audio/collect.wav',
      chain: 'assets/audio/chain.wav', hit: 'assets/audio/hit.wav', power: 'assets/audio/power.wav',
      clean: 'assets/audio/clean.wav', clear: 'assets/audio/clear.wav', victory: 'assets/audio/victory.wav',
      defeat: 'assets/audio/defeat.wav', start: 'assets/audio/start.wav'
    },
    current: null,
    currentName: '',
    pending: 'title',
    muted: false,
    unlocked: false,
    unlock() {
      if (this.unlocked) return;
      this.unlocked = true;
      this.playMusic(this.pending || 'title');
    },
    playMusic(name) {
      this.pending = name;
      if (!this.unlocked) return;
      if (this.currentName === name && this.current && !this.current.paused) return;
      if (this.current) { this.current.pause(); this.current.currentTime = 0; }
      const track = this.tracks[name];
      if (!track) return;
      this.current = track; this.currentName = name;
      track.loop = name === 'title' || name === 'gameplay';
      track.volume = name === 'gameplay' ? .26 : .32;
      track.muted = this.muted;
      track.currentTime = 0;
      track.play().catch(() => {});
    },
    sfx(name, volume = 0.55) {
      if (this.muted || !this.unlocked || !this.paths[name]) return;
      const a = new Audio(this.paths[name]);
      a.volume = volume;
      a.play().catch(() => {});
    },
    toggle() {
      this.muted = !this.muted;
      Object.values(this.tracks).forEach(track => { track.muted = this.muted; });
      muteButton.textContent = this.muted ? 'SOUND OFF' : 'SOUND ON';
      muteButton.setAttribute('aria-pressed', String(this.muted));
    }
  };

  function loadAssets() {
    const entries = Object.entries(assetList);
    let loaded = 0;
    return Promise.all(entries.map(([key, src]) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        assets[key] = img;
        loaded++;
        loadBar.style.width = `${Math.round((loaded / entries.length) * 100)}%`;
        loadText.textContent = loaded === entries.length ? 'Reactor online!' : `Charging visual systems ${loaded}/${entries.length}`;
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    })));
  }

  const keys = { left: false, right: false, jump: false, down: false };
  const pressed = { jump: false, pause: false };
  const keyMap = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'jump', KeyW: 'jump', Space: 'jump',
    ArrowDown: 'down', KeyS: 'down'
  };

  window.addEventListener('keydown', e => {
    if (keyMap[e.code]) {
      if (!keys[keyMap[e.code]] && keyMap[e.code] === 'jump') pressed.jump = true;
      keys[keyMap[e.code]] = true;
      e.preventDefault();
    }
    if (e.code === 'KeyP' || e.code === 'Escape') {
      pressed.pause = true;
      e.preventDefault();
    }
    if ((e.code === 'Enter' || e.code === 'Space') && ['title', 'gameOver', 'victory'].includes(game.state)) {
      audio.unlock();
      game.startRun();
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', e => {
    if (keyMap[e.code]) {
      keys[keyMap[e.code]] = false;
      e.preventDefault();
    }
  });
  window.addEventListener('blur', () => {
    Object.keys(keys).forEach(k => keys[k] = false);
    if (game.state === 'playing') game.togglePause();
  });

  touchControls.querySelectorAll('button[data-key]').forEach(btn => {
    const k = btn.dataset.key;
    const down = e => {
      e.preventDefault();
      audio.unlock();
      if (k === 'jump' && !keys.jump) pressed.jump = true;
      keys[k] = true;
      btn.classList.add('active');
    };
    const up = e => {
      e.preventDefault();
      keys[k] = false;
      btn.classList.remove('active');
    };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('pointerleave', up);
  });

  muteButton.addEventListener('click', e => { e.stopPropagation(); audio.unlock(); audio.toggle(); });
  pauseButton.addEventListener('click', e => { e.stopPropagation(); audio.unlock(); game.togglePause(); });
  canvas.addEventListener('pointerdown', e => {
    audio.unlock();
    if (['title', 'gameOver', 'victory'].includes(game.state)) game.startRun();
    else if (game.state === 'levelClear') game.nextLevel();
    else if (game.state === 'paused') game.togglePause();
    e.preventDefault();
  });

  class Particle {
    constructor(x, y, options = {}) {
      this.x = x; this.y = y;
      this.vx = options.vx ?? rand(-130, 130);
      this.vy = options.vy ?? rand(-210, -50);
      this.life = this.maxLife = options.life ?? rand(.35, .85);
      this.size = options.size ?? rand(3, 8);
      this.color = options.color ?? choose(['#38f1da', '#ffbf35', '#ff6848', '#ab77ff']);
      this.gravity = options.gravity ?? 420;
      this.shape = options.shape ?? 'square';
    }
    update(dt) {
      this.life -= dt; this.vy += this.gravity * dt; this.x += this.vx * dt; this.y += this.vy * dt;
      this.vx *= Math.pow(.15, dt);
    }
    draw(ctx) {
      const a = clamp(this.life / this.maxLife, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = this.color;
      if (this.shape === 'circle') {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size * a, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.life * 8); ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size); ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  }

  class FloatingText {
    constructor(x, y, text, color = '#fff', size = 22) {
      this.x = x; this.y = y; this.text = text; this.color = color; this.size = size; this.life = this.maxLife = .9;
    }
    update(dt) { this.life -= dt; this.y -= 48 * dt; }
    draw(ctx) {
      const a = clamp(this.life / this.maxLife, 0, 1);
      ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.font = `900 ${this.size}px system-ui`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(4,10,30,.7)'; ctx.strokeText(this.text, this.x, this.y); ctx.fillStyle = this.color; ctx.fillText(this.text, this.x, this.y); ctx.restore();
    }
  }


  class SpriteVfx {
    constructor(x, y, row = 0, scale = 1, duration = .48) {
      this.x = x; this.y = y; this.row = row; this.scale = scale;
      this.life = 0; this.duration = duration;
    }
    update(dt) { this.life += dt; }
    get dead() { return this.life >= this.duration; }
    draw(ctx) {
      const frame = Math.min(7, Math.floor((this.life / this.duration) * 8));
      const size = 64 * this.scale;
      ctx.save();
      ctx.globalCompositeOperation = this.row === 2 ? 'screen' : 'source-over';
      ctx.drawImage(assets.vfx, frame * 64, this.row * 64, 64, 64, this.x - size / 2, this.y - size / 2, size, size);
      ctx.restore();
    }
  }

  const levels = [
    {
      name: 'Mango Metro Rooftops', bg: 1, time: 70,
      platforms: [[0,500,960,40],[60,410,220,24],[360,430,210,24],[650,390,235,24],[210,305,190,24],[500,285,200,24],[735,225,155,24],[80,210,145,24]],
      cores: [[120,370],[238,365],[398,390],[530,390],[700,350],[830,350],[260,265],[355,265],[540,245],[650,245],[785,185],[145,170]],
      enemies: [['smog',760,330],['drill',430,390],['hawk',180,120]]
    },
    {
      name: 'Neon Refinery', bg: 2, time: 68,
      platforms: [[0,500,960,40],[45,420,175,24],[275,445,180,24],[515,415,190,24],[760,440,155,24],[110,315,230,24],[420,290,170,24],[665,315,220,24],[315,185,330,24]],
      cores: [[90,380],[175,380],[330,405],[410,405],[565,375],[660,375],[805,400],[150,275],[290,275],[460,250],[710,275],[820,275],[370,145],[590,145]],
      enemies: [['smog',150,250],['drill',540,375],['drill',800,400],['hawk',740,150]]
    },
    {
      name: 'Smogstorm Skyline', bg: 3, time: 66,
      platforms: [[0,500,960,40],[40,425,190,24],[300,405,170,24],[540,435,180,24],[770,390,160,24],[140,300,185,24],[390,275,185,24],[655,285,190,24],[55,175,180,24],[350,155,230,24],[700,165,190,24]],
      cores: [[85,385],[190,385],[350,365],[430,365],[585,395],[675,395],[815,350],[220,260],[445,235],[535,235],[700,245],[820,245],[110,135],[405,115],[540,115],[750,125]],
      enemies: [['smog',205,235],['smog',705,220],['drill',355,365],['hawk',480,75],['hawk',850,100]]
    },
    {
      name: 'The Turbine Gardens', bg: 4, time: 64,
      platforms: [[0,500,960,40],[60,430,160,24],[275,410,160,24],[500,430,160,24],[735,410,165,24],[160,315,165,24],[400,320,160,24],[635,305,180,24],[60,205,155,24],[280,190,165,24],[520,210,165,24],[745,180,155,24]],
      cores: [[105,390],[180,390],[315,370],[395,370],[540,390],[625,390],[780,370],[860,370],[210,275],[445,280],[680,265],[100,165],[330,150],[570,170],[785,140],[860,140]],
      enemies: [['drill',320,370],['drill',760,370],['smog',470,255],['hawk',160,130],['hawk',700,95]]
    },
    {
      name: 'Exhaust Canyon', bg: 5, time: 62,
      platforms: [[0,500,960,40],[0,400,180,24],[240,430,165,24],[470,390,175,24],[720,430,240,24],[90,295,205,24],[365,305,185,24],[625,285,225,24],[0,185,180,24],[250,170,180,24],[500,190,190,24],[760,165,200,24]],
      cores: [[50,360],[130,360],[275,390],[365,390],[510,350],[600,350],[760,390],[900,390],[135,255],[405,265],[515,265],[675,245],[805,245],[70,145],[300,130],[390,130],[550,150],[640,150],[810,125],[910,125]],
      enemies: [['smog',130,230],['smog',680,220],['drill',500,350],['drill',820,390],['hawk',350,80],['hawk',840,70]]
    },
    {
      name: 'Skyrail Switchyard', bg: 6, time: 60,
      platforms: [[0,500,960,40],[45,425,210,24],[330,425,300,24],[710,425,205,24],[130,315,205,24],[390,300,180,24],[640,315,205,24],[45,205,180,24],[290,190,165,24],[520,205,165,24],[745,190,170,24],[390,105,180,24]],
      cores: [[90,385],[180,385],[370,385],[480,385],[585,385],[755,385],[865,385],[175,275],[290,275],[435,260],[525,260],[685,275],[800,275],[90,165],[170,165],[330,150],[410,150],[560,165],[650,165],[790,150],[870,150],[435,65],[525,65]],
      enemies: [['drill',380,385],['drill',735,385],['smog',200,250],['smog',690,250],['hawk',300,95],['hawk',780,90],['hawk',480,30]]
    },
    {
      name: 'Reactor Citadel', bg: 7, time: 58,
      platforms: [[0,500,960,40],[55,430,160,24],[250,390,170,24],[465,435,170,24],[690,390,215,24],[120,300,190,24],[370,300,180,24],[620,300,210,24],[55,190,160,24],[270,170,165,24],[490,190,165,24],[720,165,180,24],[380,90,210,24]],
      cores: [[95,390],[180,390],[290,350],[380,350],[505,395],[590,395],[735,350],[850,350],[170,260],[280,260],[415,260],[505,260],[665,260],[785,260],[95,150],[180,150],[310,130],[400,130],[535,150],[620,150],[760,125],[850,125],[425,50],[540,50]],
      enemies: [['smog',180,235],['smog',680,230],['drill',285,350],['drill',735,350],['hawk',160,90],['hawk',520,115],['hawk',820,75]]
    },
    {
      name: 'Cloudbreaker Tower', bg: 8, time: 56,
      platforms: [[0,500,960,40],[25,430,190,24],[260,430,190,24],[510,430,190,24],[755,430,180,24],[115,325,175,24],[380,325,200,24],[670,325,175,24],[25,220,190,24],[260,210,190,24],[510,220,190,24],[755,210,180,24],[165,115,180,24],[405,105,170,24],[650,115,180,24]],
      cores: [[70,390],[170,390],[305,390],[405,390],[555,390],[655,390],[800,390],[895,390],[155,285],[250,285],[425,285],[535,285],[710,285],[810,285],[70,180],[170,180],[305,170],[405,170],[555,180],[655,180],[800,170],[895,170],[205,75],[305,75],[445,65],[535,65],[690,75],[790,75]],
      enemies: [['drill',305,390],['drill',555,390],['drill',800,390],['smog',180,260],['smog',715,260],['hawk',120,120],['hawk',480,150],['hawk',830,110]]
    }
  ];

  class Player {
    constructor() { this.reset(100, 440); }
    reset(x, y) {
      this.x = x; this.y = y; this.prevY = y; this.w = 38; this.h = 52;
      this.vx = 0; this.vy = 0; this.onGround = false; this.coyote = 0; this.boosts = 0;
      this.facing = 1; this.inv = 1.1; this.anim = 0; this.squash = 0; this.boostFlash = 0; this.hurt = 0; this.trail = [];
    }
    get box() { return { x: this.x - this.w / 2 + 5, y: this.y - this.h / 2 + 4, w: this.w - 10, h: this.h - 6 }; }
    update(dt, platforms) {
      this.prevY = this.y;
      const axis = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      const accel = this.onGround ? 1800 : 1150;
      const target = axis * (keys.down ? 230 : 285);
      this.vx += clamp(target - this.vx, -accel * dt, accel * dt);
      if (axis) this.facing = axis;
      else this.vx *= Math.pow(.008, dt);

      if (this.onGround) { this.coyote = .11; this.boosts = 0; }
      else this.coyote -= dt;

      if (pressed.jump && (this.coyote > 0 || this.boosts < 2)) {
        const airBoost = this.coyote <= 0;
        if (airBoost) this.boosts++;
        this.vy = airBoost ? -365 : -450;
        this.onGround = false; this.coyote = 0; this.squash = .18;
        this.boostFlash = airBoost ? .24 : 0;
        game.burst(this.x, this.y + 22, airBoost ? 13 : 9, airBoost ? '#ffcf42' : '#38f1da');
        game.spawnVfx(this.x, this.y + 24, airBoost ? 2 : 1, airBoost ? .8 : .55, .36);
        audio.sfx(airBoost ? 'boost' : 'jump', airBoost ? .55 : .42);
      }
      const gravity = keys.jump && this.vy < 0 ? 680 : 1240;
      this.vy += gravity * dt;
      if (keys.down && !this.onGround) this.vy += 720 * dt;
      this.vy = Math.min(this.vy, 720);

      this.x += this.vx * dt;
      this.x = clamp(this.x, this.w / 2, W - this.w / 2);
      this.y += this.vy * dt;

      this.onGround = false;
      const b = this.box;
      for (const p of platforms) {
        const movingDown = this.vy >= 0;
        const prevBottom = this.prevY + this.h / 2 - 3;
        const nowBottom = this.y + this.h / 2 - 3;
        if (movingDown && b.x + b.w > p.x + 4 && b.x < p.x + p.w - 4 && prevBottom <= p.y + 5 && nowBottom >= p.y) {
          this.y = p.y - this.h / 2 + 3;
          this.vy = 0; this.onGround = true; this.squash = Math.min(.28, Math.abs(this.vy) / 1000);
        }
      }
      if (this.y > H + 90) game.damage(true);
      this.inv = Math.max(0, this.inv - dt);
      this.squash = Math.max(0, this.squash - dt);
      this.boostFlash = Math.max(0, this.boostFlash - dt);
      this.hurt = Math.max(0, this.hurt - dt);
      this.anim += dt * (this.onGround ? 6 + Math.abs(this.vx) / 80 : 8);
      if (!this.onGround && (Math.abs(this.vx) > 70 || this.vy < 0)) {
        this.trail.push({ x: this.x, y: this.y, life: .22 });
      }
      this.trail.forEach(t => t.life -= dt);
      this.trail = this.trail.filter(t => t.life > 0);
    }
    draw(ctx) {
      for (const t of this.trail) {
        ctx.save(); ctx.globalAlpha = t.life * 1.45; ctx.translate(t.x, t.y); ctx.scale(this.facing, 1);
        ctx.drawImage(assets.petroman, (8 + ((this.anim | 0) & 1)) * 96, 0, 96, 96, -38, -45, 76, 76); ctx.restore();
      }
      let frame = ((this.anim * .45 | 0) & 1); // idle breathing frames 0–1
      if (this.hurt > 0) frame = 10;
      else if (this.boostFlash > 0 || game.powerTimer > 0) frame = 8 + ((this.anim | 0) & 1);
      else if (!this.onGround) frame = this.vy < -20 ? 6 : 7;
      else if (Math.abs(this.vx) > 45) frame = 2 + ((this.anim | 0) % 4);
      if (this.inv > 0 && Math.floor(this.inv * 12) % 2 === 0 && this.hurt <= 0) return;
      const sy = this.squash > 0 ? .9 : 1;
      const sx = this.squash > 0 ? 1.1 : 1;
      if (game.powerTimer > 0) {
        ctx.save(); ctx.globalAlpha = .24 + Math.sin(game.t * 10) * .08; ctx.fillStyle = '#54ffe9';
        ctx.beginPath(); ctx.arc(this.x, this.y, 42, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      ctx.save(); ctx.translate(this.x, this.y); ctx.scale(this.facing * sx, sy);
      ctx.drawImage(assets.petroman, frame * 96, 0, 96, 96, -48, -52, 96, 96);
      ctx.restore();
    }
  }

  class Enemy {
    constructor(type, x, y, index) {
      this.type = type; this.x = x; this.y = y; this.startX = x; this.startY = y;
      this.w = type === 'hawk' ? 44 : 42; this.h = 40; this.vx = (index % 2 ? 1 : -1) * (type === 'drill' ? 82 : 62);
      this.vy = 0; this.t = Math.random() * 10; this.dead = false; this.row = type === 'smog' ? 0 : type === 'drill' ? 1 : 2;
    }
    get box() { return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h }; }
    update(dt, platforms) {
      this.t += dt;
      if (this.type === 'hawk') {
        this.x += this.vx * dt;
        this.y = this.startY + Math.sin(this.t * 2.2) * 34;
        if (this.x < 25 || this.x > W - 25) this.vx *= -1;
      } else {
        this.vy += 1000 * dt; this.x += this.vx * dt; this.y += this.vy * dt;
        let landed = false;
        for (const p of platforms) {
          if (this.x + this.w / 2 > p.x && this.x - this.w / 2 < p.x + p.w && this.y + this.h / 2 >= p.y && this.y + this.h / 2 - this.vy * dt <= p.y + 6 && this.vy >= 0) {
            this.y = p.y - this.h / 2; this.vy = 0; landed = true;
            const ahead = this.x + Math.sign(this.vx) * (this.w / 2 + 10);
            if (ahead < p.x || ahead > p.x + p.w) this.vx *= -1;
          }
        }
        if (!landed && this.y > H + 40) { this.x = this.startX; this.y = this.startY; this.vy = 0; }
        if (this.type === 'smog' && landed && Math.sin(this.t * 1.4) > .94) this.vy = -260;
        if (this.x < 18 || this.x > W - 18) this.vx *= -1;
      }
    }
    draw(ctx) {
      const frame = (this.t * 8 | 0) % 4;
      if (game.powerTimer > 0) {
        ctx.save(); ctx.globalAlpha = .32 + Math.sin(this.t * 12) * .12; ctx.fillStyle = '#50ffe8'; ctx.beginPath(); ctx.arc(this.x, this.y, 30, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      ctx.save(); ctx.translate(this.x, this.y); if (this.vx < 0) ctx.scale(-1,1);
      ctx.drawImage(assets.enemies, frame * 96, this.row * 96, 96, 96, -38, -38, 76, 76); ctx.restore();
    }
  }

  const game = {
    state: 'loading',
    t: 0, dt: 0, last: 0,
    player: new Player(), particles: [], texts: [], vfx: [], enemies: [], platforms: [], cores: [],
    levelIndex: 0, score: 0, highScore: Number(localStorage.getItem('petromanHighScore') || 0), lives: 3,
    chain: 0, maxChain: 0, ordered: 0, nextOrder: 0, timeLeft: 0, levelBonus: 0,
    power: null, powerTimer: 0, powerSpawned: false, shake: 0, flash: 0, clearTimer: 0,

    startRun() {
      this.score = 0; this.lives = 3; this.levelIndex = 0; this.maxChain = 0;
      this.loadLevel(0); this.state = 'playing';
      audio.playMusic('gameplay'); audio.sfx('start', .5);
    },
    loadLevel(index) {
      this.levelIndex = index;
      const l = levels[index];
      this.platforms = l.platforms.map(([x,y,w,h]) => ({x,y,w,h}));
      this.cores = l.cores.map(([x,y], i) => ({x,y,order:i,collected:false,t:Math.random()*10}));
      this.enemies = l.enemies.map((e,i) => new Enemy(e[0], e[1], e[2], i));
      this.player.reset(90, 450);
      this.chain = 0; this.ordered = 0; this.nextOrder = 0; this.timeLeft = l.time;
      this.power = null; this.powerTimer = 0; this.powerSpawned = false;
      this.particles.length = 0; this.texts.length = 0; this.vfx.length = 0; this.flash = .25;
      this.state = 'playing';
    },
    nextLevel() {
      if (this.levelIndex >= levels.length - 1) { this.victory(); return; }
      this.loadLevel(this.levelIndex + 1);
    },
    victory() {
      this.state = 'victory';
      this.highScore = Math.max(this.highScore, this.score);
      localStorage.setItem('petromanHighScore', this.highScore);
      audio.playMusic('victory'); audio.sfx('victory', .6);
      this.spawnVfx(W / 2, H / 2, 2, 5.5, 1.1);
    },
    togglePause() {
      if (this.state === 'playing') this.state = 'paused';
      else if (this.state === 'paused') this.state = 'playing';
    },
    burst(x, y, count = 12, color = null) {
      for (let i=0;i<count;i++) this.particles.push(new Particle(x,y,{color: color || undefined}));
    },
    spawnVfx(x, y, row = 0, scale = 1, duration = .48) {
      this.vfx.push(new SpriteVfx(x, y, row, scale, duration));
    },
    addScore(n, x, y, text = null, color = '#fff6bd') {
      this.score += n;
      if (this.score > this.highScore) this.highScore = this.score;
      this.texts.push(new FloatingText(x,y,text || `+${n}`,color,text && text.length > 8 ? 18 : 22));
    },
    damage(fell = false) {
      if (this.player.inv > 0 || this.state !== 'playing') return;
      this.lives--;
      this.shake = .65; this.flash = .35; this.chain = 0;
      audio.sfx('hit', .65);
      this.burst(this.player.x, this.player.y, 22, '#ff6848');
      this.spawnVfx(this.player.x, this.player.y, 0, 1.55, .52);
      this.player.hurt = .38;
      if (this.lives <= 0) {
        this.state = 'gameOver';
        this.highScore = Math.max(this.highScore, this.score);
        localStorage.setItem('petromanHighScore', this.highScore);
        audio.playMusic('defeat'); audio.sfx('defeat', .55);
      } else {
        this.player.reset(90, 450);
        this.player.hurt = .32;
        if (fell) this.player.inv = 1.4;
      }
    },
    collectCore(core) {
      core.collected = true;
      const correct = core.order === this.nextOrder;
      if (correct) {
        this.chain++;
        this.ordered++;
        const bonus = 150 + this.chain * 40;
        this.addScore(bonus, core.x, core.y - 12, this.chain >= 3 ? `CHAIN x${this.chain}` : `+${bonus}`, '#fff083');
      } else {
        this.chain = 0;
        this.addScore(100, core.x, core.y - 12, '+100', '#a8fff3');
      }
      this.maxChain = Math.max(this.maxChain, this.chain);
      const next = this.cores.find(c => !c.collected);
      this.nextOrder = next ? next.order : -1;
      this.burst(core.x, core.y, correct ? 18 : 10, correct ? '#ffbf35' : '#38f1da');
      this.spawnVfx(core.x, core.y, 1, correct ? 1.2 : .85, .38);
      audio.sfx(correct && this.chain >= 3 ? 'chain' : 'collect', correct ? .6 : .45);
      const collected = this.cores.filter(c => c.collected).length;
      if (!this.powerSpawned && collected >= Math.ceil(this.cores.length * .48)) {
        this.powerSpawned = true;
        const p = this.platforms[Math.min(this.platforms.length - 1, 1 + (this.levelIndex * 2) % (this.platforms.length - 1))];
        this.power = { x: p.x + p.w / 2, y: p.y - 32, t: 0 };
        this.texts.push(new FloatingText(this.power.x, this.power.y - 25, 'PURIFIER READY!', '#49ffe5', 19));
      }
      if (collected === this.cores.length) this.finishLevel();
    },
    finishLevel() {
      this.levelBonus = Math.max(0, Math.floor(this.timeLeft) * 75) + this.ordered * 60 + this.lives * 500;
      this.score += this.levelBonus;
      this.state = 'levelClear'; this.clearTimer = 0;
      audio.sfx('clear', .7);
      this.burst(W/2, H/2, 60);
      this.spawnVfx(W/2, H/2, 2, 4.4, .9);
    },
    collectPower() {
      this.power = null; this.powerTimer = 7.5;
      this.addScore(500, this.player.x, this.player.y - 35, 'PURIFIER MODE!', '#56ffe9');
      this.shake = .35; this.flash = .5;
      this.burst(this.player.x, this.player.y, 35, '#38f1da');
      this.spawnVfx(this.player.x, this.player.y, 2, 2.1, .62);
      audio.sfx('power', .7);
    },
    update(dt) {
      this.t += dt;
      if (pressed.pause) this.togglePause();
      pressed.pause = false;
      if (this.state !== 'playing') {
        if (this.state === 'levelClear') this.clearTimer += dt;
        this.particles.forEach(p => p.update(dt)); this.particles = this.particles.filter(p => p.life > 0);
        this.texts.forEach(t => t.update(dt)); this.texts = this.texts.filter(t => t.life > 0);
        this.vfx.forEach(v => v.update(dt)); this.vfx = this.vfx.filter(v => !v.dead);
        pressed.jump = false;
        return;
      }
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) { this.timeLeft = 0; this.damage(); if (this.state === 'playing') this.timeLeft = 20; }
      this.player.update(dt, this.platforms);
      this.enemies.forEach(e => e.update(dt, this.platforms));
      this.cores.forEach(c => c.t += dt);
      if (this.power) this.power.t += dt;
      if (this.powerTimer > 0) this.powerTimer = Math.max(0, this.powerTimer - dt);
      this.shake = Math.max(0, this.shake - dt * 2.5);
      this.flash = Math.max(0, this.flash - dt * 2.7);

      const pb = this.player.box;
      for (const c of this.cores) {
        if (c.collected) continue;
        const dx = this.player.x - c.x, dy = this.player.y - c.y;
        if (dx*dx + dy*dy < 34*34) this.collectCore(c);
      }
      if (this.power) {
        const dx = this.player.x - this.power.x, dy = this.player.y - this.power.y;
        if (dx*dx + dy*dy < 38*38) this.collectPower();
      }
      for (const e of this.enemies) {
        if (e.dead || !rectsOverlap(pb, e.box)) continue;
        if (this.powerTimer > 0) {
          e.dead = true;
          this.addScore(750, e.x, e.y, 'CLEAN +750', '#58ffe8');
          this.burst(e.x,e.y,22,'#38f1da');
          this.spawnVfx(e.x, e.y, 2, 1.35, .46);
          audio.sfx('clean', .42);
        } else this.damage();
      }
      this.enemies = this.enemies.filter(e => !e.dead);
      this.particles.forEach(p => p.update(dt)); this.particles = this.particles.filter(p => p.life > 0);
      this.texts.forEach(t => t.update(dt)); this.texts = this.texts.filter(t => t.life > 0);
      this.vfx.forEach(v => v.update(dt)); this.vfx = this.vfx.filter(v => !v.dead);
      if (Math.random() < dt * (this.powerTimer > 0 ? 14 : 3)) {
        this.particles.push(new Particle(rand(0,W), H+5, {vy:rand(-80,-25),vx:rand(-8,8),gravity:-8,life:rand(1,2),size:rand(1,3),color:this.powerTimer>0?'#38f1da':'#ffffff',shape:'circle'}));
      }
      pressed.jump = false;
    },

    drawBackground(ctx) {
      const l = levels[this.levelIndex] || levels[0];
      const bg = assets[`bg${l.bg}`];
      ctx.drawImage(bg, 0, 0, W, H);
      const drift = (this.t * 14) % W;
      ctx.save(); ctx.globalAlpha = .10; ctx.strokeStyle = '#71fff0'; ctx.lineWidth = 1;
      for (let x = -W + drift; x < W * 2; x += 80) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x-180,H); ctx.stroke(); }
      ctx.restore();
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(3,11,36,.04)'); g.addColorStop(1, 'rgba(3,9,26,.42)');
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    },
    drawPlatforms(ctx) {
      const tileIndex = this.levelIndex % 8;
      const sx = (tileIndex % 4) * 128;
      const sy = Math.floor(tileIndex / 4) * 32;
      for (const p of this.platforms) {
        for (let dx = 0; dx < p.w; dx += 128) {
          const dw = Math.min(128, p.w - dx);
          ctx.drawImage(assets.platforms, sx, sy, dw, 32, p.x + dx, p.y, dw, p.h);
        }
        ctx.save(); ctx.globalAlpha = .20; ctx.fillStyle = '#effffb'; ctx.fillRect(p.x + 10, p.y + 4, Math.max(0, p.w - 20), 2); ctx.restore();
      }
    },
    drawCores(ctx) {
      for (const c of this.cores) {
        if (c.collected) continue;
        const active = c.order === this.nextOrder;
        const pulse = 1 + Math.sin(c.t * 5) * .09;
        if (active) {
          ctx.save(); ctx.globalAlpha = .18 + Math.sin(c.t*6)*.05; ctx.fillStyle = '#fff17a'; ctx.beginPath(); ctx.arc(c.x,c.y,35+Math.sin(c.t*4)*5,0,Math.PI*2); ctx.fill(); ctx.restore();
          ctx.save(); ctx.textAlign='center'; ctx.font='900 11px system-ui'; ctx.fillStyle='#fffbd1'; ctx.fillText('NEXT',c.x,c.y-30); ctx.restore();
        }
        const frame = active ? 0 : 1 + (c.order % 3);
        ctx.save(); ctx.translate(c.x,c.y); ctx.scale(pulse,pulse); ctx.drawImage(assets.pickups,frame*64,0,64,64,-28,-28,56,56); ctx.restore();
      }
      if (this.power) {
        const p = this.power; const pulse=1+Math.sin(p.t*7)*.1;
        ctx.save(); ctx.translate(p.x,p.y); ctx.scale(pulse,pulse); ctx.drawImage(assets.pickups,4*64,0,64,64,-32,-32,64,64); ctx.restore();
      }
    },
    drawHud(ctx) {
      ctx.save();
      ctx.fillStyle = 'rgba(4,13,39,.74)'; ctx.strokeStyle = 'rgba(83,255,232,.42)'; ctx.lineWidth=2;
      roundRect(ctx,14,14,360,70,20); ctx.fill(); ctx.stroke();
      ctx.textBaseline='middle';
      ctx.drawImage(assets.ui,0,0,64,64,25,24,25,25);
      ctx.font='900 15px system-ui'; ctx.fillStyle='#83fff0'; ctx.fillText('SCORE',57,34);
      ctx.font='900 28px system-ui'; ctx.fillStyle='#fff7ce'; ctx.fillText(String(this.score).padStart(7,'0'),32,65);
      ctx.drawImage(assets.ui,64,0,64,64,194,24,25,25);
      ctx.font='900 14px system-ui'; ctx.fillStyle='#9ad9dc'; ctx.fillText('BEST',226,34);
      ctx.font='900 20px system-ui'; ctx.fillStyle='#ffd15a'; ctx.fillText(String(this.highScore).padStart(7,'0'),203,64);

      roundRect(ctx,390,14,280,70,20); ctx.fill(); ctx.stroke();
      ctx.drawImage(assets.ui,128,0,64,64,404,22,27,27);
      ctx.font='900 13px system-ui'; ctx.fillStyle='#90fff0'; ctx.fillText(`STAGE ${this.levelIndex+1}/${levels.length}`,438,33);
      ctx.font='900 18px system-ui'; ctx.fillStyle='#fff'; ctx.fillText(levels[this.levelIndex].name,410,61);

      roundRect(ctx,686,14,260,70,20); ctx.fill(); ctx.stroke();
      ctx.drawImage(assets.ui,192,0,64,64,699,22,27,27);
      ctx.font='900 13px system-ui'; ctx.fillStyle='#90fff0'; ctx.fillText('TIME',733,33);
      ctx.font='900 27px system-ui'; ctx.fillStyle=this.timeLeft<12?'#ff8068':'#fff7ce'; ctx.fillText(Math.ceil(this.timeLeft).toString().padStart(2,'0'),705,62);
      ctx.drawImage(assets.ui,256,0,64,64,790,22,27,27);
      ctx.font='900 13px system-ui'; ctx.fillStyle='#90fff0'; ctx.fillText('LIVES',824,33);
      for(let i=0;i<this.lives;i++) ctx.drawImage(assets.pickups,5*64,0,64,64,808+i*29,45,26,26);
      if (this.chain > 1) {
        roundRect(ctx,W/2-100,94,200,38,18); ctx.fillStyle='rgba(206,66,41,.78)'; ctx.fill(); ctx.strokeStyle='#ffd75f'; ctx.stroke();
        ctx.font='900 18px system-ui'; ctx.fillStyle='#fffbd1'; ctx.textAlign='center'; ctx.fillText(`SPARK CHAIN ×${this.chain}`,W/2,114);
      }
      if (this.powerTimer > 0) {
        const ww=300, x=W/2-ww/2, y=H-34;
        ctx.fillStyle='rgba(3,16,38,.75)'; roundRect(ctx,x,y,ww,18,9); ctx.fill();
        ctx.fillStyle='#42f0d9'; roundRect(ctx,x+3,y+3,(ww-6)*(this.powerTimer/7.5),12,6); ctx.fill();
        ctx.font='900 11px system-ui'; ctx.fillStyle='#eafffb'; ctx.textAlign='center'; ctx.fillText('PURIFIER MODE',W/2,y-5);
      }
      ctx.restore();
    },
    drawTitle(ctx) {
      ctx.drawImage(assets.titleScreen,0,0,W,H);
      const shade = ctx.createLinearGradient(0,0,0,H); shade.addColorStop(.55,'rgba(3,8,26,.02)'); shade.addColorStop(1,'rgba(2,6,20,.88)'); ctx.fillStyle=shade; ctx.fillRect(0,0,W,H);
      const pulse=1+Math.sin(this.t*3)*.025;
      ctx.save(); ctx.translate(W/2,405); ctx.scale(pulse,pulse); ctx.fillStyle='rgba(11,27,65,.9)'; ctx.strokeStyle='#56ffe7'; ctx.lineWidth=3; roundRect(ctx,-155,-35,310,70,28); ctx.fill(); ctx.stroke();
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 24px system-ui'; ctx.fillStyle='#fff6c3'; ctx.fillText('PLAY NOW',0,-5); ctx.font='700 12px system-ui'; ctx.fillStyle='#9fffee'; ctx.fillText('ENTER • SPACE • TAP',0,19); ctx.restore();
      ctx.save(); ctx.textAlign='center'; ctx.fillStyle='#e6fffa'; ctx.font='800 15px system-ui'; ctx.fillText('Collect the glowing cores in order. Boost twice. Purify every threat.',W/2,474); ctx.fillStyle='#9ecfd1'; ctx.font='700 12px system-ui'; ctx.fillText(`HIGH SCORE ${String(this.highScore).padStart(7,'0')}`,W/2,506); ctx.restore();
    },
    drawOverlay(ctx) {
      if (this.state === 'paused') this.panel(ctx,'PAUSED','Tap, press P or Escape to continue','REACTOR HOLD');
      if (this.state === 'gameOver') this.endScreen(ctx, false);
      if (this.state === 'victory') this.endScreen(ctx, true);
      if (this.state === 'levelClear') {
        const last=this.levelIndex===levels.length-1;
        this.panel(ctx,last?'GRAND REACTOR CLEAN!':'SECTOR CLEAN!',`Time, sequence and life bonus +${this.levelBonus.toLocaleString()}`,last?'TAP FOR FINALE':'TAP FOR NEXT STAGE');
      }
    },
    endScreen(ctx, won) {
      ctx.drawImage(won ? assets.victoryScreen : assets.defeatScreen, 0, 0, W, H);
      const g=ctx.createLinearGradient(0,330,0,H); g.addColorStop(0,'rgba(3,8,25,0)'); g.addColorStop(1,'rgba(3,8,25,.94)'); ctx.fillStyle=g; ctx.fillRect(0,280,W,260);
      ctx.save();
      ctx.fillStyle='rgba(5,17,47,.91)'; ctx.strokeStyle=won?'#55ffe5':'#ff745d'; ctx.lineWidth=3;
      roundRect(ctx,245,368,470,105,26); ctx.fill(); ctx.stroke();
      ctx.textAlign='center'; ctx.fillStyle='#9fffee'; ctx.font='900 13px system-ui'; ctx.fillText(won?'MISSION SCORE':'FINAL SCORE',W/2,394);
      ctx.fillStyle='#fff3a9'; ctx.font='900 36px system-ui'; ctx.fillText(this.score.toLocaleString(),W/2,430);
      ctx.fillStyle='#d8fffa'; ctx.font='700 13px system-ui'; ctx.fillText(`BEST ${this.highScore.toLocaleString()}  •  MAX CHAIN ×${Math.max(1,this.maxChain)}`,W/2,456);
      ctx.fillStyle=won?'#ef433f':'#9e2446'; ctx.strokeStyle='#ffd568'; ctx.lineWidth=2; roundRect(ctx,330,483,300,44,20); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#fffbd5'; ctx.font='900 15px system-ui'; ctx.fillText(won?'PLAY AGAIN':'RETRY MISSION',W/2,510); ctx.restore();
    },
    panel(ctx,title,sub,action) {
      ctx.save(); ctx.fillStyle='rgba(3,8,25,.68)'; ctx.fillRect(0,0,W,H);
      ctx.translate(W/2,H/2); const pulse=1+Math.sin(this.t*3)*.012; ctx.scale(pulse,pulse);
      ctx.fillStyle='rgba(10,27,65,.96)'; ctx.strokeStyle='#52f5dd'; ctx.lineWidth=4; roundRect(ctx,-285,-130,570,260,36); ctx.fill(); ctx.stroke();
      ctx.textAlign='center'; ctx.fillStyle='#ffbd36'; ctx.font='900 43px system-ui'; ctx.fillText(title,0,-52);
      ctx.fillStyle='#eafffb'; ctx.font='700 17px system-ui'; wrapText(ctx,sub,0,-4,470,26);
      ctx.fillStyle='#f45b32'; ctx.strokeStyle='#ffd568'; ctx.lineWidth=2; roundRect(ctx,-150,60,300,54,22); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#fffbd5'; ctx.font='900 16px system-ui'; ctx.fillText(action,0,94); ctx.restore();
    },
    render() {
      resizeCanvas();
      ctx.setTransform(1,0,0,1,0,0);
      ctx.fillStyle = '#050b1c';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      const scale = Math.min(canvas.width/W, canvas.height/H);
      const ox = (canvas.width - W*scale)/2;
      const oy = (canvas.height - H*scale)/2;
      ctx.setTransform(scale,0,0,scale,ox,oy);
      ctx.imageSmoothingEnabled=true;
      ctx.clearRect(0,0,W,H);
      if (this.state === 'title' || this.state === 'loading') { this.drawTitle(ctx); return; }
      ctx.save();
      if (this.shake>0) ctx.translate(rand(-6,6)*this.shake,rand(-5,5)*this.shake);
      this.drawBackground(ctx); this.drawPlatforms(ctx); this.drawCores(ctx);
      this.enemies.forEach(e=>e.draw(ctx));
      this.particles.forEach(p=>p.draw(ctx));
      this.vfx.forEach(v=>v.draw(ctx));
      this.player.draw(ctx);
      this.texts.forEach(t=>t.draw(ctx));
      ctx.restore();
      this.drawHud(ctx);
      if (this.flash>0) { ctx.fillStyle=`rgba(255,255,255,${this.flash*.6})`; ctx.fillRect(0,0,W,H); }
      this.drawOverlay(ctx);
    },
    loop(now) {
      if (!this.last) this.last=now;
      let dt=Math.min(.033,(now-this.last)/1000); this.last=now;
      this.update(dt); this.render();
      requestAnimationFrame(t=>this.loop(t));
    }
  };

  function roundRect(c,x,y,w,h,r) {
    r=Math.min(r,w/2,h/2); c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath();
  }
  function wrapText(c,text,x,y,maxWidth,lineHeight) {
    const words=text.split(' '); let line='', lines=[];
    for (const word of words) { const test=line+word+' '; if(c.measureText(test).width>maxWidth && line){lines.push(line.trim());line=word+' ';} else line=test; }
    lines.push(line.trim());
    lines.forEach((l,i)=>c.fillText(l,x,y+i*lineHeight));
  }

  // Sponsor-funded boost. On game over it revives the run in place; mid-run it
  // tops up a life, grants Purifier Mode and a stretch of invulnerability.
  window.MMARewardBridge?.({
    slug: 'petroman-reactor-rush',
    label: 'Reactor boost',
    onGrant() {
      if (game.state === 'gameOver') {
        game.lives = 2;
        game.chain = 0;
        game.player.reset(90, 450);
        game.player.inv = 2.4;
        game.state = 'playing';
        audio.playMusic('gameplay');
      } else {
        game.lives = Math.min(9, game.lives + 1);
        game.player.inv = Math.max(game.player.inv, 6);
      }
      game.powerTimer = Math.max(game.powerTimer, 10);
      game.power = null;
      game.flash = .5;
      game.burst(game.player.x, game.player.y, 30, '#7ef7ff');
      game.spawnVfx(game.player.x, game.player.y, 2, 2, .7);
      game.addScore(500, game.player.x, game.player.y - 40, 'SPONSOR BOOST!', '#7ef7ff');
      audio.sfx('start', .6);
    },
  });

  loadAssets().then(() => {
    game.state='title'; audio.playMusic('title');
    setTimeout(()=>loading.classList.add('hidden'),350);
    resizeCanvas();
    window.__PETROMAN_GAME_READY = true;
    requestAnimationFrame(t=>game.loop(t));
  }).catch(err => {
    console.error(err); loadText.textContent='Asset load failed. Refresh to try again.';
  });
})();
