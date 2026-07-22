#!/usr/bin/env node
// Audit the built character atlases and rebuild any that came out wrong.
//
// The delivered sheets are not uniform: most are chroma-keyed to alpha=0, a
// handful sit on a painted backdrop, and at least one file is corrupt. A sheet
// that fails segmentation still produces a technically-valid one-frame atlas,
// which would silently freeze that character everywhere it appears -- so this
// checks frame counts rather than mere file existence.
//
//   node scripts/verify-sprite-atlases.mjs [--fix]

import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { buildAtlas } from './build-sprite-atlas.mjs';

const require = createRequire(import.meta.url);
const AdmZip = require('adm-zip');

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const ATLAS_DIR = join(ROOT, 'public/assets/images/sprites/atlas');
const TMP = join(ROOT, '.sprite-tmp');
const MIN_VIABLE_FRAMES = 12;

async function main() {
  const fix = process.argv.includes('--fix');
  const zipPath = join(ROOT, 'mochi_mango_146_spritesheets.zip');

  const roadmap = JSON.parse(readFileSync(join(ROOT, 'docs/sprite-roadmap.json'), 'utf8'));
  const bySlug = new Map();
  for (const b of roadmap.batches) for (const f of b.files) bySlug.set(f, b.n);

  // index.json and aliases.json live alongside the per-character manifests.
  const SIDECARS = new Set(['index.json', 'aliases.json']);
  const manifests = readdirSync(ATLAS_DIR).filter((f) => f.endsWith('.json') && !SIDECARS.has(f));
  const bad = [];
  for (const f of manifests) {
    const m = JSON.parse(readFileSync(join(ATLAS_DIR, f), 'utf8'));
    const count = m.frames.length;
    if (count < MIN_VIABLE_FRAMES) bad.push({ slug: m.slug, frames: count });
  }

  console.log(`atlases: ${manifests.length}`);
  console.log(`suspect (under ${MIN_VIABLE_FRAMES} frames): ${bad.length}`);
  bad.forEach((b) => console.log(`  ${b.slug}: ${b.frames} frame(s)`));

  if (!fix || !bad.length) {
    if (bad.length) console.log('\nre-run with --fix to rebuild these');
    return;
  }

  const zip = new AdmZip(zipPath);
  const entries = new Map(zip.getEntries().filter((e) => !e.isDirectory).map((e) => [e.name, e]));
  const slugify = (s) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  mkdirSync(TMP, { recursive: true });
  const stillBad = [];

  for (const { slug } of bad) {
    const file = [...entries.keys()].find(
      (n) => slugify(n.replace(/^\d+_/, '').replace(/\.png$/, '')) === slug
    );
    if (!file) { stillBad.push({ slug, reason: 'no source sheet' }); continue; }

    const sheetPath = join(TMP, file);
    writeFileSync(sheetPath, entries.get(file).getData());
    try {
      const r = await buildAtlas(sheetPath, slug, ATLAS_DIR);
      console.log(`  rebuilt ${slug}: ${r.frames} frames`);
    } catch (err) {
      stillBad.push({ slug, reason: err.message });
      console.error(`  ! ${slug}: ${err.message}`);
    } finally {
      rmSync(sheetPath, { force: true });
    }
  }

  rmSync(TMP, { recursive: true, force: true });

  const slugs = readdirSync(ATLAS_DIR).filter((f) => f.endsWith('.webp')).map((f) => f.replace(/\.webp$/, '')).sort();
  writeFileSync(join(ATLAS_DIR, 'index.json'), JSON.stringify(slugs));

  console.log(`\nrepaired ${bad.length - stillBad.length}/${bad.length}`);
  if (stillBad.length) {
    console.log('needs manual handling:');
    stillBad.forEach((s) => console.log(`  ${s.slug}: ${s.reason}`));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
