/* eslint-disable @typescript-eslint/no-require-imports -- Optional external browser runtime. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.CARE_PLAYWRIGHT_MODULE || 'playwright');
const { loadTypeScript } = require('../tests/helpers/load-ts.cjs');
const { catheterPlan } = loadTypeScript('src/lib/careEquipment.ts');
const { CARE_CASES, CARE_PROCEDURES, createCareState, currentCareStep, applyCareAction, respondToCareComplication } = loadTypeScript('src/lib/basicCareSimulation.ts');
const base = process.env.CARE_BASE_URL || 'http://127.0.0.1:3100';
async function main() {
  const browser = await chromium.launch({ executablePath: process.env.CARE_CHROME_PATH, headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, hasTouch: true }); page.setDefaultTimeout(20000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', error => { errors.push(error.message); console.error('BROWSER', error.stack); });
    async function enter(scenario, assessment = false) {
      await page.goto(base + '/basic-care', { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: new RegExp(CARE_PROCEDURES[scenario.procedure].title) }).click();
      await page.locator(`[data-case="${scenario.id}"]`).click();
      if (assessment) await page.getByRole('button', { name: /^Evaluación/ }).click();
      await page.getByRole('button', { name: /Entrar al laboratorio/ }).click();
      await page.getByTestId('care-photo-scene').waitFor({ state: 'attached' });
    }
    await enter(CARE_CASES[0], true);
    assert.equal(await page.getByText(/Revisa tu decisión/).count(), 0);
    await page.locator('[data-tool="catheter"]').click();
    await page.getByTestId('confirm-catheter').click();
    await page.locator('[data-scene-target="site"]').click();
    const popup = page.getByRole('dialog', { name: 'Recomendación para este paso' });
    await popup.waitFor();
    assert.match(await popup.innerText(), /Identificación/);
    assert.match(await popup.innerText(), /Qué hacer en su lugar/);
    await page.evaluate(() => { for (let i = 0; i < 3; i++) document.querySelector('[data-scene-target="site"]').click(); });
    await page.screenshot({ path: '/tmp/basic-care-correction.png' });
    await page.getByRole('button', { name: 'Entendido, volver al paso' }).click();
    await page.getByText('1 error', { exact: true }).waitFor();
    console.log('PASS concrete question, modal reason and recommendation, blocked wrong action');
    for (const scenario of CARE_CASES) {
      console.log('CASE', scenario.id);
      await enter(scenario);
      let state = createCareState(scenario.procedure, 'practice', false, scenario.id);
      for (let i = 0; i < 50 && !state.finished; i++) {
        if (state.complication) {
          await page.getByRole('button', { name: scenario.procedure === 'iv' ? 'Detener uso, retirar y valorar el acceso' : 'Detener, retirar sonda y reevaluar', exact: true }).click();
          state = respondToCareComplication(state); continue;
        }
        const step = currentCareStep(state);
        const panel = page.getByRole('complementary', { name: 'Tarea actual' });
        if (scenario.id === 'ng-standard' && step.id === 'verify') {
          assert.equal(await page.locator('[data-tool="ph"]').count(), 0);
          assert.equal(await page.locator('[data-tool="verifyTube"] [data-material-image="verifyTube"]').count(), 1);
          assert.match(await panel.innerText(), /No hay tiras de pH.*estetoscopio/s);
          await page.screenshot({ path: '/tmp/basic-care-ng-verification.png', fullPage: true });
        }
        if (step.choices) await panel.getByRole('radio').nth(step.answer).check();
        if (step.precision) await panel.getByRole('slider').fill(String(step.precision.correct));
        const gauge = step.tool === 'catheter' ? catheterPlan(scenario.id).accepted[0] : undefined;
        if (step.tool === 'catheter') {
          await page.locator('[data-tool="catheter"]').click();
          await page.locator(`[data-gauge-option="${gauge}"]`).click();
          await page.getByTestId('confirm-catheter').click();
        }
        const tool = page.locator(`[data-tool="${step.tool}"]`);
        const zone = page.locator(`[data-scene-target="${step.target}"]`);
        if (['site', 'antisepsis', 'insert', 'central-placement', 'secure', 'clean'].includes(step.id)) await tool.dragTo(zone);
        else { await tool.click(); await zone.click(); }
        state = applyCareAction(state, { tool: step.tool, target: step.target, choice: step.answer, value: step.precision?.correct, gauge });
        if (['iv-hand', 'iv-leg', 'cvc-assisted', 'cvc-subclavian'].includes(scenario.id) && step.id === 'secure' || scenario.id === 'iv-leg' && step.id === 'leg-assess') await page.screenshot({ path: `/tmp/basic-care-case-${scenario.id}.png`, fullPage: true });
      }
      await page.getByTestId('care-result').waitFor();
      assert.equal(await page.getByRole('heading', { name: state.stopped ? 'Detenerse también es cuidar.' : 'Secuencia completada.', exact: true }).isVisible(), true);
      await page.getByText('0 errores', { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    console.log('PASS all 16 case routes, direct drops on anatomy, step sequence, incident responses and safe closures');
    await page.setViewportSize({ width: 390, height: 844 });
    await enter(CARE_CASES[0]);
    await page.getByRole('radio').nth(1).check();
    const tool = page.locator('[data-tool="identity"]');
    await tool.evaluate(element => window.scrollTo(0, element.getBoundingClientRect().top + scrollY - 450));
    const start = await tool.boundingBox();
    const target = await page.locator('[data-scene-target="patient"]').boundingBox();
    assert.ok(target && target.y > 0 && target.y < 600, 'anatomy stays reachable during touch dragging');
    const client = await page.context().newCDPSession(page);
    const x = start.x + start.width / 2, y = start.y + start.height / 2;
    const tx = target.x + target.width / 2, ty = target.y + target.height / 2;
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 12; i++) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + (tx - x) * i / 12, y: y + (ty - y) * i / 12 }] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.getByText('Tarea 2 de 11', { exact: true }).waitFor();
    await page.screenshot({ path: '/tmp/basic-care-touch-drag.png', fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    console.log('PASS real touch drag to visible image target, preserved progress, mobile layout and no runtime errors');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exit(1); });
