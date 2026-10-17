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
const drug = (s, id) => reduce(s, { type: "medication", id });
const study = (s, id) => reduce(s, { type: "study", id });

test("all six cases have valid physiology, bedside tests and medicines", () => {
  assert.equal(criticalCareCaseIds.length, 6);
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
