# Puddle & Pip: Meadow Dash — Stunning Edition v2

Game 1/200 for Mochi Mango Arcade.

This package is a fully standalone HTML5 canvas runner ready to drop into:

```text
/games/puddle-and-pip-meadow-dash/
```

## What changed in this upgraded build

- Completely rebuilt procedural canvas art direction with layered parallax meadow, atmospheric sky, animated sun, clouds, mountains, hills, trees, grass, flowers, pollen and vignette polish.
- Redesigned Puddle and Pip as richer canvas characters with squash/stretch, blinking, cheeks, cape/leaf trail, wing trails and power-up auras.
- More gameplay variety: jump, glide, roll, mushroom bounce pads, logs, brambles, snails, puddles, low branches, fuzzy fever mode, shield and magnet power-ups.
- Stronger juice: particles, starbursts, floating text, screen flash, screen shake, speed ramping, combo system and local high score.
- Improved SVG logo, icon and thumbnail assets.
- Retained Adsterra-ready placements and Mochi Mango Arcade portal events.

## Controls

- Desktop: Space / Up / W = jump, hold to glide. Down / S = roll. P / Esc = pause.
- Touch: tap to jump, hold to glide, swipe down or press Roll to roll.

## Portal events

The game dispatches `MMA_GAME_EVENT` events and posts messages to the parent frame:

- `ready`
- `start`
- `pause`
- `resume`
- `ad-request`
- `revive`
- `gameover`

## Ad integration

The revive button calls:

```js
window.MochiMangoSDK.showRewardedAd({ game, reason })
```

when available. Without the SDK it uses a local test fallback so the game stays playable during development.

## Notes

No external libraries are required. Everything is vanilla HTML/CSS/JS and should run as a static asset on Cloudflare Workers, Cloudflare Pages, itch.io, CrazyGames-compatible iframe shells, Kongregate-style embeds or your own portal.
