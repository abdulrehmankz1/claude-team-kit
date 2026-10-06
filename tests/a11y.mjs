// Keyboard + DOM a11y spot check on key screens.
// Usage: node tests/a11y.mjs [--base http://localhost:3000] [--screens /,/about] [--dialogs /page?state=open,...]
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
const require = createRequire(import.meta.url);
let axeSrc = null; try { axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'); } catch {}
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const list = (s) => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : []);
const base = arg('base', 'http://localhost:3000');
const screens = list(arg('screens', '/'));
const b = await chromium.launch();
const out = [];
for (const u of screens) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })).newPage();
  await p.goto(base + u, { waitUntil: 'networkidle' });
  const dom = await p.evaluate(() => {
    const vis = (e) => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return r.width > 0 && r.height > 0 && c.visibility !== 'hidden' && c.display !== 'none'; };
    const imgsNoAlt = [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).map((i) => i.src.slice(-50));
    const unlabeled = [...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(vis).filter((e) => !(e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.labels?.length || e.title)).map((e) => e.outerHTML.slice(0, 100));
    const noName = [...document.querySelectorAll('button,a[href],[role=button]')].filter(vis).filter((e) => !(e.textContent.trim() || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.title || e.querySelector('img[alt]:not([alt=""])'))).map((e) => e.outerHTML.slice(0, 110));
    const focusable = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')].filter((e) => vis(e) && !e.disabled && e.tabIndex >= 0).length;
    return { imgsNoAlt, unlabeled, noName, focusable };
  });
  // Tab through; record reached elements and whether focus indicator is visible.
  const reached = new Set(); let noRing = [];
  for (let i = 0; i < dom.focusable + 10; i++) {
    await p.keyboard.press('Tab');
    const info = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const c = getComputedStyle(e); const ring = (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0) || (c.boxShadow && c.boxShadow !== 'none'); const key = e.tagName + '|' + (e.getAttribute('aria-label') || e.textContent.trim().slice(0, 25) || e.id) + '|' + Math.round(e.getBoundingClientRect().x) + ',' + Math.round(e.getBoundingClientRect().y); return { key, ring, border: c.borderColor }; });
    if (!info) { continue; }
    if (reached.has(info.key)) break;
    reached.add(info.key); if (!info.ring) noRing.push(info.key);
  }
  let axe = null;
  if (axeSrc) { await p.addScriptTag({ content: axeSrc }); axe = await p.evaluate(async () => { const r = await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] }); return r.violations.map((v) => `${v.id} (${v.impact}) x${v.nodes.length}`); }); }
  out.push({ u, ...dom, imgsNoAlt: dom.imgsNoAlt, tabbed: reached.size, noRing: noRing.slice(0, 6), noRingCount: noRing.length, axe });
  await p.context().close();
}
// Dialog checks: open dialog, Tab x12 stays inside, Escape closes.
const dialogs = list(arg('dialogs')).map((u) => [u, null]);
const dres = [];
for (const [u] of dialogs) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })).newPage();
  await p.goto(base + u, { waitUntil: 'networkidle' }); await p.waitForTimeout(300);
  const has = await p.locator('[role=dialog],[role=alertdialog]').count();
  let trapped = null, closed = null;
  if (has) {
    trapped = true;
    for (let i = 0; i < 14; i++) { await p.keyboard.press('Tab'); if (!(await p.evaluate(() => !!document.activeElement?.closest('[role=dialog],[role=alertdialog]')))) { trapped = false; break; } }
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    closed = (await p.locator('[role=dialog],[role=alertdialog]').count()) === 0;
  }
  dres.push({ u, dialogs: has, trapped, escCloses: closed });
  await p.context().close();
}
console.log(JSON.stringify({ axe: !!axeSrc, out, dres }, null, 1));
await b.close();
