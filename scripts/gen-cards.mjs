/**
 * Generate clean, on-brand SVG key-art cards for games that don't have one,
 * compositing the mascot's real sprite over a universe-themed gradient.
 * Self-contained SVGs (sprite embedded as base64) so they work as <img src>.
 *
 * Usage: node scripts/gen-cards.mjs            (only games missing a card)
 *        node scripts/gen-cards.mjs --new      (only id>200)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUB = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const games = JSON.parse(readFileSync(join(PUB, 'assets/data/games.json'), 'utf8'));
const slugify = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const UNI = {
  cozyverse:  { a: '#ffe3f0', b: '#ffc4dd', accent: '#ff5b9a', ink: '#3a1f45', light: false },
  astromochi: { a: '#241457', b: '#4a2ea0', accent: '#25d8ff', ink: '#ffffff', light: true },
  ninegates:  { a: '#0a5c4d', b: '#0fbf9f', accent: '#f7c948', ink: '#ffffff', light: true },
  snackstreet:{ a: '#3a1030', b: '#7a2a52', accent: '#ffd100', ink: '#ffffff', light: true },
  oracle:     { a: '#1a0c3a', b: '#3a1060', accent: '#ff4f9a', ink: '#ffffff', light: true },
  standalone: { a: '#fff2d6', b: '#ffd9e6', accent: '#ff7ab8', ink: '#3a1f45', light: false }
};
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function wrap(t, max) {
  const w = t.split(' '); const lines = []; let cur = '';
  for (const word of w) { if ((cur + ' ' + word).trim().length > max) { lines.push(cur.trim()); cur = word; } else cur += ' ' + word; }
  if (cur.trim()) lines.push(cur.trim());
  return lines.slice(0, 2);
}

function card(g) {
  const u = UNI[g.universe] || UNI.standalone;
  const spritePath = join(PUB, 'assets/images/sprites', slugify(g.mascot) + '.png');
  let img = '';
  if (existsSync(spritePath)) {
    const b64 = readFileSync(spritePath).toString('base64');
    img = `<image href="data:image/png;base64,${b64}" x="330" y="40" width="286" height="286" preserveAspectRatio="xMidYMax meet"/>`;
  }
  const lines = wrap(g.title, 15);
  const tY = lines.length > 1 ? 300 : 318;
  const titleSvg = lines.map((l, i) => `<text x="34" y="${tY + i * 42}" font-family="Outfit, Verdana, sans-serif" font-size="38" font-weight="900" fill="${u.ink}">${esc(l)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="640" height="400" role="img" aria-label="${esc(g.title)}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${u.a}"/><stop offset="1" stop-color="${u.b}"/></linearGradient>
<radialGradient id="halo" cx="0.7" cy="0.42" r="0.5"><stop offset="0" stop-color="${u.accent}" stop-opacity="0.55"/><stop offset="1" stop-color="${u.accent}" stop-opacity="0"/></radialGradient>
</defs>
<rect width="640" height="400" fill="url(#bg)"/>
<circle cx="470" cy="180" r="150" fill="url(#halo)"/>
<g fill="${u.accent}" opacity="0.5">
<circle cx="70" cy="70" r="5"/><circle cx="150" cy="40" r="3"/><circle cx="590" cy="60" r="4"/><circle cx="300" cy="30" r="3"/><circle cx="600" cy="300" r="5"/><circle cx="40" cy="220" r="4"/>
</g>
<text x="34" y="56" font-family="Outfit, Verdana, sans-serif" font-size="17" font-weight="800" fill="${u.accent}" letter-spacing="1">${esc(g.universeName.toUpperCase())}</text>
${img}
${titleSvg}
<text x="34" y="${tY + lines.length * 40 + 6}" font-family="Outfit, Verdana, sans-serif" font-size="18" font-weight="700" fill="${u.ink}" opacity="0.85">${esc(g.genre)} · ${esc(g.mascot)}</text>
</svg>`;
}

const onlyNew = process.argv.includes('--new');
let n = 0;
for (const g of games) {
  if (onlyNew && g.id <= 200) continue;
  const out = join(PUB, 'assets/images/games', g.slug + '.svg');
  if (!onlyNew && existsSync(out)) continue;
  writeFileSync(out, card(g)); n++;
}
console.log('wrote', n, 'cards');
