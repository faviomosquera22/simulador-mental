import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/load-ts.cjs';
const { papReplyParts, papSpokenReply, cleanPapSpeech } = loadTypeScript('src/lib/papPresentation.ts');
const { createPapRun, tickPap } = loadTypeScript('src/lib/psychologicalFirstAid.ts');
const { performPapText } = loadTypeScript('src/lib/papConversation.ts');
const { papBehavior, papGesture } = loadTypeScript('components/psychological-first-aid/bodyLanguage.ts');
const start = () => ({ ...createPapRun(), status: 'running' });

test('patient dialogue and nonverbal directions retain chronological order without stage notation in speech', () => {
  const entry = { id: 'free-repair', reply: '“[Baja la mirada.] Gracias. [Hace una pausa.] Podemos seguir.”' };
  assert.deepEqual(papReplyParts(entry), [{ kind: 'scene', text: 'Baja la mirada.' }, { kind: 'speech', text: 'Gracias.' }, { kind: 'scene', text: 'Hace una pausa.' }, { kind: 'speech', text: 'Podemos seguir.' }]);
  assert.equal(papSpokenReply(entry), 'Gracias. Podemos seguir.');
  assert.equal(cleanPapSpeech('No me digas "cálmate".'), 'No me digas "cálmate".');
});
test('scene observations and confirmed handoffs are never spoken by the avatar', () => {
  assert.equal(papSpokenReply({ id: 'scene', reply: 'La salida está despejada.' }), '');
  assert.equal(papSpokenReply({ id: 'handoff', reply: '[El equipo recibe el caso.]' }), '');
  assert.equal(papSpokenReply({ id: 'event', reply: '[Se oye una sirena.] ¿Qué pasó?' }), '¿Qué pasó?');
  assert.equal(papSpokenReply({ id: 'free-action-deferred', reply: 'La acción queda pendiente.' }), '');
});
test('sitting is an accepted preference, not a hidden treatment or improvement in the rubric', () => {
  const before = start();
  const seated = performPapText(before, '¿Te gustaría sentarte un momento?');
  assert.equal(seated.posture, 'seated');
  assert.equal(seated.trust, before.trust);
  assert.equal(seated.distress, before.distress);
  assert.deepEqual(seated.completed, []);
  assert.equal(performPapText(seated, 'No necesitas levantarte.').posture, 'seated');
  const standing = performPapText(seated, '¿Prefieres levantarte?');
  assert.equal(standing.posture, 'standing');
});
test('medical urgency and refusal prevent automatic seating, while pause prevents any submitted action', () => {
  const medical = tickPap({ ...start(), variant: 'medical' }, 90);
  assert.notEqual(performPapText(medical, '¿Quieres sentarte?').posture, 'seated');
  const withdrawn = { ...start(), reaction: 'withdrawn', ruptures: 3 };
  assert.notEqual(performPapText(withdrawn, '¿Quieres sentarte?').posture, 'seated');
  const paused = { ...start(), status: 'paused' };
  assert.equal(performPapText(paused, '¿Quieres sentarte?'), paused);
});
test('movement alternates walking and pauses and stops while engaged or seated', () => {
  assert.equal(papBehavior('pacing', 4, 4, false, false).walking, true);
  assert.equal(papBehavior('pacing', 11, 4, false, false).walking, false);
  assert.equal(papBehavior('pacing', 4, 4, true, false).walking, false);
  assert.equal(papBehavior('agitated', 4, 4, false, true).walking, false);
  assert.notEqual(papBehavior('listening', 11, 4, false, false).glance, 0);
});
test('anger has a bounded protest sequence followed by tension, without repeated walking', () => {
  const names = [0, 2, 5, 9, 80].map(age => papGesture('agitated', age, age, false, false).name);
  assert.deepEqual(names, ['marca-un-limite', 'protesta', 'retira-las-manos', 'tension', 'tension']);
  for (let time = 0; time < 90; time += .5) assert.equal(papBehavior('agitated', time, time, false, false).walking, false);
});
test('body cues remain within reach, settle after crying and retain seated listening', () => {
  assert.equal(papGesture('tearful', 2, 2, false, false).name, 'se-limpia-el-rostro');
  assert.equal(papGesture('tearful', 8, 8, false, false).name, 'llanto-con-pausas');
  assert.equal(papGesture('listening', 8, 8, true, true).left[1], .94);
  for (const motion of ['agitated', 'withdrawing', 'tearful', 'guarded', 'recovering', 'pacing', 'listening']) {
    for (const age of [0, 2, 5, 9, 80]) {
      const gesture = papGesture(motion, age, age, false, false);
      for (const hand of [gesture.left, gesture.right]) {
        assert.ok(hand.every(Number.isFinite));
        assert.ok(hand[0] <= .36 && hand[1] <= 1.43 && hand[2] <= .38);
      }
    }
  }
});
