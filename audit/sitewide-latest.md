# Mochi Mango Arcade — Sitewide & Game Quality Audit

Generated: 2026-07-22T15:25:59.199Z  
Source: `03ae5a22bd24d29ad3ff78701bd38e9157576414`  
Live target: https://www.mochimangoarcade.com

## Executive summary

- **395 games**, **34 shared engines**, **15 universes**.
- **5 bespoke bundles** versus **390 shared-runtime games**.
- **803 live URLs checked**; **6 failures**. Median **127 ms**, p95 **207 ms**.
- **46 browser play tests**; **4 runtime failures**, **4 tests with errors**.
- Health endpoint: **200**. Unknown route: **404** (expected 404).
- Exact duplicate descriptions: **0**.

## Main conclusion

The largest opportunity is depth, not catalogue size. Shared engines are useful infrastructure, but most titles need authored levels, character-specific mechanics, progression, goals, stronger feedback and distinctive audio/visual behavior. Upgrade the largest engines first, then turn selected flagship titles into bespoke games.

## Core live checks

| Path | Status | ms | Result |
|---|---:|---:|---|
| / | 200 | 246 | OK |
| /api/health | 200 | 184 | OK |
| /games/ | 200 | 231 | OK |
| /universes/ | 200 | 218 | OK |
| /characters/ | 200 | 188 | OK |
| /new-releases/ | 200 | 311 | OK |
| /about/ | 200 | 243 | OK |
| /robots.txt | 200 | 218 | OK |
| /sitemap.xml | 200 | 193 | OK |
| /llms.txt | 200 | 148 | OK |
| /manifest.webmanifest | 200 | 144 | OK |
| /sw.js | 200 | 166 | OK |
| /audit-not-found-1784733861376/ | 404 | 182 | Failed |

## Engine improvement roadmap

| Engine | Games | Shared-runtime | Browser failures | Best next improvement |
|---|---:|---:|---:|---|
| puzzle | 66 | 66 | 0 | Add authored variety, progression and distinctive mechanics. |
| arcade | 64 | 64 | 0 | Add authored variety, progression and distinctive mechanics. |
| runner | 55 | 54 | 0 | Handcraft obstacle sequences, route choices, missions, character abilities and chase/boss stages. |
| management | 22 | 21 | 0 | Add authored variety, progression and distinctive mechanics. |
| board | 16 | 16 | 0 | Add deeper rules, competent AI, match variants, progression and strategic feedback. |
| match3 | 10 | 10 | 0 | Add level objectives, blockers, handcrafted boards, limited moves, boosters and a progression map. |
| shooter | 10 | 10 | 0 | Add enemy archetypes, authored waves, weapons, bosses, hit feedback and stage progression. |
| platformer | 9 | 7 | 2 | Add handcrafted levels, enemies, secrets, checkpoints, bosses and distinct movement abilities. |
| whack | 9 | 9 | 0 | Add multi-phase rounds, target behaviors, combos, hazards and difficulty modes. |
| breakout | 8 | 8 | 0 | Add authored brick layouts, bosses, ball modifiers, stage themes and progression. |
| flappy | 8 | 8 | 0 | Add authored routes, mission goals, abilities, environmental changes and checkpoints. |
| memory | 8 | 8 | 0 | Add themed card effects, multi-stage boards, difficulty curves, streak systems and unlocks. |
| stacker | 8 | 8 | 0 | Add varied physics, objectives, environmental modifiers and structure-specific challenges. |
| maze | 7 | 6 | 1 | Add authored mazes, enemy behaviors, keys, secrets and multi-stage progression. |
| merge | 7 | 7 | 0 | Add meaningful unlocks, themed chains, objectives, limited boards and meta progression. |
| pong | 7 | 7 | 0 | Add opponent AI styles, arenas, modifiers, tournaments and local multiplayer. |
| racing | 7 | 7 | 0 | Add authored tracks, opponents, drifting, lap structure, handling differences and tournaments. |
| bubbleshooter | 6 | 6 | 0 | Add authored formations, ceiling pressure, special bubbles, goals and progression. |
| doodlejump | 6 | 6 | 0 | Add platform archetypes, enemies, level themes, checkpoints and abilities. |
| rhythm | 6 | 6 | 0 | Add authored songs/charts, calibration, difficulty levels, combo feedback and track unlocks. |
| serve | 6 | 6 | 0 | Add recipe chains, customer personalities, upgrades, day progression and recovery states. |
| dodger | 5 | 5 | 0 | Differentiate hazards, scoring rules, stage patterns and power-ups; add phases and mastery goals. |
| idleclicker | 5 | 5 | 0 | Add economy choices, offline progress, upgrade branches, goals and prestige depth. |
| snake | 5 | 5 | 0 | Add maze layouts, objectives, enemies, hazards and character-specific mechanics. |
| tower | 5 | 5 | 0 | Add tower types, upgrades, resistances, authored maps, wave previews and strategic economy. |
| cannon | 4 | 4 | 0 | Add destructible structures, authored puzzles, ammunition types and level grading. |
| helix | 4 | 4 | 0 | Add authored tower sections, hazards, checkpoints, speed changes and skill scoring. |
| pipeline | 4 | 4 | 0 | Add handcrafted puzzles, move limits, pressure systems, special pieces and campaign structure. |
| sports | 4 | 4 | 0 | Add opponents, match states, defensive AI, tournaments, skill shots and progression. |
| archery | 3 | 3 | 0 | Add wind, moving targets, tournaments, equipment and skill-based scoring. |
| asteroids | 3 | 3 | 0 | Add ship upgrades, enemy craft, sectors, bosses, weapons and mission objectives. |
| fishing | 3 | 3 | 0 | Add fish behavior, locations, equipment, collections, weather and progression. |
| gallery | 3 | 3 | 0 | Add authored waves, accuracy grades, weapons, moving scenarios and challenge modes. |
| pinball | 2 | 2 | 0 | Add table-specific mechanisms, missions, multiball, jackpots and persistent score goals. |

