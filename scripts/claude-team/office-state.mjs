// Live office state: turns Claude Code hook payloads into desk statuses.
// The hook calls toEvent(); scripts/claude-team/office.mjs replays events through reduce() and view().
// Events never carry prompts, file contents or full shell commands, only short activity labels.
import fs from 'node:fs';
import path from 'node:path';

export const DESIGN = new Set('design-director ux-researcher information-architect ux-writer design-system-designer mobile-designer localisation-designer data-viz-designer design-handoff-specialist product-designer ui-designer motion-designer edge-case-specialist qa-usability-lead design-system-auditor accessibility-localisation-auditor product-logic-compliance-auditor'.split(' '));
export const STALE_MS = 20 * 60 * 1000;
export const DONE_MS = 4000;
const FEED_MAX = 40;

const clip = (value, max = 80) => {
  const s = String(value ?? '').replace(/\s+/g, ' ').trim();
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
};
const base = (p) => clip(String(p ?? '').split(/[\\/]/).pop(), 60);

// Short label for a tool call. Bash uses its description, never the raw command.
export function summarize(tool, input = {}) {
  if (!tool) return '';
  if (tool === 'Bash' || tool === 'PowerShell') {
    const program = String(input.command ?? '').trim().split(/\s+/).find((w) => w && !w.includes('='));
    return clip(`${tool} · ${input.description || clip(program, 30) || 'command'}`);
  }
  if (['Read', 'Write', 'Edit', 'NotebookEdit'].includes(tool)) return clip(`${tool} ${base(input.file_path ?? input.notebook_path)}`);
  if (tool === 'Grep' || tool === 'Glob') return clip(`${tool} ${clip(input.pattern, 40)}`);
  if (tool === 'Agent' || tool === 'Task') return clip(`Delegating to ${input.subagent_type || 'an agent'}`);
  if (tool === 'Skill') return clip(`Skill ${input.skill ?? ''}`);
  if (tool === 'WebFetch') { try { return clip(`Fetching ${new URL(input.url).hostname}`); } catch { return 'Fetching a page'; } }
  if (tool === 'WebSearch') return 'Searching the web';
  if (tool.startsWith('mcp__')) { const [, server, name] = tool.split('__'); return clip(`${server.replace(/^claude_ai_/, '')} · ${name ?? ''}`); }
  return clip(tool);
}

// Hook payload -> compact event, or null when the event is not tracked.
export function toEvent(p, now = Date.now()) {
  if (!p || typeof p !== 'object' || !p.hook_event_name || !p.session_id) return null;
  const e = { t: now, e: p.hook_event_name, s: String(p.session_id).slice(0, 8) };
  if (p.agent_id) e.a = String(p.agent_id);
  if (p.agent_type) e.ty = String(p.agent_type);
  if (p.tool_name) e.x = summarize(p.tool_name, p.tool_input || {});
  if (p.tool_name === 'Agent' || p.tool_name === 'Task') e.sub = String(p.tool_input?.subagent_type ?? '');
  if (p.hook_event_name === 'Notification') { e.n = String(p.notification_type ?? ''); e.x = clip(p.message ?? p.title ?? '', 80); }
  return e;
}

