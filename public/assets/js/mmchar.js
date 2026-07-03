/**
 * Mochi Mango Arcade — Character & sprite system.
 *
 * Two ways to draw a mascot:
 *   1. A real, merch-ready PNG sprite at /assets/images/sprites/<slug>.png
 *      (transparent, generated to match the card art).
 *   2. A polished, animated procedural vector character (fallback) — a real
 *      cute mascot with body, ears, eyes, blush and expression, coloured from
 *      the universe palette and shaped by the mascot's species.
 *
 * Both keep the character large, centred and consistent so the same art can
 * live on plush, apparel and stickers.
 */

const SPRITE_BASE = '/assets/images/sprites/';

class SpriteBank {
  constructor() { this.cache = new Map(); }
  get(slug) {
    if (this.cache.has(slug)) return this.cache.get(slug);
    const img = new Image();
    const rec = { img, ready: false, failed: false };
    img.onload = () => { rec.ready = img.naturalWidth > 0; };
    img.onerror = () => { rec.failed = true; };
    img.src = SPRITE_BASE + slug + '.png';
    this.cache.set(slug, rec);
    return rec;
  }
}
export const sprites = new SpriteBank();

// species -> feature set for the vector fallback
const SPECIES = [
  ['dragon', 'dragon'], ['dino', 'dragon'], ['gecko', 'dragon'], ['lizard', 'dragon'],
  ['panda', 'bear'], ['bear', 'bear'], ['koala', 'bear'], ['wombat', 'bear'],
  ['cat', 'cat'], ['neko', 'cat'], ['kitt', 'cat'], ['tiger', 'cat'], ['corgi', 'dog'],
  ['pup', 'dog'], ['dog', 'dog'], ['fox', 'fox'], ['bunny', 'bunny'], ['rabbit', 'bunny'],
  ['mouse', 'mouse'], ['hamster', 'mouse'], ['mole', 'mouse'], ['frog', 'frog'],
  ['duck', 'bird'], ['owl', 'bird'], ['penguin', 'bird'], ['parrot', 'bird'],
  ['crow', 'bird'], ['pigeon', 'bird'], ['flamingo', 'bird'], ['falcon', 'bird'], ['crane', 'bird'],
  ['bat', 'bat'], ['bee', 'bug'], ['bumble', 'bug'], ['beetle', 'bug'], ['worm', 'bug'],
  ['firefly', 'bug'], ['snail', 'snail'], ['turtle', 'turtle'], ['crab', 'crab'],
  ['octopus', 'octopus'], ['kraken', 'octopus'], ['robot', 'robot'], ['bot', 'robot'],
  ['mecha', 'robot'], ['ninja', 'ninja'], ['wizard', 'wizard'], ['mage', 'wizard'],
  ['ghost', 'ghost'], ['goblin', 'goblin'], ['monkey', 'monkey'], ['hippo', 'bear'],
  ['sloth', 'bear'], ['llama', 'llama'], ['zebra', 'llama'], ['pegasus', 'llama'],
  ['whale', 'whale'], ['walrus', 'whale']
];

export function speciesOf(name) {
  const s = name.toLowerCase();
  for (const [k, v] of SPECIES) if (s.includes(k)) return v;
  return 'blob';
}

function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/**
 * Draw the procedural vector mascot.
 * opts: { body, belly, dark, species, t, run, jump, squash, face(=1 right/-1 left), expr }
 */
