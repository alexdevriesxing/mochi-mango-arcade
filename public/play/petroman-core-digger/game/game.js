(() => {
'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = true;
const loading = document.getElementById('loading');
const barFill = document.getElementById('barFill');
const loadText = document.getElementById('loadText');
const muteBtn = document.getElementById('mute');
const pauseBtn = document.getElementById('pause');

const W = 1280;
const H = 720;
const OX = 64;
const OY = 106;
const CELL = 32;
const COLS = 36;
const ROWS = 18;
const BOARD_W = COLS * CELL;
const BOARD_H = ROWS * CELL;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const keyOf = (x, y) => `${x},${y}`;
const manhattan = (ax, ay, bx, by) => Math.abs(ax - bx) + Math.abs(ay - by);
const DIRS = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 }
};
const OPPOSITE = { left: 'right', right: 'left', up: 'down', down: 'up' };

const assetPaths = {
  petroman: 'assets/sprites/petroman-spritesheet.png',
  enemies: 'assets/sprites/enemy-spritesheet.png',
  objects: 'assets/sprites/object-atlas.png',
  dirt: 'assets/tiles/dirt-tiles.png',
  tunnel: 'assets/tiles/tunnel-tiles.png',
  wall: 'assets/tiles/wall-tiles.png',
  vfx: 'assets/vfx/vfx-spritesheet.png',
  hud: 'assets/ui/hud-frame.png',
  logo: 'assets/ui/logo.png',
  title: 'assets/ui/title-screen.png',
  victory: 'assets/ui/victory-screen.png',
  defeat: 'assets/ui/defeat-screen.png',
  clear: 'assets/ui/level-clear.png',
  pause: 'assets/ui/pause.png'
};
for (let i = 1; i <= 4; i++) assetPaths[`bg${i}`] = `assets/backgrounds/background-${i}.png`;
const A = {};

const audio = {
  muted: false,
  unlocked: false,
  current: null,
  currentName: '',
  tracks: {
    title: new Audio('assets/audio/music-title.wav'),
    game: new Audio('assets/audio/music-gameplay.wav'),
    victory: new Audio('assets/audio/music-victory.wav'),
    defeat: new Audio('assets/audio/music-defeat.wav')
  },
  sfxPaths: {
    start: 'assets/audio/start.wav',
    dig: 'assets/audio/dig.wav',
    collect: 'assets/audio/collect.wav',
    hit: 'assets/audio/hit.wav',
    clear: 'assets/audio/clear.wav',
    victory: 'assets/audio/victory.wav',
    defeat: 'assets/audio/defeat.wav',
    life: 'assets/audio/extra-life.wav',
    shoot: 'assets/audio/orb-shoot.wav',
    bounce: 'assets/audio/orb-bounce.wav',
    pop: 'assets/audio/enemy-pop.wav',
    drop: 'assets/audio/boulder-drop.wav'
  },
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    this.music(game.state === 'title' ? 'title' : 'game');
  },
  music(name) {
    if (!this.unlocked) return;
    if (this.currentName === name && this.current && !this.current.paused) return;
    if (this.current) {
      this.current.pause();
      this.current.currentTime = 0;
    }
    const track = this.tracks[name];
    if (!track) return;
    this.current = track;
    this.currentName = name;
    track.loop = name === 'title' || name === 'game';
    track.volume = name === 'game' ? 0.24 : 0.32;
    track.muted = this.muted;
    track.play().catch(() => {});
  },
  sfx(name, volume = 0.55) {
    if (!this.unlocked || this.muted || !this.sfxPaths[name]) return;
    const sound = new Audio(this.sfxPaths[name]);
    sound.volume = volume;
    sound.play().catch(() => {});
  },
  toggle() {
    this.muted = !this.muted;
    Object.values(this.tracks).forEach(track => { track.muted = this.muted; });
    muteBtn.textContent = this.muted ? 'SOUND OFF' : 'SOUND ON';
  }
};

function loadAssets() {
  const entries = Object.entries(assetPaths);
  let loaded = 0;
  return Promise.all(entries.map(([name, src]) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      A[name] = image;
      loaded += 1;
      barFill.style.width = `${(loaded / entries.length) * 100}%`;
      loadText.textContent = `Loading hand-drawn production assets ${loaded}/${entries.length}`;
      resolve();
    };
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  })));
}

const keys = { left: false, right: false, up: false, down: false, fire: false };
let requestedDirection = 'right';
let pressedFire = false;
let pressedPause = false;
const keyMap = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  KeyX: 'fire', KeyK: 'fire', Space: 'fire'
};

addEventListener('keydown', event => {
  if (keyMap[event.code]) {
    const action = keyMap[event.code];
    if (action === 'fire' && !keys.fire) pressedFire = true;
    if (action !== 'fire') requestedDirection = action;
    keys[action] = true;
    event.preventDefault();
  }
  if (event.code === 'KeyP' || event.code === 'Escape') {
    pressedPause = true;
    event.preventDefault();
  }
  if ((event.code === 'Enter' || event.code === 'Space') && ['title', 'gameOver', 'victory'].includes(game.state)) {
    audio.unlock();
    game.start();
    event.preventDefault();
  } else if ((event.code === 'Enter' || event.code === 'Space') && game.state === 'levelClear') {
    game.next();
    event.preventDefault();
  }
});
addEventListener('keyup', event => {
  if (keyMap[event.code]) keys[keyMap[event.code]] = false;
});

document.querySelectorAll('[data-key]').forEach(button => {
  const action = button.dataset.key;
  const down = event => {
    event.preventDefault();
    audio.unlock();
    if (action === 'fire' && !keys.fire) pressedFire = true;
    if (action !== 'fire') requestedDirection = action;
    keys[action] = true;
    button.classList.add('active');
  };
  const up = event => {
    event.preventDefault();
    keys[action] = false;
    button.classList.remove('active');
  };
  button.addEventListener('pointerdown', down);
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(name => button.addEventListener(name, up));
});

muteBtn.onclick = event => {
  event.stopPropagation();
  audio.unlock();
  audio.toggle();
};
pauseBtn.onclick = event => {
  event.stopPropagation();
  audio.unlock();
  game.togglePause();
};
canvas.addEventListener('pointerdown', event => {
  audio.unlock();
  if (['title', 'gameOver', 'victory'].includes(game.state)) game.start();
  else if (game.state === 'levelClear') game.next();
  else if (game.state === 'paused') game.togglePause();
  event.preventDefault();
});

