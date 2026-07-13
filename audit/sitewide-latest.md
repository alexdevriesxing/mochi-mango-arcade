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

### Broken catalogue entries

1. **Pixel Prawn: Deep Sea Debugger**
   - Detail page: HTTP 404
   - Play page: HTTP 404
   - Missing referenced image
   - Missing generated static detail and play files

2. **Pixel Panda Parkour**
   - Detail page: HTTP 404
   - Play page: HTTP 404
   - Missing referenced image
   - Missing generated static detail and play files

3. **Boom Bap Cannon**
   - Play page returns HTTP 200, but the browser test found no visible canvas or iframe runtime.

### Runtime JavaScript defects

4. **Super Sean's Merge Madness**
   - Browser error: `Cannot read properties of undefined (reading 'push')`.

5. **Super Sean's Pipe Puzzle**
   - Browser error: `c.save is not a function`.

## Sitewide script and analytics issue

Every browser test attempted to load the Cloudflare Insights beacon, but the current Content Security Policy blocks it. Analytics is therefore not functioning as configured.

Forty-four of the 46 tests also attempted to load a third-party advertising script from `demolishwrestconclusions.com`. The CSP correctly blocked it, but the script reference or injection remains in the source/rendering pipeline. Remove it at source rather than relying only on CSP rejection.

These blocked requests account for almost all browser console errors. They are sitewide integration errors, not evidence that all 46 game engines are broken.

## Data and content integrity

- **155 broken exact image references.** The UI may display fallback art, but the catalogue data points to missing files. This weakens cards, detail pages, social previews, structured data and future build automation.
- **392 synthetic metric records.** The Worker removes these from public responses, but they remain in `games.json`. Remove the fields at source so future generators cannot accidentally republish them.
- **Duplicate descriptions:**
  - `lulu-lanterns-lost-woods` and `lulu-lanterns-glow-garden`
  - `nine-gates-mahjong-trails` and `baos-jade-dragon-rescue`

## Gameplay architecture

The shared runtime currently resolves the catalogue into approximately these gameplay-mode volumes:

| Runtime mode | Approx. games |
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
| Bubble shooter | 10 |
| Maze | 10 |
| Racing | 9 |
| Breakout | 9 |
| Whack / reaction | 9 |

The catalogue is technically broad but mechanically concentrated. Improving the six largest modes would materially improve roughly half the entire library.

## Highest-return engine upgrades

### 1. Runner

Add handcrafted obstacle sequences, branching routes, missions, character abilities, stage themes, checkpoints and chase/boss encounters. Avoid relying on title and background changes alone.

### 2. Match-3 and tile puzzles

Add authored boards, varied objectives, blockers, limited moves, boosters, difficulty curves and a progression map. Mahjong, memory and logic-branded games should not all feel like the same generic swap loop.

### 3. Serving and management

Add customer personalities, recipes, upgrade choices, day progression, rush periods, failure/recovery states and meaningful economy decisions.

### 4. Memory

Add themed card effects, multiple board shapes, multi-stage rounds, streaks, special pairs, difficulty modes and character unlocks.

### 5. Rhythm

Add authored charts and music, timing calibration, difficulty levels, clear judgement feedback, combo systems and unlockable tracks.

### 6. Shooter

Add enemy archetypes, authored waves, weapons, bosses, hit feedback, stage goals and progression.

## Games to improve first

### P0 — repair before promotion

1. Pixel Prawn: Deep Sea Debugger
2. Pixel Panda Parkour
3. Boom Bap Cannon
4. Super Sean's Merge Madness
5. Super Sean's Pipe Puzzle

### P1 — flagship depth pass

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

### P2 — asset and differentiation batch

Prioritise the remaining games with missing image references, especially featured titles:

- Bao's Jade Dragon Rescue
- The Bubble Tea Bears
- The Donut Dragon Derby
- Tika Tiger: Traffic Tango

Then repair the remaining missing references in a generated batch rather than by hand.

## Visual and mobile findings

- No horizontal overflow was detected in the 12 priority mobile play tests.
- Successful mobile canvases rendered at approximately 356 × 475 CSS pixels in a 390 × 844 viewport.
- Successful desktop engine samples rendered visible runtimes without layout overflow.
- The current visual shell is stable after the hardening pass, but most games still need stronger title-specific visual behaviour: themed HUD elements, unique effects, character animation, backgrounds, win/lose screens and sound identity.

## SEO and technical findings

### Working well

- Homepage: HTTP 200.
- Health endpoint: HTTP 200.
- Real 404 behaviour is working.
- `robots.txt`, `sitemap.xml`, `llms.txt`, manifest and service-worker cleanup endpoint are reachable.
- HSTS and the hardened CSP are present.
- Live response performance is strong.

### Still to improve

- Repair the two missing detail/play page pairs and regenerate the sitemap after repair.
- Correct all missing exact image references.
- Remove synthetic metrics at source.
- Remove duplicate descriptions.
- Remove the residual third-party advertising loader.
- Either allow the official Cloudflare analytics endpoint in CSP or disable Cloudflare Web Analytics injection; do not leave it permanently blocked and noisy.
- Generate dedicated 1200 × 630 raster social images for flagship titles.
- Add real release dates, update history, authorship and gameplay-specific FAQ content to flagship pages.

## Recommended delivery order

1. Repair the five P0 games and remove the two real JavaScript errors.
2. Remove residual ad injection and resolve the Cloudflare analytics/CSP mismatch.
3. Batch-fix the 155 broken image references and remove synthetic source metrics.
4. Upgrade runner, match-3, serving, memory, rhythm and shooter engines.
5. Give the 20 flagship games bespoke progression, content, VFX, SFX and endings.
6. Add real gameplay analytics: game start, first input, session duration, completion, replay and runtime error.
7. Use the permanent sitewide audit workflow before every major release.
