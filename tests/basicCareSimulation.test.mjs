import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/load-ts.cjs';
const { catheterPlan } = loadTypeScript('src/lib/careEquipment.ts');
const { CARE_PROCEDURES, createCareState, currentCareStep, applyCareAction, respondToCareComplication, careScore } = loadTypeScript('src/lib/basicCareSimulation.ts');
function correct(state) {
  const step = currentCareStep(state);
  return applyCareAction(state, { tool: step.tool, target: step.target, choice: step.answer, value: step.precision?.correct, gauge: step.tool === 'catheter' ? catheterPlan(state.caseId).accepted[0] : undefined });
}
function until(state, id) { for (let i = 0; i < 50 && currentCareStep(state)?.id !== id && !state.finished; i++) state = correct(state); assert.equal(currentCareStep(state)?.id, id); return state; }
for (const procedure of ['iv', 'ng', 'wound']) {
  test(`${procedure}: safe standard sequence reaches closure without errors`, () => {
    let state = createCareState(procedure);
    for (let i = 0; i < 30 && !state.finished; i++) state = correct(state);
    assert.equal(state.finished, true); assert.equal(state.stopped, false); assert.equal(state.errors, 0); assert.equal(careScore(state), 100);
    assert.equal(state.index, CARE_PROCEDURES[procedure].steps.length);
    assert.equal(applyCareAction(state, { tool: 'catheter', target: 'site' }), state);
  });
}
test('invasive actions cannot skip identity/hygiene or use the wrong anatomical zone', () => {
  const state = applyCareAction(createCareState('iv'), { tool: 'catheter', target: 'site' });
  assert.equal(state.index, 0); assert.equal(state.errors, 1); assert.equal(state.criticalErrors, 1);
  const next = applyCareAction(state, { tool: 'identity', target: 'site', choice: 1 });
  assert.equal(next.index, 0); assert.equal(next.errors, 2);
});
test('wrong choice is retained in score and history after correction', () => {
  let state = applyCareAction(createCareState('iv'), { tool: 'identity', target: 'patient', choice: 0 });
  state = correct(state);
  assert.equal(state.index, 1); assert.equal(state.errors, 1); assert.equal(state.criticalErrors, 1); assert.equal(careScore(state), 85); assert.equal(state.events[0].kind, 'error');
});
test('precision is required: missing/non-finite and excessive angle cannot advance', () => {
  const state = until(createCareState('iv'), 'insert');
  for (const value of [undefined, NaN, Infinity, 45, 5]) assert.equal(applyCareAction(state, { tool: 'catheter', target: 'site', value }).index, state.index);
  assert.equal(correct(state).index, state.index + 1);
});
test('NG measurement is individual and cannot substitute for initial placement verification', () => {
  let state = until(createCareState('ng'), 'measure');
  assert.equal(applyCareAction(state, { tool: 'measure', target: 'nose', value: 50 }).index, state.index);
  state = until(state, 'verify');
  for (const choice of [0, 2, undefined]) assert.equal(applyCareAction(state, { tool: 'verifyTube', target: 'nose', choice }).index, state.index);
  assert.equal(correct(state).index, state.index + 1);
});
test('IV infiltration persists through attempted continuation; response closes as stopped', () => {
  let state = correct(until(createCareState('iv', 'assessment', true), 'flush'));
  assert.equal(state.complication, true); assert.equal(state.finished, false);
  state = applyCareAction(state, { tool: 'dressing', target: 'site' });
  assert.equal(state.complication, true); assert.equal(state.criticalErrors, 1);
  state = respondToCareComplication(state);
  assert.equal(state.complication, false); assert.equal(state.stopped, true); assert.equal(state.finished, true);
  assert.equal(state.events.some(e => e.step === 'secure'), false);
});
test('NG cough requires withdrawal and reassessment before retry; high pH requires x-ray', () => {
  let state = correct(until(createCareState('ng', 'practice', true), 'insert'));
  assert.equal(state.complication, true);
  state = respondToCareComplication(state);
  assert.equal(currentCareStep(state).id, 'position'); assert.equal(state.recovered, true);
  state = until(state, 'verify');
  assert.equal(currentCareStep(state).answer, 1);
  const wrong = applyCareAction(state, { tool: 'verifyTube', target: 'nose', choice: 0 });
  assert.equal(wrong.index, state.index); assert.equal(wrong.criticalErrors, 1);
  state = correct(state); assert.equal(currentCareStep(state).id, 'secure');
});
test('NG without pH strips requires documented confirmation and rejects auscultation alone', () => {
  const state = until(createCareState('ng'), 'verify');
  const step = currentCareStep(state);
  assert.equal(step.tool, 'verifyTube');
  assert.match(step.instruction, /No hay tiras de pH/);
  const action = { tool: step.tool, target: step.target, choice: 2 };
  const wrong = applyCareAction(state, action);
  assert.equal(wrong.index, state.index);
  assert.equal(wrong.criticalErrors, 1);
  assert.equal(wrong.events.some(event => event.kind === 'success' && event.step === 'verify'), false);
  assert.match(explainCareError(state, action).reason, /estetoscopio/);
  assert.match(explainCareError(state, action).recommendation, /radiografía.*documentada/);
  const confirmed = correct(wrong);
  assert.equal(currentCareStep(confirmed).id, 'secure');
  assert.match(confirmed.events.at(-1).text, /Resultado simulado.*radiografía.*documentó/);
  assert.equal(confirmed.criticalErrors, 1);
});
test('NG verification is a review action, not a disposable supply', () => {
  const { SINGLE_USE_TOOLS } = loadTypeScript('src/lib/careEquipment.ts');
  assert.equal(SINGLE_USE_TOOLS.includes('verifyTube'), false);
  const state = correct(until(createCareState('ng'), 'verify'));
  assert.equal(state.equipment.units.some(unit => unit.tool === 'verifyTube' && unit.status === 'used'), false);
});
test('infection signs require escalation and never produce a routine wound success', () => {
  let state = until(createCareState('wound', 'practice', true), 'assess');
  const unsafe = applyCareAction(state, { tool: 'assess', target: 'wound', choice: 0 });
  assert.equal(unsafe.finished, false); assert.equal(unsafe.criticalErrors, 1);
  state = correct(unsafe);
  assert.equal(state.finished, true); assert.equal(state.stopped, true);
  assert.equal(state.events.some(e => e.step === 'clean'), false);
});
test('wound cleaning needs three separately applied fresh gauzes', () => {
  let state = until(createCareState('wound'), 'clean'); const index = state.index;
  state = correct(state); assert.equal(state.index, index); assert.equal(state.passes, 1);
  state = correct(state); assert.equal(state.index, index); assert.equal(state.passes, 2);
  state = correct(state); assert.equal(state.index, index + 1); assert.equal(state.passes, 0);
});
test('pause prevents both interventions and incident resolution, with no scoring side effects', () => {
  let state = { ...createCareState('ng'), paused: true }; assert.equal(correct(state), state);
  state = { ...correct(until(createCareState('ng', 'practice', true), 'insert')), paused: true };
  assert.equal(respondToCareComplication(state), state); assert.equal(correct(state), state);
});
test('catalog exposes basic care in nursing and multi-word search', () => {
  const { modulesForCareer } = loadTypeScript('src/lib/simulationCatalog.ts');
  assert.equal(modulesForCareer('enfermeria', 'cuidados basicos')[0].href, '/basic-care');
});

