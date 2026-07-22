# Production Build Report

## Build identity

- Title: **Petroman: Bubble Blitz**
- Target: Mochi Mango Arcade
- Format: self-contained HTML5/CSS/JavaScript
- Native canvas: 960×540, responsive 16:9 scaling
- External runtime dependencies: none

## Implemented systems

- Acceleration-based platform movement, jump physics and screen-edge wrapping
- Player bubble-capacity and bubble-cooldown upgrades
- Projectile, free-floating and enemy-trapping bubble states
- Bubble expiration, enemy escape, bubble spring bounce and chain-pop interactions
- Enemy-specific movement: patrol/jump, charge, flight and boss AI
- Smog King health, projectiles, stage music and boss HUD
- Four pickup upgrades plus score, time, life and crown rewards
- Score multiplier window and persistent local high score
- Stage timer and late-stage Smog Surge state
- Animated VFX, particles, floating score text and screen shake
- Responsive keyboard and multitouch controls
- Title, level-intro, pause, stage-clear, victory and defeat states

## Verification completed

- JavaScript syntax validation with Node
- Dependency-free runtime smoke test
- All twelve levels loaded, updated and rendered in the smoke harness
- Bubble fire, jump, pause, boss, victory and defeat paths executed
- PNG decode verification for every raster asset
- WAV header/channel/rate/frame verification for every audio asset
- Runtime reference scan against package files
- JSON validation
- Placeholder/TODO marker scan
- ZIP integrity test

Browser screenshots could not be captured from the live local build because the managed Chromium environment blocks loopback and local-file URLs. The packaged runtime was therefore validated through the Node canvas/DOM smoke harness and static asset/reference checks.


## Hand-Drawn Remaster Patch
- Replaced Petroman gameplay spritesheet with hand-drawn sprite frames.
- Replaced enemy spritesheet with hand-drawn enemy and boss frames.
- Replaced stage backgrounds with painted concept strips from the approved Petroman art pass.
- Replaced platform tile atlas with hand-drawn industrial platform tiles.
- Replaced victory and defeat screens with illustrated art screens.
- Refreshed title screen and key art to align with the hand-drawn art pass.
