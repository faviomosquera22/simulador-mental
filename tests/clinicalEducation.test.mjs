import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/load-ts.cjs';
const education=loadTypeScript('src/lib/clinicalEducation.ts');
const critical=loadTypeScript('src/lib/criticalCareSimulation.ts');
const gyn=loadTypeScript('src/lib/gynecologySimulation.ts');
const start=id=>critical.simulationReducer(critical.createSimulation(id),{type:'start'});
const tick=(s,n)=>{for(let i=0;i<n;i++)s=critical.simulationReducer(s,{type:'tick'});return s;};
const action=(s,id)=>critical.simulationReducer(s,{type:'action',id});
const preparation=loadTypeScript('src/lib/medicationPreparation.ts');
const drug=(s,id,presentationId)=>{const m=critical.medicationsFor(s.scenario).find(m=>m.id===id);const p=m.presentations.find(p=>p.id===presentationId)??m.presentations[0];return critical.simulationReducer(s,{type:'medication',id,presentationId,amount:1,unit:preparation.doseUnits(m,p)[0]});};
test('all registered cases have two closing questions, four distinct options, and an inspectable reference',()=>{
 for(const id of [...critical.criticalCareCaseIds,...gyn.GYNECOLOGY_CASES.map(c=>c.id)]){
  assert.equal(education.finalQuestions(id).length,2,id);
  for(const q of education.CASE_QUESTIONS.filter(q=>q.caseId===id)){
   assert.equal(new Set(q.options.map(o=>o.id)).size,4);assert.ok(q.options.some(o=>o.id===q.correct));
   assert.match(education.CLINICAL_SOURCES[q.source].url,/^https:/);
  }
 }
});
test('question answers cannot be changed or forged, and answered prompts are not triggered again',()=>{
 const q=education.triggeredQuestion('asthma','medication:salbutamol',[]);
 assert.ok(q);const answers=education.answerQuestion([],q.id,q.correct,12);
 assert.equal(answers[0].correct,true);assert.equal(education.answerQuestion(answers,q.id,'option-0',15),answers);
 assert.equal(education.answerQuestion(answers,'unknown','option-0',15),answers);
 assert.equal(education.answerQuestion(answers,q.id,'forged',15),answers);
 assert.equal(education.triggeredQuestion('asthma','medication:salbutamol',answers),null);
});
test('critical care exposes diverse families and presentations without accepting invalid presentations',()=>{
 for(const id of critical.criticalCareCaseIds){const meds=critical.medicationsFor(id);assert.ok(meds.length>=11);assert.ok(new Set(meds.map(m=>m.category)).size>=8);}
 const s=start('asthma');assert.equal(drug(s,'salbutamol','nonexistent'),s);
 const first=drug(s,'salbutamol','inhaler');const second=drug(first,'salbutamol','nebulizer');
 assert.equal(second.medications.length,1,'changing presentation cannot bypass cooldown');
});
test('alternative corticosteroid shares the canonical cooldown and completes the priority',()=>{
 const s=action(start('asthma'),'iv');const next=drug(s,'methylprednisolone','vial');
 assert.ok(next.actions.includes('med:steroid'));assert.equal(next.decisions.at(-1).judgment,'alternative');
 assert.equal(drug(next,'steroid').medications.length,1);
});
test('unsafe oral glucose is recorded and harms oxygenation instead of correcting glucose',()=>{
 const initial=start('hypoglycemia');const treated=drug(initial,'oral-glucose','gel');
 assert.equal(treated.decisions.at(-1).judgment,'harmful');
 const a=tick(initial,50),b=tick(treated,50);assert.ok(b.vitals.spo2<a.vitals.spo2);assert.equal(b.vitals.glucose,a.vitals.glucose);
});
test('unnecessary tests remain available and are recorded without completing priorities',()=>{
 const s=start('sepsis'), next=critical.simulationReducer(s,{type:'study',id:'lipid-profile'});
 assert.equal(next.decisions.at(-1).judgment,'unnecessary');assert.ok(!critical.scenarios.sepsis.priorities.includes("study:lipid-profile"));
});
test('gynecology medication alternatives fulfill one priority and cannot be stacked for extra credit',()=>{
 const c=gyn.GYNECOLOGY_CASES.find(c=>c.id==='obs-02');let run={...gyn.createRun(c.id),status:'running'};
 for(const id of ['abcde','call','iv'])run=gyn.performAction(c,run,id);
 const invalid=gyn.performAction(c,run,'med-labetalol','invalid');assert.equal(invalid,run);
 run=gyn.performAction(c,run,'med-labetalol','Solución IV según orden');
 assert.ok(gyn.hasDecision(c,run,'antihypertensive'));
 assert.equal(gyn.performAction(c,run,'med-hydralazine','Solución IV para dilución'),run);
 assert.equal(gyn.performAction(c,run,'antihypertensive'),run);
});
test('gynecology offers a variety of drugs and records unsafe treatments',()=>{
 for(const c of gyn.GYNECOLOGY_CASES){assert.ok(c.actions.filter(a=>a.group==='medicacion').length>=10);}
 const c=gyn.GYNECOLOGY_CASES.find(c=>c.id==='obs-02');const run={...gyn.createRun(c.id),status:'running'};
 const next=gyn.performAction(c,run,'med-ergometrine','Ampolla IM');
 assert.equal(gyn.evaluateRun(c,next).harmful.length,1);
 assert.ok(gyn.getPhysiology(c,{...next,elapsed:60}).vitals.sbp>gyn.getPhysiology(c,{...run,elapsed:60}).vitals.sbp);
});