const { CARE_CASES, careDefinition, careCase, careQuestion, explainCareError } = loadTypeScript('src/lib/basicCareSimulation.ts');
for (const scenario of CARE_CASES) {
  test(`case ${scenario.id}: complete an explicit safe route without skipped steps`, () => {
    let state = createCareState(scenario.procedure, 'practice', false, scenario.id);
    for (let i = 0; i < 50 && !state.finished; i++) state = state.complication ? respondToCareComplication(state) : correct(state);
    assert.equal(state.finished, true, scenario.id); assert.equal(state.errors, 0, scenario.id);
    assert.equal(state.caseId, scenario.id); assert.equal(careDefinition(state).patient, scenario.patient);
    const expectedStop = ['iv-infiltration', 'iv-phlebitis', 'ng-trauma', 'wound-infection', 'cvc-infection'].includes(scenario.id);
    assert.equal(state.stopped, expectedStop, scenario.id);
  });
}
test('an adult emergency leg case never teaches routine leg insertion or forces a flush', () => {
  const state = createCareState('iv', 'practice', true, 'iv-leg');
  assert.equal(state.challenge, false);
  assert.equal(careCase(state.caseId, 'iv').anatomy, 'leg');
  assert.equal(careDefinition(state).steps.some(step => ['insert', 'flush'].includes(step.id)), false);
  const ready = until(state, 'leg-assess');
  assert.equal(applyCareAction(ready, { tool: 'assess', target: 'site', choice: 0 }).index, ready.index);
});
test('CVC placement is distinct and cannot be used on blood return alone', () => {
  let state = until(createCareState('cvc', 'assessment', false, 'cvc-assisted'), 'central-verify');
  assert.ok(careDefinition(state).steps.some(step => step.id === 'ultrasound'));
  state = applyCareAction(state, { tool: 'verifyLine', target: 'site', choice: 0 });
  assert.equal(currentCareStep(state).id, 'central-verify'); assert.equal(state.criticalErrors, 1);
  assert.match(explainCareError(state, { tool: 'verifyLine', target: 'site', choice: 0 }).reason, /retorno de sangre/);
});
test('wrong material has a specific explanation and actionable next step', () => {
  const state = until(createCareState('iv'), 'site');
  const action = { tool: 'catheter', target: 'site', choice: 0 };
  const correction = explainCareError(state, action);
  assert.match(correction.reason, /Catéter periférico/);
  assert.match(correction.recommendation, /Torniquete/);
  const next = applyCareAction(state, action);
  assert.equal(next.index, state.index); assert.match(next.events.at(-1).text, /Recomendación/);
});
test('every decision has a concrete question, and every case has unique identity and a safe default', () => {
  assert.equal(new Set(CARE_CASES.map(item => item.id)).size, CARE_CASES.length);
  for (const scenario of CARE_CASES) for (const step of careDefinition({ procedure: scenario.procedure, caseId: scenario.id }).steps) {
    if (step.choices) { assert.ok(careQuestion(step).includes('¿')); assert.ok(step.answer >= 0 && step.answer < step.choices.length); }
  }
  assert.equal(createCareState('iv', 'practice', false, 'cvc-assisted').caseId, 'iv-forearm');
});
