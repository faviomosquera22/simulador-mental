/* eslint-disable @typescript-eslint/no-require-imports -- Optional external browser runtime. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.CARE_PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.CARE_BASE_URL || 'http://127.0.0.1:3100';
async function main() {
  const browser = await chromium.launch({ executablePath: process.env.CARE_CHROME_PATH, headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
    page.setDefaultTimeout(20000);
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/basic-care', { waitUntil: 'networkidle' });
    assert.equal(await page.locator('[data-station-photo]').count(), 4);
    await page.screenshot({ path: '/tmp/basic-care-ux-home.png', fullPage: true });
    await page.getByRole('button', { name: /Entrar al laboratorio/ }).click();
    const apply = page.getByTestId('apply-material');
    assert.equal(await apply.isDisabled(), true);
    await page.locator('[data-tool="identity"]').click();
    await page.getByRole('button', { name: 'Ampliar imagen del material' }).click();
    await page.getByRole('dialog', { name: 'Conoce el material' }).waitFor();
    await page.screenshot({ path: '/tmp/basic-care-ux-material-detail.png' });
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').isVisible(), false);
    assert.equal(await apply.isDisabled(), true, 'selection alone does not apply an intervention or skip the decision');
    await page.getByRole('radio').nth(1).check();
    assert.equal(await apply.isEnabled(), true);
    await page.screenshot({ path: '/tmp/basic-care-ux-desktop.png', fullPage: true });
    await apply.click();
    await page.getByText('Tarea 2 de 11', { exact: true }).waitFor();
    await page.locator('[data-tool="soap"]').click();
    await apply.click();
    await page.getByText('Tarea 3 de 11', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Ver bandeja completa', exact: true }).click();
    assert.equal(await page.locator('[data-tool]').count(), 11);
    for (const image of await page.locator('[data-tool] [data-material-image]').all()) {
      const box = await image.boundingBox(); assert.ok(box.width > 65 && box.height >= 65);
    }
    await page.getByRole('button', { name: 'Cómo practicar', exact: true }).click();
    await page.getByRole('region', { name: 'Cómo practicar' }).waitFor();
    await page.getByRole('button', { name: 'Entendido', exact: true }).click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    console.log('PASS illustrated materials, contextual tray, selection/decision/application, full tray and onboarding');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '/basic-care', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Entrar al laboratorio/ }).click();
    await page.locator('[data-tool="identity"]').click();
    await page.getByRole('radio').nth(1).check();
    await page.screenshot({ path: '/tmp/basic-care-ux-mobile.png', fullPage: true });
    await page.getByTestId('apply-material').click();
    await page.getByText('Tarea 2 de 11', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Ver paciente', exact: true }).click();
    await page.getByTestId('care-photo-scene').waitFor();
    await page.screenshot({ path: '/tmp/basic-care-ux-mobile-patient.png', fullPage: true });
    await page.getByRole('button', { name: 'Paso y materiales', exact: true }).click();
    await page.locator('[data-tool="soap"]').focus(); await page.keyboard.press('Enter');
    await page.getByTestId('apply-material').focus(); await page.keyboard.press('Enter');
    await page.getByText('Tarea 3 de 11', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    console.log('PASS mobile task/patient tabs preserve state, image selection and CTA by keyboard, no horizontal overflow or runtime errors');
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