export function readRoster(root) {
  const dir = path.join(root, '.claude', 'agents');
  const roster = [{ id: 'pm', team: 'pm', model: 'main session', role: 'Brief, acceptance criteria, delegation, STATE.md' }];
  let files = [];
  try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort(); } catch { return roster; }
  for (const f of files) {
    const text = fs.readFileSync(path.join(dir, f), 'utf8');
    const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? '';
    const field = (k) => (new RegExp(`^${k}:\\s*(.*)$`, 'm').exec(fm)?.[1] ?? '').trim().replace(/^["']|["']$/g, '');
    const id = field('name') || f.slice(0, -3);
    roster.push({ id, team: DESIGN.has(id) ? 'des' : 'dev', model: field('model') || 'inherit', role: clip(field('description'), 160) });
  }
  return roster;
}

// The office is opt-in per developer: its hooks live in the gitignored .claude/settings.local.json, never in the shared settings.
export const HOOK_EVENTS = ['UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'PermissionRequest', 'Notification', 'SubagentStart', 'SubagentStop', 'Stop', 'SessionEnd'];
const HOOK_SCRIPT = 'office-event.mjs';
const isOffice = (group) => (group?.hooks ?? []).some((h) => [h.command, ...(h.args ?? [])].some((a) => String(a ?? '').includes(HOOK_SCRIPT)));

export function withOffice(settings, enable, hookPath = '${CLAUDE_PROJECT_DIR}/.claude/hooks/office-event.mjs') {
  const out = { ...settings, hooks: { ...(settings.hooks ?? {}) } };
  for (const ev of HOOK_EVENTS) {
    const rest = (out.hooks[ev] ?? []).filter((g) => !isOffice(g));
    if (enable) rest.push({ hooks: [{ type: 'command', command: 'node', args: [hookPath], timeout: 5 }] });
    if (rest.length) out.hooks[ev] = rest; else delete out.hooks[ev];
  }
  if (!Object.keys(out.hooks).length) delete out.hooks;
  return out;
}

export const officeEnabled = (settings) => HOOK_EVENTS.every((ev) => (settings.hooks?.[ev] ?? []).some(isOffice));

export const initial = () => ({ inst: {}, doneAt: {}, feed: [] });

function log(state, ev, who, text) {
  state.feed.unshift({ t: ev.t, who, x: clip(text, 100) });
  state.feed.length = Math.min(state.feed.length, FEED_MAX);
}

// Each running agent is an instance: a subagent by agent_id, or a session's main actor.
// A session started with --agent has agent_type but no agent_id, so its main actor is that agent, not the PM.
export function reduce(state, ev) {
  if (!ev || !ev.e) return state;
  const key = ev.a ? ev.a : `main:${ev.s}`;
  const type = ev.a ? (ev.ty || 'agent') : (ev.ty || 'pm');
  const cur = state.inst[key];
  const put = (st, act) => { state.inst[key] = { type, s: ev.s, st, act: act ?? cur?.act ?? '', t: ev.t }; };
  const finish = (k) => { const i = state.inst[k]; if (!i) return; delete state.inst[k]; state.doneAt[i.type] = ev.t; };
  switch (ev.e) {
    case 'UserPromptSubmit':
      if (!ev.a) { put('w', 'Reading your message'); log(state, ev, type, 'picked up a new message'); }
      break;
    case 'SubagentStart':
      put('w', 'Starting'); log(state, ev, type, 'started');
      break;
    case 'PreToolUse':
      put('w', ev.x); log(state, ev, type, ev.x);
      break;
    case 'PostToolUse':
      if (cur) put('w', cur.act);
      break;
    case 'PermissionRequest':
      put('h', `Approve: ${ev.x}`); log(state, ev, type, `waiting for your approval: ${ev.x}`);
      break;
    case 'Notification': {
      const waiting = Object.values(state.inst).some((i) => i.s === ev.s && i.st === 'h');
      if (ev.n === 'permission_prompt' && !waiting) { put('h', 'Needs your approval'); log(state, ev, type, ev.x || 'needs your approval'); }
      else if (ev.n === 'idle_prompt') { put('h', 'Waiting for your reply'); log(state, ev, type, 'waiting for your reply'); }
      break;
    }
    case 'SubagentStop':
      finish(key); log(state, ev, type, 'finished');
      break;
    case 'Stop':
      if (!ev.a) { finish(key); log(state, ev, type, 'finished the turn'); }
      break;
    case 'SessionEnd':
      for (const [k, i] of Object.entries(state.inst)) if (i.s === ev.s) finish(k);
      log(state, ev, type, 'session ended');
      break;
  }
  return state;
}

// Desk statuses for the page: w working, h waiting for you, d just finished, i idle.
export function view(state, roster, now = Date.now()) {
  const live = Object.values(state.inst).filter((i) => now - i.t < STALE_MS);
  const known = new Set(roster.map((r) => r.id));
  const desk = (r) => {
    const mine = live.filter((i) => i.type === r.id).sort((a, b) => b.t - a.t);
    const waiting = mine.find((i) => i.st === 'h');
    if (mine.length) return { ...r, st: waiting ? 'h' : 'w', act: (waiting || mine[0]).act, n: mine.length };
    if (now - (state.doneAt[r.id] ?? -Infinity) < DONE_MS) return { ...r, st: 'd', act: 'Done', n: 1 };
    return { ...r, st: 'i', act: 'idle', n: 1 };
  };
  const guestIds = [...new Set(live.map((i) => i.type))].filter((t) => !known.has(t)).sort();
  const desks = roster.map(desk);
  const guests = guestIds.map((id) => desk({ id, team: 'guest', model: '', role: 'Not a kit agent' }));
  const all = [...desks, ...guests];
  return {
    now,
    desks,
    guests,
    counts: { w: all.filter((d) => d.st === 'w').length, h: all.filter((d) => d.st === 'h').length, total: all.length },
    feed: state.feed.slice(0, 8),
  };
}
