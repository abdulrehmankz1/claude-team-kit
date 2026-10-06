import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { snapshot } from './snapshot.mjs';
const hook = path.resolve('.claude/hooks/session-start.mjs');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(),'claude-team-'));
const run = root => spawnSync(process.execPath,[hook],{env:{...process.env,CLAUDE_PROJECT_DIR:root},encoding:'utf8'});

test('hook loads state in a path containing spaces and apostrophes', () => {
 const root=tmp();
 try { const p=path.join(root,"project's space"); fs.mkdirSync(path.join(p,'.claude','team'),{recursive:true}); fs.writeFileSync(path.join(p,'.claude','team','STATE.md'),'Current task A'); const r=run(p);assert.equal(r.status,0);assert.match(r.stdout,/Current task A/); }
 finally {fs.rmSync(root,{recursive:true,force:true});}
});
test('hook handles missing project and missing state without crashing',()=>{
 const root=tmp();try {for(const value of ['',root]){const r=run(value);assert.equal(r.status,0);assert.match(r.stdout,/unavailable|not initialized/);}}finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('hook refuses oversized state and does not mutate it',()=>{
 const root=tmp();try{const p=path.join(root,'.claude','team');fs.mkdirSync(p,{recursive:true});const value='x'.repeat(25000);fs.writeFileSync(path.join(p,'STATE.md'),value);const r=run(root);assert.equal(r.status,0);assert.match(r.stdout,/small regular/);assert.equal(fs.readFileSync(path.join(p,'STATE.md'),'utf8'),value);}finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('snapshot is deterministic and changes on an edit',()=>{
 const root=tmp();try{fs.writeFileSync(path.join(root,'a.md'),'A');fs.writeFileSync(path.join(root,'b.md'),'B');const a=snapshot(root,['a.md','b.md']);assert.deepEqual(a,snapshot(root,['b.md','a.md']));fs.writeFileSync(path.join(root,'b.md'),'C');assert.notEqual(a.snapshot,snapshot(root,['a.md','b.md']).snapshot);}finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('snapshot rejects traversal, absent paths and secret files',()=>{
 const root=tmp();try{fs.writeFileSync(path.join(root,'.env.local'),'do not output');for(const paths of [[],['../outside'],['missing'],['.env.local']]) assert.throws(()=>snapshot(root,paths));}finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('snapshot rejects symlinks rather than reading another tree',()=>{
 const root=tmp();try{fs.writeFileSync(path.join(root,'real.md'),'A');try{fs.symlinkSync(path.join(root,'real.md'),path.join(root,'link.md'));}catch(error){if(error.code==='EPERM')return;throw error;}assert.throws(()=>snapshot(root,['link.md']),/Symlinks/);}finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('snapshot rejects a file under a symlinked parent',()=>{
 const root=tmp();const outside=tmp();try{fs.writeFileSync(path.join(outside,'other.md'),'outside data');try{fs.symlinkSync(outside,path.join(root,'linked'),'dir');}catch(error){if(error.code==='EPERM')return;throw error;}assert.throws(()=>snapshot(root,['linked/other.md']),/Symlinks/);}finally{fs.rmSync(root,{recursive:true,force:true});fs.rmSync(outside,{recursive:true,force:true});}
});
