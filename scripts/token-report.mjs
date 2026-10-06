#!/usr/bin/env node
// Builds reports/token-usage.{json,md} from Claude Code session transcripts for this project.
// Usage: node scripts/token-report.mjs [--session <id>] [--since <ISO date>]
// Sources: ~/.claude/projects/<project-slug>/<session>.jsonl (PM) and <session>/subagents/agent-*.jsonl (+ .meta.json).
// Attribution: each agent's description carries a tag like "[portal/B4-library]"; PM work is tagged "[general/pm]".
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const slug = ROOT.replace(/[^A-Za-z0-9]/g, '-');
const PROJ = path.join(os.homedir(), '.claude', 'projects', slug);
const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : undefined; };
const since = arg('since') ? Date.parse(arg('since')) : 0;
const onlySession = arg('session');
const PROJECT = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).name; } catch { return path.basename(ROOT); } })();

if (!fs.existsSync(PROJ)) { console.error(`No transcripts at ${PROJ}`); process.exit(1); }

function readUsage(file) {
  // Streamed messages repeat per content block with the same message.id; keep the last record per id.
  const byId = new Map();
  let first = null, last = null, tools = 0;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    const ts = o.timestamp ? Date.parse(o.timestamp) : null;
    if (ts && ts < since) continue;
    if (ts) { first ??= ts; last = ts; }
    if (o.type !== 'assistant' || !o.message?.usage) continue;
    const content = Array.isArray(o.message.content) ? o.message.content : [];
    tools += content.filter((c) => c.type === 'tool_use').length;
    byId.set(o.message.id || o.uuid, { model: o.message.model, u: o.message.usage, ts });
  }
  return { msgs: [...byId.values()].filter((m) => m.model !== '<synthetic>'), first, last, tools };
}

const zero = () => ({ input: 0, cacheWrite: 0, cacheRead: 0, output: 0, total: 0, requests: 0 });
const add = (acc, u) => {
  acc.input += u.input_tokens || 0;
  acc.cacheWrite += u.cache_creation_input_tokens || 0;
  acc.cacheRead += u.cache_read_input_tokens || 0;
  acc.output += u.output_tokens || 0;
  acc.total = acc.input + acc.cacheWrite + acc.cacheRead + acc.output;
  acc.requests++;
};

const sessions = fs.readdirSync(PROJ).filter((f) => f.endsWith('.jsonl')).map((f) => f.slice(0, -6))
  .filter((s) => !onlySession || s === onlySession);

const runs = [];
for (const s of sessions) {
  runs.push({ session: s, agent: 'PM (main session)', description: '[general/pm] PM orchestration', file: path.join(PROJ, `${s}.jsonl`) });
  const sub = path.join(PROJ, s, 'subagents');
  if (!fs.existsSync(sub)) continue;
  for (const f of fs.readdirSync(sub).filter((x) => x.endsWith('.jsonl'))) {
    const metaPath = path.join(sub, f.replace(/\.jsonl$/, '.meta.json'));
    const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {};
    runs.push({ session: s, agent: meta.agentType || 'subagent', description: meta.description || f, requestedModel: meta.model, file: path.join(sub, f) });
  }
}

const totals = zero();
const by = { agent: {}, tag: {}, area: {}, model: {} };
const runRows = [];
let firstTs = Infinity, lastTs = 0;
for (const r of runs) {
  const { msgs, first, last, tools } = readUsage(r.file);
  if (!msgs.length) continue;
  const tag = (r.description.match(/\[([^\]]+)\]/) || [, 'general/untagged'])[1];
  const area = tag.split('/')[0];
  const acc = zero();
  const models = new Set();
  for (const m of msgs) {
    add(acc, m.u); add(totals, m.u);
    models.add(m.model);
    for (const [k, key] of [['agent', r.agent], ['tag', tag], ['area', area], ['model', m.model]]) add((by[k][key] ??= zero()), m.u);
  }
  if (first) firstTs = Math.min(firstTs, first);
  if (last) lastTs = Math.max(lastTs, last);
  runRows.push({ agent: r.agent, description: r.description, tag, models: [...models].join(', '), toolCalls: tools,
    minutes: first && last ? +((last - first) / 60000).toFixed(1) : null, ...acc });
}

const fmt = (n) => n.toLocaleString('en-US');
const pct = (n) => totals.total ? `${((n / totals.total) * 100).toFixed(1)}%` : '0%';
const table = (title, obj, label) => {
  const rows = Object.entries(obj).sort((a, b) => b[1].total - a[1].total);
  return `## ${title}\n\n| ${label} | Input | Cache write | Cache read | Output | **Total** | Share | Requests |\n|---|---:|---:|---:|---:|---:|---:|---:|\n` +
    rows.map(([k, v]) => `| ${k} | ${fmt(v.input)} | ${fmt(v.cacheWrite)} | ${fmt(v.cacheRead)} | ${fmt(v.output)} | **${fmt(v.total)}** | ${pct(v.total)} | ${v.requests} |`).join('\n') + '\n';
};

const wallMin = isFinite(firstTs) ? ((lastTs - firstTs) / 60000).toFixed(1) : '0';
const generated = new Date().toISOString();
const json = { generated, project: PROJECT, sessions, wallClockMinutes: +wallMin, start: isFinite(firstTs) ? new Date(firstTs).toISOString() : null,
  end: lastTs ? new Date(lastTs).toISOString() : null, totals, byAgent: by.agent, byTag: by.tag, byArea: by.area, byModel: by.model, runs: runRows };
fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'token-usage.json'), JSON.stringify(json, null, 2));

const heavy = [...runRows].sort((a, b) => b.total - a.total);
const md = `# Token usage — ${PROJECT}

Generated: ${generated}
Window: ${json.start} → ${json.end} (${wallMin} min wall clock) · Sessions: ${sessions.length} · Agent runs: ${runRows.length}

| Metric | Tokens |
|---|---:|
| Input (fresh) | ${fmt(totals.input)} |
| Cache write | ${fmt(totals.cacheWrite)} |
| Cache read | ${fmt(totals.cacheRead)} |
| Output | ${fmt(totals.output)} |
| **Total** | **${fmt(totals.total)}** |
| API requests | ${totals.requests} |

${table('By area', by.area, 'Area')}
${table('By slice / tag', by.tag, 'Tag')}
${table('By agent type', by.agent, 'Agent')}
${table('By model', by.model, 'Model')}
## Agent runs (heaviest first)

| # | Agent | Task | Model | Minutes | Tool calls | Output | **Total** | Share |
|---:|---|---|---|---:|---:|---:|---:|---:|
${heavy.map((r, i) => `| ${i + 1} | ${r.agent} | ${r.description.replace(/\|/g, '/')} | ${r.models} | ${r.minutes ?? '—'} | ${r.toolCalls} | ${fmt(r.output)} | **${fmt(r.total)}** | ${pct(r.total)} |`).join('\n')}

_Minutes = first→last transcript timestamp per run (parallel runs overlap, so they do not add up to wall clock). Cache reads are billed far cheaper than fresh input; "Total" is a raw token sum._
`;
fs.writeFileSync(path.join(ROOT, 'reports', 'token-usage.md'), md);
console.log(`total ${fmt(totals.total)} tokens across ${runRows.length} runs → reports/token-usage.md`);
