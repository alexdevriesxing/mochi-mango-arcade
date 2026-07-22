#!/usr/bin/env node
// Cast the remaining orphan characters into games by game type.
//
// Many of the unused characters are named for a mechanic rather than a
// universe -- Merge Molly, Tile Spirit Lin, Orbit Defender, Brock Blocks --
// which is a much stronger signal about where they belong than name similarity
// to an existing mascot. This pairs those orphans with mascots whose games run
// on the matching engine, preferring mascots that carry the most games.
//
//   node scripts/propose-sidekick-casting.mjs

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { speciesCompatible } from './lib/creatures.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const ATLAS_DIR = join(ROOT, 'public/assets/images/sprites/atlas');

const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Name fragments that betray which mechanic a character was drawn for.
const MODE_HINTS = {
  merge: ['merge', 'molly'],
  match3: ['tile', 'gem', 'jewel', 'jade', 'mosaic', 'lin'],
  breakout: ['block', 'brick', 'brock'],
  helix: ['pogo', 'spiral', 'helix', 'hoop'],
  asteroids: ['orbit', 'defender', 'astro', 'starfall', 'galaxy', 'comet', 'meteor', 'nebula'],
  pipeline: ['bolt', 'gear', 'pipe', 'circuit', 'wire'],
  cannon: ['cannon', 'trix', 'titan', 'blast'],
  bubbleshooter: ['bubble', 'bloop', 'sweetpop', 'poppi'],
  idleclicker: ['miner', 'mica', 'harvest', 'farmer', 'treasure', 'taro'],
  board: ['egbert', 'panya', 'clover', 'dice', 'domino'],
  doodlejump: ['jump', 'juno', 'hop'],
  fishing: ['coralia', 'riptide', 'dolphin', 'snail', 'shelly', 'tide'],
  racing: ['dashley', 'turbo', 'rally', 'dash'],
  rhythm: ['waddle', 'beat', 'yarn', 'kiki'],
  stacker: ['stack', 'tower'],
  shooter: ['patrol', 'skyler', 'ranger'],
};

function main() {
  const games = JSON.parse(readFileSync(join(ROOT, 'public/assets/data/games.json'), 'utf8'));
  const proposal = JSON.parse(readFileSync(join(ROOT, 'docs/mascot-remap-proposal.json'), 'utf8'));
  const index = JSON.parse(readFileSync(join(ATLAS_DIR, 'index.json'), 'utf8'));
  const aliases = existsSync(join(ATLAS_DIR, 'aliases.json'))
    ? JSON.parse(readFileSync(join(ATLAS_DIR, 'aliases.json'), 'utf8'))
    : {};

  const built = new Set(index);
  const orphans = proposal.unmatchedOrphans
    .concat(proposal.proposals.filter((p) => p.confidence < 0.6).map((p) => ({ sheet: p.sheet, character: p.character })))
    .map((o) => {
      const name = o.character.toLowerCase();
      const modes = Object.entries(MODE_HINTS)
        .filter(([, words]) => words.some((w) => name.includes(w)))
        .map(([mode]) => mode);
      return { ...o, slug: slugify(o.character), modes };
    })
    .filter((o) => o.modes.length);

  // Mascots that still have no art of their own and no alias.
  const uncovered = new Map();
  for (const g of games) {
    if (!g.mascot) continue;
    const k = slugify(g.mascot);
    if (built.has(k) || aliases[k]) continue;
    if (!uncovered.has(k)) uncovered.set(k, { mascot: g.mascot, slug: k, games: [], engines: new Set() });
    const u = uncovered.get(k);
    u.games.push({ slug: g.slug, title: g.title, engine: g.engine });
    u.engines.add(g.engine);
  }

  const tokens = (s) => slugify(s).split('-').filter((t) => t.length > 2);

  const pairs = [];
  for (const o of orphans) {
    for (const u of uncovered.values()) {
      const shared = o.modes.filter((m) => u.engines.has(m));
      if (!shared.length) continue;
      // Matching the mechanic is not enough: the game names its mascot on
      // screen, so a dolphin standing in for a turtle still reads as wrong art.
      if (!speciesCompatible(tokens(o.character), tokens(u.mascot))) continue;
      pairs.push({ o, u, mode: shared[0], weight: u.games.length });
    }
  }
  // Most games first, so the strongest characters land on the widest surfaces.
  pairs.sort((a, b) => b.weight - a.weight || a.o.slug.localeCompare(b.o.slug));

  const usedOrphans = new Set(), usedMascots = new Set();
  const casting = [];
  for (const { o, u, mode } of pairs) {
    if (usedOrphans.has(o.slug) || usedMascots.has(u.slug)) continue;
    usedOrphans.add(o.slug); usedMascots.add(u.slug);
    casting.push({ sheet: o.sheet, character: o.character, spriteSlug: o.slug, mascot: u.mascot, mascotSlug: u.slug, mode, games: u.games });
  }

  writeFileSync(join(ROOT, 'docs/sidekick-casting.json'), JSON.stringify({ generated: new Date().toISOString().slice(0, 10), casting }, null, 2));

  console.log(`orphans with a mode affinity: ${orphans.length}`);
  console.log(`cast: ${casting.length} (covering ${casting.reduce((t, c) => t + c.games.length, 0)} games)\n`);
  for (const c of casting) {
    console.log(`  ${c.character.padEnd(20)} -> "${c.mascot}" [${c.mode}] (${c.games.length} game${c.games.length > 1 ? 's' : ''})`);
  }
  console.log('\nwrote docs/sidekick-casting.json');
}

main();
