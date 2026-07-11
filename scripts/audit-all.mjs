import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const games = JSON.parse(readFileSync(join(root, 'public/assets/data/games.json'), 'utf-8'));
const issues = [];

// Check required fields
games.forEach(g => {
  const req = ['id', 'title', 'slug', 'universe', 'universeName', 'genre', 'mascot', 'description', 'engine', 'built', 'merchHook'];
  req.forEach(f => {
    if (g[f] === undefined || g[f] === null) issues.push(`Game #${g.id} "${g.title}" missing field: ${f}`);
  });
  if (g.built && !g.playUrl) issues.push(`Game #${g.id} "${g.title}" built but missing playUrl`);
  if (g.built && !g.detailUrl) issues.push(`Game #${g.id} "${g.title}" built but missing detailUrl`);
  if (!g.slug || g.slug !== g.slug.toLowerCase()) issues.push(`Game #${g.id} non-lowercase slug: ${g.slug}`);
});

// Check duplicates
const slugs = games.map(g => g.slug);
slugs.forEach((s, i) => {
  if (slugs.indexOf(s) !== i) issues.push(`DUPLICATE slug: ${s} (game #${games[i].id})`);
});

// Check mode detection
const MODES = new Set(['sports', 'racing', 'breakout', 'snake', 'rhythm', 'tower', 'pinball', 'fishing', 'archery', 'pong', 'bubbleshooter', 'cannon', 'merge', 'helix', 'doodlejump', 'asteroids', 'pipeline', 'gallery', 'idleclicker', 'flappy', 'platformer', 'shooter', 'whack', 'match3', 'serve', 'maze', 'memory', 'stacker', 'dodger', 'runner']);

games.forEach(g => {
  if (!g.built) return;
  const s = (g.genre + ' ' + g.engine + ' ' + (g.title || '') + ' ' + (g.slug || '')).toLowerCase();
  let mode;
  if (MODES.has(g.engine)) mode = g.engine;
  else if (/(soccer|football|kick|penalty|goal|sport|basketball|hoop|score|shoot-out|stadium|league|club|team)/.test(s)) mode = 'sports';
  else if (/(racing|racer|driv|kart|speed|grand.prix|circuit|track|drag|drift|moto|car|vehicle|wheels|race|derby)/.test(s)) mode = 'racing';
  else if (/(breakout|brick|smash|block.blast|blocky|bouncer|paddle|wall.break)/.test(s)) mode = 'breakout';
  else if (/(snake|slither|serpent|worm|noodle|crawler|coil|conda)/.test(s)) mode = 'snake';
  else if (/(rhythm|beat|dance|music|tempo|groove|jam|jukebox|drumline|drum|bongo|concert|melody|tune|band)/.test(s)) mode = 'rhythm';
  else if (/(tower|defense|defence|guard|fortress|castle.defense|wave|siege|bastion|warden)/.test(s)) mode = 'tower';
  else if (/(pinball|flipper|bumper|arcade.ball|plunger|tilt)/.test(s)) mode = 'pinball';
  else if (/(fish|fishing|angle|angler|cast|reel|hook|pond|lake|tide|aquarium|ocean|whale|submarine|deep)/.test(s)) mode = 'fishing';
  else if (/(pong|tennis|paddle|racket|ping.pong|table.tennis)/.test(s)) mode = 'pong';
  else if (/(bubble|pop|shoot.bubble|burst|color.match|balloon)/.test(s)) mode = 'bubbleshooter';
  else if (/(cannon|artillery|launch|projectile|catapult|mortar|howitzer)/.test(s)) mode = 'cannon';
  else if (/(merge|2048|combine|grow|evolve|synthesize|fuse|combine.tile)/.test(s)) mode = 'merge';
  else if (/(helix|spiral|spin|fall|descent|tunnel|vortex|whirl|rotating)/.test(s)) mode = 'helix';
  else if (/(doodle|doodle.jump|bounce.up|spring|jump.climb|vertical.climb|ascend|flap.up)/.test(s)) mode = 'doodlejump';
  else if (/(asteroid|space.shoot|meteor|alien.invader|space.battle|cosmic|shooter.space)/.test(s)) mode = 'asteroids';
  else if (/(pipe|pipeline|connect|plumb|flow|route|tube|pipe.puzzle|water.pipe)/.test(s)) mode = 'pipeline';
  else if (/(gallery|shooting.gallery|shoot.gallery|target.range|aim.bonus|sharpshooter|fair.shoot)/.test(s)) mode = 'gallery';
  else if (/(idle|clicker|tap|farm|mine|earn|incremental|collect|grind|tapper|auto.click)/.test(s)) mode = 'idleclicker';
  else if (/(archery|arrow|bow|target|aim|bullseye|dart|crossbow|sharpshoot|hunter|snipe)/.test(s)) mode = 'archery';
  else if (/(parcel|kite|airlift|balloon|glide|flight|flying|aerial|paraglide|sky-diner|sky diner)/.test(s)) mode = 'flappy';
  else if (/(maze|labyrinth|heist)/.test(s)) mode = 'maze';
  else if (/(memory|mirror|hidden|detective|solitaire|concentration|mooncat|tarot|matching)/.test(s)) mode = 'memory';
  else if (/(\bstack\b|\bfort\b|blanket|pillow|sleepover|snowflake|honey-rescue)/.test(s)) mode = 'stacker';
  else if (/(defen|patrol|survival|boss|arena|shooter|bullet|battler|tactic)/.test(s)) mode = 'shooter';
  else if (/(whack|reaction|coordination|emergency|reflex|cleanup)/.test(s)) mode = 'whack';
  else if (/(match|tile|mahjong|sort|flow|logic|gravity|deduction|slide)/.test(s)) mode = 'match3';
  else if (/(manage|cook|serv|shop|hotel|tavern|farm|sim|cafe|kitchen|bakery|time management|market|salon|dress|diner|restaurant)/.test(s)) mode = 'serve';
  else if (/(platform|jump|hop|bounce|climb|parkour|wall)/.test(s)) mode = 'platformer';
  else if (/(runner|lane|dash|sprint|drift|run)/.test(s)) mode = 'runner';
  else if (g.engine === 'runner') mode = 'runner';
  else if (g.engine === 'puzzle') mode = 'match3';
  else if (g.engine === 'management') mode = 'serve';
  else mode = 'dodger';
  if (mode !== g.engine) issues.push(`Mode mismatch: #${g.id} "${g.title}" engine="${g.engine}" modeFor returns="${mode}"`);
});

