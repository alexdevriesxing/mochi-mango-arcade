# Character sprites

Drop a transparent, full-body PNG per mascot here, named by mascot slug:

    bao.png, nori-ninja.png, captain-nova.png, ...

The game engine (`/assets/js/mmchar.js`) auto-detects `<slug>.png` and uses it
as the in-game hero. If a sprite is missing, a polished animated **vector
character** is drawn instead — so the games always work.

Generate the full set (needs a fal.ai key):

    FAL_KEY=xxxx node scripts/generate-sprites.mjs

Tune the prompt on a few first:

    FAL_KEY=xxxx ONLY=bao,nori-ninja FORCE=1 node scripts/generate-sprites.mjs

Slugs come from each game's `mascot` field in `assets/data/games.json`
(lowercased, non-alphanumerics → hyphens). Review generated art for brand
consistency before using it on merchandise.