test('oral glucose needs a favorable sampled swallowing screen, not consciousness alone',()=>{
 let s={...start('hypoglycemia'),vitals:{...start('hypoglycemia').vitals,gcs:15}};
 assert.equal(drug(s,'oral-glucose','gel').decisions.at(-1).judgment,'harmful');
 s=critical.simulationReducer(s,{type:'study',id:'swallow'});
 s={...s,elapsed:6};assert.equal(drug(s,'oral-glucose','gel').decisions.at(-1).judgment,'alternative');
 const unsafe=critical.simulationReducer(start('hypoglycemia'),{type:'study',id:'swallow'});
 assert.equal(drug({...unsafe,elapsed:6,vitals:{...unsafe.vitals,gcs:15}},'oral-glucose','gel').decisions.at(-1).judgment,'harmful');
});

test('confirmed questions add or subtract five points and remain within the final score limits',()=>{
 const [a,b]=education.finalQuestions('asthma');
 const correct=education.answerQuestion([],a.id,a.correct,20);
 assert.equal(education.scoreWithQuestions('asthma',60,correct).total,65);
 const wrongOption=b.options.find(o=>o.id!==b.correct).id;
 const mixed=education.answerQuestion(correct,b.id,wrongOption,21);
 assert.equal(education.scoreWithQuestions('asthma',60,mixed).total,60);
 assert.equal(education.scoreWithQuestions('asthma',2,[mixed[1]]).total,0);
 assert.equal(education.scoreWithQuestions('asthma',98,correct).total,100);
 assert.equal(education.scoreWithQuestions('asthma',68,correct,69).total,69);
});
test('score ignores duplicate, forged and other-case answers and computes correctness from the option',()=>{
 const q=education.finalQuestions('asthma')[0];
 const valid={questionId:q.id,optionId:q.correct,at:0,correct:false};
 const answers=[valid,{...valid,correct:true}, {questionId:'unknown',optionId:'option-1',at:0,correct:true}];
 assert.equal(education.scoreWithQuestions('asthma',50,answers).total,55);
 assert.equal(education.scoreWithQuestions('sepsis',50,answers).total,50);
 assert.equal(education.scoreWithQuestions('asthma',50,[{...valid,optionId:'forged'}]).total,50);
});
test('gynecology monitor channels start empty, connect independently and reset completely',()=>{
 let run={...gyn.createRun('obs-01'),status:'running'};
 assert.deepEqual(Object.keys(run.monitoring),[]);
 run=gyn.setGynecologyMonitoring(run,'ecg',true);assert.equal(run.monitoring.ecg,0);
 const same=gyn.setGynecologyMonitoring(run,'ecg',true);assert.equal(same,run);
 run={...run,elapsed:10};run=gyn.setGynecologyMonitoring(run,'bp',true);assert.equal(run.monitoring.bp,10);
 const next=gyn.setGynecologyMonitoring(run,'ecg',false);assert.equal(next.monitoring.ecg,undefined);assert.equal(next.monitoring.bp,10);
 assert.equal(run.monitoring.ecg,0,'disconnect preserves prior snapshots');
 assert.deepEqual(Object.keys(gyn.createRun('obs-01').monitoring),[]);
 for(const status of ['ready','paused','finished']){const frozen={...run,status};assert.equal(gyn.setGynecologyMonitoring(frozen,'spo2',true),frozen);}
 assert.equal(gyn.setGynecologyMonitoring(run,'etco2',true),run);
});
test('connecting gynecology sensors changes no physiology, decisions, or treatment',()=>{
 const c=gyn.GYNECOLOGY_CASES.find(c=>c.id==='obs-01');const run={...gyn.createRun(c.id),status:'running',elapsed:60};
 const connected=gyn.GYNECOLOGY_MONITOR_CHANNELS.reduce((previous,key)=>gyn.setGynecologyMonitoring(previous,key,true),run);
 assert.deepEqual(gyn.getPhysiology(c,connected),gyn.getPhysiology(c,run));assert.equal(connected.decisions,run.decisions);
 const {observedVital}=loadTypeScript('src/lib/criticalCareObservation.ts');
 const v=gyn.getPhysiology(c,run).vitals;const vitals={...v,temperature:v.temp};
 assert.equal(observedVital({monitoring:run.monitoring,vitals},'hr'),null);
 assert.equal(observedVital({monitoring:connected.monitoring,vitals},'hr'),v.hr);
 assert.equal(observedVital({monitoring:connected.monitoring,vitals},'etco2'),null,'no invented capnography');
});