// Check engine classes exist in mmengine.js
const mmengine = readFileSync(join(root, 'public/assets/js/mmengine.js'), 'utf-8');
const definedClasses = [];
const classRe = /^class (\w+) extends Base/mg;
let m;
while ((m = classRe.exec(mmengine)) !== null) definedClasses.push(m[1]);

const modeToClass = {
  sports: 'Sports', racing: 'Racing', breakout: 'Breakout', snake: 'Snake', rhythm: 'Rhythm',
  tower: 'TowerDefense', pinball: 'Pinball', fishing: 'Fishing', archery: 'Archery', pong: 'Pong',
  bubbleshooter: 'BubbleShooter', cannon: 'Cannon', merge: 'Merge', helix: 'Helix',
  doodlejump: 'DoodleJump', asteroids: 'Asteroids', pipeline: 'Pipeline', gallery: 'Gallery',
  idleclicker: 'IdleClicker', flappy: 'Flappy', platformer: 'Platformer', dodger: 'Dodger',
  shooter: 'Shooter', whack: 'Whack', match3: 'Match3', serve: 'Serve', maze: 'Maze',
  memory: 'Memory', stacker: 'Stacker', runner: 'Runner'
};

games.filter(g => g.built).forEach(g => {
  const cls = modeToClass[g.engine];
  if (cls && !definedClasses.includes(cls)) {
    issues.push(`Missing engine class: #${g.id} "${g.title}" needs class ${cls} for engine ${g.engine}`);
  }
});

// Check play/detail page existence
games.filter(g => g.built).forEach(g => {
  const pp = join(root, 'public', g.playUrl.replace(/^\//, ''), 'index.html');
  const dp = join(root, 'public', g.detailUrl.replace(/^\//, ''), 'index.html');
  if (!existsSync(pp)) issues.push(`MISSING play page: ${g.playUrl}`);
  if (!existsSync(dp)) issues.push(`MISSING detail page: ${g.detailUrl}`);
});

// Check for games with same title but different slugs
const titles = {};
games.forEach(g => {
  if (!titles[g.title]) titles[g.title] = [];
  titles[g.title].push(g.slug);
});
Object.entries(titles).filter(([, slugs]) => slugs.length > 1).forEach(([title, slugs]) => {
  if (new Set(slugs).size > 1) issues.push(`Same title different slugs: "${title}" -> ${slugs.join(', ')}`);
});

console.log('=== FULL AUDIT COMPLETE ===');
console.log(`Total games: ${games.length}`);
console.log(`Built: ${games.filter(g => g.built).length}`);
console.log(`Issues: ${issues.length}`);
issues.forEach(i => console.log(`  ${i}`));
if (!issues.length) console.log('No issues found.');
