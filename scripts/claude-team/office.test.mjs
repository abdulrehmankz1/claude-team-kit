import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { initial, officeEnabled, readRoster, reduce, summarize, toEvent, view, withOffice, DONE_MS, STALE_MS } from './office-state.mjs';
const hook = path.resolve('.claude/hooks/office-event.mjs');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(),'claude-office-'));
const roster = [{id:'pm',team:'pm',model:'main session',role:''},{id:'frontend-dev',team:'dev',model:'sonnet',role:''},{id:'ux-writer',team:'des',model:'opus',role:''}];
const run = (events) => { const s=initial(); let t=1000; for (const e of events) reduce(s,{t:t+=100,s:'sess0001',...e}); return {s,t}; };
const desk = (v,id) => [...v.desks,...v.guests].find(d=>d.id===id);

test('labels never include raw shell commands, prompts or file paths', () => {
 assert.equal(summarize('Bash',{command:'curl -H "Authorization: Bearer abc" x',description:'Fetch status'}),'Bash · Fetch status');
 assert.equal(summarize('Bash',{command:'TOKEN=abc npm test'}),'Bash · npm');
 assert.equal(summarize('Edit',{file_path:'C:\\work\\app\\Newsletter.tsx'}),'Edit Newsletter.tsx');
 assert.equal(summarize('Agent',{subagent_type:'qa-tester',prompt:'secret brief'}),'Delegating to qa-tester');
 const e=toEvent({hook_event_name:'UserPromptSubmit',session_id:'abcdefgh-123',prompt:'my private brief'},5);
 assert.deepEqual(e,{t:5,e:'UserPromptSubmit',s:'abcdefgh'});
 assert.equal(toEvent({prompt:'x'}),null);
});
test('subagent goes working, waiting, working, then done and idle', () => {
 const {s,t}=run([{e:'SubagentStart',a:'a1',ty:'frontend-dev'},{e:'PreToolUse',a:'a1',ty:'frontend-dev',x:'Edit Newsletter.tsx'}]);
 assert.equal(desk(view(s,roster,t),'frontend-dev').st,'w');
 reduce(s,{t:t+1,s:'sess0001',e:'PermissionRequest',a:'a1',ty:'frontend-dev',x:'Bash · Install zod'});
 assert.deepEqual([desk(view(s,roster,t+1),'frontend-dev').st,view(s,roster,t+1).counts.h],['h',1]);
 reduce(s,{t:t+2,s:'sess0001',e:'PostToolUse',a:'a1',ty:'frontend-dev'});
 assert.equal(desk(view(s,roster,t+2),'frontend-dev').st,'w');
 reduce(s,{t:t+3,s:'sess0001',e:'SubagentStop',a:'a1',ty:'frontend-dev'});
 assert.equal(desk(view(s,roster,t+4),'frontend-dev').st,'d');
 assert.equal(desk(view(s,roster,t+3+DONE_MS),'frontend-dev').st,'i');
});
test('parallel instances are counted and stay busy until the last one stops', () => {
 const {s,t}=run([{e:'SubagentStart',a:'a1',ty:'ux-writer'},{e:'SubagentStart',a:'a2',ty:'ux-writer'},{e:'SubagentStop',a:'a1',ty:'ux-writer'}]);
 const d=desk(view(s,roster,t),'ux-writer');assert.deepEqual([d.st,d.n],['w',1]);
 reduce(s,{t,s:'sess0001',e:'SubagentStart',a:'a3',ty:'ux-writer'});assert.equal(desk(view(s,roster,t),'ux-writer').n,2);
});
test('main session is the PM, or the named agent when started with --agent', () => {
 const {s,t}=run([{e:'UserPromptSubmit'},{e:'PreToolUse',x:'Read STATE.md'}]);
 assert.equal(desk(view(s,roster,t),'pm').act,'Read STATE.md');
 reduce(s,{t,s:'sess0002',e:'PreToolUse',ty:'ux-writer',x:'Read copy.md'});
 assert.equal(desk(view(s,roster,t),'ux-writer').st,'w');
 reduce(s,{t,s:'sess0001',e:'Stop'});assert.equal(desk(view(s,roster,t+1),'pm').st,'d');
});
test('unknown agents appear as visitors, session end and staleness clear desks', () => {
 const {s,t}=run([{e:'SubagentStart',a:'g1',ty:'Explore'},{e:'SubagentStart',a:'a1',ty:'frontend-dev'}]);
 assert.equal(desk(view(s,roster,t),'Explore').team,'guest');
 reduce(s,{t,s:'sess0001',e:'SessionEnd'});
 assert.equal(view(s,roster,t+DONE_MS+1).guests.length,0);
 const r=run([{e:'SubagentStart',a:'a1',ty:'frontend-dev'}]);
 assert.equal(desk(view(r.s,roster,r.t+STALE_MS),'frontend-dev').st,'i');
});
test('roster reads agent frontmatter and assigns rooms', () => {
 const root=tmp();try{const d=path.join(root,'.claude','agents');fs.mkdirSync(d,{recursive:true});
 fs.writeFileSync(path.join(d,'ux-writer.md'),'---\nname: ux-writer\ndescription: Copy deck\nmodel: opus\n---\nBody');
 fs.writeFileSync(path.join(d,'qa-tester.md'),'---\r\nname: "qa-tester"\r\nmodel: "sonnet"\r\n---\r\n');
 const r=readRoster(root);assert.deepEqual(r.map(x=>[x.id,x.team,x.model]),[['pm','pm','main session'],['qa-tester','dev','sonnet'],['ux-writer','des','opus']]);}
 finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('hook appends one event, ignores bad input and never fails', () => {
 const root=tmp();try{
  const call=(input,env={CLAUDE_PROJECT_DIR:root})=>spawnSync(process.execPath,[hook],{input,env:{...process.env,...env},encoding:'utf8'});
  let r=call(JSON.stringify({hook_event_name:'PreToolUse',session_id:'s1',tool_name:'Bash',tool_input:{command:'npm test',description:'Run tests'}}));
  assert.equal(r.status,0);assert.equal(r.stdout,'');
  for(const bad of ['not json','{}']) assert.equal(call(bad).status,0);
  assert.equal(call('{}',{CLAUDE_PROJECT_DIR:''}).status,0);
  const lines=fs.readFileSync(path.join(root,'.claude','office','events.jsonl'),'utf8').trim().split('\n');
  assert.equal(lines.length,1);assert.equal(JSON.parse(lines[0]).x,'Bash · Run tests');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('enable adds office hooks next to existing local settings, disable removes only those', () => {
 const mine={permissions:{allow:['Read']},hooks:{Stop:[{hooks:[{type:'command',command:'node',args:['my-hook.mjs']}]}]}};
 const on=withOffice(mine,true);
 assert.ok(officeEnabled(on));assert.equal(on.hooks.Stop.length,2);assert.deepEqual(on.permissions,mine.permissions);
 assert.deepEqual(withOffice(on,true),on,'enabling twice adds nothing');
 const off=withOffice(on,false);
 assert.ok(!officeEnabled(off));assert.deepEqual(off,mine);
 assert.deepEqual(withOffice(withOffice({},true),false),{});
 assert.equal(withOffice({},true,'/opt/office/hook.mjs').hooks.PreToolUse[0].hooks[0].args[0],'/opt/office/hook.mjs');
});
test('the office CLI turns itself on and off in settings.local.json', () => {
 const root=tmp();try{
  const cli=(c)=>spawnSync(process.execPath,[path.resolve('scripts/claude-team/office.mjs'),c,'--root',root],{encoding:'utf8'});
  const local=path.join(root,'.claude','settings.local.json');
  assert.match(cli('status').stdout,/OFF/);
  assert.equal(cli('enable').status,0);assert.ok(officeEnabled(JSON.parse(fs.readFileSync(local,'utf8'))));
  assert.match(cli('status').stdout,/ON/);
  cli('disable');assert.deepEqual(JSON.parse(fs.readFileSync(local,'utf8')),{});
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('the shared settings never switch the office on for everyone', () => {
 assert.ok(!JSON.stringify(JSON.parse(fs.readFileSync('.claude/settings.json','utf8')).hooks).includes('office-event'));
});
test('the landing page copy of the tower matches the live page', () => {
 assert.equal(fs.readFileSync('docs/office.html','utf8'),fs.readFileSync('scripts/claude-team/office.html','utf8'),'copy scripts/claude-team/office.html to docs/office.html');
});