test('obstetric catalogue contains three distinct cases per key with matching response and complete questions',()=>{
 assert.equal(gyn.GYNECOLOGY_CASES.length,11);
 const ids=gyn.GYNECOLOGY_CASES.map(c=>c.id);assert.equal(new Set(ids).size,ids.length);
 for(const key of ['roja','azul','amarilla']){
  const cases=gyn.GYNECOLOGY_CASES.filter(c=>c.obstetricKey===key);assert.equal(cases.length,3,key);
  assert.equal(new Set(cases.map(c=>c.diagnosis)).size,3,key);
  for(const c of cases){
   assert.equal(c.actions.find(a=>a.id===`key-${key}`).critical,true);
   for(const other of ['roja','azul','amarilla'].filter(k=>k!==key))assert.equal(c.actions.find(a=>a.id===`key-${other}`).harmful,true);
   const during=education.CASE_QUESTIONS.filter(q=>q.caseId===c.id&&q.stage==='during');assert.ok(during.length);
   assert.equal(education.finalQuestions(c.id).length,2);
   for(const q of during)assert.ok(q.triggers.some(t=>c.actions.some(a=>t===`action:${a.id}`)),`${c.id}: reachable question`);
   for(const a of c.actions.filter(a=>a.fulfills))assert.ok(c.actions.some(original=>original.id===a.fulfills),`${c.id}: missing alias target ${a.fulfills}`);
  }
 }
});
test('trauma with a firm uterus does not improve bleeding after an unnecessary massage or uterotonic',()=>{
 const c=gyn.GYNECOLOGY_CASES.find(c=>c.id==='obs-04'), atony=gyn.GYNECOLOGY_CASES.find(c=>c.id==='obs-01');
 assert.equal(atony.actions.find(a=>a.id==='massage').critical,true,'variant changes do not mutate the base case');
 let run={...gyn.createRun(c.id),status:'running'};
 for(const id of ['consent','iv','call'])run=gyn.performAction(c,run,id);
 const control={...run,elapsed:120};
 run=gyn.performAction(c,run,'massage');run=gyn.performAction(c,run,'uterotonic');run={...run,elapsed:120};
 assert.equal(gyn.getPhysiology(c,run).bleeding,gyn.getPhysiology(c,control).bleeding);
 assert.equal(gyn.getPhysiology(c,run).vitals.sbp,gyn.getPhysiology(c,control).vitals.sbp);
 assert.equal(c.actions.find(a=>a.id==='med-oxytocin').fulfills,undefined);
 assert.ok(gyn.evaluateRun(c,run).omitted.some(a=>a.id==='definitive'));
});
test('eclampsia avoids oral antihypertensive credit during the postictal state',()=>{
 const c=gyn.GYNECOLOGY_CASES.find(c=>c.id==='obs-06');let run={...gyn.createRun(c.id),status:'running'};
 run=gyn.performAction(c,run,'med-nifedipine');assert.equal(gyn.hasDecision(c,run,'antihypertensive'),false);
 assert.ok(gyn.evaluateRun(c,run).harmful.some(a=>a.id==='med-nifedipine'));
 assert.ok(c.actions.find(a=>a.id==='seizure-safety').critical);
 assert.equal(c.actions.find(a=>a.id==='med-labetalol').fulfills,'antihypertensive');
});
test('new maternal plans distinguish pregnancy from puerperium and tissue or surgical source control',()=>{
 const find=id=>gyn.GYNECOLOGY_CASES.find(c=>c.id===id);
 assert.ok(find('obs-08').actions.find(a=>a.id==='fetal').critical);
 assert.equal(find('obs-07').actions.some(a=>a.id==='fetal'),false);
 assert.equal(find('obs-09').actions.some(a=>a.id==='fetal'),false);
 assert.match(find('obs-05').actions.find(a=>a.id==='definitive').label,/tejido/);
 assert.match(find('obs-09').actions.find(a=>a.id==='definitive').label,/herida/);
 assert.equal(find('obs-08').actions.find(a=>a.id==='med-ceftriaxone-metronidazole').fulfills,'antibiotics');
});