function frame(image, index, frameWidth, frameHeight, x, y, width = frameWidth, height = frameHeight, row = 0) {
  ctx.drawImage(image, index * frameWidth, row * frameHeight, frameWidth, frameHeight, x, y, width, height);
}
function cellCenter(x, y) {
  return { x: OX + x * CELL + CELL / 2, y: OY + y * CELL + CELL / 2 };
}
function inside(x, y) {
  return x >= 1 && y >= 1 && x < COLS - 1 && y < ROWS - 1;
}
function heldDirection() {
  if (keys[requestedDirection]) return requestedDirection;
  for (const direction of ['left', 'right', 'up', 'down']) if (keys[direction]) return direction;
  return null;
}

// Large, deliberately looped playfields. Every stage has multiple escape routes,
// readable boulder traps and separated core clusters instead of a cramped maze.
const levels = [
  {
    name: 'Core Lab Access', theme: 2, activeCap: 3,
    enemies: ['smog', 'smog', 'drill', 'smog', 'patrol', 'smog'],
    boulders: [[10, 4], [25, 4], [10, 11], [25, 11]],
    carve: [[1,1,34,1],[17,1,2,16],[2,8,32,1],[5,3,1,12],[30,3,1,12],[5,3,13,1],[18,3,13,1],[5,13,13,1],[18,13,13,1]],
    groups: [[8,5,4,2],[23,5,4,2],[8,10,4,2],[23,10,4,2]]
  },
  {
    name: 'Refinery Underpass', theme: 1, activeCap: 3,
    enemies: ['smog','smog','drill','patrol','smog','drill','patrol'],
    boulders: [[8,3],[18,6],[27,3],[12,12],[24,12]],
    carve: [[1,1,34,1],[1,16,34,1],[3,5,30,1],[3,11,30,1],[3,3,1,11],[12,1,1,15],[23,1,1,15],[32,3,1,11],[17,5,2,7]],
    groups: [[6,2,4,2],[15,2,4,2],[26,2,4,2],[6,7,4,2],[26,7,4,2]]
  },
  {
    name: 'Neon Service Tunnels', theme: 0, activeCap: 4,
    enemies: ['smog','drill','patrol','drone','smog','drill','drone'],
    boulders: [[6,5],[15,3],[21,12],[29,5]],
    carve: [[1,1,34,1],[2,6,32,1],[2,12,32,1],[2,1,1,15],[33,1,1,15],[8,1,1,12],[18,6,1,10],[27,1,1,12],[8,4,20,1],[8,10,20,1]],
    groups: [[4,3,3,2],[11,7,4,2],[21,7,4,2],[29,3,3,2],[4,13,3,2],[29,13,3,2]]
  },
  {
    name: 'Pressure Grid', theme: 1, activeCap: 4,
    enemies: ['smog','smog','drill','patrol','drone','smog','patrol','drill'],
    boulders: [[7,4],[14,7],[21,4],[28,7],[18,13]],
    carve: [[1,1,34,1],[1,16,34,1],[4,4,28,1],[4,8,28,1],[4,12,28,1],[4,4,1,9],[11,1,1,15],[18,1,1,15],[25,1,1,15],[31,4,1,9]],
    groups: [[6,2,3,2],[13,5,3,2],[20,2,3,2],[27,5,3,2],[6,9,3,2],[20,9,3,2]]
  },
  {
    name: 'Blue Utility Vault', theme: 2, activeCap: 4,
    enemies: ['drill','drill','patrol','drone','smog','patrol','drone','smog'],
    boulders: [[5,4],[10,10],[18,5],[26,10],[31,4]],
    carve: [[1,1,34,1],[1,16,34,1],[1,8,34,1],[6,1,1,15],[14,1,1,15],[22,1,1,15],[30,1,1,15],[6,4,24,1],[6,12,24,1]],
    groups: [[2,3,3,2],[9,5,3,2],[17,2,3,2],[25,5,3,2],[31,3,3,2],[9,13,3,2],[25,13,3,2]]
  },
  {
    name: 'Mango Fuel Caverns', theme: 3, activeCap: 5,
    enemies: ['smog','smog','drill','patrol','drone','drone','smog','drill','patrol'],
    boulders: [[6,3],[12,7],[18,11],[24,7],[30,3]],
    carve: [[1,1,34,1],[2,5,32,1],[2,10,32,1],[1,16,34,1],[2,1,1,15],[33,1,1,15],[9,1,1,15],[18,1,1,15],[27,1,1,15]],
    groups: [[4,2,3,2],[12,2,4,2],[21,2,4,2],[29,2,3,2],[4,12,3,2],[12,12,4,2],[21,12,4,2],[29,12,3,2]]
  },
  {
    name: 'Purifier Reservoir', theme: 2, activeCap: 5,
    enemies: ['drill','drill','patrol','patrol','drone','smog','smog','drone','patrol'],
    boulders: [[5,5],[11,3],[18,7],[25,3],[31,5]],
    carve: [[1,1,34,1],[1,16,34,1],[3,4,30,1],[3,8,30,1],[3,12,30,1],[3,4,1,9],[10,1,1,15],[18,1,1,15],[26,1,1,15],[32,4,1,9]],
    groups: [[5,2,3,2],[12,5,4,2],[21,5,4,2],[28,2,3,2],[5,13,3,2],[12,9,4,2],[21,9,4,2],[28,13,3,2]]
  },
  {
    name: 'Smogworks Sublevel', theme: 0, activeCap: 5,
    enemies: ['smog','smog','drill','drill','patrol','drone','drone','smog','patrol','drill'],
    boulders: [[6,4],[12,4],[18,4],[24,4],[30,4],[18,12]],
    carve: [[1,1,34,1],[1,16,34,1],[2,7,32,1],[2,13,32,1],[5,1,1,15],[11,1,1,15],[18,1,1,15],[25,1,1,15],[31,1,1,15],[5,4,26,1],[5,10,26,1]],
    groups: [[2,3,2,2],[7,5,3,2],[13,2,3,2],[20,2,3,2],[27,5,3,2],[32,3,2,2],[7,11,3,2],[27,11,3,2]]
  },
  {
    name: 'Reactor Root Network', theme: 3, activeCap: 6,
    enemies: ['drill','drill','patrol','patrol','drone','drone','smog','smog','drill','patrol'],
    boulders: [[5,3],[10,11],[15,3],[21,11],[26,3],[31,11]],
    carve: [[1,1,34,1],[1,16,34,1],[3,4,30,1],[3,12,30,1],[3,4,1,9],[8,4,1,9],[14,1,1,15],[21,1,1,15],[27,4,1,9],[32,4,1,9],[8,8,20,1]],
    groups: [[5,2,2,2],[10,5,3,2],[16,2,3,2],[23,2,3,2],[29,5,2,2],[10,9,3,2],[16,13,3,2],[23,13,3,2]]
  },
  {
    name: 'Deep Core Junction', theme: 2, activeCap: 6,
    enemies: ['smog','drill','drill','patrol','patrol','drone','drone','drone','smog','patrol','drill'],
    boulders: [[4,5],[9,3],[14,10],[21,10],[26,3],[31,5]],
    carve: [[1,1,34,1],[1,16,34,1],[2,5,32,1],[2,10,32,1],[2,1,1,15],[33,1,1,15],[7,1,1,15],[13,1,1,15],[18,1,1,15],[23,1,1,15],[29,1,1,15]],
    groups: [[4,2,2,2],[9,6,3,2],[14,2,3,2],[20,6,3,2],[25,2,3,2],[30,6,2,2],[9,12,3,2],[20,12,3,2],[25,12,3,2]]
  },
  {
    name: 'Petro Mantle', theme: 1, activeCap: 6,
    enemies: ['smog','smog','drill','drill','patrol','patrol','drone','drone','smog','patrol','drill'],
    boulders: [[5,4],[10,8],[15,4],[21,8],[26,4],[31,8]],
    carve: [[1,1,34,1],[1,16,34,1],[3,4,30,1],[3,8,30,1],[3,12,30,1],[3,4,1,9],[9,1,1,15],[15,4,1,9],[21,1,1,15],[27,4,1,9],[32,4,1,9]],
    groups: [[5,2,3,2],[11,5,3,2],[17,2,3,2],[23,5,3,2],[29,2,2,2],[5,13,3,2],[11,9,3,2],[23,9,3,2],[29,13,2,2]]
  },
  {
    name: 'Smog King Core', theme: 0, activeCap: 6,
    enemies: ['boss','drill','drill','patrol','patrol','drone','drone','smog','smog','drill','patrol','drone'],
    boulders: [[5,3],[10,7],[15,3],[21,7],[26,3],[31,7],[18,13]],
    carve: [[1,1,34,1],[1,16,34,1],[2,5,32,1],[2,9,32,1],[2,13,32,1],[2,1,1,15],[33,1,1,15],[7,1,1,15],[13,1,1,15],[18,1,1,15],[23,1,1,15],[29,1,1,15]],
    groups: [[4,2,2,2],[9,3,3,2],[14,6,3,2],[20,6,3,2],[25,3,3,2],[30,2,2,2],[4,10,2,2],[9,11,3,2],[25,11,3,2],[30,10,2,2]]
  }
];

