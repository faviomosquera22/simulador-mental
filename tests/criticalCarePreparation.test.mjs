import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/load-ts.cjs';
const { createSimulation, simulationReducer: reduce, criticalBleedingRate, medicationsFor } = loadTypeScript('src/lib/criticalCareSimulation.ts');
const { doseUnits } = loadTypeScript('src/lib/medicationPreparation.ts');
const { GYNECOLOGY_CASES, createRun, getPhysiology, performAction } = loadTypeScript('src/lib/gynecologySimulation.ts');
const start = id => reduce(createSimulation(id),{type:'start'});
const tick = (s,n=1)=>{for(let i=0;i<n;i++)s=reduce(s,{type:'tick'});return s;};

test('oxygen requires explicit device and flow; invalid settings never connect or bypass intubation',()=>{
 let s=start('asthma');s=reduce(s,{type:'action',id:'oxygen'});assert.equal(s.oxygenTherapy,null);assert.ok(!s.actions.includes('oxygen'));
 for(const settings of [{device:'cannula',flow:0},{device:'cannula',flow:7},{device:'cannula',flow:1.25},{device:'mask',flow:2},{device:'reservoir',flow:9},{device:'unknown',flow:4},{device:'cannula',flow:NaN}]){
  assert.equal(reduce(s,{type:'oxygen',settings}).oxygenTherapy,null);
 }
 assert.equal(reduce(start('ventilation'),{type:'oxygen',settings:{device:'cannula',flow:2}}).oxygenTherapy,null);
});
test('half-litre flow, device change, removal, pause, reset and qualitative oxygen response share one state',()=>{
 const s=start('asthma'),settings={device:'cannula',flow:1.5};
 const low=reduce(s,{type:'oxygen',settings});settings.flow=6;assert.equal(low.oxygenTherapy.flow,1.5);
 const high=reduce(s,{type:'oxygen',settings:{device:'mask',flow:8}});
 assert.ok(tick(high,30).vitals.spo2>tick(low,30).vitals.spo2);
 assert.match(high.log.at(-1).text,/8 L\/min/);
 const paused=reduce(high,{type:'pause'});assert.equal(reduce(paused,{type:'oxygen',settings:null}),paused);
 const removed=reduce(high,{type:'oxygen',settings:null});assert.equal(removed.oxygenTherapy,null);assert.ok(!removed.actions.includes('oxygen'));
 assert.equal(reduce(high,{type:'reset',scenario:'sepsis'}).oxygenTherapy,null);
});
test('oral strengths, fractional tablet quantities and suspension volumes retain the exact amount and route',()=>{
 const s=start('asthma');
 const tablet=reduce(s,{type:'medication',id:'paracetamol',presentationId:'oral500',amount:1.5,unit:'comprimidos'});
 assert.equal(tablet.medications[0].dose.total,750);assert.equal(tablet.medications[0].route,'Oral');assert.match(tablet.decisions[0].presentation,/750 mg/);
 const suspension=reduce(s,{type:'medication',id:'amoxicillin',presentationId:'suspension250',amount:7.5,unit:'mL'});
 assert.equal(suspension.medications[0].dose.total,375);assert.equal(suspension.medications[0].dose.totalUnit,'mg');assert.match(suspension.log.at(-1).text,/7.5 mL = 375 mg/);
 const stronger=reduce(s,{type:'medication',id:'paracetamol',presentationId:'oral1000',amount:1,unit:'comprimidos'});
 assert.equal(stronger.medications[0].dose.total,1000);
});
test('dose validation rejects nonpositive and nonfinite quantities, incompatible units and fractional capsules',()=>{
 const s=start('asthma');
 for(const [amount,unit] of [[0,'comprimidos'],[-1,'comprimidos'],[Infinity,'comprimidos'],[NaN,'comprimidos'],[1,'g'],[.3,'comprimidos']])assert.equal(reduce(s,{type:'medication',id:'paracetamol',presentationId:'oral500',amount,unit}).medications.length,0);
 assert.equal(reduce(s,{type:'medication',id:'amoxicillin',presentationId:'capsule500',amount:.5,unit:'cápsulas'}).medications.length,0);
});
test('IV presentation requires access while oral selection does not; changing strength cannot bypass cooldown',()=>{
 const s=start('asthma');assert.equal(reduce(s,{type:'medication',id:'paracetamol',presentationId:'iv',amount:50,unit:'mL'}).medications.length,0);
 const iv=reduce(s,{type:'action',id:'iv'});const given=reduce(iv,{type:'medication',id:'paracetamol',presentationId:'iv',amount:50,unit:'mL'});
 assert.equal(given.medications[0].dose.total,500);
 assert.equal(reduce(given,{type:'medication',id:'paracetamol',presentationId:'oral1000',amount:1,unit:'comprimidos'}).medications.length,1);
});
test('all oral drugs inherit aspiration consequences when consciousness or airway makes the route unsafe',()=>{
 const s=start('hypoglycemia');const m=medicationsFor(s.scenario).find(m=>m.id==='amoxicillin');
 const given=reduce(s,{type:'medication',id:m.id,presentationId:m.presentations[0].id,amount:1,unit:doseUnits(m,m.presentations[0])[0]});
 assert.equal(given.decisions[0].judgment,'harmful');assert.ok(tick(given,35).vitals.spo2<tick(s,35).vitals.spo2);
});
test('critical bleeding persists during partial TANN and cannot be erased by source control or pause',()=>{
 let s=start('obstetric');assert.ok(criticalBleedingRate(s)>0);s=reduce(s,{type:'action',id:'help'});
 assert.equal(reduce(s,{type:'garment',step:2}),s);
 s=reduce(s,{type:'garment',step:0});const baseline=s.vitals.bloodLoss;s=tick(s,60);assert.ok(s.vitals.bloodLoss>baseline);
 const paused=reduce(s,{type:'pause'});assert.equal(reduce(paused,{type:'tick'}),paused);
 let controlled=s;for(const id of ['iv','uterotonic','definitive'])controlled=reduce(controlled,{type:'action',id});
 assert.ok(criticalBleedingRate(controlled)<criticalBleedingRate(s));assert.ok(tick(controlled).vitals.bloodLoss>=s.vitals.bloodLoss);
});
test('gynecology distinguishes a clean case, external spotting and active hemorrhage; verified TANN remains temporary',()=>{
 const clean=GYNECOLOGY_CASES.find(c=>c.id==='obs-02');assert.equal(getPhysiology(clean,createRun(clean.id)).currentBleedingRate,0);
 const c=GYNECOLOGY_CASES.find(c=>c.id==='obs-01');let run={...createRun(c.id),status:'running'};const before=getPhysiology(c,run);
 for(const id of ['key-roja','consent','tann-assess','tann-prepare','tann-1','tann-2','tann-3','tann-4','tann-5','tann-6','tann'])run=performAction(c,run,id);
 const after=getPhysiology(c,{...run,elapsed:60});assert.ok(after.currentBleedingRate>0);assert.ok(after.currentBleedingRate<before.currentBleedingRate);assert.ok(after.bleeding>=before.bleeding);
});