test('gynecology prompts are reached by clinical progress and cannot repeat after answering',()=>{
 for(const c of gyn.GYNECOLOGY_CASES){
  assert.equal(education.gynecologyQuestionAfterDecision(c.id,'action:consent',2,[]),null);
  const q=education.gynecologyQuestionAfterDecision(c.id,'action:consent',3,[]);assert.ok(q,c.id);
  const answers=education.answerQuestion([],q.id,q.correct,10);
  assert.equal(education.gynecologyQuestionAfterDecision(c.id,'action:consent',4,answers),null);
 }
});
test('direct examination actions require consent for intimate findings and do not treat physiology',()=>{
 for(const c of gyn.GYNECOLOGY_CASES){
  const exams=c.actions.filter(a=>a.examZone);assert.ok(exams.length>=7);
  let run={...gyn.createRun(c.id),status:'running'};
  assert.equal(gyn.performAction(c,run,'exam-bleeding'),run,'consent required');
  run=gyn.performAction(c,run,'consent');
  for(const exam of exams){
   const next=gyn.performAction(c,run,exam.id);assert.notEqual(next,run);
   assert.deepEqual(gyn.getPhysiology(c,{...next,elapsed:60}),gyn.getPhysiology(c,{...run,elapsed:60}));
   assert.equal(exam.result,c.findings[exam.examZone]);
   assert.equal(gyn.performAction(c,next,exam.id),next,'repeated clicks do not count as new decisions');
  }
 }
});
test('expanded gynecology catalogue preserves fluid aliases and indication-specific antibiotics',()=>{
 for(const c of gyn.GYNECOLOGY_CASES)assert.ok(c.actions.filter(a=>a.group==='medicacion').length>=17,c.id);
 const c=gyn.GYNECOLOGY_CASES.find(c=>c.id==='obs-01');let run={...gyn.createRun(c.id),status:'running'};
 run=gyn.performAction(c,run,'iv');run=gyn.performAction(c,run,'med-ringer','Bolsa para perfusión IV');
 assert.ok(gyn.hasDecision(c,run,'fluids'));assert.equal(gyn.performAction(c,run,'med-saline'),run);
 const urinary=gyn.GYNECOLOGY_CASES.find(c=>c.id==='obs-08');
 assert.equal(urinary.actions.find(a=>a.id==='med-ceftriaxone').fulfills,'antibiotics');
 assert.equal(c.actions.find(a=>a.id==='med-ceftriaxone').fulfills,undefined);
 assert.equal(c.actions.find(a=>a.id==='med-calcium').effect,undefined,'antidote without toxicity cannot treat the current cause');
});

