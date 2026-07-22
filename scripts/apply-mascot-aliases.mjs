#!/usr/bin/env node
// Turn reviewed remap proposals into sprite aliases.
//
// Renaming a mascot in games.json would ripple into titles, descriptions and
// URLs that already reference the old name, so instead we map the game's
// existing mascot slug onto the atlas of the adopted character. The game keeps
// its copy; it just gains real art. Reverting means deleting an entry here.
//
// Only pairings whose species already agree survive scripts/propose-mascot-remap.mjs,
// so an alias never swaps one creature for another.
//
//   node scripts/apply-mascot-aliases.mjs [--min 0.6]

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const ATLAS_DIR = join(ROOT, 'public/assets/images/sprites/atlas');

/**
 * Mechanic-based casting (scripts/propose-sidekick-casting.mjs) proposed 25
 * pairings, but checking them against the actual art rejected most: the
 * unused characters are largely humanoid while the mascots they would stand in
 * for are animals -- a girl cast as "Gemma Gerbil", an astronaut kid as "Orbit
 * Otter". Name-based species checks cannot catch that, because those character
 * names contain no creature word at all.
 *
 * These are the pairings that survived looking at them. Everything else keeps
 * the procedural vector character, which speciesOf() already themes to the
 * mascot's real species -- a correct vector animal beats wrong real art.
 */
const APPROVED_CASTING = new Set([
  'bloopette',          // Bloop family variant, stands in for Bloop Axolotl
  'delphie-dolphin',    // sea character into a fishing game
  'hattie-harvest',     // harvest/cooking theme, humanoid like Mochi Chef
  'skyler-patrol',      // humanoid, no species claim on either side
  'tile-spirit-lin',    // humanoid spirit, no species claim on either side
]);

function main() {
  const minIdx = process.argv.indexOf('--min');
  const MIN = minIdx >= 0 ? Number(process.argv[minIdx + 1]) : 0.6;

  const proposal = JSON.parse(readFileSync(join(ROOT, 'docs/mascot-remap-proposal.json'), 'utf8'));
  const index = JSON.parse(readFileSync(join(ATLAS_DIR, 'index.json'), 'utf8'));
  const built = new Set(index);

  const aliases = {};
  const skipped = [];

  for (const p of proposal.proposals) {
    if (p.confidence < MIN) { skipped.push({ ...p, why: `confidence ${p.confidence} < ${MIN}` }); continue; }
    // The adopted character's atlas has to exist before an alias can point at it.
    if (!built.has(p.spriteSlug)) { skipped.push({ ...p, why: 'atlas not built yet' }); continue; }
    if (built.has(p.currentSlug)) { skipped.push({ ...p, why: 'mascot already has its own atlas' }); continue; }
    aliases[p.currentSlug] = p.spriteSlug;
  }

  // Fold in the hand-approved mechanic-based casting.
  const castingPath = join(ROOT, 'docs/sidekick-casting.json');
  if (existsSync(castingPath)) {
    for (const c of JSON.parse(readFileSync(castingPath, 'utf8')).casting) {
      if (!APPROVED_CASTING.has(c.spriteSlug)) continue;
      if (!built.has(c.spriteSlug)) { skipped.push({ currentSlug: c.mascotSlug, why: `casting: ${c.spriteSlug} atlas not built` }); continue; }
      if (built.has(c.mascotSlug) || aliases[c.mascotSlug]) continue;
      aliases[c.mascotSlug] = c.spriteSlug;
    }
  }

  writeFileSync(join(ATLAS_DIR, 'aliases.json'), JSON.stringify(aliases, null, 2));

  const games = JSON.parse(readFileSync(join(ROOT, 'public/assets/data/games.json'), 'utf8'));
  const slugify = (s) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const covered = games.filter((g) => g.mascot && aliases[slugify(g.mascot)]).length;

  console.log(`aliases written: ${Object.keys(aliases).length} (covering ${covered} games)`);
  for (const [from, to] of Object.entries(aliases)) console.log(`  ${from}  ->  ${to}`);
  if (skipped.length) {
    console.log(`\nskipped ${skipped.length}:`);
    skipped.forEach((s) => console.log(`  ${s.currentSlug}: ${s.why}`));
  }
  console.log(`\nwrote ${join('public/assets/images/sprites/atlas', 'aliases.json')}`);
}

main();