class Player {
  constructor() {
    this.gx = 2;
    this.gy = 1;
    const point = cellCenter(this.gx, this.gy);
    this.x = point.x;
    this.y = point.y;
    this.tx = this.x;
    this.ty = this.y;
    this.moving = false;
    this.dir = 'right';
    this.facing = 'right';
    this.anim = 0;
    this.invulnerable = 1.8;
    this.fireFlash = 0;
  }
  update(dt) {
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.fireFlash = Math.max(0, this.fireFlash - dt);
    this.anim += dt;
    if (this.moving) {
      const dx = this.tx - this.x;
      const dy = this.ty - this.y;
      const distance = Math.hypot(dx, dy);
      const step = 205 * dt;
      if (distance <= step) {
        this.x = this.tx;
        this.y = this.ty;
        this.moving = false;
        const buffered = heldDirection();
        if (buffered) this.tryMove(buffered);
      } else {
        this.x += dx / distance * step;
        this.y += dy / distance * step;
      }
    } else {
      const direction = heldDirection();
      if (direction) this.tryMove(direction);
    }
    if (pressedFire) {
      this.fire();
      pressedFire = false;
    }
  }
  tryMove(direction) {
    const vector = DIRS[direction];
    const nx = this.gx + vector.x;
    const ny = this.gy + vector.y;
    if (!inside(nx, ny)) return false;
    const boulder = game.boulderAt(nx, ny);
    if (boulder) {
      if (vector.y !== 0 || !boulder.push(vector.x)) return false;
    }
    this.dir = direction;
    if (direction === 'left' || direction === 'right') this.facing = direction;
    this.gx = nx;
    this.gy = ny;
    const point = cellCenter(nx, ny);
    this.tx = point.x;
    this.ty = point.y;
    this.moving = true;
    if (game.grid[ny][nx] === 1) {
      game.grid[ny][nx] = 0;
      audio.sfx('dig', 0.2);
      game.digFlash(nx, ny);
    }
    game.collectAt(nx, ny);
    return true;
  }
  fire() {
    if (game.orb) return;
    game.orb = new Orb(this.gx, this.gy, this.dir);
    this.fireFlash = 0.22;
    audio.sfx('shoot', 0.44);
  }
  draw() {
    if (this.invulnerable > 0 && Math.floor(this.invulnerable * 12) % 2 === 0) return;
    let frameIndex = 0;
    if (this.fireFlash > 0) frameIndex = 8 + Math.min(2, Math.floor((0.22 - this.fireFlash) * 14));
    else if (this.moving) frameIndex = 2 + Math.floor(this.anim * 11) % 4;
    else frameIndex = Math.floor(this.anim * 3) % 2;
    ctx.save();
    if (this.facing === 'left') {
      ctx.translate(this.x, 0);
      ctx.scale(-1, 1);
      ctx.translate(-this.x, 0);
    }
    frame(A.petroman, frameIndex, 96, 96, this.x - 35, this.y - 38, 70, 70);
    ctx.restore();
  }
}

