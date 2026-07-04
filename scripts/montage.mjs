/**
 * Build a labelled contact-sheet montage of every PNG in a dimension group,
 * so a whole set can be identified in one look. Index labels map back to the
 * manifest order.
 *
 * Usage: node scripts/montage.mjs <WxH> <out.png> [cols] [tile]
 */
import sharp from '../node_modules/sharp/lib/index.js';
import { readFileSync } from 'node:fs';

const [, , dim, out, COLS = '7', TILE = '300'] = process.argv;
const manifest = JSON.parse(readFileSync(new URL('./sheet-manifest.json', import.meta.url)));
const files = manifest[dim] || [];
const cols = +COLS, tile = +TILE, rows = Math.ceil(files.length / cols);
const pad = 6, labelH = 22, cellW = tile + pad, cellH = tile + labelH + pad;
const W = cols * cellW + pad, H = rows * cellH + pad;

const layers = [];
for (let i = 0; i < files.length; i++) {
  const buf = await sharp('../' + files[i]).resize({ width: tile, height: tile, fit: 'inside', background: '#ffffff' })
    .flatten({ background: '#ffffff' }).png().toBuffer();
  const x = pad + (i % cols) * cellW, y = pad + Math.floor(i / cols) * cellH;
  layers.push({ input: buf, left: x, top: y + labelH });
  const label = Buffer.from(`<svg width="${tile}" height="${labelH}"><rect width="100%" height="100%" fill="#222"/><text x="6" y="16" font-family="sans-serif" font-size="14" fill="#fff">#${i}  ${files[i].replace(/ChatGPT Image .*?\(/, '(').slice(0, 10)}</text></svg>`);
  layers.push({ input: label, left: x, top: y });
}

await sharp({ create: { width: W, height: H, channels: 3, background: '#dddddd' } })
  .composite(layers).png({ compressionLevel: 9 }).toFile(out);
console.log(`montage ${out} — ${files.length} tiles, ${W}x${H}`);
