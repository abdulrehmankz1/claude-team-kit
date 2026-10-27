// Live office: watch the team's agents work in your browser. Optional and off by default.
// Reads .claude/office/events.jsonl (written by .claude/hooks/office-event.mjs) and serves the office page on localhost only.
// Usage: node scripts/claude-team/office.mjs [enable|disable|status] [--port 4317] [--root <project dir>]
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initial, officeEnabled, readRoster, reduce, view, withOffice } from './office-state.mjs';

const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : fallback; };
const root = path.resolve(arg('--root', process.cwd()));
const port = Number(arg('--port', 4317));
const file = path.join(root, '.claude', 'office', 'events.jsonl');

const local = path.join(root, '.claude', 'settings.local.json');
const readLocal = () => { try { return JSON.parse(fs.readFileSync(local, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return {}; throw new Error(`Cannot parse ${local}: ${error.message}`); } };
const command = process.argv[2];
if (['enable', 'disable', 'status'].includes(command)) {
  const settings = readLocal();
  if (command === 'status') {
    console.log(officeEnabled(settings) ? 'Live office is ON for you in this project.' : 'Live office is OFF. Turn it on with: node scripts/claude-team/office.mjs enable');
  } else {
    fs.mkdirSync(path.dirname(local), { recursive: true });
    fs.writeFileSync(local, JSON.stringify(withOffice(settings, command === 'enable'), null, 2) + '\n');
    console.log(command === 'enable'
      ? 'Live office ON (hooks added to .claude/settings.local.json, only for you). Restart Claude Code, then run: node scripts/claude-team/office.mjs'
      : 'Live office OFF. Hooks removed from .claude/settings.local.json; your other local settings are untouched.');
  }
  process.exit(0);
}
const page = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'office.html'));
const roster = readRoster(root);

let state = initial();
let offset = 0;
let rest = '';
function ingest() {
  let size;
  try { size = fs.statSync(file).size; } catch { return; }
  if (size < offset) { state = initial(); offset = 0; rest = ''; }
  if (size === offset) return;
  const fd = fs.openSync(file, 'r');
  const buf = Buffer.alloc(size - offset);
  fs.readSync(fd, buf, 0, buf.length, offset);
  fs.closeSync(fd);
  offset = size;
  const lines = (rest + buf.toString('utf8')).split('\n');
  rest = lines.pop();
  for (const line of lines) { try { reduce(state, JSON.parse(line)); } catch {} }
}
ingest();
setInterval(ingest, 400);

const server = http.createServer((req, res) => {
  const host = String(req.headers.host ?? '').replace(/:\d+$/, '');
  if (!['localhost', '127.0.0.1', '[::1]'].includes(host) || req.method !== 'GET') { res.writeHead(403).end(); return; }
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }).end(page);
  } else if (url.pathname === '/state') {
    ingest();
    const body = { project: path.basename(root), watching: fs.existsSync(file), ...view(state, roster) };
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end(JSON.stringify(body));
  } else {
    res.writeHead(404).end();
  }
});
server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE' ? `Port ${port} is busy. Try --port ${port + 1}.` : error.message);
  process.exit(1);
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Live office for ${path.basename(root)}: http://localhost:${port}`);
  let on = false;
  try { on = officeEnabled(readLocal()); } catch {}
  if (!on) console.log('The office is OFF, so no new activity is recorded. Turn it on with: node scripts/claude-team/office.mjs enable');
  else console.log(fs.existsSync(file) ? `Watching ${path.relative(root, file)}` : 'No activity yet. Start Claude Code in this project and the desks will light up.');
});
