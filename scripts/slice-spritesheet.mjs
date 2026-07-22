#!/usr/bin/env node
// Slice a Mochi Mango character spritesheet into individual frames.
//
// The source sheets are 1920x1920 RGBA with the background already at alpha=0
// (the leftover green RGB is chroma-key residue, not a real background). Poses
// are laid out in semantic rows -- idle, walk, run, jump/dash, action, emote,
// face -- but counts, sizes and gutters all vary sheet to sheet, and on some
// sheets a tall pose bleeds vertically into the row below.
//
// So we do not project onto the axes and look for empty gutters: a single
// overlapping row collapses that whole approach. Instead we label connected
// blobs of ink, attach each blob's loose satellites (dust puffs, sparkles,
// held props), then group the results into rows. Only genuinely touching poses
// need the valley split at the end.
//
//   node scripts/slice-spritesheet.mjs <sheet.png> <outDir> [--contact]

import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';

// A pixel counts as ink once it is more than faintly visible; the chroma spill
// left behind by the render leaves a halo of very low alpha we do not want.
const ALPHA_INK = 24;
// Some sheets came back over a soft, semi-transparent painted haze instead of a
// clean key. That haze sits well above the usual ink floor, so at the default
// threshold it bridges every pose and the whole sheet labels as one blob. When
// enough of the sheet is partially transparent we raise the bar to "nearly
// solid", which is what the characters themselves are.
const HAZY_SHARE = 0.1;
const ALPHA_INK_HAZY = 200;
// Anything smaller than this is confetti or a stray sparkle, not a pose.
const MIN_FRAME_W = 40;
const MIN_FRAME_H = 40;
// Blobs at least this big are treated as a pose in their own right; smaller
// ones are satellites looking for a body to belong to.
const SEED_W = MIN_FRAME_W * 0.6;
const SEED_H = MIN_FRAME_H * 0.6;
// Ignore specks below this many pixels outright.
const NOISE_AREA = 12;
// How far a satellite may sit from a pose and still be considered part of it.
const SATELLITE_DIST = 26;
// Two seeds overlapping horizontally by more than this share of the narrower
// one are the same character split by a transparent seam, not two poses.
const SEED_MERGE_OVERLAP = 0.5;
// Where two poses touch, the contact is thin next to the bodies around it. A
// column holding under this share of the run's average ink reads as a seam.
const VALLEY_RATIO = 0.12;
// Not every sheet arrived chroma-keyed. A few were delivered over a painted
// backdrop with no usable alpha at all; below this share of transparent pixels
// we stop trusting alpha and recover the background by colour instead.
const MIN_TRANSPARENT_SHARE = 0.05;
// Squared RGB distance within which a pixel counts as "the same colour" as the
// sampled backdrop. Generous, because these backdrops carry a soft gradient.
const BG_TOLERANCE_SQ = 46 * 46;

/** Union-find over blob labels. */
function makeUnionFind(n) {
  const parent = new Int32Array(n);
  for (let i = 0; i < n; i++) parent[i] = i;
  const find = (x) => {
    let r = x;
    while (parent[r] !== r) r = parent[r];
    while (parent[x] !== r) { const next = parent[x]; parent[x] = r; x = next; }
    return r;
  };
  return { find, union: (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[rb] = ra; } };
}

/**
 * Label 8-connected runs of ink and return one bounding box per blob.
 * Classic two-pass: provisional labels scanning forward, then resolve.
 */
function labelBlobs(alpha, W, H, ink) {
  const labels = new Int32Array(W * H);
  const uf = makeUnionFind(Math.floor((W * H) / 4) + 2);
  let next = 1;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (alpha[i] < ink) continue;
      // Neighbours already visited: W, NW, N, NE.
      let best = 0;
      for (const [dx, dy] of [[-1, 0], [-1, -1], [0, -1], [1, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W) continue;
        const nl = labels[ny * W + nx];
        if (!nl) continue;
        if (!best) best = nl; else uf.union(best, nl);
      }
      labels[i] = best || next++;
    }
  }

  const boxes = new Map();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const l = labels[y * W + x];
      if (!l) continue;
      const r = uf.find(l);
      let b = boxes.get(r);
      if (!b) boxes.set(r, (b = { x0: x, y0: y, x1: x, y1: y, area: 0 }));
      if (x < b.x0) b.x0 = x;
      if (x > b.x1) b.x1 = x;
      if (y < b.y0) b.y0 = y;
      if (y > b.y1) b.y1 = y;
      b.area++;
    }
  }
  return [...boxes.values()];
}

const boxW = (b) => b.x1 - b.x0 + 1;
const boxH = (b) => b.y1 - b.y0 + 1;
const absorb = (a, b) => {
  a.x0 = Math.min(a.x0, b.x0); a.y0 = Math.min(a.y0, b.y0);
  a.x1 = Math.max(a.x1, b.x1); a.y1 = Math.max(a.y1, b.y1);
  a.area += b.area;
};
/** Gap between two boxes; 0 when they touch or overlap. */
const gap = (a, b) => Math.hypot(
  Math.max(0, Math.max(a.x0 - b.x1, b.x0 - a.x1)),
  Math.max(0, Math.max(a.y0 - b.y1, b.y0 - a.y1))
);

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

