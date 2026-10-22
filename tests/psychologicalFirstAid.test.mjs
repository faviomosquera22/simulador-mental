import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/load-ts.cjs';
const { PAP_ACTIONS, createPapRun, tickPap, performPap, papFinishBlock, finishPap, papRubric, papBlock, papMotion } = loadTypeScript('src/lib/psychologicalFirstAid.ts');
const start = (variant = 'standard') => ({ ...createPapRun('practice', variant), status: 'running' });
const act = (run, ids) => ids.reduce((value, id) => {
  const action = PAP_ACTIONS.find(a => a.id === id);
  assert.equal(papBlock(value, action), null, `${id} must be available`);
  return performPap(value, id);
}, run);
const opening = ['scene', 'observe', 'introduce', 'distance', 'quiet', 'needs', 'physical'];
const continuation = ['risk', 'validate', 'supports', 'silence', 'water', 'information', 'contact', 'reassess', 'plan'];

test('full PAP case requires responding to the event and allows a safe ending with residual distress', () => {
  let run = act(start(), opening);
  assert.equal(run.event, true);
  assert.equal(run.eventHandled, false);
  run = act(run, ['event-response', ...continuation]);
  assert.equal(papFinishBlock(run), null);
  assert.ok(run.distress > 0, 'distress does not need to disappear');
  assert.equal(finishPap(run).status, 'finished');
  assert.equal(papRubric(run).score, 100);
});
test('consent, physical assessment and chosen support precede interventions; invalid actions do nothing', () => {
  const run = start();
  for (const id of ['contact', 'water', 'plan', 'information', 'force-story', 'missing']) assert.equal(performPap(run, id), run);
  assert.equal(finishPap(run), run);
  assert.equal(performPap(act(run, ['scene']), 'scene').completed.filter(id => id === 'scene').length, 1);
});
test('pause, briefing and finish freeze progression and decisions', () => {
  for (const status of ['ready', 'paused', 'finished']) {
    const run = { ...start(), status };
    assert.equal(tickPap(run, 400), run);
    assert.equal(performPap(run, 'scene'), run);
  }
});
test('new medical warning overrides routine actions; requesting help is distinct from confirmed reception', () => {
  let run = act(start('medical'), opening);
  for (const id of ['risk', 'needs', 'reassess', 'contact', 'water']) assert.equal(performPap(run, id), run);
  run = act(run, ['emergency']);
  assert.equal(run.eventHandled, false);
  assert.equal(finishPap(run), run);
  run = act(run, ['handoff', ...continuation]);
  assert.equal(run.eventHandled, true);
  assert.equal(papFinishBlock(run), null);
  assert.equal(finishPap(run).status, 'finished');
});
test('emergency activation never depends on an introduction when a timed warning arrives first', () => {
  let run = tickPap(start('medical'), 90);
  assert.equal(run.event, true);
  assert.ok(!run.completed.includes('introduce'));
  run = act(run, ['emergency', 'handoff']);
  assert.ok(run.completed.includes('handoff'));
  run = act(run, ['scene', 'introduce', 'physical']);
  assert.match(run.findings.at(-1), /dolor torácico nuevo/);
  assert.doesNotMatch(run.history.at(-1).reply, /no me duele/);
});
test('acknowledging a medical warning does not resolve it or unlock ordinary care', () => {
  let run = act(start('medical'), opening);
  run = act(run, ['event-response']);
  assert.equal(performPap(run, 'water'), run);
  assert.ok(papFinishBlock(run));
  assert.ok(papRubric(run).score <= 40);
});
test('pressuring a story and false reassurance affect the actor and remain in debrief after repair', () => {
  let run = act(start(), ['scene', 'observe', 'introduce', 'distance', 'needs']);
  const trust = run.trust;
  run = act(run, ['force-story', 'minimize']);
  assert.ok(run.trust < trust);
  assert.equal(papMotion(run), 'agitated');
  run = act(run, ['repair']);
  assert.equal(papRubric(run).penalties, 20);
  assert.equal(run.history.filter(h => h.harmful).length, 2);
});
test('closure cannot use an early reevaluation after new information; plan must follow latest review', () => {
  let run = act(start(), opening);
  run = act(run, ['event-response', 'risk', 'validate', 'supports', 'reassess', 'information', 'contact', 'plan']);
  assert.match(papFinishBlock(run), /Reevalúa/);
  run = act(run, ['reassess']);
  assert.match(papFinishBlock(run), /plan/);
  run = act(run, ['plan']);
  assert.equal(papFinishBlock(run), null);
});
test('repeated reassessment cannot farm points, paused time cannot trigger an event, reset clears the case', () => {
  let run = act(start(), opening);
  run = act(run, ['event-response', ...continuation]);
  const score = papRubric(run).score;
  for (let i = 0; i < 4; i++) run = act(run, ['reassess']);
  assert.equal(papRubric(run).score, score);
  const paused = { ...start(), status: 'paused' };
  assert.equal(tickPap(paused, 300).event, false);
  assert.deepEqual(createPapRun().completed, []);
  assert.deepEqual(createPapRun().history, []);
});