## Top 50 games to improve first

| # | Game | Engine | Priority | Findings |
|---:|---|---|---:|---|
| 1 | Petroman: Reactor Rush | platformer | 145 | Live detail failed (404); Live play failed (404); Browser runtime failed on desktop; 1 browser error(s) on desktop |
| 2 | Petroman: Bubble Blitz | platformer | 106 | Live detail failed (404); Live play failed (404); Browser runtime failed on mobile; 1 browser error(s) on mobile |
| 3 | Petroman: Core Digger Deluxe | maze | 106 | Live detail failed (404); Live play failed (404); Browser runtime failed on desktop; 1 browser error(s) on desktop |
| 4 | Bao’s Jade Dragon Rescue | puzzle | 41 | Shared puzzle runtime used by 66 games |
| 5 | Madame Fortuna’s Mirror Match | puzzle | 37 | Shared puzzle runtime used by 66 games |
| 6 | Mushmoo’s Moonlit Match | puzzle | 37 | Shared puzzle runtime used by 66 games |
| 7 | Nine Gates Mahjong Trails | puzzle | 37 | Shared puzzle runtime used by 66 games |
| 8 | The Bubble Tea Bears | puzzle | 37 | Shared puzzle runtime used by 66 games |
| 9 | Bloop Bubble Rescue | arcade | 36 | Shared arcade runtime used by 64 games |
| 10 | Bramble Bear's Honeycomb Match | puzzle | 36 | Shared puzzle runtime used by 66 games |
| 11 | Madame Fortuna's Tarot Memory | puzzle | 36 | Shared puzzle runtime used by 66 games |
| 12 | The Jellybean Knights | arcade | 36 | Shared arcade runtime used by 64 games |
| 13 | Pip's Lily Pad Hop | arcade | 35 | Shared arcade runtime used by 64 games |
| 14 | AstroMochi: Planet Hop | runner | 34 | Shared runner runtime used by 55 games |
| 15 | The Donut Dragon Derby | runner | 34 | Shared runner runtime used by 55 games |
| 16 | Tika Tiger: Traffic Tango | runner | 34 | Shared runner runtime used by 55 games |
| 17 | Finnick Firefly’s Night Garden | puzzle | 33 | Shared puzzle runtime used by 66 games |
| 18 | Hector Hotdog’s Stadium Sprint | puzzle | 33 | Shared puzzle runtime used by 66 games |
| 19 | Madame Fortuna's Crystal Cascade | puzzle | 33 | Shared puzzle runtime used by 66 games |
| 20 | Morpheus's Dreamlight Memory | puzzle | 33 | Shared puzzle runtime used by 66 games |
| 21 | Morpheus's Pillow Tower | puzzle | 33 | Shared puzzle runtime used by 66 games |
| 22 | Puddle & Pip: Memory Meadow | puzzle | 33 | Shared puzzle runtime used by 66 games |
| 23 | Puddle & Pip: Pillow Fort Frenzy | puzzle | 33 | Shared puzzle runtime used by 66 games |
| 24 | Skyrail Stunt Squad | runner | 33 | Shared runner runtime used by 55 games |
| 25 | The Clockwork Cupcake Factory | puzzle | 33 | Shared puzzle runtime used by 66 games |
| 26 | The Spaghetti Yeti | puzzle | 33 | Shared puzzle runtime used by 66 games |
| 27 | Umbra's Midnight Dash | runner | 33 | Shared runner runtime used by 55 games |
| 28 | Umbra’s Shadow Paw Heist | puzzle | 33 | Shared puzzle runtime used by 66 games |
| 29 | Bramble Bear's Beehive Defense | arcade | 32 | Shared arcade runtime used by 64 games |
| 30 | Bubblesaurus Bath Time | arcade | 32 | Shared arcade runtime used by 64 games |
| 31 | Captain Cornflake’s Cereal Sea | arcade | 32 | Shared arcade runtime used by 64 games |
| 32 | Nine Gates: Palace of Winds | puzzle | 32 | Shared puzzle runtime used by 66 games |
| 33 | Pearl Pegasus Cloud Rescue | arcade | 32 | Shared arcade runtime used by 64 games |
| 34 | Pip's Firefly Flight | arcade | 32 | Shared arcade runtime used by 64 games |
| 35 | Puddle & Pip: Acorn Airlift | arcade | 32 | Shared arcade runtime used by 64 games |
| 36 | The Sock Goblin Grand Hotel | arcade | 32 | Shared arcade runtime used by 64 games |
| 37 | Umbra's Moonlit Labyrinth | arcade | 32 | Shared arcade runtime used by 64 games |
| 38 | Umbra's Shadow Blast | arcade | 32 | Shared arcade runtime used by 64 games |
| 39 | Bloop’s Alien Aquarium | arcade | 31 | Shared arcade runtime used by 64 games |
| 40 | Lady Lemon’s Sour Castle | arcade | 31 | Shared arcade runtime used by 64 games |
| 41 | Nine Gates Dragon Boat Dash | arcade | 31 | Shared arcade runtime used by 64 games |
| 42 | Pip & The Cloud Kites | arcade | 31 | Shared arcade runtime used by 64 games |
| 43 | Pip’s Sky Parcel Service | arcade | 31 | Shared arcade runtime used by 64 games |
| 44 | Puddle’s Pajama Parade | arcade | 31 | Shared arcade runtime used by 64 games |
| 45 | Umbra’s Moonlight Maze | arcade | 31 | Shared arcade runtime used by 64 games |
| 46 | Bamboo Sprint | runner | 30 | Shared runner runtime used by 55 games |
| 47 | Baxter Bean & The Coffee Comets | runner | 30 | Shared runner runtime used by 55 games |
| 48 | Cassette Courier | runner | 30 | Shared runner runtime used by 55 games |
| 49 | Chef BaoBao’s Midnight Noodle Run | runner | 30 | Shared runner runtime used by 55 games |
| 50 | Circuit Courier Rush | runner | 30 | Shared runner runtime used by 55 games |