/**
 * Recover an alpha mask for a sheet that arrived without one.
 *
 * Flood-fills inward from the border rather than deleting every pixel matching
 * the backdrop colour, so a character's own dark clothing survives even when it
 * happens to sit near the backdrop's colour. Writes the cleared pixels back
 * into `rgba` so the crops come out transparent too.
 */
function recoverAlphaFromBackdrop(rgba, W, H, channels) {
  const at = (x, y) => (y * W + x) * channels;

  // Sample the border for the backdrop colour.
  const rs = [], gs = [], bs = [];
  for (let x = 0; x < W; x += 4) {
    for (const y of [0, H - 1]) { const i = at(x, y); rs.push(rgba[i]); gs.push(rgba[i + 1]); bs.push(rgba[i + 2]); }
  }
  for (let y = 0; y < H; y += 4) {
    for (const x of [0, W - 1]) { const i = at(x, y); rs.push(rgba[i]); gs.push(rgba[i + 1]); bs.push(rgba[i + 2]); }
  }
  const bg = [median(rs), median(gs), median(bs)];

  const isBg = (i) => {
    const dr = rgba[i] - bg[0], dg = rgba[i + 1] - bg[1], db = rgba[i + 2] - bg[2];
    return dr * dr + dg * dg + db * db <= BG_TOLERANCE_SQ;
  };

  const visited = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) { stack.push(x, 0, x, H - 1); }
  for (let y = 0; y < H; y++) { stack.push(0, y, W - 1, y); }

  while (stack.length) {
    const y = stack.pop(), x = stack.pop();
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const p = y * W + x;
    if (visited[p]) continue;
    const i = p * channels;
    if (!isBg(i)) continue;
    visited[p] = 1;
    rgba[i + 3] = 0;
    stack.push(x - 1, y, x + 1, y, x, y - 1, x, y + 1);
  }

  const alpha = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) alpha[p] = visited[p] ? 0 : 255;
  return alpha;
}

/** Split a box that swallowed several touching poses, using column ink valleys. */
function valleySplit(box, alpha, W, inkLevel) {
  const width = boxW(box);
  if (width < MIN_FRAME_W * 2) return [box];

  const ink = new Int32Array(width);
  for (let y = box.y0; y <= box.y1; y++) {
    const row = y * W;
    for (let x = box.x0; x <= box.x1; x++) if (alpha[row + x] >= inkLevel) ink[x - box.x0]++;
  }
  const mean = ink.reduce((a, b) => a + b, 0) / width;
  const threshold = Math.max(1, mean * VALLEY_RATIO);

  const cuts = [];
  let vStart = -1;
  for (let i = 0; i < width; i++) {
    if (ink[i] <= threshold) { if (vStart < 0) vStart = i; }
    else if (vStart >= 0) { cuts.push(box.x0 + ((vStart + i - 1) >> 1)); vStart = -1; }
  }

  const out = [];
  let start = box.x0;
  for (const cut of cuts) {
    if (cut - start + 1 >= MIN_FRAME_W && box.x1 - cut >= MIN_FRAME_W) {
      out.push({ ...box, x0: start, x1: cut });
      start = cut + 1;
    }
  }
  out.push({ ...box, x0: start, x1: box.x1 });
  return out;
}

