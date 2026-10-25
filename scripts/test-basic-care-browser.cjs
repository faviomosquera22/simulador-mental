/* eslint-disable @typescript-eslint/no-require-imports -- Optional external browser runtime. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.CARE_PLAYWRIGHT_MODULE || 'playwright');
const { loadTypeScript } = require('../tests/helpers/load-ts.cjs');
const { CARE_PROCEDURES } = loadTypeScript('src/lib/basicCareSimulation.ts');
const base = process.env.CARE_BASE_URL || 'http://127.0.0.1:3100';
async function main() {
  const browser = await chromium.launch({ executablePath: process.env.CARE_CHROME_PATH, headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, acceptDownloads: true });
    page.setDefaultTimeout(20000);
    const errors = []; page.on('pageerror', e => { errors.push(e.message); console.error('BROWSER ERROR', e.message); });
    const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.goto(base + '/simulation-hub/enfermeria', { waitUntil: 'networkidle' });
    await page.locator('[data-module="basic-care"]').click();
    await page.getByRole('heading', { name: /Cuidados básicos/ }).waitFor();
    await page.screenshot({ path: '/tmp/basic-care-landing.png', fullPage: true });
    await noOverflow();
    async function enter(procedure, challenge = false, assessment = false) {
      console.log('Entering', procedure, challenge ? 'incident' : 'standard');
      await page.goto(base + '/basic-care', { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: new RegExp(CARE_PROCEDURES[procedure].title) }).click();
      if (challenge) await page.getByRole('checkbox', { name: /Incluir un incidente/ }).check();
      if (assessment) await page.getByRole('button', { name: /^Evaluación/ }).click();
      await page.getByRole('button', { name: /Entrar al laboratorio/ }).click();
      await page.getByTestId('care-photo-scene').waitFor({ state: 'attached' });
      assert.equal(await page.getByTestId('care-photo-scene').count(), 1);
    }
    async function perform(step, choice = step.answer, drag = false) {
      const panel = page.getByRole('complementary', { name: 'Tarea actual' });
      if (step.choices) await panel.getByRole('radio').nth(choice).check();
      if (step.precision) await panel.getByRole('slider').fill(String(step.precision.correct));
      if (step.tool === 'catheter') { await page.locator('[data-tool="catheter"]').click(); await page.getByTestId('confirm-catheter').click(); }
      const tool = page.locator(`[data-tool="${step.tool}"]`);
      const target = page.locator(`[data-target="${step.target}"]`);
      if (drag) await tool.dragTo(target);
      else { await tool.click(); await target.click(); }
    }
    for (const procedure of ['iv', 'ng', 'wound']) {
      await enter(procedure);
      await page.getByRole('button', { name: 'Pausar', exact: true }).click();
      assert.equal(await page.locator('[data-tool="identity"]').isDisabled(), true);
      await page.getByRole('button', { name: 'Reanudar práctica', exact: true }).click();
      await page.getByRole('button', { name: 'Ver bandeja completa', exact: true }).click();
      await page.locator('[data-tool="catheter"], [data-tool="tube"], [data-tool="dressing"]').first().click();
      if (await page.getByRole('dialog', { name: 'Preparar catéter periférico' }).isVisible()) await page.getByTestId('confirm-catheter').click();
      await page.locator(`[data-target="${CARE_PROCEDURES[procedure].target}"]`).click();
      await page.getByText('1 error', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Entendido, volver al paso', exact: true }).click();
      for (const step of CARE_PROCEDURES[procedure].steps) {
        if (step.id === 'insert' || step.id === 'clean') {
          await page.screenshot({ path: `/tmp/basic-care-${procedure}-desktop.png`, fullPage: true });
        }
        for (let i = 0; i < (step.repeats || 1); i++) await perform(step, step.answer, step.id === 'hygiene');
      }
      await page.getByTestId('care-result').waitFor();
      await page.getByRole('heading', { name: 'Secuencia completada.', exact: true }).waitFor();
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: /Descargar bitácora/ }).click();
      const download = await downloadPromise; assert.equal(download.suggestedFilename(), `practica-cuidados-${procedure}.txt`);
      const result = await page.getByTestId('care-result').innerText();
      assert.ok(result.includes(procedure === 'wound' ? '95' : '85'), result);
      await noOverflow();
    }
    console.log('PASS standard IV/NG/wound completion, unsafe sequence penalty, drag/drop, pause, fresh gauzes and download');
    for (const procedure of ['iv', 'ng', 'wound']) {
      await enter(procedure, true);
      let retried = false;
      for (let i = 0; i < CARE_PROCEDURES[procedure].steps.length; i++) {
        const step = CARE_PROCEDURES[procedure].steps[i];
        const choice = procedure === 'ng' && step.id === 'verify' || procedure === 'wound' && step.id === 'assess' ? 1 : step.answer;
        for (let j = 0; j < (step.repeats || 1); j++) await perform(step, choice);
        if (procedure === 'iv' && step.id === 'flush') {
          await page.getByRole('heading', { name: 'Detén el procedimiento.' }).waitFor();
          await page.screenshot({ path: '/tmp/basic-care-incident.png', fullPage: true });
          await page.getByRole('button', { name: 'Detener uso, retirar y valorar el acceso' }).click();
          break;
        }
        if (procedure === 'ng' && step.id === 'insert' && !retried) {
          await page.getByRole('button', { name: 'Detener, retirar sonda y reevaluar' }).click();
          retried = true; i = 3;
        }
        if (procedure === 'wound' && step.id === 'assess') break;
      }
      await page.getByTestId('care-result').waitFor();
      if (procedure !== 'ng') await page.getByRole('heading', { name: 'Detenerse también es cuidar.' }).waitFor();
    }
    console.log('PASS IV incident safety closure, NG withdrawal/retry and high-pH x-ray branch, wound infection escalation');
    await enter('iv', false, true);
    assert.equal(await page.getByText('PISTA DE MATERIAL').count(), 0);
    await perform(CARE_PROCEDURES.iv.steps[0]);
    await page.getByText('Acción registrada. Continúa con la siguiente tarea.').waitFor();
    assert.equal(await page.getByText(/Se verificaron dos identificadores/).count(), 0);
    await page.getByRole('button', { name: 'Cambiar estación' }).click();
    await page.getByRole('button', { name: 'Seguir practicando' }).click();
    await page.getByText('Tarea 2 de 11', { exact: true }).waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await enter('wound');
    await page.getByRole('button', { name: 'Activar animación' }).waitFor();
    await noOverflow();
    const step = CARE_PROCEDURES.wound.steps[0];
    await page.getByRole('complementary', { name: 'Tarea actual' }).getByRole('radio').nth(step.answer).check();
    await page.locator(`[data-tool="${step.tool}"]`).focus(); await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Ver paciente', exact: true }).click();
    await page.locator(`[data-target="${step.target}"]`).focus(); await page.keyboard.press('Enter');
    await page.getByText('Tarea 2 de 11', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Paso y materiales', exact: true }).click();
    await page.screenshot({ path: '/tmp/basic-care-mobile.png', fullPage: true });
    for (const procedure of ['iv', 'ng']) { await enter(procedure); await noOverflow(); }
    assert.deepEqual(errors, []);
    console.log('PASS assessment hints hidden, cancel navigation preserves session, keyboard application, reduced motion, 390px layout, WebGL rendering and no runtime errors');
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
