import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/load-ts.cjs';
const { DASHBOARD_MODULES } = loadTypeScript('src/lib/dashboardCatalog.ts');
const { SIMULATION_CAREERS, CAREER_MODULE_IDS, modulesForCareer, moduleCareers, isSimulationCareer } = loadTypeScript('src/lib/simulationCatalog.ts');

test('every existing module remains discoverable and career lists have no dangling or duplicate IDs', () => {
  const ids = new Set(DASHBOARD_MODULES.map(module => module.id));
  for (const career of SIMULATION_CAREERS) {
    const assigned = CAREER_MODULE_IDS[career.id];
    assert.equal(new Set(assigned).size, assigned.length);
    for (const id of assigned) assert.ok(ids.has(id), id);
  }
  for (const item of DASHBOARD_MODULES) assert.ok(moduleCareers(item.id).length > 0, item.id);
});
test('career organization separates nursing practice, medical interpretation and psychological support', () => {
  const ids = career => modulesForCareer(career).map(module => module.id);
  assert.ok(ids('enfermeria').includes('pae'));
  assert.ok(!ids('psicologia').includes('pae'));
  assert.ok(ids('medicina').includes('ultrasound'));
  assert.ok(ids('psicologia').includes('psychological-first-aid'));
  assert.ok(ids('psicologia').includes('mental-sim'));
  assert.equal(moduleCareers('critical-care').length, 2);
  assert.equal(moduleCareers('triage').length, 3);
});
test('search respects the selected career and supports accent-insensitive multi-word queries', () => {
  assert.deepEqual(modulesForCareer('psicologia', 'primeros psicologicos').map(module => module.id), ['psychological-first-aid']);
  assert.equal(modulesForCareer('psicologia', 'gasometria').length, 0);
  assert.ok(modulesForCareer('medicina', 'gasometria').some(module => module.id === 'gasometry'));
});
test('only the three known careers are accepted as catalog routes', () => {
  assert.equal(isSimulationCareer('enfermeria'), true);
  assert.equal(isSimulationCareer('medicina'), true);
  assert.equal(isSimulationCareer('psicologia'), true);
  assert.equal(isSimulationCareer('not-a-career'), false);
});
