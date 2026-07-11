Original prompt: Integrate Monetag Vignette zone 11269408 and Direct Link https://omg10.com/4/11269418 globally, then update all games with meaningful rewarded benefits, enhance and polish the games and site, push to GitHub, and deploy to Cloudflare.

## Progress

- Located the shared SEO/page-head generator in `scripts/seo-build.mjs`.
- Added `public/js/monetag-loader.js` with the vignette loader and `window.triggerRewardedAd(onRewardGranted)`.
- Avoided regenerating stale SEO output because it would introduce unrelated catalogue changes.
- Found and removed an extra closing brace in `public/assets/js/mmengine.js` that prevented every shared-engine game from loading.
- Added guarded Monetag Vignette and Direct Link reward orchestration with focus/visibility validation, popup-block handling, a minimum visit, timeout cleanup, and exact-once callbacks.
- Added mode-specific rewarded boosts, one reward per run, fullscreen, text-state and deterministic time hooks to the 246 shared-engine games.
- Connected Meadow Dash's revive to Monetag and added Pancake Panic's +20s/full-power/Golden-Rush reward.
- Corrected game-mode misclassification (`drag` inside “dragon” and `car` inside “carnival/cargo”) and eliminated missing-sprite 404 noise.
- Added a luminous universe-aware arcade bezel and polished rewarded-boost panel across all 248 play routes.
- Created isolated Cloudflare D1 database `mochi-mango-arcade-profiles` for accounts and trophies.
- 2026-07-11 continuation scope: finish and release the prior work; add polished pre-game rewarded booster choices; deepen challenge, game feel, graphics and accessibility; add comprehensive Tabletop Kingdom, Retroverse, and Puzzle Realm universes; replace all internal/developer-facing copy; complete technical SEO and AI-search discovery work; push to GitHub and deploy to Cloudflare.
- Audited the shared engine and found broken pointer dispatch in Sports/Fishing/Archery, inconsistent arrow-key casing in nine modes, resize-triggered run resets, several keyword mode misclassifications, incomplete Racing/Rhythm goals, and missing text-state coverage.
- Audited rewards and found that pre-game grants auto-start or are erased by standalone resets, iframe games are not reliably paused, outer reward state lacks iframe acknowledgement, and the SDK contains a fake-grant fallback that must be removed.
- Generated and saved optimized high-resolution WebP hero art for Tabletop Kingdom, Retroverse, and Puzzle Realm under `public/assets/images/universes/`.
- Verified Node/Playwright/Wrangler/GitHub tooling and authentication; `wrangler deploy --dry-run` succeeds with the assets and D1 binding.

## TODO

- Integrate the profile backend/frontend and apply D1 migrations.
- Run game Playwright checks and inspect screenshots/state/errors, including stubbed ad flows.
- Run deployment dry run, commit, push, deploy, and verify live URLs.
- Fix shared input, resize, difficulty, session-goal, reward state-machine, standalone reward persistence and iframe acknowledgement issues.
- Integrate the three new universe content packs, engines, key art, page generation and consumer-facing copy.
- Implement crawl-safe 404 behavior, page-specific SEO/schema, sitemap/robots/LLM discovery files, performance improvements and validation.
