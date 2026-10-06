#!/usr/bin/env node
// Pixel-compare a running page against its Figma reference render.
// Usage: node scripts/visual-diff.mjs <route> <figmaNodeId> [<route> <figmaNodeId> ...] [--base http://localhost:3000]
//   e.g. node scripts/visual-diff.mjs "/portal/library?state=loading" 128:1522
// Needs: dev server running (PM keeps one on :3000 — do not start another), .figma/renders/<id>.png from figma-analyst.
// Output: .screens/<id>.png (app), .screens/<id>-diff.png (red = mismatch), .screens/<id>-side.png (figma | app), mismatch %.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const args = process.argv.slice(2);
const bi = args.indexOf('--base');
const base = bi > -1 ? args.splice(bi, 2)[1] : 'http://localhost:3000';
if (args.length < 2 || args.length % 2) {
  console.log('usage: node scripts/visual-diff.mjs <route> <figmaNodeId> [...pairs] [--base url]');
  process.exit(1);
}
const outDir = path.join(ROOT, '.screens');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const results = [];
for (let i = 0; i < args.length; i += 2) {
  const [route, id] = [args[i], args[i + 1]];
  const safe = id.replace(/[:;]/g, '-');
  const refPath = path.join(ROOT, '.figma', 'renders', `${safe}.png`);
  if (!fs.existsSync(refPath)) { console.error(`missing reference ${path.relative(ROOT, refPath)}`); continue; }
  let ref = PNG.sync.read(fs.readFileSync(refPath));
  // Tier-flow F2/F3 frames are 1592 tall; the bottom 64px is a prototype-only nav strip (not product UI).
  if (ref.height === 1592) {
    const cropped = new PNG({ width: ref.width, height: 1528 });
    PNG.bitblt(ref, cropped, 0, 0, ref.width, 1528, 0, 0);
    ref = cropped;
  }
  // Viewport matches the frame height so fill-height shells render at the designed size.
  const page = await browser.newPage({ viewport: { width: ref.width, height: Math.min(ref.height, 2400) }, reducedMotion: 'reduce' });
  await page.goto(base + route, { waitUntil: 'networkidle', timeout: 90000 });
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const shot = PNG.sync.read(await page.screenshot({ fullPage: true }));
  await page.close();

  // Crop/pad the app screenshot to the reference size so the diff is aligned top-left.
  const app = new PNG({ width: ref.width, height: ref.height });
  for (let y = 0; y < ref.height; y++) for (let x = 0; x < ref.width; x++) {
    const d = (y * ref.width + x) * 4;
    if (x < shot.width && y < shot.height) {
      const s = (y * shot.width + x) * 4;
      app.data[d] = shot.data[s]; app.data[d + 1] = shot.data[s + 1]; app.data[d + 2] = shot.data[s + 2]; app.data[d + 3] = 255;
    } else { app.data[d + 3] = 255; }
  }
  const diff = new PNG({ width: ref.width, height: ref.height });
  const bad = pixelmatch(ref.data, app.data, diff.data, ref.width, ref.height, { threshold: 0.15, includeAA: false });
  const side = new PNG({ width: ref.width * 2, height: ref.height });
  PNG.bitblt(ref, side, 0, 0, ref.width, ref.height, 0, 0);
  PNG.bitblt(app, side, 0, 0, ref.width, ref.height, ref.width, 0);
  fs.writeFileSync(path.join(outDir, `${safe}.png`), PNG.sync.write(app));
  fs.writeFileSync(path.join(outDir, `${safe}-diff.png`), PNG.sync.write(diff));
  fs.writeFileSync(path.join(outDir, `${safe}-side.png`), PNG.sync.write(side));
  const pct = ((bad / (ref.width * ref.height)) * 100).toFixed(2);
  const heightNote = shot.height !== ref.height ? ` (page height ${shot.height} vs figma ${ref.height})` : '';
  results.push({ route, id, mismatchPct: +pct, pageHeight: shot.height, figmaHeight: ref.height });
  console.log(`${id}\t${route}\tmismatch ${pct}%${heightNote}\t→ .screens/${safe}-side.png`);
}
await browser.close();
fs.appendFileSync(path.join(outDir, 'results.jsonl'), results.map((r) => JSON.stringify({ ts: new Date().toISOString(), ...r })).join('\n') + (results.length ? '\n' : ''));
