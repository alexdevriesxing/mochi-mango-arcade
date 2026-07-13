import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const outputDir = path.join(root, 'audit');
const baseUrl = (process.env.AUDIT_BASE_URL || 'https://www.mochimangoarcade.com').replace(/\/$/, '');
const sourceSha = process.env.GITHUB_SHA || 'local';
const runBrowser = process.env.RUN_BROWSER_AUDIT !== '0';
const gamesPath = path.join(publicDir, 'assets', 'data', 'games.json');
fs.mkdirSync(outputDir, { recursive: true });

const raw = JSON.parse(fs.readFileSync(gamesPath, 'utf8'));
const games = Array.isArray(raw) ? raw : raw.games;
if (!Array.isArray(games)) throw new Error('games.json must be an array or contain a games array');

const exists = value => value && fs.existsSync(value);
const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const countBy = (items, getter) => Object.fromEntries([...items.reduce((map, item) => {
  const key = getter(item) || '(missing)';
  map.set(key, (map.get(key) || 0) + 1);
  return map;
}, new Map()).entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
const median = values => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
};
const percentile = (values, ratio) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
};

const recommendations = {
  runner: 'Handcraft obstacle sequences, route choices, missions, character abilities and chase/boss stages.',
  dodger: 'Differentiate hazards, scoring rules, stage patterns and power-ups; add phases and mastery goals.',
  match3: 'Add level objectives, blockers, handcrafted boards, limited moves, boosters and a progression map.',
  memory: 'Add themed card effects, multi-stage boards, difficulty curves, streak systems and unlocks.',
  serve: 'Add recipe chains, customer personalities, upgrades, day progression and recovery states.',
  racing: 'Add authored tracks, opponents, drifting, lap structure, handling differences and tournaments.',
  sports: 'Add opponents, match states, defensive AI, tournaments, skill shots and progression.',
  shooter: 'Add enemy archetypes, authored waves, weapons, bosses, hit feedback and stage progression.',
  breakout: 'Add authored brick layouts, bosses, ball modifiers, stage themes and progression.',
  snake: 'Add maze layouts, objectives, enemies, hazards and character-specific mechanics.',
  rhythm: 'Add authored songs/charts, calibration, difficulty levels, combo feedback and track unlocks.',
  tower: 'Add tower types, upgrades, resistances, authored maps, wave previews and strategic economy.',
  pinball: 'Add table-specific mechanisms, missions, multiball, jackpots and persistent score goals.',
  fishing: 'Add fish behavior, locations, equipment, collections, weather and progression.',
  archery: 'Add wind, moving targets, tournaments, equipment and skill-based scoring.',
  pong: 'Add opponent AI styles, arenas, modifiers, tournaments and local multiplayer.',
  bubbleshooter: 'Add authored formations, ceiling pressure, special bubbles, goals and progression.',
  cannon: 'Add destructible structures, authored puzzles, ammunition types and level grading.',
  merge: 'Add meaningful unlocks, themed chains, objectives, limited boards and meta progression.',
  helix: 'Add authored tower sections, hazards, checkpoints, speed changes and skill scoring.',
  doodlejump: 'Add platform archetypes, enemies, level themes, checkpoints and abilities.',
  asteroids: 'Add ship upgrades, enemy craft, sectors, bosses, weapons and mission objectives.',
  pipeline: 'Add handcrafted puzzles, move limits, pressure systems, special pieces and campaign structure.',
  gallery: 'Add authored waves, accuracy grades, weapons, moving scenarios and challenge modes.',
  idleclicker: 'Add economy choices, offline progress, upgrade branches, goals and prestige depth.',
  flappy: 'Add authored routes, mission goals, abilities, environmental changes and checkpoints.',
  platformer: 'Add handcrafted levels, enemies, secrets, checkpoints, bosses and distinct movement abilities.',
  whack: 'Add multi-phase rounds, target behaviors, combos, hazards and difficulty modes.',
  maze: 'Add authored mazes, enemy behaviors, keys, secrets and multi-stage progression.',
  stacker: 'Add varied physics, objectives, environmental modifiers and structure-specific challenges.',
  board: 'Add deeper rules, competent AI, match variants, progression and strategic feedback.'
};

const engines = countBy(games, game => game.engine);
const genres = countBy(games, game => game.genre);
const universes = countBy(games, game => game.universeName || game.universe);
const mascots = countBy(games, game => game.mascot);
const descriptionGroups = new Map();
for (const game of games) {
  const fingerprint = normalize(game.description);
  if (fingerprint) descriptionGroups.set(fingerprint, [...(descriptionGroups.get(fingerprint) || []), game.slug]);
}
const duplicateDescriptions = [...descriptionGroups.entries()].filter(([, slugs]) => slugs.length > 1);

