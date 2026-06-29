# Puddle's Pancake Panic — Ultimate Edition

A richer and more visually polished standalone HTML5 build of **Game 2/200** for **Mochi Mango Arcade**.

## Highlights

- High-detail cartoon breakfast cart presentation with layered meadow background
- Puddle chef + Pip companion rendered directly in canvas
- 3 active frying pans with pour → cook → flip → plate loop
- Plate assembly with 6 toppings: syrup, berries, butter, cream, choco, banana
- VIP guests, combo system, fever meter, slow time and golden rush power moments
- Responsive full-screen play shell with Adsterra placement zones
- Local best score persistence and portal event hooks

## Files

- `index.html` — self-contained game build
- `assets/logo.svg` — logo / listing art
- `assets/thumbnail.svg` — thumbnail / feature image
- `game.config.json` — metadata and integration hints

## Integration

Drop the folder into your website game directory, for example:

`/public/play/puddles-pancake-panic/`

Then point the corresponding game page iframe or play shell to:

`/play/puddles-pancake-panic/index.html`

## Controls

- **Mouse / Touch**: tap pans, toppings, serve button and order cards
- **Space / Enter**: start / resume / pause
- **Q**: activate power when charged
- **Esc**: pause / resume

## Portal hooks

The game posts events to the parent frame:

- `game_start`
- `order_served`
- `game_end`

These are sent with source `mochi-mango-arcade` and game id `puddles-pancake-panic`.
