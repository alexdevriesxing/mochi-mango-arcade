# Asset Manifest

Every item below is loaded by `game.js`, referenced by `index.html`, or intentionally supplied as deployable key art/catalogue content.

## Runtime sprites

- `assets/sprites/petroman-spritesheet.png` — 14 × 96×96 frames: idle, run, jump, fall, three bubble-fire poses, hit and victory poses.
- `assets/sprites/enemy-spritesheet.png` — 5 rows × 4 frames: Smog Slime, Grease Goblin, Spark Bat, Barrel Bot and Smog King.
- `assets/sprites/bubble-object-atlas.png` — animated bubbles, trapped-bubble shell, pop animation and eight pickups.

## Runtime environments

- `assets/backgrounds/background-1.png` through `background-12.png` — one illustrated background per stage.
- `assets/tiles/platform-tiles.png` — 4 visual themes × 8 64×64 platform tile variations.

## Runtime UI and effects

- `assets/ui/ui-atlas.png` — score, lives, stage, combo, timer, bubble capacity, audio, pause, play and control icons.
- `assets/ui/title-screen.png` — integrated title/start scene.
- `assets/ui/victory-screen.png` — integrated campaign victory scene.
- `assets/ui/defeat-screen.png` — integrated game-over scene.
- `assets/ui/logo.png` — site shell/game identity.
- `assets/vfx/vfx-spritesheet.png` — bubble muzzle, capture swirl, impact/pop and stage-clear flare animations.

## Runtime audio

Music:

- `music-title.wav`
- `music-gameplay.wav`
- `music-boss.wav`
- `music-victory.wav`
- `music-defeat.wav`

Sound effects:

- `jump.wav`
- `bubble-shoot.wav`
- `bubble-bounce.wav`
- `trap.wav`
- `pop.wav`
- `combo.wav`
- `collect.wav`
- `powerup.wav`
- `hit.wav`
- `clear.wav`
- `start.wav`
- `boss-hit.wav`
- `defeat.wav`
- `victory.wav`
- `menu.wav`

All audio is original synthesized stereo PCM WAV at 44.1 kHz.

## Key art and catalogue assets

- `assets/key-art/hero-petroman-bubble-blitz-1600x900.png`
- `assets/key-art/gameplay-preview-1600x900.png`
- `assets/key-art/thumbnail-800x450.png`
- `assets/key-art/thumbnail-512x288.png`
- `assets/key-art/icon-512.png`

The hero is referenced through Open Graph metadata; thumbnails and icon are referenced through the catalogue JSON, integration snippet, manifest and HTML shell.