const records = games.map((game, index) => {
  const slug = game.slug;
  const imagePath = String(game.image || '').replace(/^\//, '');
  const detailPath = path.join(publicDir, 'games', slug, 'index.html');
  const playPath = path.join(publicDir, 'play', slug, 'index.html');
  const bespokePath = path.join(publicDir, 'play', slug, 'game', 'index.html');
  const missing = ['title', 'slug', 'description', 'genre', 'engine', 'mascot', 'universe'].filter(key => !game[key]);
  const descriptionLength = String(game.description || '').trim().length;
  const engineSize = engines[game.engine] || 0;
  const bespokeBundle = exists(bespokePath);
  const sharedRuntime = Boolean(game.built) && !bespokeBundle;
  const issues = [];
  if (missing.length) issues.push(`Missing fields: ${missing.join(', ')}`);
  if (descriptionLength < 90) issues.push(`Short description (${descriptionLength} characters)`);
  if (!imagePath || !exists(path.join(publicDir, imagePath))) issues.push('Missing referenced image');
  if (!exists(detailPath)) issues.push('Missing static detail page');
  if (!exists(playPath)) issues.push('Missing static play page');
  if ((descriptionGroups.get(normalize(game.description)) || []).length > 1) issues.push('Duplicate description');
  if (sharedRuntime && engineSize >= 20) issues.push(`Shared ${game.engine} runtime used by ${engineSize} games`);
  if (game.rating != null || game.plays != null) issues.push('Synthetic rating/play fields remain in source data');
  let score = missing.length * 8;
  score += descriptionLength < 90 ? 8 : descriptionLength < 140 ? 3 : 0;
  score += (!imagePath || !exists(path.join(publicDir, imagePath))) ? 14 : 0;
  score += !exists(detailPath) ? 18 : 0;
  score += !exists(playPath) ? 22 : 0;
  score += sharedRuntime ? 12 : -12;
  score += Math.min(18, Math.round(engineSize / Math.max(1, games.length) * 100));
  score += game.featured ? 8 : 0;
  score += game.new ? 4 : 0;
  score += (game.rating != null || game.plays != null) ? 4 : 0;
  return {
    index: index + 1, slug, title: game.title, engine: game.engine, genre: game.genre,
    universe: game.universeName || game.universe, mascot: game.mascot, built: Boolean(game.built),
    featured: Boolean(game.featured), new: Boolean(game.new), bespokeBundle, sharedRuntime,
    descriptionLength, score, issues,
    recommendation: recommendations[game.engine] || 'Add an authored loop, progression, challenge curve, feedback and character-specific mechanics.'
  };
});

async function request(url, consume = false, timeoutMs = 15000) {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: 'follow', headers: { 'user-agent': 'MMA-Sitewide-Audit/1.0' } });
    const text = consume ? await response.text() : '';
    if (!consume && response.body) await response.body.cancel();
    return {
      url, ok: response.ok, status: response.status, ms: Date.now() - start, finalUrl: response.url,
      contentType: response.headers.get('content-type'), csp: response.headers.get('content-security-policy'),
      hsts: response.headers.get('strict-transport-security'), text
    };
  } catch (error) {
    return { url, ok: false, status: 0, ms: Date.now() - start, error: error.name === 'AbortError' ? 'timeout' : error.message };
  } finally { clearTimeout(timer); }
}

async function mapLimit(items, limit, worker) {
  const output = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const current = next++;
      if (current >= items.length) return;
      output[current] = await worker(items[current]);
    }
  }));
  return output;
}

const corePaths = ['/', '/api/health', '/games/', '/universes/', '/characters/', '/new-releases/', '/about/', '/robots.txt', '/sitemap.xml', '/llms.txt', '/manifest.webmanifest', '/sw.js', `/audit-not-found-${Date.now()}/`];
const core = await mapLimit(corePaths, 8, item => request(`${baseUrl}${item}`, true, 20000));
const liveTargets = records.flatMap(record => [
  { slug: record.slug, kind: 'detail', url: `${baseUrl}/games/${record.slug}/` },
  { slug: record.slug, kind: 'play', url: `${baseUrl}/play/${record.slug}/` }
]);
const live = await mapLimit(liveTargets, 28, async item => ({ ...item, ...(await request(item.url)) }));
const liveMap = new Map(live.map(item => [`${item.slug}:${item.kind}`, item]));
for (const record of records) {
  record.live = { detail: liveMap.get(`${record.slug}:detail`), play: liveMap.get(`${record.slug}:play`) };
  if (!record.live.detail?.ok) { record.score += 30; record.issues.push(`Live detail failed (${record.live.detail?.status || record.live.detail?.error})`); }
  if (!record.live.play?.ok) { record.score += 35; record.issues.push(`Live play failed (${record.live.play?.status || record.live.play?.error})`); }
  if ((record.live.play?.ms || 0) > 2500) { record.score += 5; record.issues.push(`Slow play response (${record.live.play.ms} ms)`); }
}

