# Petroman: Reactor Rush

**Petroman: Reactor Rush** is a complete original HTML5 single-screen arcade platform game created for **Mochi Mango Arcade**.

Petroman is a feisty pocket-sized superhero who uses a twin-boost reactor belt to secure unstable energy cores before Petro City disappears beneath a smog storm. The game captures the fast, score-driven appeal of classic airborne collectathon platformers while using an original character, original enemies, original stage designs, original branding and newly produced audiovisual assets.

## Production build contents

- Eight handcrafted stages with increasing enemy density and tighter timers
- Eight distinct illustrated backgrounds and eight matching industrial platform tile themes
- A 12-frame Petroman sprite sheet: idle, run, jump, fall, boost, hurt and victory poses
- Three original enemy families with four animation frames each: Smoglets, Drillbugs and Volt Hawks
- Ordered energy-core collection, Spark Chain scoring and persistent local high scores
- Twin aerial boosts, fast drop, air steering and responsive touch controls
- Purifier Mode that converts enemies into bonus targets
- Sprite-based collection bursts, impacts, explosions and purifier-ring VFX
- Illustrated title, victory and defeat screens
- Canvas HUD using a dedicated icon atlas plus animated score, timer, lives, combo and power displays
- Original title music, gameplay loop, victory fanfare, defeat sting and eleven gameplay/UI sound effects
- 1600×900 hero art, gameplay art, victory art and defeat art
- 800×450 listing thumbnail, 512×512 app icon and an additional promotional poster
- No external libraries, CDNs, trackers, web fonts or runtime downloads

## Run locally

Serve the folder through a static web server so browser audio and local high-score storage work normally:

```bash
python -m http.server 8080
```

Open `http://localhost:8080`.

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | Arrow keys or A/D | Left/right controls |
| Jump / reactor boost | Space, W or Up | Boost button |
| Second air boost | Press jump again in mid-air | Tap Boost again |
| Fast drop | S or Down | Down control |
| Pause | P or Escape | Pause button |
| Audio | Sound button | Sound button |

## Mochi Mango Arcade deployment

1. Upload the complete `petroman-reactor-rush` folder without changing its internal paths.
2. Publish it at `/play/petroman-reactor-rush/` or your normal playable-game route.
3. Use `assets/key-art/hero-petroman-reactor-rush-1600x900.png` for the listing/article hero.
4. Use `assets/key-art/thumbnail-800x450.png` for game cards and `assets/key-art/icon-512.png` for square placements.
5. Import the fields in `mochi-mango-game-entry.json` into the site entry.
6. Keep the iframe at 16:9 and allow fullscreen and autoplay.

A ready-to-copy iframe is included in `integration-snippet.html`.

## QA

Run the dependency-free smoke test with Node.js:

```bash
node tests/qa-smoke-test.js
```

The test verifies that every preloaded image resolves, the game reaches its ready state, start input is handled and the animation loop advances without a JavaScript exception.

## Originality

The packaged code, character design, enemies, interface artwork, stage layouts, generated graphics and synthesized audio were created for this game. No character, logo, music, level layout or art asset from Bomb Jack is included. This is an original game in the broader single-screen arcade collectathon genre.


## Hand-Drawn Remaster Update
The final runtime now uses the illustrated Petroman, enemy, background, tile, object, VFX and UI atlases from the approved art pass.
