/* eslint-disable @typescript-eslint/no-require-imports -- Optional external Playwright runtime. */
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require(process.env.PAP_PLAYWRIGHT_MODULE || 'playwright');
const { loadTypeScript } = require('../tests/helpers/load-ts.cjs');
const { CASE_QUESTIONS } = loadTypeScript('src/lib/clinicalEducation.ts');
const base = process.env.PAP_BASE_URL || 'http://127.0.0.1:3100';
const output = path.resolve('docs');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PAP_CHROME_PATH, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const seen = [];
    async function answer(caseId, { inspect = false, wrong = false, stage = 'during' } = {}) {
      const modal = page.locator('.mandatory-question-modal[open]');
      await modal.waitFor({ state: 'visible' });
      const prompt = await modal.locator('.case-question h3').innerText();
      const q = CASE_QUESTIONS.find(q => q.caseId === caseId && q.prompt === prompt);
      assert.ok(q, prompt);assert.equal(q.stage, stage);assert.ok(!seen.includes(q.id));seen.push(q.id);
      assert.equal(await modal.getByRole('radio').count(), 4);
      assert.equal(await modal.locator('.question-explanation').count(), 0);
      assert.equal(await modal.getByRole('button', { name: 'Confirmar respuesta', exact: true }).isDisabled(), true);
      if (inspect) {
        await page.keyboard.press('Escape');assert.ok(await modal.isVisible());
        const time = page.locator(caseId.startsWith('obs-') ? '[aria-label="Tiempo simulado"]' : '.room-session-controls time');
        const before = await time.innerText();await page.waitForTimeout(1200);assert.equal(await time.innerText(), before, 'questions must pause the case');
        const heights = await modal.locator('fieldset label').evaluateAll(labels => labels.map(label => label.getBoundingClientRect().height));
        assert.ok(Math.max(...heights)-Math.min(...heights)<1, `${caseId}: equal-height options ${heights}`);
        await page.screenshot({ path: path.join(output, `${caseId}-question-desktop.png`) });
        await page.setViewportSize({ width: 390, height: 844 });
        const mobileHeights = await modal.locator('fieldset label').evaluateAll(labels => labels.map(label => label.getBoundingClientRect().height));
        assert.ok(Math.max(...mobileHeights)-Math.min(...mobileHeights)<1, `${caseId}: mobile equal-height options ${mobileHeights}`);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.screenshot({ path: path.join(output, `${caseId}-question-mobile.png`) });
      }
      const optionId = wrong ? q.options.find(o => o.id !== q.correct).id : q.correct;
      await modal.locator(`input[value="${optionId}"]`).check();
      assert.equal(await modal.locator('.question-explanation').count(), 0, 'selecting does not reveal the answer');
      await modal.getByRole('button', { name: 'Confirmar respuesta', exact: true }).click();
      assert.match(await modal.locator('.question-explanation strong').innerText(), wrong ? /Revisa/ : /Respuesta correcta/);
      assert.equal(await modal.getByRole('radio').first().isDisabled(), true);
      assert.match(await modal.locator('.question-points').innerText(),wrong ? /−5/ : /\+5/);
      assert.equal(await modal.locator('.question-explanation a').getAttribute('href'), loadTypeScript('src/lib/clinicalEducation.ts').CLINICAL_SOURCES[q.source].url);
      await modal.getByRole('button', { name: stage === 'during' ? 'Continuar el caso' : 'Continuar evaluación', exact: true }).click();
      if (inspect) await page.setViewportSize({ width: 1440, height: 1050 });
    }

    await page.goto(base + '/critical-care');
    await page.getByRole('button').filter({ hasText: 'Crisis asmática grave' }).click();
    await page.getByRole('button', { name: 'Iniciar simulación' }).click();
    await page.getByRole('button', { name: 'Monitorizar', exact: true }).click();
    await page.getByRole('switch', { name: 'Saturación de oxígeno', exact: true }).check();
    assert.equal(await page.locator('.mandatory-question-modal[open]').count(), 0, 'monitoring cannot trigger a clinical question');
    await page.getByRole('button', { name: 'Llamar', exact: true }).click();
    await page.getByRole('button', { name: 'Activar equipo de urgencias', exact: true }).click();
    await page.getByRole('button', { name: 'Intervención', exact: true }).click();
    await page.getByRole('button', { name: 'Obtener acceso venoso', exact: true }).click();
    await page.getByRole('button', { name: 'Colocar en posición de confort', exact: true }).click();
    await answer('asthma', { inspect: true, wrong: true });
    await page.getByRole('button', { name: 'Oxígeno / ventilador', exact: true }).click();
    await page.getByRole('button', { name: 'Conectar / aplicar oxígeno', exact: true }).click();
    assert.equal(await page.locator('.mandatory-question-modal[open]').count(), 0, 'answered questions cannot repeat');
    await page.getByRole('button', { name: 'Pruebas', exact: true }).click();
    await page.getByRole('button', { name: /Solicitar Gasometría arterial/ }).click();
    await page.getByRole('button', { name: /Solicitar Potasio y electrolitos/ }).click();
    await answer('asthma');
    await page.getByRole('button', { name: 'Finalizar', exact: true }).click();
    await page.locator('.immersive-modal[open]').getByRole('button', { name: 'Finalizar y revisar', exact: true }).click();
    await answer('asthma', { stage: 'final' });await answer('asthma', { stage: 'final' });
    assert.equal(seen.filter(id => id.startsWith('asthma:')).length, 4);

    await page.goto(base + '/clinical-room');
    await page.getByRole('button', { name: 'Cambiar caso ↗', exact: true }).click();
    await page.getByRole('button').filter({ has: page.getByText('Hemorragia posparto · traje antichoque TANN', { exact: true }) }).click();
    await page.getByRole('button', { name: 'Preparar escenario →', exact: true }).click();
    await page.getByRole('button', { name: 'Iniciar simulación ▷', exact: true }).click();
    await page.getByRole('button', { name: '✥ Claves y TANN', exact: true }).click();
    for (const id of ['consent', 'key-roja', 'tann-assess']) await page.locator(`[data-tann-action="${id}"]`).click();
    await answer('obs-01', { inspect: true });
    for (const id of ['tann-prepare', 'tann-1', 'tann-2']) await page.locator(`[data-tann-action="${id}"]`).click();
    await answer('obs-01', { wrong: true });
    for (const id of ['tann-3', 'tann-4', 'tann-5', 'tann-6', 'tann']) await page.locator(`[data-tann-action="${id}"]`).click();
    assert.equal(await page.locator('.tann-segment-overlay').getAttribute('data-verified'), 'true');
    await page.getByRole('button', { name: 'Finalizar', exact: true }).click();
    await page.getByRole('button', { name: 'Finalizar y ver evaluación →', exact: true }).click();
    await answer('obs-01', { stage: 'final' });await answer('obs-01', { stage: 'final' });
    assert.equal(seen.filter(id => id.startsWith('obs-01:')).length, 4);
    assert.deepEqual(errors, []);
    console.log('PASS: both simulators, eight case questions, progress triggers, pause, scoring feedback, answer locking, desktop/mobile equal-height choices, closing flow and TANN continuation.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