export function drawVectorChar(c, x, y, size, o) {
  const t = o.t || 0;
  const s = size / 2;
  const squash = o.squash || 0;                 // -1..1  (neg = wide/short)
  const sx = 1 + squash * 0.18, sy = 1 - squash * 0.22;
  const bob = o.run ? Math.sin(t * 14) * s * 0.05 : Math.sin(t * 3) * s * 0.03;
  const legPhase = o.run ? Math.sin(t * 16) : 0;
  const blink = (Math.sin(t * 2.3) > 0.97) ? 0.15 : 1;
  const body = o.body, belly = o.belly, ink = '#2b2340';
  const sp = o.species || 'blob';

  c.save();
  c.translate(x, y + bob);
  c.scale((o.face || 1) * sx, sy);

  // soft ground shadow
  c.save();
  c.globalAlpha = 0.18; c.fillStyle = '#000';
  c.beginPath(); c.ellipse(0, s * 0.98, s * 0.72, s * 0.2, 0, 0, 7); c.fill();
  c.restore();

  // feet
  c.fillStyle = shade(body, -18);
  c.beginPath(); c.ellipse(-s * 0.32, s * 0.86 + legPhase * s * 0.12, s * 0.24, s * 0.16, 0, 0, 7); c.fill();
  c.beginPath(); c.ellipse(s * 0.32, s * 0.86 - legPhase * s * 0.12, s * 0.24, s * 0.16, 0, 0, 7); c.fill();

  // tail / accents behind body
  if (sp === 'cat' || sp === 'fox' || sp === 'dog' || sp === 'mouse') {
    c.strokeStyle = body; c.lineWidth = s * 0.16; c.lineCap = 'round';
    c.beginPath(); c.moveTo(s * 0.55, s * 0.2); c.quadraticCurveTo(s * 0.95, s * 0.0 + Math.sin(t * 5) * s * 0.1, s * 0.85, -s * 0.4); c.stroke();
  }

  // ears / head accents (behind head)
  drawEars(c, s, body, sp, t);

  // body — soft rounded plush
  const grad = c.createRadialGradient(-s * 0.2, -s * 0.25, s * 0.1, 0, s * 0.15, s * 0.95);
  grad.addColorStop(0, tint(body, 26)); grad.addColorStop(0.6, body); grad.addColorStop(1, shade(body, -10));
  c.fillStyle = grad;
  c.beginPath(); c.ellipse(0, s * 0.1, s * 0.7, s * 0.72, 0, 0, 7); c.fill();
  // belly
  c.fillStyle = belly;
  c.beginPath(); c.ellipse(0, s * 0.26, s * 0.42, s * 0.46, 0, 0, 7); c.fill();
  // glossy top sheen
  c.save(); c.globalAlpha = 0.28; c.fillStyle = '#fff';
  c.beginPath(); c.ellipse(-s * 0.24, -s * 0.26, s * 0.22, s * 0.3, -0.4, 0, 7); c.fill(); c.restore();

  // arms
  c.fillStyle = body;
  const armY = s * 0.18, armSw = o.run ? Math.sin(t * 16) * s * 0.18 : 0;
  c.beginPath(); c.ellipse(-s * 0.6, armY + armSw, s * 0.18, s * 0.26, -0.3, 0, 7); c.fill();
  c.beginPath(); c.ellipse(s * 0.6, armY - armSw, s * 0.18, s * 0.26, 0.3, 0, 7); c.fill();

  // face group (unflip so eyes always read correctly)
  c.save();
  // eyes — big glossy plush eyes with twin sparkles
  const eyeY = -s * 0.1, eyeDx = s * 0.26;
  if (blink > 0.5) {
    for (const dir of [-1, 1]) {
      const ex = dir * eyeDx;
      c.fillStyle = ink;
      c.beginPath(); c.ellipse(ex, eyeY, s * 0.17, s * 0.24, 0, 0, 7); c.fill();
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(ex + s * 0.06, eyeY - s * 0.09, s * 0.06, 0, 7); c.fill();
      c.globalAlpha = 0.85; c.beginPath(); c.arc(ex - s * 0.05, eyeY + s * 0.07, s * 0.03, 0, 7); c.fill(); c.globalAlpha = 1;
    }
  } else {
    c.strokeStyle = ink; c.lineWidth = s * 0.05; c.lineCap = 'round';
    c.beginPath(); c.arc(-eyeDx, eyeY, s * 0.14, 0.2, Math.PI - 0.2); c.stroke();
    c.beginPath(); c.arc(eyeDx, eyeY, s * 0.14, 0.2, Math.PI - 0.2); c.stroke();
  }
  // blush
  c.fillStyle = 'rgba(255,120,150,.5)';
  c.beginPath(); c.ellipse(-s * 0.4, s * 0.06, s * 0.11, s * 0.075, 0, 0, 7); c.fill();
  c.beginPath(); c.ellipse(s * 0.4, s * 0.06, s * 0.11, s * 0.075, 0, 0, 7); c.fill();
  // nose + mouth (expression)
  c.strokeStyle = ink; c.lineWidth = s * 0.05; c.lineCap = 'round'; c.fillStyle = ink;
  const my = s * 0.12;
  if (o.expr === 'ouch') {
    c.beginPath(); c.arc(0, my + s * 0.06, s * 0.11, Math.PI, 0); c.stroke();
  } else if (o.expr === 'wow') {
    c.beginPath(); c.ellipse(0, my + s * 0.03, s * 0.08, s * 0.1, 0, 0, 7); c.fill();
  } else {
    c.beginPath(); c.moveTo(-s * 0.12, my); c.quadraticCurveTo(0, my + s * 0.14, s * 0.12, my); c.stroke();
  }
  c.restore();

  // species front accents (horn, beak overlay)
  drawFront(c, s, body, sp, o);

  c.restore();
}