class Enemy {
  constructor(kind, gx, gy, options = {}) {
    this.kind = kind;
    this.gx = gx;
    this.gy = gy;
    const point = cellCenter(gx, gy);
    this.x = point.x;
    this.y = point.y;
    this.tx = this.x;
    this.ty = this.y;
    this.moving = false;
    this.dead = false;
    this.anim = Math.random() * 5;
    this.row = { smog: 0, drill: 1, drone: 2, patrol: 3, boss: 4 }[kind];
    this.speed = kind === 'boss' ? 102 : kind === 'drone' ? 122 : kind === 'patrol' ? 112 : kind === 'drill' ? 98 : 92;
    this.hp = kind === 'boss' ? 8 : 1;
    this.lastDir = 'down';
    this.digger = kind === 'drill' || kind === 'drone' || kind === 'boss';
    this.letterIndex = Number.isInteger(options.letterIndex) ? options.letterIndex : -1;
    this.spawnGrace = 0.8;
  }
  canDig() {
    return this.digger || game.rage;
  }
  update(dt) {
    if (this.dead) return;
    this.spawnGrace = Math.max(0, this.spawnGrace - dt);
    this.anim += dt;
    if (this.moving) {
      const dx = this.tx - this.x;
      const dy = this.ty - this.y;
      const distance = Math.hypot(dx, dy);
      const step = this.speed * (game.rage ? 1.13 : 1) * dt;
      if (distance <= step) {
        this.x = this.tx;
        this.y = this.ty;
        this.moving = false;
      } else {
        this.x += dx / distance * step;
        this.y += dy / distance * step;
      }
    } else {
      const direction = this.chooseDirection();
      if (direction) this.move(direction);
    }
    if (this.spawnGrace <= 0 && Math.hypot(this.x - game.player.x, this.y - game.player.y) < 22 && game.player.invulnerable <= 0) {
      game.hurt();
    }
  }
  chooseDirection() {
    const candidates = [];
    for (const direction of Object.keys(DIRS)) {
      const vector = DIRS[direction];
      const nx = this.gx + vector.x;
      const ny = this.gy + vector.y;
      if (!inside(nx, ny) || game.boulderAt(nx, ny)) continue;
      if (game.grid[ny][nx] === 1 && !this.canDig()) continue;
      let score = manhattan(nx, ny, game.player.gx, game.player.gy) * 10;
      if (direction === OPPOSITE[this.lastDir]) score += 35;
      if (direction === this.lastDir && this.kind === 'patrol') score -= 10;
      score += Math.random() * 18;
      candidates.push({ direction, score });
    }
    if (!candidates.length) return null;
    candidates.sort((a, b) => a.score - b.score);
    return candidates[0].direction;
  }
  move(direction) {
    const vector = DIRS[direction];
    const nx = this.gx + vector.x;
    const ny = this.gy + vector.y;
    if (!inside(nx, ny)) return;
    if (game.grid[ny][nx] === 1 && this.canDig()) {
      game.grid[ny][nx] = 0;
      game.digFlash(nx, ny);
    }
    this.lastDir = direction;
    this.gx = nx;
    this.gy = ny;
    const point = cellCenter(nx, ny);
    this.tx = point.x;
    this.ty = point.y;
    this.moving = true;
  }
  hit(source, power = 1) {
    if (this.dead) return;
    if (this.kind === 'boss') {
      this.hp -= power;
      game.flash(this.x, this.y, 1);
      audio.sfx('hit', 0.5);
      game.score += 500 * power;
      if (this.hp > 0) return;
    }
    this.dead = true;
    game.kills += 1;
    const points = this.kind === 'boss' ? 8000 : this.kind === 'drone' ? 800 : this.kind === 'patrol' ? 650 : this.kind === 'drill' ? 550 : 400;
    game.score += points;
    game.flash(this.x, this.y, 2);
    audio.sfx('pop', 0.48);
    if (this.letterIndex >= 0 && source === 'orb') game.awardLetter(this.letterIndex);
  }
  draw() {
    if (this.dead) return;
    const frameIndex = Math.floor(this.anim * 8) % 4;
    const size = this.kind === 'boss' ? 92 : 58;
    frame(A.enemies, frameIndex, 96, 96, this.x - size / 2, this.y - size / 2 - 2, size, size, this.row);
    if (this.letterIndex >= 0) {
      frame(A.objects, 7 + this.letterIndex, 64, 64, this.x - 14, this.y - 36, 28, 28);
    }
  }
}

class Orb {
  constructor(gx, gy, direction) {
    this.gx = gx;
    this.gy = gy;
    const point = cellCenter(gx, gy);
    this.x = point.x;
    this.y = point.y;
    this.tx = this.x;
    this.ty = this.y;
    this.dir = direction;
    this.mode = 'outbound';
    this.moving = false;
    this.age = 0;
    this.bounces = 0;
    this.trailClock = 0;
    this.chooseNext();
  }
  passable(x, y) {
    return inside(x, y) && game.grid[y][x] === 0 && !game.boulderAt(x, y);
  }
  setTarget(direction) {
    const vector = DIRS[direction];
    const nx = this.gx + vector.x;
    const ny = this.gy + vector.y;
    if (!this.passable(nx, ny)) return false;
    this.dir = direction;
    this.gx = nx;
    this.gy = ny;
    const point = cellCenter(nx, ny);
    this.tx = point.x;
    this.ty = point.y;
    this.moving = true;
    return true;
  }
  chooseNext() {
    if (this.mode === 'returning') {
      const direction = game.pathDirection(this.gx, this.gy, game.player.gx, game.player.gy);
      if (!direction || !this.setTarget(direction)) game.orb = null;
      return;
    }
    if (this.age > 4.6 || this.bounces >= 4) {
      this.mode = 'returning';
      this.chooseNext();
      return;
    }
    if (this.setTarget(this.dir)) return;
    const turnOptions = Object.keys(DIRS).filter(direction => direction !== OPPOSITE[this.dir] && this.passable(this.gx + DIRS[direction].x, this.gy + DIRS[direction].y));
    if (turnOptions.length) {
      this.bounces += 1;
      audio.sfx('bounce', 0.24);
      const preferred = turnOptions[(this.gx + this.gy + this.bounces) % turnOptions.length];
      this.setTarget(preferred);
      return;
    }
    this.mode = 'returning';
    this.chooseNext();
  }
  update(dt) {
    this.age += dt;
    this.trailClock += dt;
    if (this.moving) {
      const dx = this.tx - this.x;
      const dy = this.ty - this.y;
      const distance = Math.hypot(dx, dy);
      const step = 390 * dt;
      if (distance <= step) {
        this.x = this.tx;
        this.y = this.ty;
        this.moving = false;
        if (this.mode === 'returning' && this.gx === game.player.gx && this.gy === game.player.gy) {
          game.orb = null;
          return;
        }
        this.chooseNext();
      } else {
        this.x += dx / distance * step;
        this.y += dy / distance * step;
      }
    }
    for (const enemy of game.enemies) {
      if (!enemy.dead && Math.hypot(this.x - enemy.x, this.y - enemy.y) < (enemy.kind === 'boss' ? 42 : 27)) {
        enemy.hit('orb');
        this.mode = 'returning';
        this.moving = false;
        this.chooseNext();
        break;
      }
    }
    if (this.mode === 'returning' && Math.hypot(this.x - game.player.x, this.y - game.player.y) < 19) game.orb = null;
  }
  draw() {
    frame(A.objects, 4, 64, 64, this.x - 22, this.y - 22, 44, 44);
    if (this.trailClock > 0.05) {
      this.trailClock = 0;
      game.flashes.push(new Flash(this.x, this.y, 3, 0.28));
    }
  }
}

