#!/usr/bin/env node
// Propose mascot reassignments so orphan spritesheets get adopted by games.
//
// 72 of the 146 delivered characters match no mascot in games.json by exact
// name, but many are near-misses the roadmap's strict matcher rejects --
// "Marshmallow Mecha" vs "Marshmallow Mechas", "Biscotti Bandit" vs "Biscuit
// Bandits". This scores every orphan against every uncovered mascot on stemmed
// token overlap and writes the ranked pairings out for review.
//
// It only PROPOSES. Renaming a mascot changes player-visible text, so nothing
// is written to games.json here.
//
//   node scripts/propose-mascot-remap.mjs [--min 0.4]

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { creatureOf } from './lib/creatures.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Words that carry no identity -- matching on these alone means nothing.
const STOP = new Set(['the', 'of', 'and', 'squad', 'crew', 'club', 'team']);

/** Crude singular stem: enough to pair "mechas" with "mecha". */
const stem = (t) => (t.length > 4 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t);

const tokenise = (s) =>
  slugify(s).split('-').filter((t) => t.length > 2 && !STOP.has(t)).map(stem);

/** Jaccard-ish overlap, biased toward covering the shorter name completely. */
function score(a, b) {
  const ca = creatureOf(a), cb = creatureOf(b);
  if (ca && cb && ca !== cb) return 0; // different species -- never the same character

  const A = new Set(a), B = new Set(b);
  let shared = 0;
  for (const t of A) if (B.has(t)) shared++;
  if (!shared) return 0;
  const base = shared / Math.min(A.size, B.size) * 0.7 + shared / new Set([...A, ...B]).size * 0.3;
  // A matching creature is the strongest signal there is; a match resting only
  // on a shared given name or title is the weakest.
  if (ca && ca === cb) return Math.min(1, base + 0.25);
  return base * 0.8;
}

function main() {
  const minIdx = process.argv.indexOf('--min');
  const MIN = minIdx >= 0 ? Number(process.argv[minIdx + 1]) : 0.4;

  const games = JSON.parse(readFileSync(join(ROOT, 'public/assets/data/games.json'), 'utf8'));
  const roadmap = JSON.parse(readFileSync(join(ROOT, 'docs/sprite-roadmap.json'), 'utf8'));

  const covered = new Set(roadmap.entries.filter((e) => e.mascot).map((e) => e.mascot));
  const orphans = roadmap.entries.filter((e) => !e.mascot);

  // Uncovered mascots, with the games riding on each.
  const uncovered = new Map();
  for (const g of games) {
    if (!g.mascot) continue;
    const k = slugify(g.mascot);
    if (covered.has(k)) continue;
    if (!uncovered.has(k)) uncovered.set(k, { mascot: g.mascot, slug: k, games: [] });
    uncovered.get(k).games.push({ slug: g.slug, title: g.title, engine: g.engine, universe: g.universe });
  }

  const proposals = [];
  const taken = new Set();

  // Best-first across all pairs, so a strong match wins its mascot outright.
  const pairs = [];
  for (const o of orphans) {
    const ot = tokenise(o.name);
    for (const u of uncovered.values()) {
      const s = score(ot, tokenise(u.mascot));
      if (s >= MIN) pairs.push({ o, u, s });
    }
  }
  pairs.sort((a, b) => b.s - a.s || b.u.games.length - a.u.games.length);

  const usedOrphans = new Set();
  for (const { o, u, s } of pairs) {
    if (usedOrphans.has(o.file) || taken.has(u.slug)) continue;
    usedOrphans.add(o.file);
    taken.add(u.slug);
    proposals.push({
      sheet: o.file,
      character: o.name,
      spriteSlug: slugify(o.name),
      currentMascot: u.mascot,
      currentSlug: u.slug,
      confidence: Number(s.toFixed(2)),
      games: u.games,
    });
  }

  const unmatchedOrphans = orphans.filter((o) => !usedOrphans.has(o.file));
  const out = {
    generated: new Date().toISOString().slice(0, 10),
    minConfidence: MIN,
    proposals: proposals.sort((a, b) => b.games.length - a.games.length || b.confidence - a.confidence),
    unmatchedOrphans: unmatchedOrphans.map((o) => ({ sheet: o.file, character: o.name })),
  };
  writeFileSync(join(ROOT, 'docs/mascot-remap-proposal.json'), JSON.stringify(out, null, 2));

  console.log(`orphan sheets: ${orphans.length}`);
  console.log(`proposed pairings: ${proposals.length} (covering ${proposals.reduce((t, p) => t + p.games.length, 0)} games)`);
  console.log(`still unpaired: ${unmatchedOrphans.length}\n`);
  for (const p of proposals) {
    console.log(`  ${p.confidence}  ${p.character}  ->  "${p.currentMascot}"  (${p.games.length} game${p.games.length > 1 ? 's' : ''})`);
  }
  console.log('\nwrote docs/mascot-remap-proposal.json');
}

main();
