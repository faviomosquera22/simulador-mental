import test from "node:test";
import assert from "node:assert/strict";
import { GYNECOLOGY_CASES, createRun, performAction, resultReady, getPhysiology, evaluateRun } from "../src/lib/gynecologySimulation.ts";

for (const c of GYNECOLOGY_CASES) {
  test(`${c.id}: action dependencies are reachable and a complete run meets critical priorities`, () => {
    let run = { ...createRun(c.id), status: "running", diagnosis: c.diagnosis };
    let actions = c.actions.filter(a => !a.harmful);
    while (actions.length) {
      const before = actions.length;
      actions = actions.filter(a => {
        const next = performAction(c, run, a.id);
        if (next === run) return true;
        run = next; return false;
      });
      assert.ok(actions.length < before, "unreachable dependency");
    }
    const report = evaluateRun(c, run);
    assert.equal(report.score, 100);
    assert.equal(report.safe, true);
  });
  test(`${c.id}: critical omissions cannot be hidden by a correct diagnosis`, () => {
    const report = evaluateRun(c, { ...createRun(c.id), diagnosis: c.diagnosis });
    assert.ok(report.omitted.length > 0);
    assert.equal(report.safe, false);
    assert.ok(report.score < 70);
  });
}
const c = GYNECOLOGY_CASES[0];
test("paused, ready and finished sessions reject decisions", () => {
  for (const status of ["ready", "paused", "finished"]) {
    const run = { ...createRun(c.id), status };
    assert.equal(performAction(c, run, "abcde"), run);
  }
});
test("decisions enforce prerequisites and cannot be repeated", () => {
  const run = { ...createRun(c.id), status: "running" };
  assert.equal(performAction(c, run, "fluids"), run);
  const once = performAction(c, run, "abcde");
  assert.equal(performAction(c, once, "abcde"), once);
});
test("results remain pending until their simulated turnaround has elapsed", () => {
  const action = c.actions.find(a => a.id === "labs");
  const run = performAction(c, { ...createRun(c.id), status: "running", elapsed: 10 }, action.id);
  assert.equal(resultReady(action, { ...run, elapsed: 39 }), false);
  assert.equal(resultReady(action, { ...run, elapsed: 40 }), true);
});
test("deterioration continues without action and escalation does not cure instantly", () => {
  const start = { ...createRun(c.id), status: "running" };
  const before = getPhysiology(c, { ...start, elapsed: 240 });
  assert.ok(before.vitals.sbp < c.initial.sbp);
  let run = performAction(c, { ...start, elapsed: 240 }, "call");
  run = performAction(c, run, "definitive");
  assert.equal(getPhysiology(c, run).vitals.sbp, before.vitals.sbp);
  assert.ok(getPhysiology(c, { ...run, elapsed: 300 }).vitals.sbp < c.initial.sbp);
});
test("postpartum treatment cannot undo blood already lost", () => {
  const postpartum = GYNECOLOGY_CASES.find(item => item.id === "obs-01");
  let run = { ...createRun(postpartum.id), status: "running", elapsed: 180 };
  const before = getPhysiology(postpartum, run).bleeding;
  run = performAction(postpartum, run, "iv");
  run = performAction(postpartum, run, "fluids");
  assert.equal(getPhysiology(postpartum, run).bleeding, before);
  assert.ok(getPhysiology(postpartum, { ...run, elapsed: 240 }).bleeding >= before);
});
test("unsafe actions and delayed critical decisions reduce the score", () => {
  let run = { ...createRun(c.id), status: "running", elapsed: 300, diagnosis: c.diagnosis };
  for (const action of c.actions.filter(a => !a.harmful)) run = performAction(c, run, action.id);
  const before = evaluateRun(c, run);
  run = performAction(c, run, "discharge");
  const after = evaluateRun(c, run);
  assert.ok(after.score < before.score);
  assert.equal(after.harmful.length, 1);
  assert.ok(after.late.length > 0);
});

test("obstetric keys match each scenario and incorrect activation is penalized", () => {
  for (const c of GYNECOLOGY_CASES.filter(c => c.obstetricKey)) {
    let run = { ...createRun(c.id), status: "running" };
    const wrong = c.actions.find(a => a.id.startsWith("key-") && a.harmful);
    run = performAction(c, run, wrong.id);
    assert.ok(evaluateRun(c, run).harmful.some(a => a.id === wrong.id));
    assert.ok(evaluateRun(c, run).omitted.some(a => a.id === `key-${c.obstetricKey}`));
  }
});
test("TANN requires assessment and red activation and provides temporary support", () => {
  const c = GYNECOLOGY_CASES.find(c => c.id === "obs-01");
  let run = { ...createRun(c.id), status: "running", elapsed: 120 };
  assert.equal(performAction(c, run, "tann"), run);
  run = performAction(c, run, "key-roja");
  assert.equal(performAction(c, run, "tann"), run);
  run = performAction(c, run, "tann-assess");
  const before = getPhysiology(c, run);
  const treated = performAction(c, run, "tann");
  assert.deepEqual(getPhysiology(c, treated), before);
  assert.ok(getPhysiology(c, { ...treated, elapsed: 180 }).vitals.sbp > getPhysiology(c, { ...run, elapsed: 180 }).vitals.sbp);
  assert.ok(getPhysiology(c, { ...treated, elapsed: 180 }).bleeding >= before.bleeding);
  assert.equal(getPhysiology(c, treated).escalated, false);
  assert.ok(!GYNECOLOGY_CASES.find(c => c.id === "obs-02").actions.some(a => a.id === "tann"));
});
test("hypertension worsens without care and responds gradually to blood-pressure treatment", () => {
  const c = GYNECOLOGY_CASES.find(c => c.id === "obs-02");
  let run = { ...createRun(c.id), status: "running", elapsed: 120 };
  assert.ok(getPhysiology(c, run).vitals.sbp > c.initial.sbp);
  assert.equal(getPhysiology(c, run).critical, true);
  run = performAction(c, run, "iv");
  run = performAction(c, run, "call");
  const before = getPhysiology(c, run);
  const treated = performAction(c, run, "antihypertensive");
  assert.equal(getPhysiology(c, treated).vitals.sbp, before.vitals.sbp);
  assert.ok(getPhysiology(c, { ...treated, elapsed: 180 }).vitals.sbp < before.vitals.sbp);
});
test("fluids improve perfusion without directly stopping hemorrhage", () => {
  const c = GYNECOLOGY_CASES.find(c => c.id === "obs-01");
  let run = { ...createRun(c.id), status: "running", elapsed: 120 };
  run = performAction(c, run, "iv");
  const treated = performAction(c, run, "fluids");
  const later = getPhysiology(c, { ...treated, elapsed: 180 });
  const untreated = getPhysiology(c, { ...run, elapsed: 180 });
  assert.equal(later.bleeding, untreated.bleeding);
  assert.ok(later.vitals.sbp > untreated.vitals.sbp);
});