class Boulder {
  constructor(gx, gy) {
    this.gx = gx;
    this.gy = gy;
    const point = cellCenter(gx, gy);
    this.x = point.x;
    this.y = point.y;
    this.tx = this.x;
    this.ty = this.y;
    this.mode = 'rest';
    this.wobble = 0;
    this.fallCells = 0;
    this.crushCount = 0;
    this.dead = false;
  }
  push(dx) {
    if (this.mode !== 'rest' || dx === 0) return false;
    const nx = this.gx + dx;
    if (!inside(nx, this.gy) || game.grid[this.gy][nx] !== 0 || game.boulderAt(nx, this.gy, this)) return false;
    this.gx = nx;
    const point = cellCenter(nx, this.gy);
    this.tx = point.x;
    this.ty = point.y;
    this.mode = 'push';
    audio.sfx('drop', 0.2);
    return true;
  }
  unsupported() {
    if (this.gy >= ROWS - 2) return false;
    return game.grid[this.gy + 1][this.gx] === 0 && !game.boulderAt(this.gx, this.gy + 1, this);
  }
  startFall() {
    this.gy += 1;
    const point = cellCenter(this.gx, this.gy);
    this.tx = point.x;
    this.ty = point.y;
    this.mode = 'fall';
    this.fallCells += 1;
    audio.sfx('drop', 0.38);
  }
  update(dt) {
    if (this.dead) return;
    if (this.mode === 'push' || this.mode === 'fall') {
      const dx = this.tx - this.x;
      const dy = this.ty - this.y;
      const distance = Math.hypot(dx, dy);
      const speed = this.mode === 'fall' ? 350 : 230;
      const step = speed * dt;
      if (distance <= step) {
        this.x = this.tx;
        this.y = this.ty;
        const wasFall = this.mode === 'fall';
        this.mode = 'rest';
        if (wasFall) this.checkCrush();
      } else {
        this.x += dx / distance * step;
        this.y += dy / distance * step;
        if (this.mode === 'fall') this.checkCrush();
      }
      return;
    }
    if (this.unsupported()) {
      if (this.fallCells > 0) {
        this.startFall();
      } else {
        this.wobble += dt;
        if (this.wobble >= 0.48) {
          this.wobble = 0;
          this.startFall();
        }
      }
    } else {
      if (this.fallCells >= 2) this.finishDrop();
      this.fallCells = 0;
      this.wobble = 0;
    }
  }
  finishDrop() {
    if (this.fallCells >= 3) game.maybeLetter(this.x, this.y, this.crushCount >= 2);
    if (this.fallCells >= 4 && !game.goldenSpawned && Math.random() < 0.18) game.spawnGoldenCore(this.gx, this.gy);
    this.crushCount = 0;
  }
  checkCrush() {
    for (const enemy of game.enemies) {
      if (!enemy.dead && enemy.gx === this.gx && enemy.gy === this.gy) {
        if (enemy.kind === 'boss') enemy.hit('boulder', 2);
        else enemy.hit('boulder');
        this.crushCount += 1;
        const chainScore = 1000 * (2 ** Math.min(3, this.crushCount - 1));
        game.score += chainScore;
        game.message(`BOULDER CHAIN +${chainScore}`, 1.2);
      }
    }
    if (game.player.gx === this.gx && game.player.gy === this.gy && game.player.invulnerable <= 0) game.hurt();
  }
  draw() {
    const shake = this.wobble > 0 ? Math.sin(this.wobble * 55) * 3 : 0;
    frame(A.objects, 5, 64, 64, this.x - 28 + shake, this.y - 30, 56, 56);
  }
}

class Token {
  constructor(gx, gy, type, options = {}) {
    this.gx = gx;
    this.gy = gy;
    const point = cellCenter(gx, gy);
    this.x = point.x;
    this.y = point.y;
    this.type = type;
    this.groupId = options.groupId ?? -1;
    this.index = options.index ?? 0;
    this.t = Math.random() * 4;
    this.dead = false;
    this.life = type === 'golden' ? 12 : Infinity;
  }
  update(dt) {
    if (this.dead) return;
    this.t += dt;
    if (this.life !== Infinity) {
      this.life -= dt;
      if (this.life <= 0) {
        this.dead = true;
        return;
      }
    }
    if (Math.hypot(this.x - game.player.x, this.y - game.player.y) < 22) this.collect();
  }
  collect() {
    if (this.dead) return;
    this.dead = true;
    if (this.type === 'core') {
      game.score += 250;
      game.coresGot += 1;
      audio.sfx('collect', 0.32);
      game.flash(this.x, this.y, 2);
      game.groupCollected(this.groupId);
    } else if (this.type === 'letter') {
      game.awardLetter(this.index);
    } else if (this.type === 'golden') {
      game.score += 8000;
      game.flash(this.x, this.y, 3);
      audio.sfx('life', 0.65);
      game.clearLevel('GOLDEN REACTOR CORE');
    }
  }
  draw() {
    const bob = Math.sin(this.t * 4) * 3;
    if (this.type === 'core') frame(A.objects, game.theme, 64, 64, this.x - 18, this.y - 18 + bob, 36, 36);
    else if (this.type === 'golden') frame(A.objects, 0, 64, 64, this.x - 25, this.y - 25 + bob, 50, 50);
    else frame(A.objects, 7 + this.index, 64, 64, this.x - 23, this.y - 23 + bob, 46, 46);
  }
}

