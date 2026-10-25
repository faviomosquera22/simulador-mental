/* eslint-disable @typescript-eslint/no-require-imports -- Optional external browser runtime. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.CARE_PLAYWRIGHT_MODULE || 'playwright');
const { loadTypeScript } = require('../tests/helpers/load-ts.cjs');
const { CARE_PROCEDURES } = loadTypeScript('src/lib/basicCareSimulation.ts');
const base = process.env.CARE_BASE_URL || 'http://127.0.0.1:3100';
async function main() {
  const browser = await chromium.launch({ executablePath: process.env.CARE_CHROME_PATH, headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, hasTouch: true }); page.setDefaultTimeout(20000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors = [], missing = [];
    page.on('pageerror', error => { errors.push(error.message); console.error(error.stack); });
    page.on('response', response => { if (response.url().includes('/basic-care/realistic/') && response.status() >= 400) missing.push(response.url()); });
    await page.goto(base + '/basic-care', { waitUntil: 'networkidle' });
    await page.screenshot({ path: '/tmp/care-realistic-home.png', fullPage: true });
    await page.getByRole('button', { name: /Entrar al laboratorio/ }).click();
    await page.getByTestId('care-photo-scene').waitFor();
    async function prepare(tool, gauge) {
      await page.locator(`[data-tool="${tool}"]`).click();
      if (tool === 'catheter' && await page.getByRole('dialog', { name: 'Preparar catéter periférico' }).isVisible()) {
        if (gauge) await page.locator(`[data-gauge-option="${gauge}"]`).click();
        await page.getByTestId('confirm-catheter').click();
      }
    }
    async function perform(step, gauge = 20, drag = false) {
      const panel = page.getByRole('complementary', { name: 'Tarea actual' });
      if (step.choices) await panel.getByRole('radio').nth(step.answer).check();
      if (step.precision) await panel.getByRole('slider').fill(String(step.precision.correct));
      await prepare(step.tool, gauge);
      if (drag) await page.locator(`[data-tool="${step.tool}"]`).dragTo(page.locator(`[data-scene-target="${step.target}"]`));
      else await page.getByTestId('apply-material').click();
    }
    for (const step of CARE_PROCEDURES.iv.steps.slice(0, 6)) await perform(step);
    await page.getByRole('slider').fill('20');
    await page.locator('[data-tool="catheter"]').click();
    const picker = page.getByRole('dialog', { name: 'Preparar catéter periférico' }); await picker.waitFor();
    assert.equal(await picker.locator('[data-gauge-option]').count(), 6);
    assert.equal(await page.getByTestId('held-equipment').getAttribute('data-held-tool'), 'none');
    await page.locator('[data-gauge-option="14"]').click();
    await page.screenshot({ path: '/tmp/care-realistic-gauge-picker.png' });
    await page.getByTestId('confirm-catheter').click();
    assert.equal(await page.getByTestId('held-equipment').getAttribute('data-held-gauge'), '14');
    await page.getByTestId('apply-material').click();
    await page.getByRole('dialog', { name: 'Recomendación para este paso' }).waitFor();
    assert.match(await page.getByRole('dialog', { name: 'Recomendación para este paso' }).innerText(), /20 o 22/);
    await page.getByRole('button', { name: 'Entendido, volver al paso' }).click();
    assert.equal(await page.locator('[data-testid="installed-catheter"]').count(), 0);
    await page.getByRole('button', { name: 'Cambiar calibre', exact: true }).click();
    await page.locator('[data-gauge-option="20"]').click(); await page.getByTestId('confirm-catheter').click();
    const held = page.getByTestId('held-equipment'); assert.equal(await held.getAttribute('data-held-gauge'), '20');
    await page.screenshot({ path: '/tmp/care-realistic-equipped.png', fullPage: true });
    await page.locator('[data-tool="catheter"]').dragTo(page.locator('[data-scene-target="site"]'));
    await page.getByTestId('installed-catheter').waitFor();
    assert.equal(await page.getByTestId('installed-catheter').getAttribute('data-gauge'), '20');
    await page.getByTestId('mandril-pending').waitFor();
    await page.screenshot({ path: '/tmp/care-realistic-installed.png', fullPage: true });
    await page.getByRole('button', { name: 'Descartar mandril →', exact: true }).click();
    await page.getByText('Tarea 9 de 11', { exact: true }).waitFor();
    await page.locator('[data-unit-id^="mandril-"][data-unit-status="disposed"]').waitFor({ state: 'attached' });
    assert.equal(await page.getByTestId('installed-catheter').count(), 1, 'flexible catheter remains in patient after sharp disposal');
    await page.screenshot({ path: '/tmp/care-realistic-disposed.png', fullPage: true });
    for (const step of CARE_PROCEDURES.iv.steps.slice(8)) await perform(step);
    await page.getByTestId('care-result').waitFor();
    assert.equal(await page.locator('[data-unit-status="used"]').count(), 0, 'explicit closing action includes remaining waste');
    assert.equal(await page.getByTestId('installed-catheter').count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    console.log('PASS real photographic assets, six gauge choices, explicit confirmation, wrong-gauge feedback, equipped -> installed -> mandril disposal, retained catheter and final inventory');
    await page.getByRole('button', { name: /Repetir esta práctica/ }).click();
    assert.equal(await page.locator('[data-unit-id]').count(), 0); assert.equal(await page.getByTestId('installed-catheter').count(), 0);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '/basic-care', { waitUntil: 'networkidle' });
    await page.locator('[data-case="iv-hand"]').click(); await page.getByRole('button', { name: /Entrar al laboratorio/ }).click();
    for (const step of CARE_PROCEDURES.iv.steps.slice(0, 6)) await perform(step, 22);
    await page.getByRole('slider').fill('20'); await prepare('catheter', 22);
    assert.equal(await page.getByTestId('held-equipment').getAttribute('data-held-gauge'), '22');
    await page.screenshot({ path: '/tmp/care-realistic-mobile.png', fullPage: true });
    // A real touchscreen gesture carries the already prepared 22G unit to the anatomy.
    const tool = page.locator('[data-tool="catheter"]');
    await tool.evaluate(element => window.scrollTo(0, element.getBoundingClientRect().top + scrollY - 480));
    const a = await tool.boundingBox(), b = await page.locator('[data-scene-target="site"]').boundingBox();
    const client = await page.context().newCDPSession(page);
    const x = a.x + a.width / 2, y = a.y + a.height / 2, tx = b.x + b.width / 2, ty = b.y + b.height / 2;
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 12; i++) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + (tx - x) * i / 12, y: y + (ty - y) * i / 12 }] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.getByTestId('installed-catheter').waitFor();
    assert.equal(await page.getByTestId('installed-catheter').getAttribute('data-gauge'), '22');
    await page.screenshot({ path: '/tmp/care-realistic-mobile-installed.png', fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []); assert.deepEqual(missing, []);
    console.log('PASS mobile gauge selection, real touch drag of a prepared 22G catheter, no overflow, missing assets or runtime errors');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exit(1); });
