# Mochi Mango Arcade — Sitewide & Game Quality Audit

Generated: 13 July 2026  
Live target: https://www.mochimangoarcade.com

## Executive summary

- 392 catalogue games across 14 universes.
- 797 live URLs checked; 793 succeeded and 4 failed.
- Median server response: 84 ms; p95: 137 ms.
- Homepage and `/api/health` return HTTP 200.
- Unknown routes correctly return HTTP 404.
- 46 browser play tests covered every raw engine plus priority mobile titles.
- 43 of 46 tested games produced a visible playable runtime.
- Only 2 titles use bespoke embedded game bundles; 390 rely on the shared canvas runtime.
- 155 catalogue entries reference an image path that does not exist at that exact location.
- All 392 catalogue records still contain synthetic rating and/or play-count fields in source data.
- Two pairs of games use exact duplicate descriptions.

## Immediate defects

1. **Pixel Prawn: Deep Sea Debugger** — detail and play pages return 404; image and generated pages are missing.
2. **Pixel Panda Parkour** — detail and play pages return 404; image and generated pages are missing.
3. **Boom Bap Cannon** — HTTP 200, but no visible game runtime was found.
4. **Super Sean's Merge Madness** — runtime error: `Cannot read properties of undefined (reading 'push')`.
5. **Super Sean's Pipe Puzzle** — runtime error: `c.save is not a function`.

## Sitewide integration defects

- Cloudflare Insights is injected but blocked by CSP on every browser test, so analytics is not operating correctly.
- A third-party advertising script from `demolishwrestconclusions.com` was attempted on 44 of 46 tests and blocked by CSP. Remove the loader at source.
- These two blocked scripts account for almost all console errors; most game canvases themselves started successfully.

## Data integrity

- 155 broken exact image references.
- Synthetic rating/play fields remain in all 392 source records.
- Duplicate descriptions:
  - `lulu-lanterns-lost-woods` / `lulu-lanterns-glow-garden`
  - `nine-gates-mahjong-trails` / `baos-jade-dragon-rescue`

## Largest gameplay modes

| Mode | Games |
|---|---:|
| Runner | 55 |
| Match-3 / tile puzzle | 50 |
| Serving / management | 31 |
| Memory | 22 |
| Rhythm | 18 |
| Shooter | 18 |
| Board | 16 |
| Tower defence | 14 |
| Flappy / flight | 14 |
| Stacker | 12 |

Improving runner, match-3, serving, memory, rhythm and shooter would improve roughly half the catalogue.

## Priority games

### P0 repair

1. Pixel Prawn: Deep Sea Debugger
2. Pixel Panda Parkour
3. Boom Bap Cannon
4. Super Sean's Merge Madness
5. Super Sean's Pipe Puzzle

### P1 flagship depth

6. Puddle & Pip: Meadow Dash
7. Puddle's Pancake Panic
8. Mushmoo's Moonlit Match
9. Bloop Bubble Rescue
10. Nine Gates Mahjong Trails
11. SnackStreet Rush
12. Crownlight Chess
13. Starling Signal Patrol
14. Glitch Garden
15. Boot Sector
16. Rooftop Rocket Rumble
17. Tower of Floppy
18. Super Sean's Racing Rally
19. Super Sean's Soccer Showdown
20. Super Sean's Pinball Party
21. Comet Quarry Crew
22. Floppy Flap
23. Bao's Jade Dragon Rescue
24. The Donut Dragon Derby
25. Tika Tiger: Traffic Tango

## Visual/mobile findings

- No horizontal overflow in the 12 priority mobile tests.
- Mobile game canvases rendered at about 356 × 475 CSS pixels in a 390 × 844 viewport.
- Desktop engine samples displayed without layout overflow.
- The shell is stable, but shared-runtime games need title-specific HUDs, effects, animation, backgrounds, win/lose screens and sound identity.

## Technical/SEO status

Working: HTTP 200 homepage and health endpoint, real 404s, reachable robots/sitemap/llms/manifest/service-worker cleanup, HSTS, CSP and strong response times.

Remaining: repair missing game pages, regenerate sitemap, repair image references, remove synthetic metrics and duplicate copy, remove residual ad loading, resolve analytics/CSP, create raster social cards, and add release history/authorship/game-specific FAQ content.

## Delivery order

1. Repair the five P0 games.
2. Remove residual ad injection and resolve analytics/CSP.
3. Batch-fix image references and source metrics.
4. Upgrade the six largest gameplay modes.
5. Give 20 flagship games bespoke progression, content, VFX, SFX and endings.
6. Add real gameplay analytics.
7. Run the permanent sitewide audit before major releases.
