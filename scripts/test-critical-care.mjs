import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const fixture = { exports: {} }; cache.set(file, fixture);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(id => load(path.resolve(path.dirname(file), id + ".ts")), fixture, fixture.exports);
  return fixture.exports;
}
const { createSimulation, simulationReducer: reduce, medicationsFor, medicationBlock, medicationExposure, criticalCareCaseIds } = load(path.resolve("src/lib/criticalCareSimulation.ts"));
const start = id => reduce(createSimulation(id), { type: "start" });
const ticks = (s, count) => { for(let i = 0; i < count; i++) s = reduce(s, { type: "tick" }); return s; };
const action = (s, id) => reduce(s, { type: "action", id });
const drug = (s, id) => { const m = medicationsFor(s.scenario).find(m=>m.id===id); const p=m.presentations[0]; const unit=p.quantityUnit ?? (m.continuous || id==="dexmedetomidine" ? "mL/h" : id==="insulin" ? "UI" : ["saline","ringer"].includes(id) ? "mL" : id==="salbutamol"||id==="ipratropium" ? p.id==="inhaler"?"inhalaciones":"mg" : id==="dextrose"||id==="oral-glucose" ? "g" : "mg"); return reduce(s, { type: "medication", id, amount: 1, unit }); };
const study = (s, id) => reduce(s, { type: "study", id });

test("all seven cases have valid physiology, bedside tests and medicines", () => {
  assert.equal(criticalCareCaseIds.length, 7);
  for (const id of criticalCareCaseIds) {
    const s = ticks(start(id), 600);
    for (const value of Object.values(s.vitals)) assert.ok(Number.isFinite(value), id);
    assert.ok(medicationsFor(id).length > 0, id);
  }
});
test("ready, pause and finish freeze drug effect, studies, complications and all signs", () => {
  const running = drug(start("asthma"), "salbutamol");
  for (const s of [createSimulation("asthma"), reduce(running,{type:"pause"}), reduce(running,{type:"finish"})]) {
    assert.equal(ticks(s,100),s);
    assert.equal(drug(s,"salbutamol"),s);
    assert.equal(study(s,"gas"),s);
  }
});
test("assessment of all four zones, including zone four, does not treat physiology", () => {
  let s=start("sepsis");const baseline=s.vitals;
  for(let i=0;i<4;i++) s=reduce(s,{type:"assess",zone:i});
  assert.equal(s.assessed.length,4);assert.equal(s.vitals,baseline);assert.match(s.feedback,/Fiebre/);
});
test("salbutamol has onset delay, improves oxygenation and wears off", () => {
  const initial=start("asthma"); const treated=drug(initial,"salbutamol");
  assert.equal(treated.vitals,initial.vitals);
  assert.equal(medicationExposure(ticks(treated,5),"salbutamol"),0);
  assert.ok(ticks(treated,50).vitals.spo2>ticks(initial,50).vitals.spo2+4);
  assert.equal(medicationExposure(ticks(treated,190),"salbutamol"),0);
});
test("duplicate immediate doses are rejected and excess beta agonist creates an alert", () => {
  let s=drug(start("asthma"),"salbutamol");
  const duplicate=drug(s,"salbutamol");assert.equal(duplicate.medications.length,1);
  s=drug(ticks(s,25),"salbutamol");s=ticks(s,30);
  assert.ok(s.complications.some(c=>c.id==="beta-tachycardia" && c.resolvedAt===undefined));
  const acknowledged=reduce(s,{type:"acknowledge",id:"beta-tachycardia"});
  assert.equal(acknowledged.complications.find(c=>c.id==="beta-tachycardia").resolvedAt,undefined);
  assert.equal(acknowledged.vitals,s.vitals);
  s=ticks(acknowledged,200);assert.ok(s.complications.find(c=>c.id==="beta-tachycardia").resolvedAt);
});
test("sepsis worsens without treatment and noradrenaline requires support and access", () => {
  let s=start("sepsis");assert.equal(drug(s,"norepinephrine").medications.length,0);
  const untreated=ticks(s,100);
  for(const id of ["help","iv","fluids"])s=action(s,id);
  s=drug(drug(s,"antibiotic"),"norepinephrine");s=ticks(s,100);
  assert.ok(s.vitals.sbp>untreated.vitals.sbp+20);assert.ok(s.vitals.temperature<untreated.vitals.temperature);
  assert.ok(s.vitals.lactate<untreated.vitals.lactate);
});
test("infusions can be stopped but bolus medicines cannot be undone", () => {
  let s=start("sepsis");for(const id of ["help","iv","fluids"])s=action(s,id);
  s=ticks(drug(s,"norepinephrine"),30);const before=s.vitals.sbp;
  s=reduce(s,{type:"stop-medication",id:"norepinephrine"});assert.equal(s.vitals.sbp,before);
  assert.ok(ticks(s,40).vitals.sbp<before-10);
  const asthma=drug(start("asthma"),"salbutamol");assert.equal(reduce(asthma,{type:"stop-medication",id:"salbutamol"}),asthma);
});
test("antihistamine alone does not reverse anaphylactic shock; adrenaline affects signs", () => {
  const base=start("anaphylaxis");const adjunct=ticks(drug(base,"antihistamine"),75);const causal=ticks(drug(base,"adrenaline"),75);
  assert.ok(adjunct.vitals.sbp<base.vitals.sbp);assert.ok(adjunct.complications.some(c=>c.id==="airway-edema"));
  assert.ok(causal.vitals.sbp>adjunct.vitals.sbp+20);assert.ok(causal.vitals.spo2>adjunct.vitals.spo2+8);
});
test("glucose result is sampled when requested and repeats reflect subsequent treatment", () => {
  let s=study(start("hypoglycemia"),"glucose");const first=s.studies[0].snapshot.glucose;
  assert.equal(study(s,"glucose"),s);s=ticks(s,3);s=action(s,"iv");s=drug(s,"dextrose");s=ticks(s,45);
  assert.ok(s.vitals.glucose>70);assert.ok(s.vitals.gcs>14);
  s=study(s,"glucose");assert.equal(s.studies.length,2);assert.equal(s.studies[0].snapshot.glucose,first);
  assert.ok(s.studies[1].snapshot.glucose>first+30);assert.match(s.studies[0].result,/38 mg/);
});
test("stroke medication requires CT result and specialist plan and never cures focal deficit", () => {
  let s=start("stroke");for(const id of ["iv","help","onset"])s=action(s,id);
  assert.ok(medicationBlock(s,medicationsFor("stroke")[0]));s=study(s,"ct");s=ticks(s,30);s=action(s,"pressure-plan");
  assert.equal(medicationBlock(s,medicationsFor("stroke")[0]),null);s=ticks(drug(s,"antihypertensive"),40);
  assert.ok(s.vitals.sbp<180);assert.match(reduce(s,{type:"assess",zone:3}).feedback,/Asimetría/);
});
test("ventilator and sedative interactions affect pressure without immediate medication jumps", () => {
  let s=start("ventilation");for(const id of ["help","iv","circuit"])s=action(s,id);
  const treated=drug(s,"sedative");assert.equal(treated.vitals,s.vitals);
  assert.ok(ticks(treated,40).vitals.sbp<ticks(s,40).vitals.sbp-8);
  const high=reduce(s,{type:"ventilator",settings:{fio2:60,peep:18,rate:16,volume:400}});
  assert.ok(ticks(high,40).vitals.sbp<90);
});
test("reset clears every drug, complication, sample and clock", () => {
  const s=reduce(ticks(drug(start("asthma"),"salbutamol"),80),{type:"reset",scenario:"sepsis"});
  assert.equal(s.medications.length+s.complications.length+s.studies.length+s.elapsed,0);assert.equal(s.status,"ready");
});

