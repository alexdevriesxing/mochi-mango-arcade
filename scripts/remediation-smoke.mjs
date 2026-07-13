import fs from 'node:fs';
import { chromium } from 'playwright';

const base = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:8787';
const targets = [
  'scanline-sprint','pixel-panda-parkour-standalone','pixel-prawn-deep-sea-debugger-standalone','boom-bap-cannon',
  'super-seans-merge-madness','super-seans-pipe-puzzle','puddle-pip-meadow-dash',
  'puddles-pancake-panic','mushmoos-moonlit-match','bloop-bubble-rescue','nine-gates-mahjong-trails',
  'snackstreet-rush','crownlight-chess','starling-signal-patrol','glitch-garden','boot-sector',
  'rooftop-rocket-rumble','tower-of-floppy','super-seans-racing-rally','super-seans-soccer-showdown',
  'super-seans-pinball-party','comet-quarry-crew','floppy-flap','baos-jade-dragon-rescue',
  'the-donut-dragon-derby','tika-tiger-traffic-tango'
];

const browser = await chromium.launch({ headless: true });
const failures = [];
const results = [];
for (const viewport of [{ name: 'desktop', width: 1280, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
  const context = await browser.newContext({ viewport });
  for (const slug of targets) {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(String(error.message || error)));
    page.on('console', message => {
      const text = message.text();
      if (message.type() === 'error' && !/favicon|Failed to load resource|cloudflareinsights/i.test(text)) errors.push(text);
    });
    const url = `${base}/play/${slug}/`;
    let status = 0;
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      status = response?.status() || 0;
      await page.waitForTimeout(900);
      const start = page.locator('.mma-play-normal').first();
      if (await start.isVisible().catch(() => false)) await start.click();
      await page.waitForTimeout(400);
      if (slug.includes('merge-madness')) {
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowUp');
      }
      if (slug.includes('pipe-puzzle')) {
        const canvas = page.locator('canvas').first();
        if (await canvas.isVisible().catch(() => false)) await canvas.click({ position: { x: 160, y: 180 } });
      }
      await page.waitForTimeout(300);
      const metrics = await page.evaluate(() => ({
        canvas: [...document.querySelectorAll('canvas')].some(node => { const r=node.getBoundingClientRect(); return r.width>120&&r.height>120; }),
        iframe: [...document.querySelectorAll('iframe')].some(node => { const r=node.getBoundingClientRect(); return r.width>120&&r.height>120; }),
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 3,
        qualityPanel: Boolean(document.querySelector('.mma-quality-panel')),
        campaignPanel: Boolean(document.querySelector('.mma-campaign-panel')),
        title: document.querySelector('h1')?.textContent || document.title
      }));
      const fatal = errors.filter(error => !/cloudflareinsights|favicon|Failed to load resource/i.test(error));
      const ok = status === 200 && (metrics.canvas || metrics.iframe) && (!metrics.canvas || metrics.campaignPanel) && !metrics.horizontalOverflow && fatal.length === 0;
      results.push({ slug, viewport: viewport.name, status, ok, metrics, errors: fatal });
      if (!ok) failures.push({ slug, viewport: viewport.name, status, metrics, errors: fatal });
    } catch (error) {
      failures.push({ slug, viewport: viewport.name, status, error: String(error) });
    } finally {
      await page.close();
    }
  }
  await context.close();
}
await browser.close();
const report={generatedAt:new Date().toISOString(),tested:results.length,passed:results.filter(r=>r.ok).length,failures,results};
fs.writeFileSync('.github/remediation-smoke-status.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({tested:report.tested,passed:report.passed,failures},null,2));
if(failures.length)process.exit(1);