## Browser play tests

| Game | Engine | Viewport | HTTP | Runtime visible | Errors | Overflow |
|---|---|---|---:|---|---:|---|
| Mushmoo’s Moonlit Match | puzzle | desktop | 200 | Yes | 0 | No |
| Bloop Bubble Rescue | arcade | desktop | 200 | Yes | 0 | No |
| Puddle & Pip: Meadow Dash | runner | desktop | 200 | Yes | 0 | No |
| SnackStreet Rush | management | desktop | 200 | Yes | 0 | No |
| Crownlight Chess | board | desktop | 200 | Yes | 0 | No |
| Glitch Garden | match3 | desktop | 200 | Yes | 0 | No |
| Starling Signal Patrol | shooter | desktop | 200 | Yes | 0 | No |
| Petroman: Reactor Rush | platformer | desktop | 404 | No | 1 | No |
| Nori Ninja Slice | whack | desktop | 200 | Yes | 0 | No |
| Super Sean's Brick Buster | breakout | desktop | 200 | Yes | 0 | No |
| Floppy Flap | flappy | desktop | 200 | Yes | 0 | No |
| Opal Owl’s Mystery Library | memory | desktop | 200 | Yes | 0 | No |
| Crash Koala Construction Co. | stacker | desktop | 200 | Yes | 0 | No |
| Petroman: Core Digger Deluxe | maze | desktop | 404 | No | 1 | No |
| Super Sean's Merge Madness | merge | desktop | 200 | Yes | 0 | No |
| Super Sean's Ping Pong | pong | desktop | 200 | Yes | 0 | No |
| Super Sean's Racing Rally | racing | desktop | 200 | Yes | 0 | No |
| Cupcake Cyclone | bubbleshooter | desktop | 200 | Yes | 0 | No |
| Pixel Pogo Peak | doodlejump | desktop | 200 | Yes | 0 | No |
| Boot Sector | rhythm | desktop | 200 | Yes | 0 | No |
| SnackStreet Festival Frenzy | serve | desktop | 200 | Yes | 0 | No |
| Cathode Catch | dodger | desktop | 200 | Yes | 0 | No |
| Hammy Hammer: Tiny Blacksmith | idleclicker | desktop | 200 | Yes | 0 | No |
| Super Sean's Serpent Dash | snake | desktop | 200 | Yes | 0 | No |
| Tower of Floppy | tower | desktop | 200 | Yes | 0 | No |
| Boom Bap Cannon | cannon | desktop | 200 | Yes | 0 | No |
| Scanline Sprint | helix | desktop | 200 | Yes | 0 | No |
| Super Sean's Pipe Puzzle | pipeline | desktop | 200 | Yes | 0 | No |
| Super Sean's Soccer Showdown | sports | desktop | 200 | Yes | 0 | No |
| Super Sean's Archery Adventure | archery | desktop | 200 | Yes | 0 | No |
| Comet Quarry Crew | asteroids | desktop | 200 | Yes | 0 | No |
| Super Sean's Fishing Quest | fishing | desktop | 200 | Yes | 0 | No |
| Turbo Tern Target Zone | gallery | desktop | 200 | Yes | 0 | No |
| Super Sean's Pinball Party | pinball | desktop | 200 | Yes | 0 | No |
| Petroman: Reactor Rush | platformer | mobile | 404 | No | 1 | No |
| Petroman: Bubble Blitz | platformer | mobile | 404 | No | 1 | No |
| Petroman: Core Digger Deluxe | maze | mobile | 200 | Yes | 0 | No |
| Bao’s Jade Dragon Rescue | puzzle | mobile | 200 | Yes | 0 | No |
| Mushmoo’s Moonlit Match | puzzle | mobile | 200 | Yes | 0 | No |
| Nine Gates Mahjong Trails | puzzle | mobile | 200 | Yes | 0 | No |
| Madame Fortuna’s Mirror Match | puzzle | mobile | 200 | Yes | 0 | No |
| The Bubble Tea Bears | puzzle | mobile | 200 | Yes | 0 | No |
| Bloop Bubble Rescue | arcade | mobile | 200 | Yes | 0 | No |
| The Jellybean Knights | arcade | mobile | 200 | Yes | 0 | No |
| Bramble Bear's Honeycomb Match | puzzle | mobile | 200 | Yes | 0 | No |
| Madame Fortuna's Tarot Memory | puzzle | mobile | 200 | Yes | 0 | No |

## Recommended order

1. Fix all URL, runtime, console and mobile-overflow failures.
2. Upgrade the five largest engines so one improvement benefits many games.
3. Select 20 flagship titles for bespoke levels, progression, unique mechanics, audio, onboarding and endings.
4. Remove synthetic fields and stale generated metadata at source.
5. Keep automated engine smoke tests and flagship browser tests in CI.
6. Add real events for game start, first input, session length, completion, replay and errors.
