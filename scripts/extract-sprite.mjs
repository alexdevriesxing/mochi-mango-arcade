/**
 * Extract a clean transparent sprite from a character sheet by cropping one
 * pose and removing the background with an edge flood-fill (so a white/cream
 * character keeps its interior whites — only background touching the border
 * is made transparent). Verify results by viewing the output PNG.
 *
 * Usage:
 *   node scripts/extract-sprite.mjs <sheet.png> <out.png> <left> <top> <w> <h> [tol] [size]
 */
import sharp from '../node_modules/sharp/lib/index.js';

const [, , src, out, L, T, W, H, TOL = '38', SIZE = '360'] = process.argv;
const left = +L, top = +T, w = +W, h = +H, tol = +TOL, size = +SIZE;

const { data, info } = await sharp(src)
  .extract({ left, top, width: w, height: h })
  .ensureAlpha()
  .raw().toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;           // channels = 4
const idx = (x, y) => (y * width + x) * channels;

// seed flood fill from every border pixel; remove pixels within `tol` of their
// neighbour background colour (tolerant region grow).
const bg = new Uint8Array(width * height);
const stack = [];
const seedColors = [];
for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1); }
for (let y = 0; y < height; y++) { push(0, y); push(width - 1, y); }
function push(x, y) { const p = y * width + x; if (!bg[p]) { bg[p] = 1; stack.push(p); const i = idx(x, y); seedColors.push([data[i], data[i + 1], data[i + 2]]); } }

let head = 0;
while (head < stack.length) {
  const p = stack[head]; const [br, bgc, bb] = seedColors[head]; head++;
  const x = p % width, y = (p / width) | 0;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
    const np = ny * width + nx; if (bg[np]) continue;
    const ni = idx(nx, ny);
    // compare against the FIXED origin seed colour (not the neighbour) so the
    // fill cannot drift across a smooth gradient into the shaded character body.
    if (Math.abs(data[ni] - br) + Math.abs(data[ni + 1] - bgc) + Math.abs(data[ni + 2] - bb) < tol * 3) {
      bg[np] = 1; stack.push(np); seedColors.push([br, bgc, bb]);
    }
  }
}
// apply alpha
for (let p = 0; p < width * height; p++) if (bg[p]) data[p * channels + 3] = 0;

// keep only the largest connected foreground component — drops the floating
// sparkle/confetti decorations and the pose label text that surround each pose.
const label = new Int32Array(width * height).fill(-1);
const comps = [];
for (let start = 0; start < width * height; start++) {
  if (bg[start] || label[start] !== -1) continue;
  const id = comps.length; let size = 0; const q = [start]; label[start] = id; let h = 0;
  while (h < q.length) {
    const p = q[h++]; size++;
    const x = p % width, y = (p / width) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const np = ny * width + nx; if (bg[np] || label[np] !== -1) continue;
      label[np] = id; q.push(np);
    }
  }
  comps.push(size);
}
if (comps.length) {
  let best = 0; for (let i = 1; i < comps.length; i++) if (comps[i] > comps[best]) best = i;
  const keepMin = comps[best] * (+process.env.KEEP || 0.18);  // also keep sizeable attached-looking parts
  for (let p = 0; p < width * height; p++) {
    const id = label[p];
    if (id !== -1 && id !== best && comps[id] < keepMin) data[p * channels + 3] = 0;
  }
}

await sharp(data, { raw: { width, height, channels } })
  .trim({ threshold: 10 })
  .resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true })
  .png({ compressionLevel: 9, quality: 90 })
  .toFile(out);

const m = await sharp(out).metadata();
console.log(`wrote ${out} ${m.width}x${m.height}`);
