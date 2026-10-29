import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadTypeScript } from './helpers/load-ts.cjs';
const { BRAIN_CASES, BRAIN_PHASES, BRAIN_REGIONS, BRAIN_REGION_DETAILS, brainRegionExplanation } = loadTypeScript('src/lib/brainExplorer.ts');
const { modulesForCareer } = loadTypeScript('src/lib/simulationCatalog.ts');
test('three cases have valid, distinct networks and complete feedback at every moment', () => {
  assert.deepEqual(BRAIN_CASES.map(c => c.id), ['depression', 'anxiety', 'claustrophobia']);
  const ids = new Set(BRAIN_REGIONS.map(r => r.id));
  for (const c of BRAIN_CASES) {
    assert.ok(c.options[c.answer]); assert.ok(c.feedback.length > 80);
    for (const phase of BRAIN_PHASES) {
      assert.ok(c.phases[phase].focus.length >= 3);
      for (const id of c.phases[phase].focus) { assert.ok(ids.has(id)); assert.ok(c.links[id]); }
    }
    assert.notDeepEqual(c.phases.context.focus, c.phases.experience.focus);
  }
  assert.ok(modulesForCareer('psicologia', 'cerebro').some(m => m.href === '/brain-explorer'));
});
test('bilateral anatomical meshes contain finite vertices, valid indices and sulcal shading', () => {
  for (const side of ['left', 'right']) {
    const b = fs.readFileSync(`public/brain-explorer/cortex-${side}.bin`); const nv = b.readUInt32LE(0), nf = b.readUInt32LE(4);
    assert.ok(nv > 40000); assert.equal(b.length, 8 + nv * 16 + nf * 12);
    for (let i = 0; i < nv * 3; i++) assert.ok(Number.isFinite(b.readFloatLE(8 + i * 4)));
    for (let i = 0; i < nf * 3; i++) assert.ok(b.readUInt32LE(8 + nv * 12 + i * 4) < nv);
    const shades = Array.from({ length: nv }, (_, i) => b.readFloatLE(8 + nv * 12 + nf * 12 + i * 4));
    assert.ok(Math.max(...shades) - Math.min(...shades) > .2);
    for (let i = 0; i < nv; i++) assert.ok(side === 'left' ? b.readFloatLE(8 + i * 12) < 0 : b.readFloatLE(8 + i * 12) > 0);
  }
});
test('every case, moment and region has a contextual explanation and inactive regions never imply inactivity', () => {
  for (const c of BRAIN_CASES) for (const phase of BRAIN_PHASES) for (const r of BRAIN_REGIONS) {
    const detail = brainRegionExplanation(c.id, phase, r.id);
    assert.equal(detail.active, c.phases[phase].focus.includes(r.id));
    assert.ok(detail.why.length > 70);
    assert.ok(detail.trigger.length > 20);
    assert.ok(detail.experience.length > 20);
    if (!detail.active) assert.match(detail.why, /no significa que esté inactiva/);
    assert.ok(BRAIN_REGION_DETAILS[r.id].source.startsWith('https://www.nimh.nih.gov/'));
  }
  const anxiety = brainRegionExplanation('anxiety', 'experience', 'amygdala');
  const phobia = brainRegionExplanation('claustrophobia', 'experience', 'amygdala');
  assert.notEqual(anxiety.trigger, phobia.trigger);
  assert.notEqual(anxiety.why, phobia.why);
  assert.match(brainRegionExplanation('claustrophobia', 'support', 'prefrontal').why, /sin afirmar que su actividad aumente/);
});