const browserResults = [];
if (runBrowser) {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const samples = [];
    for (const engine of Object.keys(engines)) {
      const candidate = records.filter(record => record.engine === engine && record.built)
        .sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.bespokeBundle) - Number(a.bespokeBundle) || a.index - b.index)[0];
      if (candidate) samples.push({ record: candidate, viewport: 'desktop', width: 1366, height: 900 });
    }
    for (const record of [...records].sort((a, b) => b.score - a.score).slice(0, 12)) samples.push({ record, viewport: 'mobile', width: 390, height: 844 });
    const seen = new Set();
    for (const sample of samples) {
      const key = `${sample.record.slug}:${sample.viewport}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const context = await browser.newContext({ viewport: { width: sample.width, height: sample.height }, isMobile: sample.viewport === 'mobile' });
      const page = await context.newPage();
      const errors = [];
      const requestFailures = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('requestfailed', req => requestFailures.push(`${req.method()} ${req.url()} ${req.failure()?.errorText || ''}`));
      const started = Date.now();
      let status = 0;
      let metrics = {};
      try {
        const response = await page.goto(`${baseUrl}/play/${sample.record.slug}/`, { waitUntil: 'domcontentloaded', timeout: 25000 });
        status = response?.status() || 0;
        await page.waitForTimeout(1200);
        await page.keyboard.press('Space').catch(() => {});
        await page.keyboard.press('ArrowRight').catch(() => {});
        await page.waitForTimeout(400);
        metrics = await page.evaluate(() => ({
          title: document.title,
          h1: document.querySelector('h1')?.textContent?.trim() || '',
          canvases: [...document.querySelectorAll('canvas')].map(item => ({ width: item.clientWidth, height: item.clientHeight })),
          iframes: [...document.querySelectorAll('iframe')].map(item => ({ width: item.clientWidth, height: item.clientHeight, src: item.src })),
          horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
          undefinedText: /\b(undefined|NaN|null)\b/.test(document.body.innerText)
        }));
      } catch (error) { errors.push(error.message); }
      const runtimeOk = status === 200 && (metrics.canvases?.some(item => item.width > 200 && item.height > 150) || metrics.iframes?.some(item => item.width > 200 && item.height > 150));
      browserResults.push({ slug: sample.record.slug, title: sample.record.title, engine: sample.record.engine, viewport: sample.viewport, status, ms: Date.now() - started, runtimeOk, metrics, errors: [...new Set(errors)].slice(0, 20), requestFailures: [...new Set(requestFailures)].slice(0, 20) });
      await context.close();
    }
    await browser.close();
  } catch (error) { browserResults.push({ auditError: error.message }); }
}

for (const record of records) {
  record.browser = browserResults.filter(result => result.slug === record.slug);
  for (const result of record.browser) {
    if (!result.runtimeOk) { record.score += 35; record.issues.push(`Browser runtime failed on ${result.viewport}`); }
    if (result.errors.length) { record.score += Math.min(20, result.errors.length * 4); record.issues.push(`${result.errors.length} browser error(s) on ${result.viewport}`); }
    if (result.metrics.horizontalOverflow) { record.score += 8; record.issues.push(`Horizontal overflow on ${result.viewport}`); }
    if (result.metrics.undefinedText) { record.score += 8; record.issues.push(`Undefined/NaN/null visible on ${result.viewport}`); }
  }
  record.issues = [...new Set(record.issues)];
}
records.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

const failedLive = live.filter(item => !item.ok);
const responseTimes = live.filter(item => item.ok).map(item => item.ms);
const runtimeFailures = browserResults.filter(item => item.slug && !item.runtimeOk);
const browserErrors = browserResults.filter(item => item.slug && item.errors.length);
const notFound = core.find(item => item.url.includes('/audit-not-found-'));
const report = {
  generatedAt: new Date().toISOString(), sourceSha, baseUrl,
  summary: {
    totalGames: games.length, builtGames: records.filter(item => item.built).length,
    bespokeBundles: records.filter(item => item.bespokeBundle).length,
    sharedRuntimeGames: records.filter(item => item.sharedRuntime).length,
    engines: Object.keys(engines).length, genres: Object.keys(genres).length,
    universes: Object.keys(universes).length, mascots: Object.keys(mascots).length,
    duplicateDescriptions: duplicateDescriptions.length,
    liveUrlsChecked: live.length + core.length, failedLiveUrls: failedLive.length,
    medianResponseMs: median(responseTimes), p95ResponseMs: percentile(responseTimes, 0.95),
    browserTests: browserResults.filter(item => item.slug).length,
    browserRuntimeFailures: runtimeFailures.length, browserTestsWithErrors: browserErrors.length,
    homepageStatus: core.find(item => item.url === `${baseUrl}/`)?.status || 0,
    healthStatus: core.find(item => item.url === `${baseUrl}/api/health`)?.status || 0,
    notFoundStatus: notFound?.status || 0
  },
  distributions: { engines, genres, universes, mascots },
  core: core.map(({ text, ...item }) => ({ ...item, preview: text.slice(0, 500) })),
  duplicateDescriptions: duplicateDescriptions.map(([fingerprint, slugs]) => ({ fingerprint: fingerprint.slice(0, 140), slugs })),
  browserResults, topImprovementCandidates: records.slice(0, 100), games: records
};
fs.writeFileSync(path.join(outputDir, 'sitewide-latest.json'), JSON.stringify(report, null, 2) + '\n');

const coreRows = core.map(item => `| ${new URL(item.url).pathname} | ${item.status || 0} | ${item.ms} | ${item.ok ? 'OK' : item.error || 'Failed'} |`).join('\n');
const engineRows = Object.entries(engines).map(([engine, count]) => {
  const shared = records.filter(item => item.engine === engine && item.sharedRuntime).length;
  const failed = records.filter(item => item.engine === engine && item.browser.some(test => !test.runtimeOk)).length;
  return `| ${engine} | ${count} | ${shared} | ${failed} | ${recommendations[engine] || 'Add authored variety, progression and distinctive mechanics.'} |`;
}).join('\n');
const candidateRows = records.slice(0, 50).map((item, index) => `| ${index + 1} | ${String(item.title).replace(/\|/g, '\\|')} | ${item.engine} | ${item.score} | ${(item.issues.slice(0, 4).join('; ') || 'Template depth and differentiation').replace(/\|/g, '\\|')} |`).join('\n');
const browserRows = browserResults.filter(item => item.slug).map(item => `| ${String(item.title).replace(/\|/g, '\\|')} | ${item.engine} | ${item.viewport} | ${item.status} | ${item.runtimeOk ? 'Yes' : 'No'} | ${item.errors.length} | ${item.metrics.horizontalOverflow ? 'Yes' : 'No'} |`).join('\n');
const markdown = `# Mochi Mango Arcade — Sitewide & Game Quality Audit\n\nGenerated: ${report.generatedAt}  \nSource: \`${sourceSha}\`  \nLive target: ${baseUrl}\n\n## Executive summary\n\n- **${games.length} games**, **${Object.keys(engines).length} shared engines**, **${Object.keys(universes).length} universes**.\n- **${report.summary.bespokeBundles} bespoke bundles** versus **${report.summary.sharedRuntimeGames} shared-runtime games**.\n- **${report.summary.liveUrlsChecked} live URLs checked**; **${failedLive.length} failures**. Median **${report.summary.medianResponseMs} ms**, p95 **${report.summary.p95ResponseMs} ms**.\n- **${report.summary.browserTests} browser play tests**; **${runtimeFailures.length} runtime failures**, **${browserErrors.length} tests with errors**.\n- Health endpoint: **${report.summary.healthStatus}**. Unknown route: **${report.summary.notFoundStatus}** (expected 404).\n- Exact duplicate descriptions: **${duplicateDescriptions.length}**.\n\n## Main conclusion\n\nThe largest opportunity is depth, not catalogue size. Shared engines are useful infrastructure, but most titles need authored levels, character-specific mechanics, progression, goals, stronger feedback and distinctive audio/visual behavior. Upgrade the largest engines first, then turn selected flagship titles into bespoke games.\n\n## Core live checks\n\n| Path | Status | ms | Result |\n|---|---:|---:|---|\n${coreRows}\n\n## Engine improvement roadmap\n\n| Engine | Games | Shared-runtime | Browser failures | Best next improvement |\n|---|---:|---:|---:|---|\n${engineRows}\n\n## Top 50 games to improve first\n\n| # | Game | Engine | Priority | Findings |\n|---:|---|---|---:|---|\n${candidateRows}\n\n## Browser play tests\n\n| Game | Engine | Viewport | HTTP | Runtime visible | Errors | Overflow |\n|---|---|---|---:|---|---:|---|\n${browserRows || '| Browser audit unavailable | — | — | 0 | No | 1 | — |'}\n\n## Recommended order\n\n1. Fix all URL, runtime, console and mobile-overflow failures.\n2. Upgrade the five largest engines so one improvement benefits many games.\n3. Select 20 flagship titles for bespoke levels, progression, unique mechanics, audio, onboarding and endings.\n4. Remove synthetic fields and stale generated metadata at source.\n5. Keep automated engine smoke tests and flagship browser tests in CI.\n6. Add real events for game start, first input, session length, completion, replay and errors.\n`;
fs.writeFileSync(path.join(outputDir, 'sitewide-latest.md'), markdown);
console.log(JSON.stringify(report.summary, null, 2));
