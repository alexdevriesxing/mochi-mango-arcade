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

1. **Pixel Prawn: Deep Sea Debugger** — detail and play pages return 404; missing referenced image and generated pages.
2. **Pixel Panda Parkour** — detail and play pages return 404; missing referenced image and generated pages.
3. **Boom Bap Cannon** — HTTP 200, but no visible canvas or iframe runtime in the browser test.

### Runtime JavaScript defects

4. **Super Sean's Merge Madness** — `Cannot read properties of undefined (reading 'push')`.
5. **Super Sean's Pipe Puzzle** — `c.save is not a function`.

## Sitewide script and analytics issue

Every browser test attempted to load the Cloudflare Insights beacon, but the current Content Security Policy blocks it. Analytics is therefore not functioning as configured.

Forty-four of the 46 tests also attempted to load a third-party advertising script from `demolishwrestconclusions.com`. The CSP correctly blocked it, but the script reference or injection remains in the source/rendering pipeline. Remove it at source rather than relying only on CSP rejection.

These blocked requests account for almost all browser console errors. They are sitewide integration errors, not evidence that all 46 game engines are broken.

## Data and content integrity

- **155 broken exact image references.** The UI may display fallback art, but catalogue data points to missing files. This weakens cards, detail pages, social previews, structured data and build automation.
- **392 synthetic metric records.** The Worker removes these from public responses, but they remain in `games.json`. Remove the fields at source.
- **Duplicate descriptions:**
  - `lulu-lanterns-lost-woods` and `lulu-lanterns-glow-garden`
  - `nine-gates-mahjong-trails` and `baos-jade-dragon-rescue`

## Gameplay architecture

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

The catalogue is technically broad but mechanically concentrated. Improving the six largest modes would materially improve roughly half the library.

## Highest-return engine upgrades

1. **Runner:** handcrafted obstacle sequences, branching routes, missions, abilities, stage themes, checkpoints and bosses.
2. **Match-3/tile:** authored boards, objectives, blockers, move limits, boosters, progression and mode-specific rules.
3. **Serving/management:** customer personalities, recipes, upgrades, day progression, rush periods and economy choices.
4. **Memory:** themed effects, board shapes, multi-stage rounds, streaks, special pairs and difficulty modes.
5. **Rhythm:** authored charts/music, calibration, difficulties, judgement feedback and unlockable tracks.
6. **Shooter:** enemy archetypes, authored waves, weapons, bosses, hit feedback and stage goals.

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

## Visual and mobile findings

- No horizontal overflow appeared in the 12 priority mobile play tests.
- Successful mobile canvases rendered at about 356 × 475 CSS pixels in a 390 × 844 viewport.
- Successful desktop samples displayed a runtime without layout overflow.
- The shell is stable after hardening, but most games need title-specific HUDs, effects, animation, backgrounds, win/lose screens and sound identity.

## SEO and technical findings

### Working

- Homepage and health endpoint return 200.
- Real 404 behaviour works.
- `robots.txt`, sitemap, `llms.txt`, manifest and service-worker cleanup are reachable.
- HSTS and CSP are present.
- Response performance is strong.

### Remaining

- Repair two missing detail/play page pairs and regenerate the sitemap.
- Correct 155 image references.
- Remove synthetic metrics at source.
- Remove duplicate descriptions.
- Remove residual third-party ad loading.
- Resolve the Cloudflare analytics/CSP mismatch.
- Generate dedicated 1200 × 630 social cards for flagship titles.
- Add real release dates, update history, authorship and gameplay-specific FAQ content.

## Delivery order

1. Repair the five P0 games.
2. Remove residual ad injection and resolve analytics/CSP.
3. Batch-fix image references and synthetic metrics.
4. Upgrade runner, match-3, serving, memory, rhythm and shooter engines.
5. Give 20 flagship games bespoke progression, content, VFX, SFX and endings.
6. Add real gameplay analytics for starts, first input, session duration, completion, replay and errors.
7. Run the permanent sitewide audit before every major release.
