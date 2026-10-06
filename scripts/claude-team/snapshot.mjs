import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const hash = value => crypto.createHash('sha256').update(value).digest('hex');

export function snapshot(root, requested) {
  const base = fs.realpathSync(root);
  if (!requested.length) throw new Error('Provide explicit reviewed files/directories; no implicit whole-project scan.');
  const entries = new Map();
  const visit = target => {
    const rel = path.relative(base, target);
    if (!rel || rel.startsWith('..' + path.sep) || rel === '..' || path.isAbsolute(rel)) throw new Error('Path must be strictly inside project root.');
    const parts = rel.split(path.sep);
    if (parts.some(p => ['.git','node_modules','.next'].includes(p) || p === '.env' || p.startsWith('.env.'))) throw new Error('Generated, dependency, git and secret paths are excluded.');
    // Check ancestors too: lstat(target) alone would follow a symlinked parent.
    let ancestor = base;
    for (const part of parts) {
      ancestor = path.join(ancestor, part);
      if (fs.lstatSync(ancestor).isSymbolicLink()) throw new Error('Symlinks are not allowed in a scoped snapshot.');
    }
    const stat = fs.lstatSync(target);
    if (stat.isSymbolicLink()) throw new Error('Symlinks are not allowed in a scoped snapshot.');
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(target).sort()) visit(path.join(target, name));
    } else if (stat.isFile()) {
      if (stat.size > 10 * 1024 * 1024) throw new Error('Scope contains a file over 10 MiB; select a smaller scope.');
      entries.set(rel.split(path.sep).join('/'), hash(fs.readFileSync(target)));
    } else throw new Error('Nonregular files are not allowed.');
  };
  for (const value of requested) {
    if (path.isAbsolute(value)) throw new Error('Use project-relative paths.');
    visit(path.resolve(base, value));
  }
  if (!entries.size) throw new Error('Scope contains no regular files.');
  const files = Array.from(entries, ([name, sha256]) => ({path:name,sha256})).sort((a,b) => a.path.localeCompare(b.path,'en'));
  return {algorithm:'sha256', snapshot:hash(JSON.stringify(files)), files};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(snapshot(process.cwd(),process.argv.slice(2)),null,2)); }
  catch (error) { console.error(error.message); process.exitCode=1; }
}
