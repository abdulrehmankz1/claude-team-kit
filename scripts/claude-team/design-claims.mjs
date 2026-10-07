#!/usr/bin/env node
// Work-claims register for the design studio: one owner per Figma section and per docs path.
// Only the design director (or the PM acting as director) runs this, one command at a time.
// It is an assignment register for a single dispatcher, not a lock across separate sessions.
//
// Usage:
//   node scripts/claude-team/design-claims.mjs claim --id ui-designer#M2 --agent ui-designer --module M2 \
//        [--page "App · Billing" --section "3 · UI"] [--paths docs/design/app/time-off/ui-notes.md] \
//        [--after mobile-designer#M2] [--read-only]
//   node scripts/claude-team/design-claims.mjs release <id> [--note "done"]
//   node scripts/claude-team/design-claims.mjs list
//   node scripts/claude-team/design-claims.mjs check
// Options: --file <path> (default docs/design/claims.json)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LIMITS = { active: 12, figmaWriters: 8 };

const norm = (p) => p.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');
const sectionParts = (s) => (s ? s.split('/').map((x) => x.trim()).filter(Boolean) : []);

// One section contains the other when its parts are a prefix ("3 · UI" contains "3 · UI / RTL").
// An empty section means the whole page.
export function sectionsOverlap(a, b) {
  const x = sectionParts(a), y = sectionParts(b);
  const n = Math.min(x.length, y.length);
  for (let i = 0; i < n; i++) if (x[i] !== y[i]) return false;
  return true;
}

export function pathsOverlap(a, b) {
  const x = norm(a), y = norm(b);
  return x === y || x.startsWith(y + '/') || y.startsWith(x + '/');
}

export function conflicts(claim, active) {
  const found = [];
  for (const other of active) {
    if (other.id === claim.id) { found.push(`id ${claim.id} is already active`); continue; }
    if (claim.page && other.page && claim.page === other.page && sectionsOverlap(claim.section, other.section)) {
      found.push(`Figma "${claim.page}" / "${claim.section || '(whole page)'}" overlaps ${other.id} ("${other.section || '(whole page)'}")`);
    }
    for (const p of claim.paths || []) for (const q of other.paths || []) {
      if (pathsOverlap(p, q)) found.push(`path ${p} overlaps ${other.id} (${q})`);
    }
  }
  return found;
}

export function tryClaim(state, claim) {
  const problems = conflicts(claim, state.active);
  if (state.active.length + 1 > LIMITS.active) problems.push(`would exceed ${LIMITS.active} active agents`);
  const writers = state.active.filter((c) => c.page && !c.readOnly).length;
  if (claim.page && !claim.readOnly && writers + 1 > LIMITS.figmaWriters) problems.push(`would exceed ${LIMITS.figmaWriters} Figma writers`);
  for (const dep of claim.after || []) {
    if (state.active.some((c) => c.id === dep)) problems.push(`waits for ${dep}, which is still active`);
  }
  if (problems.length) return { ok: false, problems };
  state.active.push(claim);
  return { ok: true, problems: [] };
}

export function release(state, id, note) {
  const i = state.active.findIndex((c) => c.id === id);
  if (i < 0) return false;
  const [c] = state.active.splice(i, 1);
  state.history.push({ ...c, released: new Date().toISOString(), note: note || '' });
  state.history = state.history.slice(-200);
  return true;
}

export function checkState(state) {
  const problems = [];
  state.active.forEach((c, i) => problems.push(...conflicts(c, state.active.slice(i + 1))));
  if (state.active.length > LIMITS.active) problems.push(`${state.active.length} active agents exceed ${LIMITS.active}`);
  const writers = state.active.filter((c) => c.page && !c.readOnly).length;
  if (writers > LIMITS.figmaWriters) problems.push(`${writers} Figma writers exceed ${LIMITS.figmaWriters}`);
  return problems;
}

const load = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { active: [], history: [] });
const save = (file, s) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(s, null, 2) + '\n'); };

function main(argv) {
  const [cmd, ...rest] = argv;
  const opt = (n) => { const i = rest.indexOf(`--${n}`); return i > -1 ? rest[i + 1] : undefined; };
  const list = (v) => (v ? v.split(',').map((x) => x.trim()).filter(Boolean) : []);
  const file = opt('file') || 'docs/design/claims.json';
  const state = load(file);
  if (cmd === 'claim') {
    const claim = {
      id: opt('id'), agent: opt('agent'), module: opt('module') || '',
      page: opt('page') || '', section: opt('section') || '',
      paths: list(opt('paths')).map(norm), after: list(opt('after')),
      readOnly: rest.includes('--read-only'), since: new Date().toISOString(),
    };
    if (!claim.id || !claim.agent) { console.error('claim needs --id and --agent'); return 2; }
    if (!claim.page && !claim.paths.length && !claim.readOnly) { console.error('claim needs --page/--section, --paths, or --read-only'); return 2; }
    const r = tryClaim(state, claim);
    if (!r.ok) { console.error(`REFUSED ${claim.id}:\n- ` + r.problems.join('\n- ')); return 1; }
    save(file, state);
    console.log(`CLAIMED ${claim.id} (${state.active.length} active)`);
    return 0;
  }
  if (cmd === 'release') {
    const id = rest[0];
    if (!release(state, id, opt('note'))) { console.error(`not active: ${id}`); return 1; }
    save(file, state);
    console.log(`RELEASED ${id} (${state.active.length} active)`);
    return 0;
  }
  if (cmd === 'list') {
    if (!state.active.length) console.log('No active claims.');
    for (const c of state.active) console.log(`${c.id} | ${c.agent} | ${c.module} | ${c.page || '-'} / ${c.section || '-'} | ${(c.paths || []).join(', ') || '-'}${c.readOnly ? ' | read-only' : ''}`);
    return 0;
  }
  if (cmd === 'check') {
    const problems = checkState(state);
    if (problems.length) { console.error('CONFLICTS:\n- ' + problems.join('\n- ')); return 1; }
    console.log(`OK: ${state.active.length} active claims, no overlaps.`);
    return 0;
  }
  console.error('commands: claim | release <id> | list | check');
  return 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