const { nextGuidedTask, decisionSnapshot, sampleKey } = load(path.resolve("src/lib/criticalCareGuidance.ts"));
test("the guide first explains exploration without requiring all zones before urgent care", () => {
  let s=start("anaphylaxis");
  assert.equal(nextGuidedTask(s,[]).target.zone,0);
  s=reduce(s,{type:"assess",zone:0});
  assert.equal(nextGuidedTask(s,[]).target.id,"help");
  s=action(s,"help");
  assert.equal(nextGuidedTask(s,[]).target.id,"adrenaline");
  assert.equal(s.assessed.length,1);
});
test("guidance resolves medication prerequisites and distinguishes requesting from reading", () => {
  let s=reduce(start("hypoglycemia"),{type:"assess",zone:0});
  assert.equal(nextGuidedTask(s,[]).target.id,"glucose");
  s=study(s,"glucose");
  assert.notEqual(nextGuidedTask(s,[]).target.id,"dextrose","do not suggest blocked administration");
  s=ticks(s,3);
  s=reduce(s,{type:"acknowledge",id:"neuroglycopenia"});
  assert.equal(nextGuidedTask(s,[]).target.read,true);
  const read=[sampleKey("glucose",0)];
  s=action(s,"airway");
  const next=nextGuidedTask(s,read);
  assert.equal(next.target.id,"iv");assert.equal(next.target.panel,"interventions");
});
test("reevaluation records an immutable snapshot and never changes physiology", () => {
  let s=ticks(drug(start("asthma"),"salbutamol"),30);
  const before=s.vitals;
  s=reduce(s,{type:"reassess"});
  assert.equal(s.reassessments.length,1);assert.equal(s.vitals,before);
  assert.deepEqual(s.reassessments[0].vitals,before);
  const recorded=s.reassessments[0].vitals.spo2;
  s=ticks(s,20);assert.equal(s.reassessments[0].vitals.spo2,recorded);
  assert.match(s.log.find(e=>e.text.startsWith("Reevaluación registrada")).text,/no modifica/);
});
test("pausing or finishing cannot register another reevaluation", () => {
  for(const status of ["pause","finish"]){const s=reduce(start("sepsis"),{type:status});assert.equal(reduce(s,{type:"reassess"}),s);}
});
test("decision comparison stores the actual values before treatment and does not mutate them", () => {
  const s=start("asthma");const snapshot=decisionSnapshot(s,"medication","salbutamol");
  assert.equal(snapshot.title,"Salbutamol");assert.equal(snapshot.before.spo2,88);assert.ok(snapshot.observeAfter>6);
  const treated=ticks(drug(s,"salbutamol"),30);assert.ok(treated.vitals.spo2>snapshot.before.spo2);
  assert.equal(snapshot.before.spo2,88);
});

