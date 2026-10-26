/* eslint-disable @typescript-eslint/no-require-imports -- Optional external browser runtime. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.GI_PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.GI_BASE_URL || 'http://127.0.0.1:3120';
const TABS = { identity: 'Valoración', soap: 'Valoración', gloves: 'Valoración', thermometer: 'Valoración', cuff: 'Valoración', stethoscope: 'Valoración', hydration: 'Valoración', jug: 'Valoración', ors: 'Hidratación', medication: 'Hidratación', sample: 'Hidratación', call: 'Continuidad', education: 'Continuidad', iv: 'Continuidad' };
async function main() {
  const browser = await chromium.launch({ executablePath: process.env.GI_CHROME_PATH, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, hasTouch: true, acceptDownloads: true });
    page.setDefaultTimeout(20000); await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors = [], missing = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (/\/(gastrointestinal|basic-care)\/.+\.(webp|png)/.test(response.url()) && response.status() >= 400) missing.push(response.url()); });
    async function noOverflow() { assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false); }
    async function dismissFinding() { const button = page.getByRole('button', { name: 'Continuar la valoración', exact: true }); if (await button.isVisible()) await button.click(); }
    async function select(tool) {
      if (!await page.locator(`[data-gi-tool="${tool}"]`).count()) await page.getByRole('button', { name: TABS[tool], exact: true }).click();
      await page.locator(`[data-gi-tool="${tool}"]`).click();
      assert.equal(await page.getByTestId('gi-selected').getAttribute('data-selected-tool'), tool);
    }
    async function confirm(value) { await page.locator(`dialog input[value="${value}"]`).check(); await page.getByTestId('gi-confirm').click(); }
    async function tool(tool, value, target) {
      await select(tool);
      if (target) await page.locator(`[data-gi-tool="${tool}"]`).dragTo(page.locator(`[data-gi-target="${target}"]`));
      else await page.getByTestId('gi-apply').click();
      if (value !== undefined) await confirm(value);
      await dismissFinding();
    }
    async function action(id, value) { await page.locator(`[data-gi-action="${id}"]`).click(); if (value !== undefined) await confirm(value); await dismissFinding(); }
    async function enter(variant = 'standard', assessment = false) {
      const response = await page.goto(base + '/gastrointestinal', { waitUntil: 'networkidle' }); assert.equal(response.status(), 200);
      await page.locator(`[data-gi-variant="${variant}"]`).click();
      if (assessment) await page.getByRole('button', { name: 'Evaluación', exact: true }).click();
      await page.getByTestId('gi-start').click(); await page.getByTestId('gi-scene').waitFor();
    }
    async function assess() {
      await action('triage'); await tool('identity', 'two-identifiers');
      await select('identity'); await page.getByTestId('gi-apply').click();
      for (const topic of ['symptoms', 'exposure', 'background']) await page.locator(`[data-gi-history="${topic}"]`).click();
      await page.getByRole('button', { name: 'Volver al paciente', exact: true }).click();
      await tool('soap'); await tool('gloves');
      await select('thermometer');
      assert.equal(await page.getByTestId('gi-heart-rate').innerText(), '—');
      assert.match(await page.getByTestId('gi-selected').innerText(), /SELECCIONADO.*AÚN SIN APLICAR/s);
      await page.locator('[data-gi-tool="thermometer"]').dragTo(page.locator('[data-gi-target="head"]')); await dismissFinding();
      await tool('cuff'); await tool('stethoscope'); await tool('hydration'); await tool('jug');
      assert.equal(await page.getByTestId('gi-heart-rate').innerText(), '108');
      await action('classify', 'oral-observation'); await action('diagnostics', 'clinical-review');
      await tool('gloves'); await tool('soap');
      assert.match(await page.getByTestId('gi-gloves-status').innerText(), /descartados/);
    }
    const catalog = await page.goto(base + '/simulation-hub/enfermeria', { waitUntil: 'networkidle' }); assert.equal(catalog.status(), 200);
    await page.locator('[data-module="gastrointestinal"]').click();
    await page.waitForURL('**/gastrointestinal');
    await page.getByTestId('gi-start').waitFor();
    await page.getByRole('heading', { name: /Infecciones gastrointestinales/ }).waitFor();
    await noOverflow(); await page.screenshot({ path: '/tmp/gi-welcome.png', fullPage: true });
    await enter(); await assess();
    await select('ors'); await page.getByTestId('gi-apply').click();
    assert.equal(await page.getByTestId('gi-confirm').isDisabled(), true);
    await confirm(500);
    const correction = page.getByRole('dialog'); await correction.waitFor();
    assert.match(await correction.innerText(), /concentración.*1000 mL/s);
    assert.equal(await page.locator('[data-gi-action="wait"]').isDisabled(), true);
    await page.screenshot({ path: '/tmp/gi-error.png' });
    await page.getByRole('button', { name: 'Entendido, volver al paciente' }).click();
    await page.getByText('sobre sin preparar', { exact: true }).waitFor();
    await tool('ors', 1000);
    await page.getByRole('button', { name: 'Pausar', exact: true }).click();
    assert.equal(await page.locator('[data-gi-action="wait"]').isDisabled(), true);
    await page.getByRole('button', { name: 'Reanudar', exact: true }).click();
    for (let i = 0; i < 4; i++) {
      const rate = await page.getByTestId('gi-heart-rate').innerText();
      await tool('ors', 250);
      assert.equal(await page.getByTestId('gi-heart-rate').innerText(), rate, 'a selected/offered portion does not instantly improve physiology');
      await action('wait'); await action('reassess');
      if (i === 1) await page.screenshot({ path: '/tmp/gi-observation.png', fullPage: true });
    }
    await tool('jug'); await tool('education', 'complete'); await action('handoff', 'observation');
    await page.getByTestId('gi-result').waitFor();
    assert.match(await page.getByTestId('gi-result').innerText(), /95.*1 errores/s);
    assert.equal(await page.getByTestId('gi-scene').getAttribute('data-improved'), 'true');
    const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Descargar bitácora' }).click(); assert.equal((await download).suggestedFilename(), 'practica-gastrointestinal.txt');
    await noOverflow(); await page.screenshot({ path: '/tmp/gi-result.png', fullPage: true });
    console.log('PASS standard route, selection before use, native error modal, dilution, discarded gloves, measured balance, repeated reassessment, retained mistakes and downloadable report');
    await enter('intolerance', true); await assess();
    assert.equal(await page.locator('[data-recommended="true"]').count(), 0);
    await tool('ors', 1000);
    for (let i = 0; i < 2; i++) { await tool('ors', 250); await action('wait'); if (i === 0) await action('reassess'); }
    assert.equal(await page.getByTestId('gi-scene').getAttribute('data-danger'), 'true');
    await tool('ors', 250); assert.match(await page.getByRole('dialog').innerText(), /hipoperfusión.*solicita|deterioro.*llama/s);
    await page.getByRole('button', { name: 'Entendido, volver al paciente' }).click();
    await tool('call'); assert.equal(await page.getByTestId('gi-heart-rate').innerText(), '124');
    await page.getByRole('button', { name: 'Proteger al paciente durante el vómito', exact: true }).click();
    await tool('iv'); await action('handoff', 'urgent'); await page.getByTestId('gi-result').waitFor();
    assert.match(await page.getByTestId('gi-result').innerText(), /no se declara resuelta/);
    assert.equal(await page.getByTestId('gi-heart-rate').innerText(), '124');
    await page.screenshot({ path: '/tmp/gi-urgent-result.png', fullPage: true });
    console.log('PASS assessment without hints, active vomiting deterioration, blocked oral administration, persistent abnormal physiology and explicit urgent handoff');
    await page.setViewportSize({ width: 390, height: 844 });
    await enter(); await action('triage'); await tool('identity', 'two-identifiers'); await tool('soap'); await tool('gloves');
    await select('thermometer');
    const source = page.locator('[data-gi-tool="thermometer"]');
    await source.evaluate(element => window.scrollTo(0, element.getBoundingClientRect().top + scrollY - 420));
    const a = await source.boundingBox(), b = await page.locator('[data-gi-target="head"]').boundingBox();
    assert.ok(b.y > 48 && b.y < 400, 'patient stays visible while choosing a material');
    const client = await page.context().newCDPSession(page);
    const x = a.x + a.width / 2, y = a.y + a.height / 2, tx = b.x + b.width / 2, ty = b.y + b.height / 2;
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 12; i++) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + (tx - x) * i / 12, y: y + (ty - y) * i / 12 }] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.getByRole('heading', { name: 'Temperatura medida', exact: true }).waitFor(); await dismissFinding();
    await noOverflow(); await page.screenshot({ path: '/tmp/gi-mobile-viewport.png' });
    await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: '/tmp/gi-mobile.png', fullPage: true });
    await page.getByRole('button', { name: 'Ver paciente ampliado' }).click(); await page.getByRole('heading', { name: 'Andrés Molina', exact: true }).waitFor(); await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Cambiar recorrido', exact: true }).click(); await page.getByRole('button', { name: 'Conservar esta práctica', exact: true }).click();
    assert.deepEqual(errors, []); assert.deepEqual(missing, []);
    console.log('PASS real mobile touch drag to patient, accessible enlargement and reset confirmation, no overflow, broken assets or runtime errors');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exit(1); });
