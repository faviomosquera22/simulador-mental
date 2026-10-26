import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/load-ts.cjs';
const { createGiState, applyGiAction, giVitals, giBalance, giScore, giCorrection, giNextTask, giAssessed, giToolTarget, giToolAction } = loadTypeScript('src/lib/gastrointestinalSimulation.ts');
const run = (state, id, value, target) => applyGiAction(state, { id, value, target });
function assessed(mode = 'practice', variant = 'standard') {
  let state = createGiState(mode, variant);
  for (const [id, value] of [['triage'], ['identify', 'two-identifiers'], ['wash'], ['gloves'], ['history', 'symptoms'], ['history', 'exposure'], ['history', 'background'], ['temperature'], ['vitals'], ['abdomen'], ['hydration'], ['balance']]) state = run(state, id, value);
  assert.equal(giAssessed(state), true); assert.equal(state.mistakes, 0);
  return state;
}
function prepared(mode = 'practice', variant = 'standard') {
  let state = assessed(mode, variant);
  for (const [id, value] of [['classify', 'oral-observation'], ['diagnostics', 'clinical-review'], ['discard'], ['wash'], ['prepare', 1000]]) state = run(state, id, value);
  assert.equal(state.solution, 'prepared'); assert.equal(state.mistakes, 0);
  return state;
}
function interval(state) {
  state = run(state, 'drink', 250);
  state = run(state, 'wait');
  return run(state, 'reassess');
}
test('complete adult route needs observed intake, repeated reassessment, education and explicit handoff', () => {
  let state = prepared();
  for (let i = 0; i < 4; i++) state = interval(state);
  assert.equal(state.minute, 120); assert.equal(state.oralMl, 1000); assert.equal(state.remainingMl, 0);
  assert.equal(state.outcome, null); assert.equal(giVitals(state).hr, 90);
  state = run(state, 'balance'); state = run(state, 'teach', 'complete'); state = run(state, 'handoff', 'observation');
  assert.equal(state.outcome, 'observing'); assert.equal(state.mistakes, 0); assert.equal(giScore(state), 100);
  assert.match(state.events.at(-1).detail, /no se declara curada.*alta automática/);
});
test('classification cannot substitute for collecting history and examination', () => {
  let state = run(createGiState(), 'identify', 'two-identifiers');
  state = run(state, 'classify', 'oral-observation');
  assert.equal(state.flags.classified, undefined); assert.equal(state.mistakes, 1);
  assert.match(giCorrection(state, { id: 'classify', value: 'oral-observation' }).recommendation, /entrevista/);
});
test('two identifiers and consent precede routine contact, while rapid triage and help remain accessible', () => {
  const initial = createGiState();
  assert.equal(run(initial, 'triage').flags.triaged, true);
  assert.equal(run(initial, 'urgent').urgentAt, 0);
  assert.equal(run(initial, 'identify', 'name').flags.identified, undefined);
  assert.equal(run(initial, 'temperature').flags.temperature, undefined);
});
test('wrong physical destination cannot perform a valid care action', () => {
  const state = assessed();
  const wrong = run(state, 'vitals', undefined, 'abdomen');
  assert.equal(wrong.mistakes, 1);
  assert.equal(wrong.events.at(-1).kind, 'error');
  assert.match(giCorrection(state, { id: 'vitals', target: 'abdomen' }).recommendation, /Brazo/);
});
test('contact gloves must be removed and hand hygiene repeated before making the drink', () => {
  let state = run(assessed(), 'classify', 'oral-observation');
  state = run(state, 'prepare', 1000); assert.equal(state.solution, 'unprepared');
  state = run(state, 'discard'); assert.equal(state.cleanHands, false);
  state = run(state, 'prepare', 1000); assert.equal(state.solution, 'unprepared');
  state = run(state, 'wash'); state = run(state, 'prepare', 1000); assert.equal(state.remainingMl, 1000);
});
test('discarded gloves cannot become a fresh unit or be worn again', () => {
  let state = run(assessed(), 'discard'); state = run(state, 'wash');
  state = run(state, 'gloves'); assert.equal(state.gloves, 'disposed'); assert.equal(state.mistakes, 1);
});
test('packet dilution rejects wrong, nonfinite, missing and forged numeric values', () => {
  const baseline = run(run(run(assessed(), 'classify', 'oral-observation'), 'discard'), 'wash');
  for (const value of [250, 500, 0, -1000, NaN, Infinity, undefined, '1000']) {
    const state = run(baseline, 'prepare', value);
    assert.equal(state.solution, 'unprepared'); assert.equal(state.remainingMl, 0);
  }
  assert.equal(run(baseline, 'prepare', 1000).remainingMl, 1000);
});
test('a prepared packet cannot be mixed a second time or create more stock', () => {
  const state = run(prepared(), 'prepare', 1000);
  assert.equal(state.remainingMl, 1000); assert.equal(state.mistakes, 1);
});
test('offering a portion does not instantly improve physiology and cannot stack portions', () => {
  const baseline = prepared(); const state = run(baseline, 'drink', 250);
  assert.deepEqual(giVitals(state), giVitals(baseline)); assert.equal(state.minute, 0); assert.equal(state.pendingMl, 250);
  const duplicate = run(state, 'drink', 250); assert.equal(duplicate.oralMl, 0); assert.equal(duplicate.remainingMl, 750);
  assert.equal(run(state, 'wait').minute, 30);
});
test('a reserved portion is not recorded as intake until the observation interval completes', () => {
  const state = run(prepared(), 'drink', 250);
  assert.equal(state.pendingMl, 250); assert.equal(state.oralMl, 0); assert.equal(giBalance(state), 0);
  const observed = run(state, 'wait');
  assert.equal(observed.pendingMl, 0); assert.equal(observed.oralMl, 250); assert.equal(giBalance(observed), 250);
});
test('reassessment is required after each observation interval before another portion', () => {
  let state = run(run(prepared(), 'drink', 250), 'wait');
  state = run(state, 'drink', 250); assert.equal(state.oralMl, 250);
  state = run(state, 'reassess'); state = run(state, 'drink', 250); assert.equal(state.pendingMl, 250);
  assert.equal(run(state, 'wait').oralMl, 500);
});
test('fluid balance includes only case-period measured events and does not invent prior losses', () => {
  let state = prepared(); for (let i = 0; i < 4; i++) state = interval(state);
  assert.equal(state.stoolMl, 150); assert.equal(state.urineMl, 200); assert.equal(state.vomitMl, 0); assert.equal(giBalance(state), 650);
  state = run(state, 'balance'); assert.match(state.events.at(-1).detail, /sin volumen medido.*no se inventa/);
});
test('reassessment and help do not administer fluid or resolve a complication', () => {
  let state = prepared('practice', 'intolerance'); state = interval(interval(state));
  assert.equal(state.alertAt, 60); const values = giVitals(state);
  for (const id of ['urgent', 'reassess', 'balance']) state = run(state, id);
  assert.deepEqual(giVitals(state), values); assert.equal(state.alertAt, 60); assert.equal(state.outcome, null); assert.equal(state.oralMl, 500);
});
test('persistent vomiting blocks further oral intake and requires protected urgent handoff', () => {
  let state = interval(interval(prepared('practice', 'intolerance')));
  assert.equal(state.vomitMl, 300); assert.equal(giVitals(state).systolic, 90);
  const wrong = run(state, 'drink', 250); assert.equal(wrong.oralMl, 500); assert.equal(wrong.critical, 1);
  state = run(state, 'iv'); assert.equal(state.flags.ivPrepared, undefined);
  state = run(state, 'urgent'); state = run(state, 'position'); state = run(state, 'iv');
  assert.equal(state.outcome, null); state = run(state, 'handoff', 'urgent');
  assert.equal(state.outcome, 'escalated'); assert.equal(state.alertAt, 60); assert.match(state.events.at(-1).detail, /no se declara resuelta/);
});
test('a preemptive call cannot count as a response to a later deterioration', () => {
  let state = run(prepared('practice', 'intolerance'), 'urgent'); state = interval(interval(state));
  assert.equal(state.urgentAt, 0); assert.equal(giNextTask(state).tool, 'call');
  assert.equal(run(state, 'handoff', 'urgent').outcome, null);
});
test('clinical time without sufficient replacement triggers a safety branch', () => {
  let state = prepared(); for (let i = 0; i < 3; i++) state = run(state, 'wait');
  assert.equal(state.alertAt, 90); assert.equal(state.pendingMl, 0); assert.equal(state.oralMl, 0);
  assert.equal(giNextTask(state).tool, 'call'); assert.equal(run(state, 'wait').minute, 90);
});
test('antibiotics and stool samples require a justified decision rather than automatic use', () => {
  const state = assessed();
  for (const [id, value] of [['antibiotic', 'give'], ['sample', 'collect']]) assert.equal(run(state, id, value).mistakes, 1);
  for (const id of ['antibiotic', 'sample']) {
    const reviewed = run(state, id, 'not-indicated'); assert.equal(reviewed.mistakes, 0); assert.equal(reviewed.oralMl, 0);
  }
});
test('incomplete education and premature discharge cannot finish the case', () => {
  const state = prepared();
  assert.equal(run(state, 'teach', 'fasting').flags.educated, undefined);
  assert.equal(run(state, 'handoff', 'home').outcome, null);
  assert.equal(run(state, 'handoff', 'observation').outcome, null);
});
test('mistakes remain in the score after the student corrects the decision', () => {
  let state = run(createGiState(), 'identify', 'name');
  state = run(state, 'identify', 'two-identifiers');
  assert.equal(state.mistakes, 1); assert.equal(giScore(state), 95); assert.equal(state.events[0].kind, 'error');
});
test('pause freezes care and clinical time, and a new session resets history', () => {
  const state = { ...prepared(), paused: true };
  for (const action of [{ id: 'wait' }, { id: 'drink', value: 250 }, { id: 'urgent' }]) assert.equal(applyGiAction(state, action), state);
  const fresh = createGiState(); assert.equal(fresh.events.length, 0); assert.equal(fresh.remainingMl, 0); assert.equal(fresh.gloves, 'available');
});
test('a finished encounter cannot receive more treatment or score changes', () => {
  let state = prepared('assessment', 'intolerance'); state = interval(interval(state));
  for (const [id, value] of [['urgent'], ['position'], ['iv'], ['handoff', 'urgent']]) state = run(state, id, value);
  assert.equal(state.outcome, 'escalated'); assert.equal(run(state, 'wait'), state); assert.equal(run(state, 'antibiotic', 'give'), state);
});
test('assessment mode preserves the same clinical prerequisites and responses', () => {
  const practice = interval(prepared()); const evaluation = interval(prepared('assessment'));
  assert.deepEqual(giVitals(practice), giVitals(evaluation)); assert.deepEqual(practice.flags, evaluation.flags);
});
test('tool meaning and destination change explicitly when an item is used', () => {
  const state = prepared();
  assert.equal(giToolAction('ors', state), 'drink'); assert.equal(giToolTarget('ors', state), 'patient');
  const worn = assessed(); assert.equal(giToolAction('gloves', worn), 'discard'); assert.equal(giToolTarget('gloves', worn), 'bin');
});
test('the new case is discoverable in nursing without affecting existing module assignments', () => {
  const { modulesForCareer } = loadTypeScript('src/lib/simulationCatalog.ts');
  assert.equal(modulesForCareer('enfermeria', 'infecciones gastrointestinales')[0].href, '/gastrointestinal');
  assert.ok(modulesForCareer('enfermeria', 'cuidados basicos').some(item => item.id === 'basic-care'));
});