class Flash {
  constructor(x, y, row = 0, duration = 0.55) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.t = 0;
    this.duration = duration;
  }
  update(dt) { this.t += dt; }
  get dead() { return this.t > this.duration; }
  draw() {
    const frameIndex = Math.min(7, Math.floor(this.t / this.duration * 8));
    frame(A.vfx, frameIndex, 64, 64, this.x - 32, this.y - 32, 64, 64, this.row);
  }
}

const game = {
  state: 'loading',
  level: 0,
  score: 0,
  high: Number(localStorage.getItem('petromanCoreDiggerHigh') || 0),
  lives: 3,
  theme: 0,
  grid: [],
  player: null,
  enemies: [],
  enemyQueue: [],
  tokens: [],
  boulders: [],
  letters: [false, false, false, false, false],
  groupRemaining: new Map(),
  orb: null,
  flashes: [],
  kills: 0,
  coresGot: 0,
  messageTime: 0,
  floatMessage: '',
  clearReason: '',
  levelElapsed: 0,
  spawnTimer: 0,
  letterTimer: 0,
  burrowTimer: 0,
  rage: false,
  goldenSpawned: false,
  resetLettersNextLevel: false,

  start() {
    this.score = 0;
    this.lives = 3;
    this.level = 0;
    this.letters = [false, false, false, false, false];
    this.resetLettersNextLevel = false;
    audio.sfx('start', 0.5);
    this.loadLevel();
  },
  loadLevel() {
    if (this.resetLettersNextLevel) {
      this.letters = [false, false, false, false, false];
      this.resetLettersNextLevel = false;
    }
    const level = levels[this.level];
    this.theme = level.theme;
    this.state = 'playing';
    this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(1));
    for (const [x, y, width, height] of level.carve) {
      for (let yy = y; yy < y + height; yy++) {
        for (let xx = x; xx < x + width; xx++) {
          if (inside(xx, yy)) this.grid[yy][xx] = 0;
        }
      }
    }
    this.grid[1][2] = 0;
    this.grid[1][18] = 0;
    this.player = new Player();
    this.enemies = [];
    this.enemyQueue = [...level.enemies];
    this.boulders = level.boulders.map(([x, y]) => {
      this.grid[y][x] = 0;
      return new Boulder(x, y);
    });
    this.tokens = [];
    this.groupRemaining = new Map();
    this.placeCoreGroups(level.groups);
    this.orb = null;
    this.flashes = [];
    this.kills = 0;
    this.coresGot = 0;
    this.levelElapsed = 0;
    this.spawnTimer = 0.35;
    this.letterTimer = 15;
    this.burrowTimer = 22;
    this.rage = false;
    this.goldenSpawned = false;
    this.clearReason = '';
    this.message(`STAGE ${this.level + 1}: ${level.name}`, 2.1);
    audio.music('game');
  },
  placeCoreGroups(groups) {
    const reserved = new Set(['2,1', '18,1']);
    this.boulders.forEach(boulder => reserved.add(keyOf(boulder.gx, boulder.gy)));
    groups.forEach((group, groupId) => {
      const [x, y, width, height] = group;
      let count = 0;
      for (let yy = y; yy < y + height; yy++) {
        for (let xx = x; xx < x + width; xx++) {
          if (!inside(xx, yy) || reserved.has(keyOf(xx, yy)) || this.grid[yy][xx] === 0) continue;
          this.tokens.push(new Token(xx, yy, 'core', { groupId }));
          count += 1;
        }
      }
      if (count) this.groupRemaining.set(groupId, count);
    });
  },
  groupCollected(groupId) {
    if (!this.groupRemaining.has(groupId)) return;
    const remaining = this.groupRemaining.get(groupId) - 1;
    this.groupRemaining.set(groupId, remaining);
    if (remaining === 0) {
      this.score += 750;
      this.message('CORE CLUSTER +750', 1.1);
      audio.sfx('collect', 0.5);
    }
  },
  boulderAt(x, y, ignore = null) {
    return this.boulders.find(boulder => boulder !== ignore && !boulder.dead && boulder.gx === x && boulder.gy === y) || null;
  },
  enemyAt(x, y) {
    return this.enemies.find(enemy => !enemy.dead && enemy.gx === x && enemy.gy === y) || null;
  },
  collectAt(x, y) {
    for (const token of this.tokens) {
      if (!token.dead && token.gx === x && token.gy === y) token.collect();
    }
  },
  digFlash(x, y) {
    const point = cellCenter(x, y);
    this.flashes.push(new Flash(point.x, point.y, 0, 0.38));
  },
  flash(x, y, row) {
    this.flashes.push(new Flash(x, y, row));
  },
  message(text, duration = 1.5) {
    this.floatMessage = text;
    this.messageTime = duration;
  },
  spawnEnemy(kind = null, options = {}) {
    if (!kind) kind = this.enemyQueue.shift();
    if (!kind) return;
    const spawnCells = [[18,1],[17,1],[19,1],[18,2],[16,1],[20,1]];
    const spawn = spawnCells.find(([x, y]) => !this.enemyAt(x, y) && !this.boulderAt(x, y)) || [18,1];
    this.grid[spawn[1]][spawn[0]] = 0;
    this.enemies.push(new Enemy(kind, spawn[0], spawn[1], options));
    this.flashes.push(new Flash(cellCenter(spawn[0], spawn[1]).x, cellCenter(spawn[0], spawn[1]).y, 3, 0.5));
  },
  spawnLetterCarrier() {
    if (this.enemies.some(enemy => enemy.letterIndex >= 0)) return;
    const index = this.letters.findIndex(value => !value);
    if (index < 0) return;
    this.spawnEnemy('smog', { letterIndex: index });
    this.message(`PETRO LETTER ${'PETRO'[index]} HAS APPEARED!`, 1.6);
  },
  awardLetter(index) {
    if (this.letters[index]) return;
    this.letters[index] = true;
    this.score += 1500;
    audio.sfx('life', 0.5);
    this.message(`PETRO LETTER ${'PETRO'[index]}!`, 1.4);
    if (this.letters.every(Boolean)) {
      this.lives += 1;
      this.score += 5000;
      this.resetLettersNextLevel = true;
      this.clearLevel('PETRO SPELLED — EXTRA LIFE');
    }
  },
  maybeLetter(x, y, force = false) {
    const index = this.letters.findIndex(value => !value);
    if (index < 0) return;
    if (force || Math.random() < 0.18) {
      const gx = clamp(Math.floor((x - OX) / CELL), 1, COLS - 2);
      const gy = clamp(Math.floor((y - OY) / CELL), 1, ROWS - 2);
      this.tokens.push(new Token(gx, gy, 'letter', { index }));
    }
  },
  spawnGoldenCore(gx, gy) {
    if (this.goldenSpawned) return;
    const offsets = [[-1,0],[1,0],[0,-1],[0,1],[-2,0],[2,0],[0,-2],[0,2]];
    const target = offsets.map(([dx,dy]) => [gx + dx, gy + dy]).find(([x,y]) => inside(x,y) && this.grid[y][x] === 0 && !this.boulderAt(x,y) && !this.enemyAt(x,y));
    if (!target) return;
    this.goldenSpawned = true;
    this.tokens.push(new Token(target[0], target[1], 'golden'));
    this.message('RARE GOLDEN CORE — 12 SECONDS!', 2);
    audio.sfx('life', 0.55);
  },
  pathDirection(startX, startY, targetX, targetY) {
    if (startX === targetX && startY === targetY) return null;
    const queue = [[startX, startY]];
    const visited = new Set([keyOf(startX, startY)]);
    const firstDirection = new Map();
    while (queue.length) {
      const [x, y] = queue.shift();
      for (const direction of Object.keys(DIRS)) {
        const vector = DIRS[direction];
        const nx = x + vector.x;
        const ny = y + vector.y;
        if (!inside(nx, ny) || this.grid[ny][nx] !== 0 || this.boulderAt(nx, ny)) continue;
        const key = keyOf(nx, ny);
        if (visited.has(key)) continue;
        visited.add(key);
        firstDirection.set(key, x === startX && y === startY ? direction : firstDirection.get(keyOf(x, y)));
        if (nx === targetX && ny === targetY) return firstDirection.get(key);
        queue.push([nx, ny]);
      }
    }
    return null;
  },
  hurt() {
    if (this.player.invulnerable > 0 || this.state !== 'playing') return;
    this.lives -= 1;
    audio.sfx('hit', 0.6);
    this.flash(this.player.x, this.player.y, 1);
    this.orb = null;
    if (this.lives <= 0) {
      this.gameOver();
      return;
    }
    this.player = new Player();
    this.message('PETROMAN, GET BACK IN THERE!', 1.3);
  },
  clearLevel(reason) {
    if (this.state !== 'playing') return;
    this.clearReason = reason;
    this.state = 'levelClear';
    this.score += 2500 + this.level * 250;
    audio.sfx('clear', 0.65);
  },
  gameOver() {
    this.state = 'gameOver';
    this.high = Math.max(this.high, this.score);
    localStorage.setItem('petromanCoreDiggerHigh', String(this.high));
    audio.music('defeat');
    audio.sfx('defeat', 0.65);
  },
  win() {
    this.state = 'victory';
    this.high = Math.max(this.high, this.score);
    localStorage.setItem('petromanCoreDiggerHigh', String(this.high));
    audio.music('victory');
    audio.sfx('victory', 0.7);
  },
  next() {
    if (this.level >= levels.length - 1) {
      this.win();
      return;
    }
    this.level += 1;
    this.loadLevel();
  },
  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      if (audio.current) audio.current.pause();
    } else if (this.state === 'paused') {
      this.state = 'playing';
      audio.music('game');
    }
  },
  update(dt) {
    if (pressedPause) {
      pressedPause = false;
      this.togglePause();
    }
    if (this.state !== 'playing') return;
    this.levelElapsed += dt;
    this.messageTime = Math.max(0, this.messageTime - dt);
    this.spawnTimer -= dt;
    this.letterTimer -= dt;
    this.burrowTimer -= dt;

    const level = levels[this.level];
    const activeEnemies = this.enemies.filter(enemy => !enemy.dead).length;
    if (this.spawnTimer <= 0 && this.enemyQueue.length && activeEnemies < level.activeCap) {
      this.spawnEnemy();
      this.spawnTimer = Math.max(1.35, 2.4 - this.level * 0.07);
    }
    if (this.letterTimer <= 0 && this.letters.some(value => !value)) {
      this.spawnLetterCarrier();
      this.letterTimer = 22;
    }
    if (this.burrowTimer <= 0) {
      const candidate = this.enemies.find(enemy => !enemy.dead && !enemy.digger && enemy.letterIndex < 0);
      if (candidate) {
        candidate.digger = true;
        this.message('A SMOG CREATURE STARTS BURROWING!', 1.5);
      }
      this.burrowTimer = Math.max(12, 22 - this.level * 0.7);
    }

    const remainingCoreCount = this.tokens.filter(token => token.type === 'core' && !token.dead).length;
    const totalCoreCount = remainingCoreCount + this.coresGot;
    if (!this.rage && (this.levelElapsed > 48 || (totalCoreCount > 0 && remainingCoreCount / totalCoreCount < 0.28))) {
      this.rage = true;
      this.message('SMOG SURGE — THEY CAN DIG NOW!', 1.8);
    }

    this.player.update(dt);
    this.enemies.forEach(enemy => enemy.update(dt));
    this.boulders.forEach(boulder => boulder.update(dt));
    this.tokens.forEach(token => token.update(dt));
    if (this.orb) this.orb.update(dt);
    this.flashes.forEach(flash => flash.update(dt));

    this.enemies = this.enemies.filter(enemy => !enemy.dead);
    this.tokens = this.tokens.filter(token => !token.dead);
    this.flashes = this.flashes.filter(flash => !flash.dead);

    const coresRemaining = this.tokens.filter(token => token.type === 'core').length;
    if (coresRemaining === 0) this.clearLevel('ALL REACTOR CORES PURIFIED');
    else if (this.enemyQueue.length === 0 && this.enemies.length === 0) this.clearLevel('ALL SMOG CREATURES DEFEATED');
  },
  draw() {
    ctx.clearRect(0, 0, W, H);
    if (this.state === 'title') {
      ctx.drawImage(A.title, 0, 0, W, H);
      return;
    }
    if (this.state === 'victory') {
      ctx.drawImage(A.victory, 0, 0, W, H);
      this.drawEnd();
      return;
    }
    if (this.state === 'gameOver') {
      ctx.drawImage(A.defeat, 0, 0, W, H);
      this.drawEnd();
      return;
    }
    this.drawWorld();
    if (this.state === 'levelClear') this.drawClear();
    if (this.state === 'paused') this.drawPause();
  },
  drawWorld() {
    ctx.drawImage(A[`bg${this.theme + 1}`], 0, 0, W, H);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const dx = OX + x * CELL;
        const dy = OY + y * CELL;
        const variant = (x * 7 + y * 11 + this.level) % 4;
        const image = this.grid[y][x] === 1 ? A.dirt : A.tunnel;
        ctx.drawImage(image, variant * 32, this.theme * 32, 32, 32, dx, dy, 32, 32);
      }
    }
    for (let x = 0; x < COLS; x++) {
      ctx.drawImage(A.wall, ((x + this.level) % 4) * 32, this.theme * 32, 32, 32, OX + x * CELL, OY, 32, 32);
      ctx.drawImage(A.wall, ((x + 2) % 4) * 32, this.theme * 32, 32, 32, OX + x * CELL, OY + (ROWS - 1) * CELL, 32, 32);
    }
    for (let y = 0; y < ROWS; y++) {
      ctx.drawImage(A.wall, ((y + 1) % 4) * 32, this.theme * 32, 32, 32, OX, OY + y * CELL, 32, 32);
      ctx.drawImage(A.wall, ((y + 3) % 4) * 32, this.theme * 32, 32, 32, OX + (COLS - 1) * CELL, OY + y * CELL, 32, 32);
    }

    const hatch = cellCenter(18, 1);
    frame(A.objects, 6, 64, 64, hatch.x - 27, hatch.y - 27, 54, 54);
    this.tokens.forEach(token => token.draw());
    this.boulders.forEach(boulder => boulder.draw());
    this.enemies.forEach(enemy => enemy.draw());
    this.player.draw();
    if (this.orb) this.orb.draw();
    this.flashes.forEach(flash => flash.draw());
    this.drawHud();

    if (this.messageTime > 0) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '900 29px Arial';
      ctx.lineWidth = 7;
      ctx.strokeStyle = '#07102d';
      ctx.strokeText(this.floatMessage, W / 2, 126);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(this.floatMessage, W / 2, 126);
      ctx.restore();
    }
  },
  drawHud() {
    ctx.drawImage(A.hud, 0, 0, W, 92);
    const coresRemaining = this.tokens.filter(token => token.type === 'core').length;
    const enemiesRemaining = this.enemyQueue.length + this.enemies.length;
    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.font = '900 22px Arial';
    ctx.strokeStyle = '#07102d';
    ctx.lineWidth = 5;
    const text = (value, x, y, align = 'left', color = '#fff', size = 22) => {
      ctx.font = `900 ${size}px Arial`;
      ctx.textAlign = align;
      ctx.strokeText(value, x, y);
      ctx.fillStyle = color;
      ctx.fillText(value, x, y);
    };
    text(String(this.score).padStart(7, '0'), 108, 44);
    text(`x ${this.lives}`, 350, 44, 'left', '#ffd744');
    text(`${this.level + 1}/12`, 555, 44, 'left', '#52f4e4');
    text(`${coresRemaining}`, 726, 44);
    text(this.orb ? 'RETURNING' : 'READY', 905, 44, 'left', this.orb ? '#ff987c' : '#72ffcb', 19);
    text(`SMOG ${enemiesRemaining}`, 555, 76, 'left', '#ffb86b', 16);
    text(`HI ${String(this.high).padStart(7, '0')}`, 230, 76, 'right', '#ffdb54', 16);
    for (let i = 0; i < 5; i++) {
      ctx.globalAlpha = this.letters[i] ? 1 : 0.28;
      frame(A.objects, 7 + i, 64, 64, 1060 + i * 38, 18, 32, 32);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  },
  drawClear() {
    ctx.save();
    ctx.fillStyle = 'rgba(3,8,25,.68)';
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(A.clear, 390, 190, 500, 275);
    ctx.textAlign = 'center';
    ctx.font = '900 24px Arial';
    ctx.strokeStyle = '#07102d';
    ctx.lineWidth = 6;
    ctx.strokeText(this.clearReason, W / 2, 500);
    ctx.fillStyle = '#ffdf54';
    ctx.fillText(this.clearReason, W / 2, 500);
    ctx.font = '900 20px Arial';
    ctx.strokeText('Press Enter or tap for the next stage', W / 2, 548);
    ctx.fillStyle = '#fff';
    ctx.fillText('Press Enter or tap for the next stage', W / 2, 548);
    ctx.restore();
  },
  drawPause() {
    ctx.save();
    ctx.fillStyle = 'rgba(3,8,25,.76)';
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(A.pause, 540, 220, 200, 200);
    ctx.textAlign = 'center';
    ctx.font = '900 38px Arial';
    ctx.strokeStyle = '#07102d';
    ctx.lineWidth = 7;
    ctx.strokeText('PAUSED', W / 2, 475);
    ctx.fillStyle = '#fff';
    ctx.fillText('PAUSED', W / 2, 475);
    ctx.restore();
  },
  drawEnd() {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '900 26px Arial';
    ctx.strokeStyle = '#07102d';
    ctx.lineWidth = 6;
    const line = `SCORE ${String(this.score).padStart(7, '0')} • HIGH ${String(this.high).padStart(7, '0')}`;
    ctx.strokeText(line, W / 2, 660);
    ctx.fillStyle = '#fff';
    ctx.fillText(line, W / 2, 660);
    ctx.restore();
  }
};

window.__PETROMAN_CORE_DIGGER__ = game;
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  game.update(dt);
  game.draw();
  requestAnimationFrame(loop);
}

loadAssets().then(() => {
  loading.style.display = 'none';
  // Sponsor-funded boost. On game over it puts Petroman straight back in the
  // tunnels; mid-run it adds a life and a long stretch of invulnerability.
  window.MMARewardBridge?.({
    slug: 'petroman-core-digger',
    label: 'Core boost',
    onGrant() {
      if (game.state === 'gameOver') {
        game.lives = 2;
        game.player = new Player();
        game.orb = null;
        game.state = 'playing';
        audio.music('gameplay');
      } else {
        game.lives = Math.min(9, game.lives + 1);
      }
      if (game.player) game.player.invulnerable = Math.max(game.player.invulnerable, 6);
      game.score += 500;
      game.message('SPONSOR BOOST!', 1.4);
      audio.sfx('life', 0.7);
    },
  });

  game.state = 'title';
  audio.music('title');
  requestAnimationFrame(loop);
}).catch(error => {
  loadText.textContent = `Asset loading failed: ${error.message}`;
  console.error(error);
});
})();
