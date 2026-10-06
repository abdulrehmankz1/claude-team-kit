// Route smoke: load each route at 1440 and 390, record status/console/overflow.
// Routes come from --routes, or are scraped from a /dev screen-index table (name | … | a.font-mono href | BUILT).
// Usage: node tests/smoke.mjs [--base http://localhost:3000] [--routes /,/about]  -> writes tests/smoke-results.json
import fs from 'node:fs';
import { chromium } from 'playwright';
const base = process.argv.includes('--base') ? process.argv[process.argv.indexOf('--base') + 1] : 'http://localhost:3000';
const ri = process.argv.indexOf('--routes');
const browser = await chromium.launch();
let rows;
if (ri > -1) {
  rows = process.argv[ri + 1].split(',').map((h) => ({ name: h.trim(), href: h.trim(), built: true }));
} else {
  const p0 = await browser.newPage();
  await p0.goto(base + '/dev', { waitUntil: 'networkidle' });
  rows = await p0.$$eval('tbody tr', (trs) => trs.map((tr) => ({
    name: tr.children[0].textContent, href: tr.querySelector('a.font-mono')?.getAttribute('href'), built: tr.children[3].textContent.trim() === 'BUILT',
  })));
  await p0.close();
}
const seen = new Set();
const targets = rows.filter((r) => r.built && r.href && !seen.has(r.href) && seen.add(r.href));
console.log(`registry rows ${rows.length}, built ${rows.filter((r) => r.built).length}, unique built hrefs ${targets.length}`);
const results = [];
const queue = [...targets];
async function worker() {
  const ctxs = { 1440: await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }), 390: await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }) };
  while (queue.length) {
    const t = queue.shift();
    for (const w of [1440, 390]) {
      const page = await ctxs[w].newPage();
      const errs = [];
      page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(`${m.type()}: ${m.text().slice(0, 200)}`); });
      page.on('pageerror', (e) => errs.push(`pageerror: ${String(e.message).slice(0, 200)}`));
      let status = 0, overflow = 0;
      try {
        const r = await page.goto(base + t.href, { waitUntil: 'networkidle', timeout: 60000 });
        status = r?.status() ?? 0;
        await page.waitForTimeout(150);
        overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      } catch (e) { errs.push('nav: ' + String(e.message).slice(0, 150)); }
      results.push({ href: t.href, name: t.name, w, status, overflow, errs: [...new Set(errs)] });
      await page.close();
    }
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);
fs.writeFileSync(new URL('./smoke-results.json', import.meta.url), JSON.stringify(results, null, 1));
const bad = results.filter((r) => r.status !== 200 || r.errs.length || r.overflow > 0);
console.log(`checks ${results.length}; failing ${bad.length}`);
for (const w of [1440, 390]) console.log(w, 'non200', results.filter((r) => r.w === w && r.status !== 200).length, 'errs', results.filter((r) => r.w === w && r.errs.length).length, 'overflow', results.filter((r) => r.w === w && r.overflow > 0).length);
await browser.close();