function drawEars(c, s, body, sp, t) {
  c.fillStyle = body;
  const inner = tint(body, 30);
  if (sp === 'cat' || sp === 'fox' || sp === 'dragon') {
    c.beginPath(); c.moveTo(-s * 0.5, -s * 0.4); c.lineTo(-s * 0.24, -s * 0.86); c.lineTo(-s * 0.06, -s * 0.42); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(s * 0.5, -s * 0.4); c.lineTo(s * 0.24, -s * 0.86); c.lineTo(s * 0.06, -s * 0.42); c.closePath(); c.fill();
    c.fillStyle = inner;
    c.beginPath(); c.moveTo(-s * 0.4, -s * 0.44); c.lineTo(-s * 0.26, -s * 0.72); c.lineTo(-s * 0.14, -s * 0.46); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(s * 0.4, -s * 0.44); c.lineTo(s * 0.26, -s * 0.72); c.lineTo(s * 0.14, -s * 0.46); c.closePath(); c.fill();
  } else if (sp === 'bunny') {
    c.beginPath(); c.ellipse(-s * 0.22, -s * 0.78, s * 0.12, s * 0.42, -0.15, 0, 7); c.fill();
    c.beginPath(); c.ellipse(s * 0.22, -s * 0.78, s * 0.12, s * 0.42, 0.15, 0, 7); c.fill();
    c.fillStyle = inner;
    c.beginPath(); c.ellipse(-s * 0.22, -s * 0.74, s * 0.06, s * 0.3, -0.15, 0, 7); c.fill();
    c.beginPath(); c.ellipse(s * 0.22, -s * 0.74, s * 0.06, s * 0.3, 0.15, 0, 7); c.fill();
  } else if (sp === 'bear' || sp === 'mouse' || sp === 'monkey') {
    c.beginPath(); c.arc(-s * 0.42, -s * 0.5, s * 0.2, 0, 7); c.fill();
    c.beginPath(); c.arc(s * 0.42, -s * 0.5, s * 0.2, 0, 7); c.fill();
    c.fillStyle = inner;
    c.beginPath(); c.arc(-s * 0.42, -s * 0.5, s * 0.1, 0, 7); c.fill();
    c.beginPath(); c.arc(s * 0.42, -s * 0.5, s * 0.1, 0, 7); c.fill();
  } else if (sp === 'bird' || sp === 'frog') {
    // frog eyes on top
    if (sp === 'frog') {
      c.beginPath(); c.arc(-s * 0.3, -s * 0.55, s * 0.16, 0, 7); c.fill();
      c.beginPath(); c.arc(s * 0.3, -s * 0.55, s * 0.16, 0, 7); c.fill();
    }
  } else if (sp === 'bat') {
    c.beginPath(); c.moveTo(-s * 0.3, -s * 0.4); c.lineTo(-s * 0.5, -s * 0.7); c.lineTo(-s * 0.16, -s * 0.55); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(s * 0.3, -s * 0.4); c.lineTo(s * 0.5, -s * 0.7); c.lineTo(s * 0.16, -s * 0.55); c.closePath(); c.fill();
  }
}

function drawFront(c, s, body, sp, o) {
  if (sp === 'dragon') {
    c.fillStyle = tint(body, 40);
    for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * s * 0.14, -s * 0.5); c.lineTo(i * s * 0.14 + s * 0.06, -s * 0.7); c.lineTo(i * s * 0.14 + s * 0.12, -s * 0.5); c.closePath(); c.fill(); }
  }
  if (sp === 'robot') {
    c.strokeStyle = '#fff'; c.lineWidth = s * 0.04;
    c.beginPath(); c.moveTo(0, -s * 0.5); c.lineTo(0, -s * 0.72); c.stroke();
    c.fillStyle = tint(body, 50); c.beginPath(); c.arc(0, -s * 0.76, s * 0.06, 0, 7); c.fill();
  }
  if (sp === 'wizard' || sp === 'ninja') {
    c.fillStyle = sp === 'ninja' ? '#333a55' : shade(body, -30);
    c.beginPath(); c.moveTo(-s * 0.5, -s * 0.34); c.quadraticCurveTo(0, -s * 1.0, s * 0.5, -s * 0.34); c.closePath(); c.fill();
  }
}

// colour helpers
function hexToRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function toHex(r, g, b) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
export function shade(hex, amt) { const [r, g, b] = hexToRgb(hex); return toHex(r + amt, g + amt, b + amt); }
export function tint(hex, amt) { const [r, g, b] = hexToRgb(hex); return toHex(r + (255 - r) * amt / 100, g + (255 - g) * amt / 100, b + (255 - b) * amt / 100); }
