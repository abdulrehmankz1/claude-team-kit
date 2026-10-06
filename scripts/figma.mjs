#!/usr/bin/env node
// Figma REST API helper (REST only — no MCP). Reads FIGMA_TOKEN from env or .env; never prints it.
//
// Usage:
//   node scripts/figma.mjs pages                         -> .figma/pages.json (pages + top-level frames)
//   node scripts/figma.mjs nodes <id,id,...> [--depth N] -> .figma/nodes/<id>.json
//   node scripts/figma.mjs images <id,id,...> [--scale 1] [--format png] -> .figma/renders/<id>.png
//   node scripts/figma.mjs fills                          -> .figma/fills/<imageRef>.<ext> (all image fills)
//   node scripts/figma.mjs styles                         -> .figma/styles.json
//   node scripts/figma.mjs svg <id,id,...> --out <dir>    -> <dir>/<id>.svg (icons/vectors)
//
// File key comes from FIGMA_FILE_KEY (env or .env).
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const OUT = path.join(ROOT, '.figma');
function loadEnv(name) {
  if (process.env[name]) return process.env[name].trim();
  const envPath = path.join(ROOT, '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(new RegExp(`^\\s*${name}\\s*=\\s*(.*)\\s*$`));
      if (m) return m[1].replace(/^['"]|['"]$/g, '').trim();
    }
  }
  console.error(`${name} missing (set it in .env).`);
  process.exit(1);
}
const TOKEN = loadEnv('FIGMA_TOKEN');
const FILE_KEY = loadEnv('FIGMA_FILE_KEY');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(pathname, attempt = 0) {
  const res = await fetch(`https://api.figma.com/v1${pathname}`, { headers: { 'X-Figma-Token': TOKEN } });
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 6) throw new Error(`Figma ${res.status} after retries: ${pathname}`);
    const wait = Number(res.headers.get('retry-after')) * 1000 || 2000 * 2 ** attempt;
    console.error(`Figma ${res.status}; retrying in ${Math.round(wait / 1000)}s`);
    await sleep(Math.min(wait, 120000));
    return api(pathname, attempt + 1);
  }
  if (!res.ok) throw new Error(`Figma ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

async function download(url, dest, attempt = 0) {
  const res = await fetch(url);
  if (!res.ok) {
    if (attempt < 4) { await sleep(1500 * (attempt + 1)); return download(url, dest, attempt + 1); }
    throw new Error(`Download ${res.status}: ${dest}`);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

const safe = (id) => id.replace(/[:;]/g, '-');
const write = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`wrote ${path.relative(ROOT, file)}`);
};
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

const [, , cmd, idArg] = process.argv;
const ids = (idArg || '').split(',').map((s) => s.trim()).filter(Boolean);

switch (cmd) {
  case 'pages': {
    const data = await api(`/files/${FILE_KEY}?depth=2`);
    const pages = data.document.children.map((p) => ({
      id: p.id,
      name: p.name,
      frames: (p.children || []).map((f) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        w: f.absoluteBoundingBox ? Math.round(f.absoluteBoundingBox.width) : null,
        h: f.absoluteBoundingBox ? Math.round(f.absoluteBoundingBox.height) : null,
      })),
    }));
    write(path.join(OUT, 'pages.json'), { name: data.name, lastModified: data.lastModified, pages });
    for (const p of pages) console.log(`${p.id}\t${p.name}\t(${p.frames.length} frames)`);
    break;
  }
  case 'nodes': {
    const depth = arg('depth');
    for (const group of chunk(ids, 10)) {
      const q = `/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(group.join(','))}${depth ? `&depth=${depth}` : ''}&geometry=paths`;
      const data = await api(q);
      for (const [id, node] of Object.entries(data.nodes)) write(path.join(OUT, 'nodes', `${safe(id)}.json`), node);
    }
    break;
  }
  case 'images':
  case 'svg': {
    const format = cmd === 'svg' ? 'svg' : arg('format', 'png');
    const scale = arg('scale', '1');
    const dir = arg('out') ? path.resolve(ROOT, arg('out')) : path.join(OUT, 'renders');
    for (const group of chunk(ids, 20)) {
      const q = `/images/${FILE_KEY}?ids=${encodeURIComponent(group.join(','))}&format=${format}&scale=${scale}${format === 'svg' ? '&svg_outline_text=false&svg_include_id=false' : ''}`;
      const data = await api(q);
      if (data.err) throw new Error(data.err);
      for (const [id, url] of Object.entries(data.images)) {
        if (!url) { console.error(`no render for ${id}`); continue; }
        const dest = path.join(dir, `${safe(id)}.${format}`);
        await download(url, dest);
        console.log(`saved ${path.relative(ROOT, dest)}`);
      }
    }
    break;
  }
  case 'fills': {
    const data = await api(`/files/${FILE_KEY}/images`);
    const entries = Object.entries(data.meta?.images || {});
    const dir = arg('out') ? path.resolve(ROOT, arg('out')) : path.join(OUT, 'fills');
    let n = 0;
    for (const [ref, url] of entries) {
      if (!url) continue;
      const dest = path.join(dir, `${ref}.png`);
      if (fs.existsSync(dest)) continue;
      await download(url, dest);
      n++;
    }
    console.log(`saved ${n} new image fills (${entries.length} total) to ${path.relative(ROOT, dir)}`);
    break;
  }
  case 'styles': {
    write(path.join(OUT, 'styles.json'), await api(`/files/${FILE_KEY}/styles`));
    break;
  }
  default:
    console.log('commands: pages | nodes <ids> [--depth N] | images <ids> [--scale S] [--format png|jpg] [--out dir] | svg <ids> --out dir | fills | styles');
}
