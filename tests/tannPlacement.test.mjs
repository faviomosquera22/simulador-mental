import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/load-ts.cjs';
const {GYNECOLOGY_CASES,createRun,performAction,getPhysiology}=loadTypeScript('src/lib/gynecologySimulation.ts');
const {TANN_SEGMENTS,tannPlacement}=loadTypeScript('src/lib/tannPlacement.ts');
const prepare=c=>{let run={...createRun(c.id),status:'running'};for(const id of ['consent','key-roja','tann-assess','tann-prepare'])run=performAction(c,run,id);return run;};
for(const c of GYNECOLOGY_CASES.filter(c=>c.obstetricKey==='roja')){
 test(`${c.id}: TANN closes bottom to top, blocks skipped stages and requires final verification`,()=>{
  let run=prepare(c);assert.equal(tannPlacement(run.decisions).prepared,true);
  for(const segment of [...TANN_SEGMENTS].reverse().slice(0,5))assert.equal(performAction(c,run,segment.id),run);
  for(const [index,segment] of TANN_SEGMENTS.entries()){
   assert.equal(performAction(c,run,'tann'),run,'partial garment is not complete');
   run=performAction(c,run,segment.id);assert.equal(tannPlacement(run.decisions).count,index+1);
   assert.equal(performAction(c,run,segment.id),run,'segments cannot be repeated');
  }
  assert.equal(tannPlacement(run.decisions).verified,false);
  run=performAction(c,run,'tann');assert.equal(tannPlacement(run.decisions).verified,true);
 });
}
test('partial segments grant no full support; verification responds gradually and never undoes lost blood',()=>{
 const c=GYNECOLOGY_CASES.find(c=>c.id==='obs-01');const start=prepare(c);
 let run=start;for(const segment of TANN_SEGMENTS)run=performAction(c,run,segment.id);
 assert.deepEqual(getPhysiology(c,{...run,elapsed:60}),getPhysiology(c,{...start,elapsed:60}));
 const verified=performAction(c,run,'tann');assert.deepEqual(getPhysiology(c,verified),getPhysiology(c,run));
 assert.ok(getPhysiology(c,{...verified,elapsed:60}).vitals.sbp>getPhysiology(c,{...run,elapsed:60}).vitals.sbp);
 const later={...verified,elapsed:60};const before=getPhysiology(c,later).bleeding;
 const removed=performAction(c,later,'tann-remove');assert.equal(tannPlacement(removed.decisions).removed,true);
 assert.equal(getPhysiology(c,removed).bleeding,before);
 assert.ok(getPhysiology(c,{...removed,elapsed:120}).vitals.sbp<getPhysiology(c,{...later,elapsed:120}).vitals.sbp);
});
test('preparation requires consent and evaluation; pause and reset preserve the procedure lifecycle',()=>{
 const c=GYNECOLOGY_CASES.find(c=>c.id==='obs-01');let run={...createRun(c.id),status:'running'};
 for(const id of ['tann-assess','tann-prepare','tann-1'])assert.equal(performAction(c,run,id),run);
 run=prepare(c);run=performAction(c,run,'tann-1');
 for(const status of ['ready','paused','finished']){const frozen={...run,status};assert.equal(performAction(c,frozen,'tann-2'),frozen);}
 assert.equal(tannPlacement(createRun(c.id).decisions).count,0);
 assert.equal(tannPlacement([{id:'tann-6'}]).count,0,'invalid records cannot imply a complete sequence');
 for(const c of GYNECOLOGY_CASES.filter(c=>c.obstetricKey==='azul'||c.obstetricKey==='amarilla'))assert.ok(!c.actions.some(a=>a.id.startsWith('tann')));
});
