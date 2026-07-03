/**
 * Mochi Mango Arcade — merch-ready character sprite generator.
 *
 * Generates one transparent, full-body PNG sprite per mascot into
 * public/assets/images/sprites/<slug>.png. The game engine (mmchar.js)
 * automatically uses these the moment they exist, replacing the vector
 * fallback — and the same art is intended for plush / apparel / stickers.
 *
 * Requirements:
 *   FAL_KEY   — a fal.ai API key (https://fal.ai/dashboard/keys)
 * Optional:
 *   MODEL     — fal model id (default: fal-ai/flux/schnell)
 *   ONLY      — comma-separated mascot slugs to (re)generate
 *   FORCE=1   — overwrite existing sprites
 *   CONC      — concurrency (default 3)
 *
 * Usage:
 *   FAL_KEY=xxxx node scripts/generate-sprites.mjs
 *   FAL_KEY=xxxx ONLY=bao,nori-ninja FORCE=1 node scripts/generate-sprites.mjs
 *
 * NOTE: This calls a paid image API and generated art should be reviewed
 * for brand consistency before shipping to merch. Start with ONLY=<a few>
 * to dial in the prompt, then run the full batch.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUB = join(__dirname, '..', 'public');
const OUT = join(PUB, 'assets', 'images', 'sprites');
const KEY = process.env.FAL_KEY;
const MODEL = process.env.MODEL || 'fal-ai/flux/schnell';
const FORCE = process.env.FORCE === '1';
const CONC = Math.max(1, +(process.env.CONC || 3));
const ONLY = (process.env.ONLY || '').split(',').map(s => s.trim()).filter(Boolean);

if (!KEY) {
  console.error('\n  FAL_KEY is not set.\n  Get a key at https://fal.ai/dashboard/keys then run:\n    FAL_KEY=xxxx node scripts/generate-sprites.mjs\n');
  process.exit(1);
}
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const games = JSON.parse(readFileSync(join(PUB, 'assets/data/games.json'), 'utf8'));

const UNI_STYLE = {
  cozyverse: 'soft cozy pastel plush storybook style, warm gentle lighting',
  astromochi: 'cosmic candy space style, glossy, playful sci-fi accents',
  ninegates: 'jade-and-gold East-Asian festival style, lanterns and dragons motif',
  snackstreet: 'vibrant neon street-food style, bold saturated colors',
  oracle: 'whimsical mystical carnival style, moonlit magical accents',
  standalone: 'bright cheerful candy-pop style'
};

// unique mascot -> representative game (for universe/style + description)
const byMascot = new Map();
for (const g of games) if (!byMascot.has(g.mascot)) byMascot.set(g.mascot, g);

let targets = [...byMascot.values()];
if (ONLY.length) targets = targets.filter(g => ONLY.includes(slug(g.mascot)));

// Locked house style, matching the Mochi Mango Arcade brand hero art.
const HOUSE = 'cute 3D-rendered chibi kawaii plush mascot, soft rounded squishy body, ' +
  'glossy smooth Pixar-soft finish, very large sparkly glossy eyes with bright white highlights, ' +
  'small round rosy blush cheeks, tiny happy open smile, oversized head tiny body proportions, ' +
  'pastel candy colours, soft studio lighting, subtle rim light, high detail toy render';

function prompt(g) {
  const style = UNI_STYLE[g.universe] || UNI_STYLE.standalone;
  return `Adorable original mascot character "${g.mascot}", ${HOUSE}, ${style}. ` +
    `Full body, standing friendly hero pose, facing slightly right, centered, ` +
    `isolated on a plain flat pure white background, no text, no logo, no border, no shadow floor, ` +
    `consistent character design suitable for plush toys, apparel and stickers.`;
}

async function falImage(p) {
  // Submit to fal queue and poll. Works with flux/* text-to-image models.
  const submit = await fetch(`https://queue.fal.run/${MODEL}`, {
    method: 'POST',
    headers: { Authorization: `Key ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: p, image_size: 'square_hd', num_images: 1, enable_safety_checker: true })
  });
  if (!submit.ok) throw new Error(`submit ${submit.status}: ${await submit.text()}`);
  const { status_url, response_url } = await submit.json();
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 1500));
    const st = await (await fetch(status_url, { headers: { Authorization: `Key ${KEY}` } })).json();
    if (st.status === 'COMPLETED') break;
    if (st.status === 'FAILED' || st.status === 'ERROR') throw new Error('generation failed');
  }
  const res = await (await fetch(response_url, { headers: { Authorization: `Key ${KEY}` } })).json();
  const url = res.images?.[0]?.url;
  if (!url) throw new Error('no image url in response');
  return url;
}

async function removeBg(imageUrl) {
  // fal background removal -> transparent PNG. Falls back to raw image on failure.
  try {
    const submit = await fetch('https://queue.fal.run/fal-ai/imageutils/rembg', {
      method: 'POST', headers: { Authorization: `Key ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl })
    });
    if (!submit.ok) return imageUrl;
    const { status_url, response_url } = await submit.json();
    for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 1200));
      const st = await (await fetch(status_url, { headers: { Authorization: `Key ${KEY}` } })).json();
      if (st.status === 'COMPLETED') break; if (st.status === 'FAILED') return imageUrl; }
    const res = await (await fetch(response_url, { headers: { Authorization: `Key ${KEY}` } })).json();
    return res.image?.url || imageUrl;
  } catch { return imageUrl; }
}

async function one(g) {
  const s = slug(g.mascot), file = join(OUT, s + '.png');
  if (existsSync(file) && !FORCE) return { s, skipped: true };
  const raw = await falImage(prompt(g));
  const cut = await removeBg(raw);
  const buf = Buffer.from(await (await fetch(cut)).arrayBuffer());
  writeFileSync(file, buf);
  return { s, bytes: buf.length };
}

(async () => {
  console.log(`Generating ${targets.length} sprites with ${MODEL} (concurrency ${CONC})…`);
  let done = 0, made = 0, failed = 0;
  const queue = [...targets];
  async function worker() {
    while (queue.length) {
      const g = queue.shift();
      try { const r = await one(g); done++; if (!r.skipped) made++; console.log(`  [${done}/${targets.length}] ${r.s} ${r.skipped ? '(exists)' : (r.bytes + 'b')}`); }
      catch (e) { failed++; done++; console.warn(`  [${done}/${targets.length}] ${slug(g.mascot)} FAILED: ${e.message}`); }
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  console.log(`\nDone. ${made} generated, ${failed} failed, of ${targets.length} mascots.`);
})();