test("an unread active complication takes precedence over the next suggested task", () => {
  let s=drug(start("asthma"),"salbutamol");s=drug(ticks(s,25),"salbutamol");s=ticks(s,25);
  assert.equal(nextGuidedTask(s,[]).target.id,"alert:beta-tachycardia");
  s=reduce(s,{type:"acknowledge",id:"beta-tachycardia"});
  assert.notEqual(nextGuidedTask(s,[]).target.id,"alert:beta-tachycardia");
  assert.ok(s.complications.some(c=>c.resolvedAt===undefined),"reading the alert does not cure it");
});

const { observedVital, sensorConnected } = load(path.resolve("src/lib/criticalCareObservation.ts"));
test("all cases begin with every monitor channel unmeasured", () => {
  for (const id of criticalCareCaseIds) {
    const s = reduce(createSimulation(id), { type: "start" });
    for (const key of ["hr", "spo2", "sbp", "dbp", "rr", "temperature", "etco2"]) assert.equal(observedVital(s, key), null);
  }
});
test("sensor connection is valid at zero, independent per channel and never treats physiology", () => {
  const s = reduce(createSimulation("asthma"), { type: "start" });
  const connected = reduce(s, { type: "monitor", key: "ecg", enabled: true });
  assert.equal(connected.monitoring.ecg, 0);
  assert.equal(sensorConnected(connected, "ecg"), true);
  assert.equal(observedVital(connected, "hr"), s.vitals.hr);
  assert.equal(observedVital(connected, "spo2"), null);
  assert.deepEqual(connected.vitals, s.vitals);
  assert.equal(reduce(connected, { type: "monitor", key: "ecg", enabled: true }), connected);
});
test("disconnected sensors do not freeze treatment effects; reconnection shows the current patient", () => {
  let hidden = reduce(createSimulation("asthma"), { type: "start" });
  hidden = drug(hidden, "salbutamol");
  let observed = reduce(hidden, { type: "monitor", key: "spo2", enabled: true });
  for (let i = 0; i < 30; i++) { hidden = reduce(hidden, { type: "tick" }); observed = reduce(observed, { type: "tick" }); }
  assert.deepEqual(observed.vitals, hidden.vitals);
  assert.equal(observedVital(hidden, "spo2"), null);
  assert.equal(observedVital(observed, "spo2"), hidden.vitals.spo2);
  const connected = reduce(hidden, { type: "monitor", key: "spo2", enabled: true });
  assert.equal(observedVital(connected, "spo2"), hidden.vitals.spo2);
  assert.equal(connected.monitoring.spo2, hidden.elapsed);
});
test("disconnect, pause, finish and reset honor measurement lifecycle", () => {
  const start = reduce(createSimulation("sepsis"), { type: "start" });
  const connected = reduce(start, { type: "monitor", key: "bp", enabled: true });
  const off = reduce(connected, { type: "monitor", key: "bp", enabled: false });
  assert.equal(observedVital(off, "sbp"), null);
  assert.deepEqual(off.vitals, connected.vitals);
  for (const state of [createSimulation("sepsis"), reduce(connected, {type:"pause"}), reduce(connected, {type:"finish"})]) assert.equal(reduce(state, { type: "monitor", key: "ecg", enabled: true }), state);
  const reset = reduce(connected, {type:"reset",scenario:"asthma"});
  assert.deepEqual(reset.monitoring, {});
});
test("decision snapshots retain which sensors were connected before an intervention", () => {
  const { decisionSnapshot } = load(path.resolve("src/lib/criticalCareGuidance.ts"));
  const s = reduce(reduce(createSimulation("asthma"), {type:"start"}), {type:"monitor",key:"ecg",enabled:true});
  const snapshot = decisionSnapshot(s, "medication", "salbutamol");
  const next = reduce(s, {type:"monitor",key:"spo2",enabled:true});
  assert.equal(snapshot.monitoring.ecg, 0);
  assert.equal(snapshot.monitoring.spo2, undefined);
  assert.equal(next.monitoring.spo2, 0);
  assert.notEqual(snapshot.monitoring, s.monitoring);
});
