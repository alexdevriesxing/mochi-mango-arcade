/**
 * Per-game variation for the shared arcade engine.
 *
 * 395 games run on 31 modes, so 50 games share match3 and 32 share serve. With
 * only a palette swap between them they play identically and the catalogue
 * reads as filler. This derives a stable set of knobs from the game's slug --
 * same game, same feel, every session, no data to author -- plus one named
 * signature mechanic per game so two games on one mode are genuinely different
 * to play and have something concrete to advertise.
 */

/** FNV-1a. Small, fast, and stable across browsers -- we only need spread. */
function hash(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: tiny seeded PRNG, good enough for layout and pacing choices. */
function rngFrom(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Signature mechanics, per mode.
 *
 * Each entry is { id, name, blurb }: `id` is what the mode branches on, `name`
 * and `blurb` are player-facing so the start panel and the game page can say
 * what makes this one different. Modes that have not been given twists yet
 * simply fall back to the shared 'classic' entry.
 */
const TWISTS = {
  // Only list a twist once the mode actually implements it. A game that
  // advertises "Frozen Tiles" and then plays exactly like its neighbour is
  // worse than one that honestly says it is a classic arcade board -- every
  // game still gets its own pace, density and layout regardless.
  match3: [
    { id: 'classic', name: 'Classic Board', blurb: 'Straight tile matching, sized and paced to this game.' },
    { id: 'cascade', name: 'Cascade Cores', blurb: 'A tighter four-colour board where chains multiply hard — one good swap can run away with it.' },
    // Themes supply five tile symbols, so this starts at the full set rather
    // than naming a number the palette cannot always deliver.
    { id: 'colourdrain', name: 'Colour Drain', blurb: 'Starts on the full palette and loses a colour every 25 seconds. Late boards cascade, but options vanish.' },
    { id: 'bombrush', name: 'Bomb Rush', blurb: 'Every fifth match drops a live bomb onto the board. Clear around it or set it off deliberately.' },
  ],
  tower: [
    { id: 'classic', name: 'Hold the Line', blurb: 'Build, upgrade and defend, on a path and budget set for this game.' },
    { id: 'rush', name: 'Swarm Rush', blurb: 'Many weak, fast enemies — coverage and rate of fire beat raw damage.' },
    { id: 'armored', name: 'Armored Column', blurb: 'Fewer, tougher, slower foes. Concentrate fire and upgrade your best towers.' },
    { id: 'serpentine', name: 'Winding Road', blurb: 'A long, twisting path a well-placed tower can cover several times over.' },
  ],
  shooter: [
    { id: 'classic', name: 'Sky Patrol', blurb: 'Auto-fire, dodge and boss runs, with fire rate and swarm pressure set for this game.' },
    { id: 'spread', name: 'Spread Cannon', blurb: 'Your ship fires a three-way spread from the very first shot instead of earning it.' },
    { id: 'bullethell', name: 'Bullet Storm', blurb: 'Bosses throw much wider, faster fans — this one is about the dodge.' },
    { id: 'armored', name: 'Armored Assault', blurb: 'Tanks and shielded foes dominate the swarm. Hold your line and keep firing.' },
  ],
  runner: [
    { id: 'classic', name: 'Open Road', blurb: 'A straight sprint, with hazard spacing and gravity tuned to this game.' },
    { id: 'onejump', name: 'Single Jump', blurb: 'No second jump to save you — but you leap higher, so every commitment counts.' },
    { id: 'lowceiling', name: 'Low Ceilings', blurb: 'Overhead bars dominate the route. Stay low and duck rather than jumping everything.' },
    { id: 'coinrush', name: 'Treasure Run', blurb: 'Coin arcs everywhere — the line you take matters as much as surviving.' },
  ],
  rhythm: [
    { id: 'classic', name: 'Free Beat', blurb: 'Notes anywhere on stage, at this track’s own tempo and length.' },
    { id: 'lanes', name: 'Lane Beat', blurb: 'Notes land on fixed columns, so you read a groove instead of hunting the screen.' },
    { id: 'doubletime', name: 'Double Time', blurb: 'Telegraphed bursts where the notes arrive twice as fast.' },
    { id: 'precision', name: 'Precision Play', blurb: 'A tighter perfect window that pays substantially more for the accuracy.' },
  ],
  racing: [
    { id: 'classic', name: 'Open Circuit', blurb: 'Clean racing lines and boost pads, on a track width and race length set for this game.' },
    { id: 'traffic', name: 'Rush Hour', blurb: 'The circuit is packed with cones — patience and a tidy line beat raw speed.' },
    { id: 'fuel', name: 'Fuel Run', blurb: 'Speed drains the tank and boost pads are the only refill. Route through them or limp home.' },
  ],
  platformer: [
    { id: 'classic', name: 'Sure Footing', blurb: 'A straight climb, with rung spacing and platform width tuned to this game.' },
    { id: 'lowgrav', name: 'Low Gravity', blurb: 'Floaty, committed arcs — you fall slower, but you steer for much longer.' },
    { id: 'crumble', name: 'Crumbling Path', blurb: 'Most of the route falls away the moment you land on it. Keep moving.' },
    { id: 'wind', name: 'Side Wind', blurb: 'A crosswind reverses every few seconds, so every jump has to be aimed upwind.' },
  ],
  serve: [
    { id: 'classic', name: 'Rush Service', blurb: 'Clear every ticket before patience runs out, on a counter sized for this game.' },
    { id: 'vip', name: 'VIP Guests', blurb: 'Starred customers pay double but lose patience far faster. Serve them first or lose them.' },
    { id: 'combo', name: 'Order Combos', blurb: 'Serving the same ticket twice in a row pays double — spot the repeat before you start.' },
  ],
  memory: [
    { id: 'classic', name: 'Pair Hunt', blurb: 'Straight pair matching, with the board size and clock tuned to this game.' },
    { id: 'peek', name: 'Fading Peek', blurb: 'Every deal shows you the whole board for a moment, then hides it. Memorise fast.' },
    { id: 'shuffle', name: 'Shuffle Shock', blurb: 'Two face-down cards quietly trade places every few seconds.' },
    { id: 'decoy', name: 'Odd One Out', blurb: 'An extra unpaired card hides in the deck and can steal the partner you were saving.' },
  ],
};

const CLASSIC = { id: 'classic', name: 'Arcade Classic', blurb: 'Straight-up arcade scoring and escalating pressure.' };

/**
 * Stable per-game configuration.
 *
 * @param {{slug?: string, title?: string}} game
 * @param {string} mode  resolved engine mode, used to pick the twist table
 */
export function variantFor(game, mode) {
  const key = String(game?.slug || game?.title || 'mochi-mango');
  const seed = hash(`${key}::${mode || ''}`);
  const rng = rngFrom(seed);

  // Draw in a fixed order so a given slug always lands on the same values.
  const pace = 0.85 + rng() * 0.4;      // difficulty ramp multiplier
  const density = 0.8 + rng() * 0.5;    // how crowded spawns/boards get
  const layout = Math.floor(rng() * 4); // which handcrafted arrangement to use
  const accent = Math.floor(rng() * 360); // hue rotation for per-game identity

  const table = TWISTS[mode] || [CLASSIC];
  const twist = table[Math.floor(rng() * table.length)] || CLASSIC;

  return { seed, rng: rngFrom(seed), pace, density, layout, accent, twist };
}

export { TWISTS, CLASSIC };
