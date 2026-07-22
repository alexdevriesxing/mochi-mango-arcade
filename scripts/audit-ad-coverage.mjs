#!/usr/bin/env node
// Audit Adsterra unit coverage per page template.
//
// Adsterra's terms allow a given unit script at most once per page, and
// mountAds() enforces that at runtime by skipping repeats. This checks the
// other half: that every page actually carries a healthy spread of DISTINCT
// units, and flags any template that repeats one (harmless at runtime, but it
// means an intended slot is silently going unfilled).
//
//   node scripts/audit-ad-coverage.mjs

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const src = readFileSync(join(ROOT, 'public/assets/js/app.js'), 'utf8');

// Helper -> the catalog unit(s) it resolves to. Kept in step with the
// definitions in app.js; adTop is responsive and therefore counts as two.
const HELPERS = {
  adTop: ['b728x90', 'b320x50'],
  adSide: ['b300x250'],
  adNative: ['native'],
};

// Mounted once site-wide from boot(), so it is present on every page without
// appearing in any page template.
const SITEWIDE = ['social'];

/** Slice out a function body by brace matching from its declaration. */
function bodyOf(name) {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) return '';
  let i = src.indexOf('{', start), depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (!depth) return src.slice(i, j + 1); }
  }
  return src.slice(i);
}

const PAGES = ['charsPage', 'gamesPage', 'universesPage', 'shopPage', 'newPage',
               'aboutPage', 'leaderboardPage', 'playPage', 'productPage', 'adMapPage'];

// Legal pages intentionally carry no advertising.
const NO_ADS_BY_DESIGN = new Set(['legalPage']);

const rows = [];
for (const page of PAGES) {
  const body = bodyOf(page);
  if (!body) { rows.push({ page, err: 'not found' }); continue; }

  const units = [];
  for (const m of body.matchAll(/adSlot\(\s*'([^']+)'/g)) units.push(m[1]);
  for (const m of body.matchAll(/adSkyscraper\(\s*'([^']+)'/g)) units.push(m[1]);
  for (const m of body.matchAll(/adResponsive\(\s*'([^']+)'\s*,\s*'([^']+)'/g)) units.push(m[1], m[2]);
  for (const [helper, resolved] of Object.entries(HELPERS)) {
    const n = (body.match(new RegExp(`\\b${helper}\\(`, 'g')) || []).length;
    for (let i = 0; i < n; i++) units.push(...resolved);
  }

  const counts = units.reduce((a, u) => ((a[u] = (a[u] || 0) + 1), a), {});
  const distinct = Object.keys(counts);
  const repeated = distinct.filter((u) => counts[u] > 1);
  rows.push({ page, distinct: distinct.length, units: distinct.sort(), repeated });
}

console.log('Adsterra unit coverage per page template\n');
for (const r of rows) {
  if (r.err) { console.log(`  ${r.page.padEnd(16)} ${r.err}`); continue; }
  const flag = r.distinct >= 3 ? 'ok  ' : 'THIN';
  console.log(`  ${flag} ${r.page.padEnd(16)} ${String(r.distinct).padStart(2)} distinct  [${r.units.join(', ')}]`);
  if (r.repeated.length) {
    // playPage has mutually exclusive branches, so a "repeat" there is usually
    // one unit appearing once per branch rather than twice on one render.
    console.log(`       repeated in template: ${r.repeated.join(', ')}${r.page === 'playPage' ? '  (separate branches — runtime is clean)' : ''}`);
  }
}

const thin = rows.filter((r) => !r.err && r.distinct < 3 && !NO_ADS_BY_DESIGN.has(r.page));
console.log(`\nplus site-wide, mounted from boot(): ${SITEWIDE.join(', ')}`);
console.log(`${rows.length} templates · ${thin.length} below 3 distinct units`);
if (thin.length) console.log('thin:', thin.map((r) => r.page).join(', '));
