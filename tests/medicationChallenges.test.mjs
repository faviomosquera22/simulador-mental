import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTypeScript} from './helpers/load-ts.cjs';
const {MEDICATION_CHALLENGES:cases,PRACTICE_DRUGS:drugs,searchPracticeDrugs:search,drawMedicationChallenge:draw,evaluateMedicationChallenge:evaluate}=loadTypeScript('src/lib/medicationChallenges.ts');
test('each difficulty has four concise and distinct source-backed cases with valid drug/route targets',()=>{
 assert.equal(cases.length,12);assert.equal(new Set(cases.map(c=>c.id)).size,12);
 for(const level of ['easy','medium','hard'])assert.equal(cases.filter(c=>c.difficulty===level).length,4);
 for(const c of cases){
  assert.ok(c.context.split(/\s+/).length<70,c.id);assert.ok(c.goal);assert.ok(c.allergies);assert.ok(c.facts.length>=2);
  assert.match(c.source.url,/^https:/);assert.ok(c.rationale.length>90);
  assert.equal(c.accepted.length>0,c.decision==='administer');
  for(const a of c.accepted)assert.ok(drugs.some(d=>d.id===a.drugId&&d.forms.some(f=>f.route===a.route)),c.id);
 }
});
test('search ignores accents and case, supports aliases and families, and has a genuine empty state',()=>{
 assert.equal(search('').length,drugs.length);assert.equal(drugs.length,20);
 assert.equal(search('EPINEFRINA')[0].id,'adrenaline');assert.equal(search('acetaminofen')[0].id,'paracetamol');
 assert.equal(search('glucagon')[0].id,'glucagon');assert.equal(search('suero oral')[0].id,'oral-rehydration');
 assert.ok(search('antibioticos').some(d=>d.id==='amoxicillin'));assert.deepEqual(search('medicamento inexistente zx'),[]);
});
test('random selection honors difficulty and exhausts fresh cases before repeats, including bounded random values',()=>{
 for(const level of ['easy','medium','hard']){
  const seen=[];for(let i=0;i<4;i++){const c=draw(level,seen,()=>0);assert.equal(c.difficulty,level);assert.ok(!seen.includes(c.id));seen.push(c.id);}
  assert.notEqual(draw(level,seen,()=>1).id,seen.at(-1));
  for(const value of [-1,1,Infinity,NaN])assert.equal(draw(level,seen,()=>value).difficulty,level);
 }
});
test('evaluation recognizes every accepted alternative and route, and rejects all other available combinations',()=>{
 for(const c of cases){
  for(const d of drugs)for(const form of d.forms){
   const result=evaluate(c.id,{decision:'administer',drugId:d.id,formId:form.id});
   const accepted=c.decision==='administer'&&c.accepted.some(a=>a.drugId===d.id&&a.route===form.route);
   assert.equal(result.appropriate,accepted,`${c.id}/${d.id}/${form.id}`);
   assert.equal(result.score===100,accepted);assert.match(result.chosen,new RegExp(d.name));
  }
 }
});
test('wrong route does not pass and supplies the case-specific correction',()=>{
 const r=evaluate('postop-oral-unsafe',{decision:'administer',drugId:'paracetamol',formId:'tablet'});
 assert.equal(r.appropriate,false);assert.equal(r.score,40);assert.match(r.expected,/Paracetamol · IV/);
 const adrenaline=evaluate('anaphylaxis',{decision:'administer',drugId:'adrenaline',formId:'iv'});
 assert.equal(adrenaline.appropriate,false);assert.match(adrenaline.expected,/IM/);
});
test('retaining treatment is graded as a real decision, including allergy and bradycardia cases',()=>{
 for(const c of cases)assert.equal(evaluate(c.id,{decision:'hold'}).appropriate,c.decision==='hold');
 assert.equal(evaluate('penicillin-allergy',{decision:'administer',drugId:'ampicillin',formId:'iv'}).appropriate,false);
 assert.equal(evaluate('bradycardia',{decision:'administer',drugId:'metoprolol',formId:'tablet'}).appropriate,false);
});
test('no drug, forged forms, cross-drug forms and unknown cases cannot count as an administration',()=>{
 for(const input of [{decision:'administer'},{decision:'administer',drugId:'forged',formId:'tablet'},{decision:'administer',drugId:'paracetamol',formId:'capsule'},{decision:'forged'}])assert.equal(evaluate('fever',input),null);
 assert.equal(evaluate('forged',{decision:'hold'}),null);
});
