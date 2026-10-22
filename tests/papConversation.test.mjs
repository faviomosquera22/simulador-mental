import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/load-ts.cjs';
const { createPapRun, papMotion, papRubric, endPapPractice, tickPap } = loadTypeScript('src/lib/psychologicalFirstAid.ts');
const { performPapText, PAP_FREE_LIMIT } = loadTypeScript('src/lib/papConversation.ts');
const { papBodyPose } = loadTypeScript('components/psychological-first-aid/bodyLanguage.ts');
const { aimPapArm } = loadTypeScript('components/psychological-first-aid/armIk.ts');
import { Object3D, Vector3 } from 'three';
const start = () => ({ ...createPapRun(), status: 'running' });
const say = (run, words) => performPapText(run, words);

test('students can ask freely in any order; identity and needs are revealed without silently completing room actions', () => {
  let run = say(start(), '¿Cuántos años tienes?');
  assert.match(run.history.at(-1).reply, /28/);
  run = say(run, '¿En qué te puedo ayudar?');
  assert.match(run.history.at(-1).reply, /hermana/);
  assert.ok(run.completed.includes('needs'));
  assert.ok(!run.completed.includes('scene'));
  run = say(run, '¿Con quién te sientes segura?');
  assert.match(run.history.at(-1).reply, /Elena/);
  assert.ok(!run.completed.includes('risk'));
});
test('invalidation escalates into visible agitation and repeated boundary violations lead to withdrawal', () => {
  let run = say(start(), 'Cálmate, no es para tanto.');
  assert.equal(papMotion(run), 'agitated');
  assert.match(run.history.at(-1).reply, /no pasa nada|peor/i);
  run = say(run, 'Deja de llorar.');
  run = say(run, 'Cuéntame todo con cada detalle aunque no quieras.');
  assert.equal(papMotion(run), 'withdrawing');
  run = say(run, '¿Qué es lo que más te preocupa?');
  assert.match(run.history.at(-1).reply, /no quiero seguir respondiendo/i);
  assert.ok(!run.completed.includes('needs'));
});
test('repair needs distinct supportive interventions, retains penalties and cannot be farmed by repeated apologies', () => {
  let run = say(start(), 'Cállate, no molestes.');
  run = say(run, 'Perdón por decirte "cállate". Me equivoqué.');
  assert.equal(papMotion(run), 'tearful');
  assert.equal(run.repairProgress, 1);
  run = say(run, 'Perdón por decirte "cállate". Me equivoqué.');
  assert.equal(run.repairProgress, 1);
  run = say(run, 'No te voy a presionar. Me aparto y respeto tu espacio.');
  assert.equal(papMotion(run), 'recovering');
  assert.equal(papRubric(run).penalties, 10);
});
test('negation, quoted apologies and supportive autonomy statements are not treated as harmful instructions', () => {
  for (const words of ['No estás exagerando. Entiendo cómo te sientes.', 'No tienes que contarme nada que no quieras.', 'No te voy a obligar a hablar.', 'Perdón por decirte cálmate. No debí hacerlo.', 'No pasa nada si lloras, podemos esperar.', 'No estás loca por sentirte así.']) {
    const next = say(start(), words);
    assert.equal(next.ruptures, 0, words);
    assert.equal(papRubric(next).penalties, 0);
  }
  assert.equal(say(start(), 'Perdón, pero deja de llorar.').ruptures, 1);
});
test('asking about a trusted person does not imply a completed risk assessment', () => {
  const run = say(start(), '¿Con quién te sientes segura ahora?');
  assert.ok(run.completed.includes('supports'));
  assert.ok(!run.completed.includes('risk'));
  assert.match(run.history.at(-1).reply, /Elena/);
});
test('offering a call obtains permission; it does not call or invent completion', () => {
  let run = say(start(), '¿Quieres que llamemos a tu tía?');
  assert.ok(run.completed.includes('contact-consent'));
  assert.ok(!run.completed.includes('contact'));
  assert.match(run.history.at(-1).reply, /Todavía no la hemos llamado/);
  const deferred = performPapText(start(), 'Llamo a su tía.', 'action');
  assert.ok(!deferred.completed.includes('contact'));
});
test('unknown language is uncertainty, not clinical failure or invented knowledge', () => {
  const before = start();
  const after = say(before, '¿Cuál es tu película favorita?');
  assert.equal(after.history.at(-1).understood, false);
  assert.equal(after.history.at(-1).harmful, false);
  assert.equal(after.trust, before.trust);
  assert.equal(after.distress, before.distress);
  assert.deepEqual(after.completed, before.completed);
});
test('free conversation cannot resolve a new medical warning; only actual requested help and handoff can', () => {
  let run = tickPap({ ...start(), variant: 'medical' }, 90);
  run = say(run, 'Estoy aquí contigo. Entiendo que tienes miedo.');
  assert.match(run.history.at(-1).reply, /sigue doliendo el pecho/);
  assert.ok(!run.completed.includes('handoff'));
  assert.equal(run.repairProgress, 0);
  run = performPapText(run, 'Solicito valoración médica urgente.', 'action');
  assert.ok(run.completed.includes('emergency'));
  run = performPapText(run, 'Entrego el caso al equipo médico.', 'action');
  assert.ok(run.completed.includes('handoff'));
});
test('free observation actions, pause, length limits and incomplete endings are handled explicitly', () => {
  let run = performPapText(start(), 'Observo el entorno y si la salida está libre.', 'action');
  assert.ok(run.completed.includes('scene'));
  run = performPapText(run, 'Observo la postura de Valeria.', 'action');
  assert.ok(run.completed.includes('observe'));
  const paused = { ...run, status: 'paused' };
  assert.equal(say(paused, 'Hola'), paused);
  assert.equal(say(run, '  '), run);
  const limited = say(run, 'x'.repeat(2000));
  assert.equal(limited.history.at(-1).words.length, PAP_FREE_LIMIT);
  const ended = endPapPractice(run);
  assert.equal(ended.status, 'finished'); assert.equal(ended.closure, 'incomplete');
  assert.equal(say(ended, 'Hola'), ended);
});
test('accepted free reassessment keeps a fresh chronology without granting duplicate scoring credit', () => {
  let run = say(start(), '¿Cómo te sientes ahora?');
  const before = papRubric(run).score;
  run = say(run, '¿Qué ha cambiado, cómo te encuentras ahora?');
  assert.equal(run.history.at(-1).id, 'reassess');
  assert.equal(run.completed.filter(id => id === 'reassess').length, 1);
  assert.equal(papRubric(run).score, before);
});
test('body language has distinct gestures without accelerating agitated pacing; offsets are finite and bounded', () => {
  const rest = papBodyPose('listening', 1, 1);
  const angry = papBodyPose('agitated', 1, 1);
  const crying = papBodyPose('tearful', 1, 1);
  assert.notDeepEqual(angry, rest); assert.notDeepEqual(crying, angry);
  assert.equal(angry.walkSpeed, rest.walkSpeed);
  assert.ok(Math.abs(crying.elbowR) > Math.abs(rest.elbowR));
  for (const motion of ['agitated', 'withdrawing', 'tearful', 'recovering']) for (let i = 0; i < 60; i++) for (const value of Object.values(papBodyPose(motion, i, .5))) assert.ok(Number.isFinite(value) && Math.abs(value) <= 2);
});
test('arm gestures reach their world-space target without changing limb lengths, including rotated parents', () => {
  const root = new Object3D(); root.rotation.y = .9;
  const upper = new Object3D(); upper.position.set(.2, 1.4, 0); root.add(upper);
  const lower = new Object3D(); lower.position.set(.3, 0, 0); upper.add(lower);
  const hand = new Object3D(); hand.position.set(.25, 0, 0); lower.add(hand);
  root.updateMatrixWorld(true);
  const target = root.localToWorld(new Vector3(.35, 1.55, .25));
  aimPapArm(upper, lower, hand, target, new Vector3(1, -.1, .5), 1);
  assert.ok(hand.getWorldPosition(new Vector3()).distanceTo(target) < 1e-5);
  assert.ok(Math.abs(upper.getWorldPosition(new Vector3()).distanceTo(lower.getWorldPosition(new Vector3())) - .3) < 1e-5);
  const before = hand.getWorldPosition(new Vector3());
  aimPapArm(upper, lower, hand, new Vector3(), new Vector3(1, 0, 0), 0);
  assert.ok(hand.getWorldPosition(new Vector3()).distanceTo(before) < 1e-8);
});
