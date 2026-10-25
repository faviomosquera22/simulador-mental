import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/load-ts.cjs';
const { CATHETER_GAUGES, createEquipmentSession, seedEquipmentSession, selectEquipment, heldEquipment, releaseEquipment, consumeEquipment, discardEquipment, equipmentError, catheterPlan } = loadTypeScript('src/lib/careEquipment.ts');
const { createCareState, currentCareStep, applyCareAction, respondToCareComplication } = loadTypeScript('src/lib/basicCareSimulation.ts');
function correct(state) { const step = currentCareStep(state); return applyCareAction(state, { tool: step.tool, target: step.target, choice: step.answer, value: step.precision?.correct, gauge: step.tool === 'catheter' ? catheterPlan(state.caseId).accepted[0] : undefined }); }
function until(state, id) { for (let i = 0; i < 30 && currentCareStep(state)?.id !== id; i++) state = correct(state); assert.equal(currentCareStep(state)?.id, id); return state; }
test('only the six standard peripheral gauge choices are available, with distinct color codes', () => {
  assert.deepEqual(Array.from(CATHETER_GAUGES, value => value.gauge), [14, 16, 18, 20, 22, 24]);
  assert.equal(new Set(CATHETER_GAUGES.map(value => value.color)).size, 6);
  for (const gauge of [undefined, 15, 23, 25, NaN]) assert.ok(selectEquipment(createEquipmentSession(), 'catheter', gauge).error);
});
test('preparing a catheter requires a gauge and creates a visibly held unit without using it', () => {
  const result = selectEquipment(createEquipmentSession(), 'catheter', 20);
  const held = heldEquipment(result.session);
  assert.equal(held.gauge, 20); assert.equal(held.status, 'selected'); assert.equal(result.session.units.length, 1);
  assert.equal(result.session.units.some(unit => unit.status === 'installed'), false);
});
test('releasing without use preserves a fresh unit and does not manufacture duplicate stock', () => {
  let session = selectEquipment(createEquipmentSession(), 'catheter', 22).session;
  const id = heldEquipment(session).id; session = releaseEquipment(session);
  assert.equal(heldEquipment(session), undefined); assert.equal(session.units[0].status, 'ready');
  session = selectEquipment(session, 'catheter', 22).session;
  assert.equal(heldEquipment(session).id, id); assert.equal(session.units.length, 1);
});
test('insertion leaves the flexible catheter installed and generates a separate used mandril', () => {
  const prepared = selectEquipment(createEquipmentSession(), 'catheter', 20).session;
  const unit = heldEquipment(prepared);
  const session = consumeEquipment(prepared, { tool: 'catheter', target: 'site', itemId: unit.id, gauge: 20 }, 'insert');
  const installed = session.units.find(item => item.tool === 'catheter');
  const mandril = session.units.find(item => item.parentId === installed.id);
  assert.equal(installed.status, 'installed'); assert.equal(installed.target, 'site'); assert.equal(installed.gauge, 20);
  assert.equal(mandril.status, 'used'); assert.equal(mandril.tool, 'sharps'); assert.equal(heldEquipment(session), undefined);
});
test('an installed catheter cannot be discarded or selected for another insertion', () => {
  let session = selectEquipment(createEquipmentSession(), 'catheter', 20).session;
  const unit = heldEquipment(session); session = consumeEquipment(session, { tool: 'catheter', target: 'site', itemId: unit.id, gauge: 20 }, 'insert');
  assert.ok(discardEquipment(session, unit.id).error);
  assert.ok(selectEquipment(session, 'catheter', 20, unit.id).error);
  assert.ok(equipmentError(session, { tool: 'catheter', itemId: unit.id, gauge: 20 }));
});
test('discarding the mandril cannot remove the installed flexible catheter', () => {
  let session = consumeEquipment(createEquipmentSession(), { tool: 'catheter', target: 'site', gauge: 20 }, 'insert');
  session = consumeEquipment(session, { tool: 'sharps', target: 'bin' }, 'sharps');
  assert.equal(session.units.find(unit => unit.tool === 'catheter').status, 'installed');
  assert.equal(session.units.find(unit => unit.parentId).status, 'disposed');
});
test('a used gauze is not reusable; selecting another creates a distinct unit', () => {
  let session = selectEquipment(createEquipmentSession(), 'gauze').session;
  const id = heldEquipment(session).id;
  session = consumeEquipment(session, { tool: 'gauze', target: 'wound', itemId: id }, 'clean');
  assert.equal(session.units.find(unit => unit.id === id).status, 'used');
  assert.ok(selectEquipment(session, 'gauze', undefined, id).error);
  session = selectEquipment(session, 'gauze').session; assert.notEqual(heldEquipment(session).id, id);
  assert.equal(session.units.length, 2);
});
test('manual discard is final and a second discard or forged use is rejected', () => {
  let session = consumeEquipment(createEquipmentSession(), { tool: 'saline', target: 'site' }, 'flush');
  const id = session.units[0].id; session = discardEquipment(session, id).session;
  assert.equal(session.units[0].status, 'disposed');
  assert.ok(discardEquipment(session, id).error); assert.ok(equipmentError(session, { tool: 'saline', itemId: id }));
});
test('the case has an explicit gauge plan; a 14G is not silently accepted for routine hydration', () => {
  const state = until(createCareState('iv'), 'insert');
  const wrong = applyCareAction(state, { tool: 'catheter', target: 'site', value: 20, gauge: 14 });
  assert.equal(wrong.index, state.index); assert.equal(wrong.errors, 1);
  assert.equal(wrong.equipment.units.some(unit => unit.status === 'installed'), false);
  assert.match(wrong.events.at(-1).text, /20 o 22/);
  const good = applyCareAction(state, { tool: 'catheter', target: 'site', value: 20, gauge: 20 });
  assert.equal(good.index, state.index + 1);
});
test('missing gauge, mismatched gauge and forged used-unit IDs cannot bypass validation', () => {
  let state = until(createCareState('iv'), 'insert');
  assert.equal(applyCareAction(state, { tool: 'catheter', target: 'site', value: 20 }).index, state.index);
  const selected = selectEquipment(state.equipment, 'catheter', 20); state = { ...state, equipment: selected.session };
  assert.equal(applyCareAction(state, { tool: 'catheter', target: 'site', value: 20, gauge: 22, itemId: heldEquipment(state.equipment).id }).index, state.index);
  assert.equal(applyCareAction(state, { tool: 'catheter', target: 'site', value: 20, gauge: 20, itemId: 'invented' }).index, state.index);
});
test('infiltration removes the catheter from installed inventory and keeps it unavailable for reuse', () => {
  let state = until(createCareState('iv', 'practice', true), 'flush'); state = correct(state);
  assert.equal(state.complication, true); state = respondToCareComplication(state);
  const catheter = state.equipment.units.find(unit => unit.tool === 'catheter');
  assert.equal(catheter.status, 'used'); assert.ok(selectEquipment(state.equipment, 'catheter', catheter.gauge, catheter.id).error);
});
test('a failed NG attempt consumes that tube and the successful attempt needs another unit', () => {
  let state = until(createCareState('ng', 'practice', true), 'insert'); state = correct(state);
  assert.equal(state.equipment.units.find(unit => unit.tool === 'tube').status, 'used');
  state = respondToCareComplication(state); state = until(state, 'insert'); state = correct(state);
  const tubes = state.equipment.units.filter(unit => unit.tool === 'tube'); assert.equal(tubes.length, 2);
  assert.equal(tubes.filter(unit => unit.status === 'installed').length, 1);
});
test('pre-existing lines and dressings are seeded truthfully and wound removal changes only the dressing', () => {
  const cvc = seedEquipmentSession('cvc-jugular'); assert.equal(cvc.units.filter(unit => unit.status === 'installed').length, 2);
  const after = consumeEquipment(cvc, { tool: 'remove', target: 'site' }, 'remove');
  assert.equal(after.units.find(unit => unit.tool === 'cvc').status, 'installed');
  assert.equal(after.units.find(unit => unit.tool === 'dressing').status, 'used');
  assert.equal(seedEquipmentSession('cvc-assisted').units.length, 0);
});
test('reset clears held/used/disposed session history, and pause freezes clinical material use', () => {
  const state = until(createCareState('iv'), 'insert');
  assert.equal(applyCareAction({ ...state, paused: true }, { tool: 'catheter', target: 'site', value: 20, gauge: 20 }).index, state.index);
  const reset = createCareState('iv'); assert.equal(reset.equipment.units.length, 0); assert.equal(reset.equipment.selectedId, undefined);
});
