#!/usr/bin/env node
// Register the Petroman universe and its three standalone games.
//
// These ship as their own bundles under public/play/<slug>/game/ rather than
// running on the shared engine, so they are wired like the other iframe games:
// an entry in games.json, a universe for the cards and filters, and a slug in
// IFRAME_GAMES so the play page knows not to mount mmengine for them.
//
// Safe to re-run: entries are matched by slug and replaced rather than appended.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const DATA = join(ROOT, 'public/assets/data');

const UNIVERSE_KEY = 'petroman';
const UNIVERSE = {
  name: 'Petroman Petro City',
  color: '#2f8fff',
  accent: '#ffd23f',
  description: 'A hand-drawn industrial skyline where Petroman purifies the smog of Petro City.',
};

const RELEASE = '2026-07-22';

const GAMES = [
  {
    slug: 'petroman-reactor-rush',
    title: 'Petroman: Reactor Rush',
    genre: 'Arcade Platformer',
    mascot: 'Petroman',
    engine: 'platformer',
    description: 'Blast across the Petro City skyline with a twin-boost reactor belt. Secure unstable energy cores in sequence, build huge Spark Chains, dodge Smoglets and Volt Hawks, then trigger Purifier Mode to clean the sky.',
    objective: 'Collect every energy core in order and clear all eight stages without losing your Spark Chain.',
    signatureAbility: 'Purifier Mode',
  },
  {
    slug: 'petroman-bubble-blitz',
    title: 'Petroman: Bubble Blitz',
    genre: 'Arcade Platformer',
    mascot: 'Petroman',
    engine: 'platformer',
    description: 'Petroman cleans up Mango Metro one bubble at a time. Trap smog creatures in clean-air bubbles, pop them before they escape, chain score multipliers and defeat the Smog King across twelve handcrafted stages.',
    objective: 'Trap and pop every smog creature on each stage, then bring down the Smog King.',
    signatureAbility: 'Clean-Air Bubble',
  },
  {
    slug: 'petroman-blast-zone',
    title: 'Petroman: Blast Zone',
    genre: 'Arcade Maze',
    mascot: 'Petroman',
    engine: 'maze',
    description: 'Petroman clears Petro City with Purifier Charges. Blow through soft cover, set off chain reactions, uncover hidden upgrades and reactor cores across six hand-painted worlds.',
    objective: 'Clear every smog enemy on a stage, then reach the reactor core exit.',
    signatureAbility: 'Purifier Charge',
  },
  {
    slug: 'petroman-core-digger',
    title: 'Petroman: Core Digger Deluxe',
    genre: 'Arcade',
    mascot: 'Petroman',
    engine: 'maze',
    description: 'A hand-drawn dig-and-chase arcade adventure through Petro City’s core network. Tunnel out huge caverns, fire purifier orbs, drop reactor drums on pursuers and clear every stage your own way.',
    objective: 'Clear each cavern by purifying every pursuer or collecting the full core payload.',
    signatureAbility: 'Purifier Orb',
  },
];

function main() {
  // 1. Universe
  const universesPath = join(DATA, 'universes.json');
  const universes = JSON.parse(readFileSync(universesPath, 'utf8'));
  universes[UNIVERSE_KEY] = UNIVERSE;
  writeFileSync(universesPath, JSON.stringify(universes, null, 2));

  // 2. Games
  const gamesPath = join(DATA, 'games.json');
  const games = JSON.parse(readFileSync(gamesPath, 'utf8'));
  const bySlug = new Map(games.map((g) => [g.slug, g]));
  let nextId = Math.max(...games.map((g) => Number(g.id) || 0)) + 1;

  for (const spec of GAMES) {
    const existing = bySlug.get(spec.slug);
    const entry = {
      id: existing?.id ?? nextId++,
      title: spec.title,
      slug: spec.slug,
      universe: UNIVERSE_KEY,
      universeName: UNIVERSE.name,
      genre: spec.genre,
      mascot: spec.mascot,
      description: spec.description,
      image: `/assets/images/games/${spec.slug}.jpg`,
      detailUrl: `/games/${spec.slug}/`,
      playUrl: `/play/${spec.slug}/`,
      featured: true,
      new: true,
      status: 'Playable',
      engine: spec.engine,
      built: true,
      author: 'Fire Dragon Interactive',
      version: '1.0',
      releaseDate: RELEASE,
      lastUpdated: RELEASE,
      objective: spec.objective,
      signatureAbility: spec.signatureAbility,
    };
    if (existing) Object.assign(existing, entry);
    else games.push(entry);
  }

  writeFileSync(gamesPath, JSON.stringify(games, null, 2));

  console.log(`universe "${UNIVERSE_KEY}" registered`);
  console.log(`games now: ${games.length}`);
  for (const spec of GAMES) console.log(`  ${spec.slug} -> ${bySlug.has(spec.slug) ? 'updated' : 'added'}`);
}

main();
