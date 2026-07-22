# Petroman: Bubble Blitz

An original, self-contained HTML5 single-screen bubble-platform arcade game created for **Mochi Mango Arcade**.

Petroman fires clean-air bubbles that trap pollution creatures. Trapped enemies float toward the ceiling and eventually escape unless Petroman pops the bubble in time. Bubble pops build short combo chains, release collectible upgrades and clear each stage. The twelfth stage concludes with a dedicated Smog King boss encounter.

## Included production content

- Twelve handcrafted stages across four visual districts
- Four animated standard enemy families and one animated final boss
- Fourteen-frame Petroman animation sheet
- Animated normal bubbles, trapped bubbles, bubble pops and four VFX sequences
- Eight-item collectible/power-up set
- Four complete platform tile themes
- Twelve distinct 960×540 illustrated stage backgrounds
- Full HUD icon atlas and responsive touch-control interface
- Illustrated title, victory and defeat screens
- 1600×900 hero key art, gameplay preview, thumbnails and 512×512 icon
- Five stereo music tracks and fifteen stereo sound effects
- Persistent local high score
- Desktop, laptop, tablet and mobile controls
- No CDN, framework or runtime internet dependency

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | Arrow keys or A/D | Left/right buttons |
| Jump | Space, W or Up | Jump button |
| Bubble | X, K or J | Bubble button |
| Pause | P or Escape | Pause button |

## Run locally

The game is dependency-free. It can be opened directly in a browser, but a local web server is recommended:

```bash
python -m http.server 8080
```

Then open the folder through `http://localhost:8080`.

## Mochi Mango Arcade deployment

1. Upload the complete `petroman-bubble-blitz` folder to `/games/petroman-bubble-blitz/`.
2. Use `integration-snippet.html` as a starting point for the game card.
3. Import `mochi-mango-game-entry.json` into the site catalogue or map its fields to the existing game schema.
4. Keep the relative asset paths unchanged.
5. The game uses no external scripts, fonts or trackers.

## QA

Run the dependency-free Node smoke test:

```bash
node tests/qa-smoke-test.js
```

It executes loading, all twelve stage configurations, controls, bubble firing, collision/update paths, HUD rendering, pause, boss-stage rendering, victory and defeat scenes using a mocked browser/canvas environment.

See `BUILD_REPORT.md`, `ASSET_MANIFEST.md`, `FILE_INVENTORY.tsv` and `CREDITS_AND_RIGHTS.md` for the detailed package audit.
