import test from 'node:test';
import assert from 'node:assert/strict';
import { sectionsOverlap, pathsOverlap, tryClaim, release, checkState } from './design-claims.mjs';

const fresh = () => ({ active: [], history: [] });
const ui = (id, section, extra = {}) => ({ id, agent: 'ui-designer', page: 'App · Billing', section, paths: [], after: [], ...extra });

test('a parent section overlaps its subsection, siblings do not', () => {
  assert.equal(sectionsOverlap('3 · UI', '3 · UI / RTL'), true);
  assert.equal(sectionsOverlap('3 · UI / RTL', '3 · UI / Mobile & tablet'), false);
  assert.equal(sectionsOverlap('', '4 · States & edge cases'), true);
});

test('paths overlap on the same file or a containing folder', () => {
  assert.equal(pathsOverlap('docs/design/app/m2', 'docs/design/app/m2/copy.md'), true);
  assert.equal(pathsOverlap('docs/design/app/m2/copy.md', 'docs/design/app/m2/ia.md'), false);
});

test('second writer on the same section is refused', () => {
  const s = fresh();
  assert.equal(tryClaim(s, ui('ui-designer#M2', '3 · UI')).ok, true);
  const r = tryClaim(s, ui('mobile-designer#M2', '3 · UI / Mobile & tablet'));
  assert.equal(r.ok, false);
  assert.match(r.problems[0], /overlaps ui-designer#M2/);
});

test('sibling subsections and other pages run in parallel', () => {
  const s = fresh();
  assert.equal(tryClaim(s, ui('mobile-designer#M2', '3 · UI / Mobile & tablet')).ok, true);
  assert.equal(tryClaim(s, ui('localisation-designer#M2', '3 · UI / RTL')).ok, true);
  assert.equal(tryClaim(s, ui('ui-designer#M3', '3 · UI', { page: 'App · Reports' })).ok, true);
  assert.deepEqual(checkState(s), []);
});

test('shared docs file cannot be claimed twice', () => {
  const s = fresh();
  assert.equal(tryClaim(s, { id: 'a', agent: 'ux-writer', paths: ['docs/design/app/m2/copy.md'], after: [] }).ok, true);
  assert.equal(tryClaim(s, { id: 'b', agent: 'product-designer', paths: ['docs/design/app/m2'], after: [] }).ok, false);
});

test('limits: 8 Figma writers and 12 agents', () => {
  const s = fresh();
  for (let i = 0; i < 8; i++) assert.equal(tryClaim(s, ui(`w${i}`, '3 · UI', { page: `P${i}` })).ok, true);
  assert.equal(tryClaim(s, ui('w8', '3 · UI', { page: 'P8' })).ok, false);
  for (let i = 0; i < 4; i++) assert.equal(tryClaim(s, { id: `r${i}`, agent: 'ux-researcher', readOnly: true, paths: [], after: [] }).ok, true);
  assert.equal(tryClaim(s, { id: 'r4', agent: 'ux-researcher', readOnly: true, paths: [], after: [] }).ok, false);
});

test('a dependent claim waits until its predecessor is released', () => {
  const s = fresh();
  tryClaim(s, ui('ui-designer#M2', '3 · UI / Desktop'));
  const blocked = tryClaim(s, ui('mobile-designer#M2', '3 · UI / Mobile & tablet', { after: ['ui-designer#M2'] }));
  assert.equal(blocked.ok, false);
  assert.equal(release(s, 'ui-designer#M2', 'pattern approved'), true);
  assert.equal(tryClaim(s, ui('mobile-designer#M2', '3 · UI / Mobile & tablet', { after: ['ui-designer#M2'] })).ok, true);
  assert.equal(s.history.length, 1);
});
