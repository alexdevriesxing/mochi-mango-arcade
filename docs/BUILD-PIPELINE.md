# Build pipeline

Run `npm run build` after changing `games.json`, `universes.json`, or anything
that affects generated pages. Then `npm run validate` — CI runs **both**
validators, and `validate-site.mjs` passing on its own is not enough.

## Order matters

```
npm run build
  1. seo-build.mjs                 regenerates all 395 detail + play pages
  2. apply-ui-seo-gaio-polish.mjs  re-adds polish CSS/JS, OG tags, rich schema
     add-polish-fixes.mjs
     final-trust-polish.mjs
  3. protect-embedded-bundles.mjs  repairs the standalone game bundles
```

Each stage rewrites HTML the previous stage produced, so running them out of
order — or running only `seo-build.mjs` — silently reverts the site.

**Step 1 alone strips the entire polish layer.** Running `seo-build.mjs` by
itself regenerates every page from templates, dropping the polish stylesheets,
`ux-polish.js` / `trust-polish.js`, raster OG cards, enhanced `VideoGame`
schema and `PlayAction` from all 395 games at once. `validate-site.mjs` still
reports `ok: true` — only `validate-polish.mjs` catches it, which is why both
must run.

**Step 2 corrupts the embedded bundles, and step 3 repairs them.** The polish
pass does a broad replace of the game-count string, which also rewrites a
coordinate expression inside the Pancake Panic bundle
(`const x=540+col*240,y=392+row*92`) and breaks its results screen. Step 3 puts
it back; skipping it ships a visibly broken game. Expect
`protect-embedded-bundles.mjs` to report `"repaired": 1` on a normal build —
that is the guard doing its job, not a warning.

## Adding a game

New games also need artwork that the generators do not create:

- `public/assets/images/games/<slug>.jpg` — 800×450 catalogue card
- `public/assets/images/og/games/<slug>.jpg` — 1200×630 social card

`validate-polish.mjs` fails on a missing OG card, so generate both before
validating. For standalone bundles, also add the slug to `IFRAME_GAMES` in
`app.js`, or the play page will try to mount the shared engine for it.