test('each simulator case has two in-session questions and two distinct clinical closing questions',()=>{
 const ids=[...critical.criticalCareCaseIds,...gyn.GYNECOLOGY_CASES.map(c=>c.id)];
 assert.equal(education.CASE_QUESTIONS.length,ids.length*4);
 assert.equal(new Set(education.CASE_QUESTIONS.map(q=>q.id)).size,ids.length*4);
 for(const id of ids){
  const during=education.CASE_QUESTIONS.filter(q=>q.caseId===id&&q.stage==='during');
  const final=education.finalQuestions(id);
  assert.equal(during.length,2,id);assert.equal(final.length,2,id);
  assert.equal(new Set([...during,...final].map(q=>q.prompt)).size,4,id);
  assert.ok(final.every(q=>!q.prompt.includes('cifras de esta práctica')),id);
 }
});
test('alternatives have comparable character and word lengths and no dominant correct position',()=>{
 const positions=[0,0,0,0];let correctLongest=0;
 for(const q of education.CASE_QUESTIONS){
  const labels=q.options.map(o=>o.label.trim());assert.equal(new Set(labels).size,4,q.id);
  const chars=labels.map(s=>s.length),words=labels.map(s=>s.split(/\s+/).length);
  assert.ok(Math.max(...chars)/Math.min(...chars)<=1.25,`${q.id}: ${chars}`);
  assert.ok(Math.max(...words)-Math.min(...words)<=4,`${q.id}: ${words}`);
  assert.ok(labels.every(label=>label.length>=55),q.id);
  assert.ok(q.explanation.length>60,q.id);
  positions[q.options.findIndex(o=>o.id===q.correct)]++;
  const correct=q.options.find(o=>o.id===q.correct);
  if(correct.label.length===Math.max(...chars)&&chars.filter(n=>n===correct.label.length).length===1)correctLongest++;
 }
 assert.ok(positions.every(n=>n>=12&&n<=24),String(positions));
 assert.ok(correctLongest<education.CASE_QUESTIONS.length*.4,'correct answers must not systematically be the longest');
});
test('clinical progress reaches both critical-care questions even when students avoid their direct triggers',()=>{
 for(const id of critical.criticalCareCaseIds){
  assert.equal(education.criticalCareQuestionAfterDecision(id,'action:non-trigger',2,[]),null);
  const first=education.criticalCareQuestionAfterDecision(id,'action:non-trigger',3,[]);assert.ok(first,id);
  let answers=education.answerQuestion([],first.id,first.correct,12);
  assert.equal(education.criticalCareQuestionAfterDecision(id,'action:non-trigger',5,answers),null);
  const second=education.criticalCareQuestionAfterDecision(id,'action:non-trigger',6,answers);assert.ok(second,id);assert.notEqual(first.id,second.id);
  answers=education.answerQuestion(answers,second.id,second.correct,20);
  assert.equal(education.criticalCareQuestionAfterDecision(id,'action:non-trigger',20,answers),null);
 }
});
test('both gynecology questions are available through progress and the second does not repeat the first',()=>{
 for(const c of gyn.GYNECOLOGY_CASES){
  const first=education.gynecologyQuestionAfterDecision(c.id,'action:consent',3,[]);
  const answers=education.answerQuestion([],first.id,first.correct,10);
  const second=education.gynecologyQuestionAfterDecision(c.id,'action:consent',6,answers);
  assert.ok(second,c.id);assert.notEqual(first.id,second.id);
  assert.equal(education.gynecologyQuestionAfterDecision(c.id,'action:consent',6,education.answerQuestion(answers,second.id,second.correct,20)),null);
 }
});
test('case-specific option order preserves the answer key and remains stable across construction',()=>{
 const {buildClinicalQuestions}=loadTypeScript('src/lib/clinicalQuestionBank.ts');
 assert.deepEqual(buildClinicalQuestions(),education.CASE_QUESTIONS);
 const q=education.CASE_QUESTIONS.find(q=>q.id==='ventilation:closing-priority');
 assert.match(q.options.find(o=>o.id===q.correct).label,/6,4 L\/min/);
 const correct=education.answerQuestion([],q.id,q.correct,10);assert.equal(correct[0].correct,true);
 const wrong=q.options.find(o=>o.id!==q.correct);assert.equal(education.answerQuestion([],q.id,wrong.id,10)[0].correct,false);
});
