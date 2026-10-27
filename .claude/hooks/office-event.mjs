import fs from 'node:fs';
import path from 'node:path';
import { toEvent } from '../../scripts/claude-team/office-state.mjs';

// Appends one short activity line to .claude/office/events.jsonl for the live office.
// No output, no network, never blocks the session: every failure is swallowed and the exit code stays 0.
const MAX_BYTES = 512 * 1024;
const KEEP_LINES = 400;
let input = '';
process.stdin.on('data', (d) => { input += d; });
process.stdin.on('end', () => {
  try {
    const root = process.env.CLAUDE_PROJECT_DIR;
    const ev = root && toEvent(JSON.parse(input));
    if (!ev) return;
    const dir = path.join(root, '.claude', 'office');
    const file = path.join(dir, 'events.jsonl');
    fs.mkdirSync(dir, { recursive: true });
    try {
      if (fs.statSync(file).size > MAX_BYTES) {
        const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
        fs.writeFileSync(file, lines.slice(-KEEP_LINES).join('\n') + '\n');
      }
    } catch {}
    fs.appendFileSync(file, JSON.stringify(ev) + '\n');
  } catch {}
});