export async function sliceSheet(sheetPath) {
  const { data, info } = await sharp(sheetPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels } = info;

  let alpha = new Uint8Array(W * H);
  let hazy = 0;
  for (let i = 0, p = 0; i < data.length; i += channels, p++) {
    const a = data[i + 3];
    alpha[p] = a;
    if (a > ALPHA_INK && a < 250) hazy++;
  }

  // Pick the ink threshold to suit how this particular sheet was delivered.
  const total = W * H;
  const ink = hazy / total > HAZY_SHARE ? ALPHA_INK_HAZY : ALPHA_INK;

  let transparent = 0;
  for (let p = 0; p < total; p++) if (alpha[p] < ink) transparent++;

  // A few sheets have no usable alpha at all -- a fully painted backdrop.
  let recovered = false;
  if (transparent / total < MIN_TRANSPARENT_SHARE) {
    alpha = recoverAlphaFromBackdrop(data, W, H, channels);
    recovered = true;
  } else if (ink === ALPHA_INK_HAZY) {
    // Clear the haze for real, so the cropped frames come out clean instead of
    // carrying a translucent rectangle of backdrop around the character.
    for (let p = 0; p < total; p++) {
      if (alpha[p] < ink) { data[p * channels + 3] = 0; alpha[p] = 0; }
    }
    recovered = true;
  }

  const blobs = labelBlobs(alpha, W, H, recovered ? ALPHA_INK : ink)
    .filter((b) => b.area >= NOISE_AREA);
  const seeds = blobs.filter((b) => boxW(b) >= SEED_W && boxH(b) >= SEED_H);
  const satellites = blobs.filter((b) => !seeds.includes(b));

  // A character split by a transparent seam shows up as two overlapping seeds.
  seeds.sort((a, b) => a.x0 - b.x0);
  const merged = [];
  for (const s of seeds) {
    const host = merged.find((m) => {
      const overlap = Math.min(m.x1, s.x1) - Math.max(m.x0, s.x0) + 1;
      const vertical = Math.min(m.y1, s.y1) - Math.max(m.y0, s.y0) + 1;
      return overlap > 0 && vertical > 0 &&
        overlap >= SEED_MERGE_OVERLAP * Math.min(boxW(m), boxW(s));
    });
    if (host) absorb(host, s); else merged.push({ ...s });
  }

  // Reunite dust puffs, sparkles and held props with their nearest pose.
  for (const sat of satellites) {
    let best = null, bestD = Infinity;
    for (const m of merged) {
      const d = gap(sat, m);
      if (d < bestD) { bestD = d; best = m; }
    }
    if (best && bestD <= SATELLITE_DIST) absorb(best, sat);
  }

  // Group into rows by vertical centre: sort, then break wherever the step
  // between consecutive centres exceeds half a typical pose height.
  const withCentre = merged.map((b) => ({ ...b, cy: (b.y0 + b.y1) / 2 }));
  withCentre.sort((a, b) => a.cy - b.cy);
  const typicalH = median(withCentre.map(boxH));
  const rows = [];
  let current = [];
  for (const b of withCentre) {
    if (current.length && b.cy - current[current.length - 1].cy > typicalH * 0.5) {
      rows.push(current);
      current = [];
    }
    current.push(b);
  }
  if (current.length) rows.push(current);

  const frames = [];
  rows.forEach((row, rowIndex) => {
    const expanded = row.flatMap((b) => valleySplit(b, alpha, W, recovered ? ALPHA_INK : ink));
    expanded.sort((a, b) => a.x0 - b.x0);
    let col = 0;
    for (const b of expanded) {
      const w = boxW(b), h = boxH(b);
      if (w < MIN_FRAME_W || h < MIN_FRAME_H) continue;
      frames.push({ row: rowIndex, col: col++, x: b.x0, y: b.y0, w, h });
    }
  });

  // When we had to rebuild the alpha ourselves, hand back the cleaned pixels so
  // callers crop from those rather than the opaque original.
  return {
    width: W, height: H, bands: rows.length, frames,
    cleaned: recovered ? { data, width: W, height: H, channels } : null,
  };
}

/** Source to crop frames from: the cleaned buffer when we rebuilt alpha, else the file. */
export function frameSource(sheetPath, cleaned) {
  return cleaned
    ? sharp(cleaned.data, { raw: { width: cleaned.width, height: cleaned.height, channels: cleaned.channels } })
    : sharp(sheetPath).ensureAlpha();
}

async function main() {
  const [sheetPath, outDir] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (!sheetPath || !outDir) {
    console.error('usage: node scripts/slice-spritesheet.mjs <sheet.png> <outDir> [--contact]');
    process.exit(1);
  }
  const contact = process.argv.includes('--contact');

  const { width, height, bands, frames, cleaned } = await sliceSheet(sheetPath);
  await mkdir(outDir, { recursive: true });

  const src = frameSource(sheetPath, cleaned);
  for (const f of frames) {
    await src.clone()
      .extract({ left: f.x, top: f.y, width: f.w, height: f.h })
      .png().toFile(join(outDir, `r${f.row}c${f.col}.png`));
  }

  await writeFile(
    join(outDir, 'frames.json'),
    JSON.stringify({ sheet: basename(sheetPath), width, height, rows: bands, frames }, null, 2)
  );

  const perRow = frames.reduce((acc, f) => ((acc[f.row] = (acc[f.row] || 0) + 1), acc), {});
  console.log(`${basename(sheetPath)}: ${frames.length} frames in ${bands} rows [${Object.values(perRow).join(', ')}]`);

  if (contact) {
    const CELL = 120;
    const cols = Math.max(...Object.values(perRow));
    const composites = [];
    for (const f of frames) {
      composites.push({
        input: await src.clone()
          .extract({ left: f.x, top: f.y, width: f.w, height: f.h })
          .resize(CELL - 8, CELL - 8, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png().toBuffer(),
        left: f.col * CELL,
        top: f.row * CELL,
      });
    }
    await sharp({ create: { width: cols * CELL, height: bands * CELL, channels: 4, background: { r: 24, g: 20, b: 34, alpha: 1 } } })
      .composite(composites).png().toFile(join(outDir, '_contact.png'));
    console.log(`  contact sheet -> ${join(outDir, '_contact.png')}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => { console.error(err); process.exit(1); });
}
