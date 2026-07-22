#!/usr/bin/env node
// Turn a sliced character spritesheet into a runtime atlas + manifest.
//
// Every pose is normalised into a uniform cell, anchored bottom-centre so the
// character's feet stay planted from frame to frame -- without that, poses of
// differing height make the mascot bob a few pixels every time the animation
// advances. One shared scale is applied across the whole sheet so the character
// never changes size between animations.
//
//   node scripts/build-sprite-atlas.mjs <sheet.png> <slug> [--outDir dir]
//
// Writes <outDir>/<slug>.webp and <outDir>/<slug>.json.

import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { sliceSheet, frameSource } from './slice-spritesheet.mjs';

const DEFAULT_OUT = 'public/assets/images/sprites/atlas';
// How tall a typical pose should render in the atlas. The engine scales to fit
// the play area, so this only needs to be sharp on a high-DPI phone.
const TARGET_POSE_H = 180;
// A handful of poses are FX blowouts (a summoning circle, a full-width dash
// trail). Letting them set the cell size would waste most of the atlas, so past
// this multiple of the typical pose they are scaled down to fit instead.
const MAX_CELL_RATIO = 1.6;
const WEBP_QUALITY = 88;
// Every well-formed sheet carries dozens of poses; a result in the single
// digits means segmentation failed rather than the character being sparse.
const MIN_VIABLE_FRAMES = 12;

/**
 * Row order is consistent across the delivered sheets, but the number of rows
 * is not -- a 7-row sheet drops the dash and carry rows a 9-row sheet has. Map
 * from the end for the trailing rows (emotes and face closeups are always last)
 * and from the start for the locomotion rows.
 */
function nameRows(rowCount) {
  const head = ['idle', 'walk', 'run', 'jump'];
  const tail = ['emote', 'face'];
  const names = [];
  for (let i = 0; i < rowCount; i++) {
    if (i < head.length && i < rowCount - tail.length) names.push(head[i]);
    else if (i >= rowCount - tail.length) names.push(tail[i - (rowCount - tail.length)]);
    else names.push('action');
  }
  // Disambiguate repeats ("action", "action" -> "action", "action2").
  const seen = new Map();
  return names.map((n) => {
    const k = (seen.get(n) || 0) + 1;
    seen.set(n, k);
    return k === 1 ? n : `${n}${k}`;
  });
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

export async function buildAtlas(sheetPath, slug, outDir = DEFAULT_OUT) {
  const { frames, cleaned } = await sliceSheet(sheetPath);
  // A sheet that yields almost nothing has not been segmented, it has failed --
  // usually an unexpected delivery format. Fail loudly instead of shipping a
  // one-frame atlas that silently replaces the character everywhere.
  if (frames.length < MIN_VIABLE_FRAMES) {
    throw new Error(`only ${frames.length} frame(s) found in ${sheetPath} — sheet likely needs manual handling`);
  }

  const scale = Math.min(1, TARGET_POSE_H / median(frames.map((f) => f.h)));

  // Cell is the largest pose, capped so FX outliers cannot bloat the sheet.
  const scaledW = frames.map((f) => f.w * scale);
  const scaledH = frames.map((f) => f.h * scale);
  const limitW = median(scaledW) * MAX_CELL_RATIO;
  const limitH = median(scaledH) * MAX_CELL_RATIO;
  const cellW = Math.ceil(Math.min(Math.max(...scaledW), limitW));
  const cellH = Math.ceil(Math.min(Math.max(...scaledH), limitH));

  const rowCount = Math.max(...frames.map((f) => f.row)) + 1;
  const colCount = Math.max(...frames.map((f) => f.col)) + 1;
  const rowNames = nameRows(rowCount);

  const src = frameSource(sheetPath, cleaned);
  const composites = [];
  const manifestFrames = [];

  for (const f of frames) {
    // Fit inside the cell, preserving aspect; only the FX outliers actually shrink.
    const fit = Math.min(scale, cellW / f.w, cellH / f.h);
    const w = Math.max(1, Math.round(f.w * fit));
    const h = Math.max(1, Math.round(f.h * fit));

    const buf = await src
      .clone()
      .extract({ left: f.x, top: f.y, width: f.w, height: f.h })
      .resize(w, h, { fit: 'fill' })
      .png()
      .toBuffer();

    // Bottom-centre anchor inside the cell.
    const left = f.col * cellW + Math.round((cellW - w) / 2);
    const top = f.row * cellH + (cellH - h);
    composites.push({ input: buf, left, top });
    manifestFrames.push({ row: f.row, col: f.col, w, h });
  }

  await mkdir(outDir, { recursive: true });

  await sharp({
    create: { width: colCount * cellW, height: rowCount * cellH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composites)
    .webp({ quality: WEBP_QUALITY, alphaQuality: 100 })
    .toFile(join(outDir, `${slug}.webp`));

  const anims = {};
  rowNames.forEach((name, row) => {
    const count = frames.filter((f) => f.row === row).length;
    if (count) anims[name] = { row, count, fps: name === 'idle' || name === 'face' ? 6 : 10 };
  });

  const manifest = { slug, cell: { w: cellW, h: cellH }, cols: colCount, rows: rowCount, anims, frames: manifestFrames };
  await writeFile(join(outDir, `${slug}.json`), JSON.stringify(manifest));

  return { slug, frames: frames.length, cellW, cellH, cols: colCount, rows: rowCount, anims: Object.keys(anims) };
}

async function main() {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf('--outDir');
  const outDir = outIdx >= 0 ? args[outIdx + 1] : DEFAULT_OUT;
  const [sheetPath, slug] = args.filter((a, i) => !a.startsWith('--') && i !== outIdx + 1);
  if (!sheetPath || !slug) {
    console.error('usage: node scripts/build-sprite-atlas.mjs <sheet.png> <slug> [--outDir dir]');
    process.exit(1);
  }
  const r = await buildAtlas(sheetPath, slug, outDir);
  console.log(`${r.slug}: ${r.frames} frames, ${r.cols}x${r.rows} @ ${r.cellW}x${r.cellH} -> [${r.anims.join(', ')}]`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
