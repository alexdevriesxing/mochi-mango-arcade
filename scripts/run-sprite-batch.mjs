#!/usr/bin/env node
// Build one batch of character atlases from the roadmap.
//
// Extracts each sheet straight out of the delivery zip (788MB -- we never keep
// all 146 unpacked), builds its atlas, and refreshes the atlas index the
// runtime reads to know which characters have real art.
//
//   node scripts/run-sprite-batch.mjs <batchNumber> [--zip path]
//   node scripts/run-sprite-batch.mjs --files 010_Bunny_Blossom.png,106_Boba_Bear.png
//
// The --files form builds an explicit set regardless of batch, for when a
// handful of characters are needed ahead of their batch (e.g. the orphans that
// a mascot alias depends on).

import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { buildAtlas } from './build-sprite-atlas.mjs';

const require = createRequire(import.meta.url);
const AdmZip = (() => { try { return require('adm-zip'); } catch { return null; } })();

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const ATLAS_DIR = join(ROOT, 'public/assets/images/sprites/atlas');
const TMP = join(ROOT, '.sprite-tmp');

const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Characters whose generated name collides with a different, real character.
 * The roadmap's fuzzy matcher pairs these wrongly, so they are pinned by hand.
 */
const SLUG_OVERRIDES = {
  '001_Mochi.png': 'mochi',
  '050_Mochi-9.png': 'mochi-9',
  '018_Bao.png': 'bao',
  '035_Chef_Bao.png': 'chef-bao',
};

async function main() {
  const batchNo = Number(process.argv[2]);
  const zipIdx = process.argv.indexOf('--zip');
  const zipPath = zipIdx >= 0
    ? process.argv[zipIdx + 1]
    : join(ROOT, 'mochi_mango_146_spritesheets.zip');

  const filesIdx = process.argv.indexOf('--files');
  const roadmap = JSON.parse(readFileSync(join(ROOT, 'docs/sprite-roadmap.json'), 'utf8'));

  let batch;
  if (filesIdx >= 0) {
    batch = { n: 'adhoc', files: process.argv[filesIdx + 1].split(',').map((s) => s.trim()).filter(Boolean) };
  } else {
    batch = roadmap.batches.find((b) => b.n === batchNo);
    if (!batch) {
      console.error(`no batch ${batchNo}; roadmap has 1..${roadmap.batches.length}`);
      process.exit(1);
    }
  }
  if (!AdmZip) {
    console.error('adm-zip is required: npm i -D adm-zip');
    process.exit(1);
  }
  if (!existsSync(zipPath)) {
    console.error(`spritesheet zip not found: ${zipPath}`);
    process.exit(1);
  }

  mkdirSync(TMP, { recursive: true });
  mkdirSync(ATLAS_DIR, { recursive: true });

  const zip = new AdmZip(zipPath);
  const entries = new Map(zip.getEntries().filter((e) => !e.isDirectory).map((e) => [e.name, e]));

  const results = [];
  for (const file of batch.files) {
    const entry = entries.get(file);
    if (!entry) { console.warn(`  ! missing from zip: ${file}`); continue; }

    const sheetPath = join(TMP, file);
    writeFileSync(sheetPath, entry.getData());

    const slug = SLUG_OVERRIDES[file] || slugify(file.replace(/^\d+_/, '').replace(/\.png$/, ''));
    try {
      const r = await buildAtlas(sheetPath, slug, ATLAS_DIR);
      results.push(r);
      console.log(`  ${slug}: ${r.frames} frames, ${r.cols}x${r.rows} @ ${r.cellW}x${r.cellH}`);
    } catch (err) {
      console.error(`  ! ${file}: ${err.message}`);
    } finally {
      rmSync(sheetPath, { force: true });
    }
  }

  // Rebuild the index from what is actually on disk, so re-running a batch or
  // building them out of order can never leave the index describing the wrong set.
  const slugs = (await readdir(ATLAS_DIR))
    .filter((f) => f.endsWith('.webp'))
    .map((f) => f.replace(/\.webp$/, ''))
    .sort();
  writeFileSync(join(ATLAS_DIR, 'index.json'), JSON.stringify(slugs));

  rmSync(TMP, { recursive: true, force: true });
  console.log(`\nbatch ${batchNo}: built ${results.length}/${batch.files.length}; atlas index now lists ${slugs.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
