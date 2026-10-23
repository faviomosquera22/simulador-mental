import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTypeScript} from './helpers/load-ts.cjs';
const {MEDICATION_CHALLENGES:cases,PRACTICE_DRUGS:drugs,searchPracticeDrugs:search,drawMedicationChallenge:draw,evaluateMedicationChallenge:evaluate,dosePreparation,formatDose}=loadTypeScript('src/lib/medicationChallenges.ts');
const inputFor=(d,f,dose)=>({decision:'administer',drugId:d.id,formId:f.id,dose,unit:f.unit});
const validInput=c=>{const a=c.accepted[0],d=drugs.find(d=>d.id===a.drugId),f=d.forms.find(f=>f.route===a.route&&(!a.formIds||a.formIds.includes(f.id)));return inputFor(d,f,a.doses[0]);};
test('30 brief cases, ten per level, include stroke, coronary disease and nine additional drugs',()=>{
 assert.equal(cases.length,30);assert.equal(new Set(cases.map(c=>c.id)).size,cases.length);assert.equal(drugs.length,29);
 for(const level of ['easy','medium','hard'])assert.equal(cases.filter(c=>c.difficulty===level).length,10);
 for(const id of ['acute-mi-aspirin','nstemi-second-antiplatelet','post-mi-statin','ischemic-stroke-secondary','stroke-awaiting-ct','hemorrhagic-stroke'])assert.ok(cases.some(c=>c.id===id));
 for(const c of cases){assert.ok(c.context.split(/\s+/).length<75,c.id);assert.ok(c.medicationPlan);assert.ok(c.allergies);assert.ok(c.facts.length>=2);assert.match(c.source.url,/^https:/);assert.ok(c.source.section);assert.ok(c.rationale.length>90);assert.equal(c.accepted.length>0,c.decision==='administer');
  for(const a of c.accepted){const d=drugs.find(d=>d.id===a.drugId);assert.ok(d);for(const dose of a.doses)assert.ok(d.forms.some(f=>f.route===a.route&&f.unit===a.unit&&f.doses.includes(dose)&&(!a.formIds||a.formIds.includes(f.id))),`${c.id}: reachable ${dose} ${a.unit}`);}
 }
});
test('search supports names, accents, aliases, families and presentation strengths without case hints',()=>{
 assert.equal(search('').length,drugs.length);assert.equal(search('EPINEFRINA')[0].id,'adrenaline');assert.equal(search('acetaminofen')[0].id,'paracetamol');assert.equal(search('aspirina')[0].id,'aspirin');assert.equal(search('losartan')[0].id,'losartan');assert.ok(search('20 mg').some(d=>d.id==='enalapril'));assert.ok(search('antiagregantes').some(d=>d.id==='clopidogrel'));assert.deepEqual(search('inexistente zx'),[]);
 for(const d of drugs)for(const f of d.forms){assert.ok(f.doses.length>=3);assert.ok(f.doses.every(v=>Number.isFinite(v)&&v>0));assert.equal(new Set(f.doses).size,f.doses.length);assert.ok(f.unit);}
});
test('each level exhausts its full enlarged pool before repeating and avoids immediate repeat',()=>{
 for(const level of ['easy','medium','hard']){const seen=[];for(let i=0;i<10;i++){const c=draw(level,seen,()=>0);assert.equal(c.difficulty,level);assert.ok(!seen.includes(c.id));seen.push(c.id);}assert.notEqual(draw(level,seen,()=>1).id,seen.at(-1));for(const value of [-1,1,Infinity,NaN])assert.equal(draw(level,seen,()=>value).difficulty,level);}
});
test('every combination is graded on drug, route, form-specific dose and units; wrong doses never pass',()=>{
 for(const c of cases)for(const d of drugs)for(const f of d.forms)for(const dose of f.doses){
  const result=evaluate(c.id,inputFor(d,f,dose));const accepted=c.decision==='administer'&&c.accepted.some(a=>a.drugId===d.id&&a.route===f.route&&a.unit===f.unit&&a.doses.includes(dose)&&(!a.formIds||a.formIds.includes(f.id)));
  assert.ok(result);assert.equal(result.appropriate,accepted,`${c.id}/${d.id}/${f.id}/${dose}`);assert.equal(result.score===100,accepted);assert.ok(result.chosen.includes(formatDose(dose,f.unit)));
 }
});
test('10, 20 and 25 mg are independent choices; presentation strength never replaces the total dose',()=>{
 const d=drugs.find(d=>d.id==='enalapril'),small=d.forms.find(f=>f.id==='tablet'),large=d.forms.find(f=>f.id==='tablet-20');
 for(const f of [small,large]){assert.equal(evaluate('enalapril-maintenance',inputFor(d,f,10)).appropriate,true);assert.equal(evaluate('ace-titration',inputFor(d,f,20)).appropriate,true);assert.equal(evaluate('ace-titration',inputFor(d,f,25)).appropriate,false);}
 assert.equal(dosePreparation(small,20),'4 comprimidos');assert.equal(dosePreparation(large,20),'1 comprimido');
 const p=drugs.find(d=>d.id==='paracetamol');assert.equal(evaluate('postop-oral-unsafe',inputFor(p,p.forms[0],1000)).checks.route,false);
 const a=drugs.find(d=>d.id==='adrenaline');assert.equal(evaluate('anaphylaxis',inputFor(a,a.forms.find(f=>f.id==='iv'),0.5)).appropriate,false);
});
test('dose conversion preserves grams, decimal mg, inhaler vs nebulizer and IV concentrations',()=>{
 const sal=drugs.find(d=>d.id==='salbutamol');assert.equal(evaluate('wheeze',inputFor(sal,sal.forms[0],0.4)).appropriate,true);assert.equal(evaluate('wheeze',inputFor(sal,sal.forms[1],2.5)).appropriate,true);assert.equal(evaluate('wheeze',inputFor(sal,sal.forms[1],5)).appropriate,false);
 assert.equal(dosePreparation(sal.forms[0],0.4),'4 pulsaciones');const dex=drugs.find(d=>d.id==='dextrose');assert.equal(dosePreparation(dex.forms[0],20),'200 mL');assert.equal(evaluate('unconscious-low-glucose',inputFor(dex,dex.forms[0],20)).appropriate,true);
 assert.equal(evaluate('unconscious-low-glucose',{...inputFor(dex,dex.forms[0],20),unit:'mg'}),null);
});
test('stroke without imaging, active hemorrhage, nitrate interaction, allergy and bradycardia require holding',()=>{
 for(const c of cases){assert.equal(evaluate(c.id,{decision:'hold'}).appropriate,c.decision==='hold');if(c.decision==='administer')assert.equal(evaluate(c.id,validInput(c)).appropriate,true);}
 for(const id of ['stroke-awaiting-ct','hemorrhagic-stroke','nitrate-interaction','penicillin-allergy','bradycardia']){assert.equal(evaluate(id,{decision:'hold'}).appropriate,true);for(const d of drugs)for(const f of d.forms)assert.equal(evaluate(id,inputFor(d,f,f.doses[0])).score,0);}
 const asa=drugs.find(d=>d.id==='aspirin');assert.equal(evaluate('acute-mi-aspirin',inputFor(asa,asa.forms[0],100)).appropriate,false);assert.equal(evaluate('ischemic-stroke-secondary',inputFor(asa,asa.forms[0],300)).appropriate,false);
});
test('missing dose, forged presentation, nonfinite, negative, foreign unit or unlisted dose cannot administer',()=>{
 const c=cases.find(c=>c.id==='fever'),valid=validInput(c);
 for(const bad of [{decision:'administer'}, {...valid,dose:undefined},{...valid,dose:NaN},{...valid,dose:Infinity},{...valid,dose:0},{...valid,dose:-500},{...valid,dose:999},{...valid,unit:'g'},{...valid,drugId:'forged'},{...valid,formId:'capsule'},{decision:'forged'}])assert.equal(evaluate(c.id,bad),null);
 assert.equal(evaluate('forged',{decision:'hold'}),null);
});
