/* eslint-disable @typescript-eslint/no-require-imports -- Optional external browser runtime. */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const { chromium } = require(process.env.CT_PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.CT_BASE_URL || 'http://127.0.0.1:3131';
const screenshotDir = process.env.CT_SCREENSHOT_DIR || '/tmp';
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
async function main() {
  const browser = await chromium.launch({ executablePath: process.env.CT_CHROME_PATH, headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, acceptDownloads: true, hasTouch: true });
    page.setDefaultTimeout(30000);
    const errors = [], missing = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400 && /\/tomography\//.test(r.url())) missing.push(r.url()); });
    const ready = () => page.locator('[data-testid="ct-stage"][data-ready="true"]').waitFor({ timeout: 60000 });
    const canvas = () => page.locator('[data-testid="ct-stage"] canvas');
    const range = () => page.getByRole('slider', { name: 'Posición del corte', exact: true });
    const pixels = async () => hash(await canvas().screenshot());
    const overflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const response = await page.goto(base + '/tomography-simulator', { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200); await ready();
    assert.equal(await page.getByTestId('ct-matrix').innerText(), '225 × 225 × 626');
    await overflow();
    const whole3d = await pixels();
    await page.screenshot({ path: screenshotDir + '/ct-desktop-3d.png', fullPage: true });
    await range().focus(); await range().press('Home');
    assert.equal(await range().inputValue(), '0');
    assert.notEqual(await pixels(), whole3d, '3D slice navigation changes clipping');
    await page.getByRole('button', { name: 'Restablecer', exact: true }).click();
    await page.locator('[data-ct-view="axial"]').click();
    const axial = await pixels();
    await range().focus(); await range().press('End');
    assert.equal(await range().inputValue(), '625');
    assert.match(await page.getByTestId('ct-slice').innerText(), /626 \/ 626/);
    await range().press('Home');
    assert.match(await page.getByTestId('ct-slice').innerText(), /1 \/ 626/);
    await page.getByRole('button', { name: 'Reproducir', exact: false }).click();
    await page.waitForTimeout(700);
    await page.getByRole('button', { name: 'Pausar', exact: false }).click();
    const paused = await range().inputValue();
    assert.ok(Number(paused) > 0); await page.waitForTimeout(300); assert.equal(await range().inputValue(), paused);
    for (const [view, axis] of [['coronal', '1'], ['sagittal', '0'], ['axial', '2']]) {
      await page.locator(`[data-ct-view="${view}"]`).click();
      assert.equal(await page.getByRole('combobox', { name: 'Eje del recorrido' }).inputValue(), axis);
      assert.equal(await page.getByRole('combobox', { name: 'Eje del recorrido' }).isDisabled(), true);
    }
    await page.getByRole('button', { name: 'Restablecer', exact: true }).click();
    await page.getByRole('button', { name: 'Pulmón', exact: true }).click();
    assert.notEqual(await pixels(), axial, 'window changes rendered image');
    for (const id of ['head', 'neck', 'thorax', 'abdomen', 'pelvis', 'upper-limbs', 'lower-limbs']) {
      await page.locator(`[data-ct-region="${id}"]`).click(); await ready();
      assert.ok(!/225 × 225 × 626/.test(await page.getByTestId('ct-matrix').innerText()), id + ' is a real regional crop');
      assert.equal(await page.locator(`[data-ct-region="${id}"]`).getAttribute('aria-pressed'), 'true');
      assert.ok(Number(await range().getAttribute('max')) > 20);
      console.log('PASS regional volume', id);
    }
    await page.locator('[data-ct-region="abdomen"]').click(); await ready();
    await page.locator('[data-ct-view="multiplanar"]').click();
    await page.screenshot({ path: screenshotDir + '/ct-abdomen-mpr.png', fullPage: true });
    await page.locator('[data-ct-view="render"]').click();
    const bone = await pixels();
    const opacityControl = page.getByRole('slider', { name: 'Opacidad del volumen', exact: true });
    await opacityControl.focus(); await opacityControl.press('Home');
    assert.notEqual(await pixels(), bone, 'opacity changes the 3D volume');
    await opacityControl.press('End');
    await page.getByRole('combobox', { name: 'Aspecto del volumen 3D' }).selectOption('ct_surface');
    assert.notEqual(await pixels(), bone, '3D transfer function changes surface');
    await page.getByRole('button', { name: 'Aumentar zoom', exact: true }).click();
    await page.getByRole('button', { name: 'Reducir zoom', exact: true }).click();
    const box = await canvas().boundingBox();
    await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5); await page.mouse.down(); await page.mouse.move(box.x + box.width * .7, box.y + box.height * .55, { steps: 6 }); await page.mouse.up();
    await page.getByRole('button', { name: 'Restablecer', exact: true }).click();
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Captura', exact: false }).click();
    const download = await downloadEvent; const buffer = await fs.readFile(await download.path());
    assert.equal(buffer.subarray(1, 4).toString(), 'PNG');
    await page.getByLabel('Importar volumen NIfTI', { exact: true }).setInputFiles('public/tomography/region-head.nii.gz'); await ready();
    assert.match(await page.locator('h2').innerText(), /region-head/);
    assert.equal(await page.locator('[data-ct-region][aria-pressed="true"]').count(), 0);
    await page.getByLabel('Importar volumen NIfTI', { exact: true }).setInputFiles({ name: 'invalid.nii', mimeType: 'application/octet-stream', buffer: Buffer.from('not a nifti') });
    await page.getByTestId('ct-stage').getByRole('alert').waitFor();
    await page.locator('[data-ct-region="head"]').click(); await ready();
    // Force an asset failure, verify recovery and ensure no stale volume remains interactive.
    await page.route('**/tomography/region-thorax.nii.gz', r => r.fulfill({ status: 503, body: 'Unavailable' }));
    await page.locator('[data-ct-region="thorax"]').click(); await page.getByTestId('ct-stage').getByRole('alert').waitFor();
    assert.equal(await range().isDisabled(), true);
    await page.unroute('**/tomography/region-thorax.nii.gz');
    await page.getByRole('button', { name: 'Reintentar', exact: true }).click(); await ready();
    missing.length = 0;
    await page.setViewportSize({ width: 390, height: 844 });
    await overflow();
    await page.locator('[data-ct-view="coronal"]').click();
    await page.screenshot({ path: screenshotDir + '/ct-mobile.png', fullPage: true });
    const mobileBefore = await range().inputValue(); const sliderBox = await range().boundingBox();
    await range().tap({ position: { x: sliderBox.width * .2, y: sliderBox.height / 2 } });
    assert.notEqual(await range().inputValue(), mobileBefore, 'touch changes the selected slice');
    await page.locator('[data-ct-region="whole-body"]').click(); await ready();
    await page.locator('[data-ct-view="render"]').click();
    await overflow();
    await page.goto(base + '/simulation-hub/medicina', { waitUntil: 'networkidle' });
    assert.equal(await page.locator('[data-module="tomography"]').count(), 1);
    assert.deepEqual(missing, []); assert.deepEqual(errors, []);
    console.log('PASS 3D, clipping, slices, playback, planes, windows, all regions, rotation, PNG export, local import, error recovery, mobile layout and catalog integration');
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
