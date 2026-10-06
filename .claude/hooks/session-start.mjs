import fs from 'node:fs';
import path from 'node:path';

// No shell, env values, mutation or network. Output becomes session context.
const root = process.env.CLAUDE_PROJECT_DIR;
if (!root) {
  console.log('Team state not loaded: project directory unavailable. Read .claude/team/STATE.md manually.');
} else {
  const statePath = path.join(root, '.claude', 'team', 'STATE.md');
  try {
    const meta = fs.lstatSync(statePath);
    if (!meta.isFile() || meta.isSymbolicLink() || meta.size > 24 * 1024) {
      console.log('Team state not loaded: expected a small regular STATE.md. Read relevant task records manually.');
    } else {
      console.log('Team navigation summary (verify against the current checkout):\n' + fs.readFileSync(statePath, 'utf8'));
    }
  } catch (error) {
    const reason = error.code === 'ENOENT' ? 'not initialized' : 'unavailable';
    console.log(`Team state ${reason}. PM should reconcile or initialize .claude/team/STATE.md.`);
  }
}
