/* eslint-disable @typescript-eslint/no-require-imports -- Optional Playwright can resolve from an external runtime. */
/* Optional browser verification: set PAP_PLAYWRIGHT_MODULE if Playwright is installed outside this project. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PAP_PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PAP_BASE_URL || 'http://127.0.0.1:3100';
const opening = ['scene', 'observe', 'introduce', 'distance', 'quiet', 'needs', 'physical'];
const continuation = ['risk', 'validate', 'supports', 'silence', 'water', 'information', 'contact', 'reassess', 'plan'];
async function main() {
  const browser = await chromium.launch({ executablePath: process.env.PAP_CHROME_PATH, headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  async function enter(variant = 'standard', assessment = false) {
    await page.goto(`${base}/psychological-first-aid`, { waitUntil: 'networkidle' });
    if (assessment) await page.getByLabel('Evaluación', { exact: false }).check();
    await page.getByLabel('Variación del caso', { exact: true }).selectOption(variant);
    await page.getByRole('button', { name: 'Entrar a la sala' }).click();
    await page.locator('[data-loaded="true"]').waitFor({ timeout: 60000 });
  }
  async function act(id) {
    const tools = page.getByRole('button', { name: /herramientas y ejemplos/ });
    if (await tools.getAttribute('aria-expanded') === 'false') await tools.click();
    const button = page.locator(`[data-action="${id}"]`);
    assert.equal(await button.isEnabled(), true, `available action: ${id}`);
    await button.click();
  }
  await enter();
  await page.waitForFunction(() => document.querySelector('[data-testid="patient-world"]')?.dataset.locomotion === 'walking');
  const x = await page.getByTestId('patient-world').getAttribute('data-actor-x');
  await page.waitForTimeout(1200);
  assert.notEqual(await page.getByTestId('patient-world').getAttribute('data-actor-x'), x, 'patient walks through the room');
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  const pausedX = await page.getByTestId('patient-world').getAttribute('data-actor-x');
  const pausedTime = await page.locator('time').first().textContent();
  await page.waitForTimeout(1300);
  assert.equal(await page.getByTestId('patient-world').getAttribute('data-actor-x'), pausedX, 'pause freezes movement');
  assert.equal(await page.locator('time').first().textContent(), pausedTime, 'pause freezes case time');
  await page.getByRole('button', { name: 'Continuar atención' }).click();
  for (const id of opening) await act(id);
  await act('event-response');
  for (const id of continuation) await act(id);
  assert.equal(await page.getByRole('button', { name: 'Cerrar y revisar' }).isEnabled(), true);
  await page.getByRole('button', { name: 'Libreta ·' }).click();
  await page.getByRole('textbox').fill('Necesita compañía e información verificada.');
  await page.getByRole('button', { name: 'Intervenir', exact: true }).click();
  await page.getByRole('button', { name: 'Libreta ·' }).click();
  assert.equal(await page.getByRole('textbox').inputValue(), 'Necesita compañía e información verificada.');
  await page.getByRole('button', { name: 'Cerrar y revisar' }).click();
  await page.getByRole('region', { name: 'Devolución educativa' }).waitFor();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar devolución' }).click();
  const download = await downloadEvent;
  assert.equal(download.suggestedFilename(), 'psyke-pap-devolucion.json');
  console.log('PASS desktop: movement, pause, PAP workflow, notes, closing and download');

  await enter('medical', true);
  assert.equal(await page.getByText('ORIENTACIÓN DEL TUTOR').count(), 0, 'assessment hides tutor hints');
  for (const id of opening) await act(id);
  await page.getByRole('alert').filter({ hasText: 'dolor en el pecho' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Cerrar y revisar' }).isEnabled(), false);
  await act('event-response');
  assert.equal(await page.locator('[data-action="water"]').isEnabled(), false, 'acknowledgement does not resolve medical warning');
  await act('emergency'); await act('handoff');
  for (const id of continuation) await act(id);
  await page.getByRole('button', { name: 'Cerrar y revisar' }).click();
  await page.getByRole('region', { name: 'Devolución educativa' }).waitFor();
  console.log('PASS medical variant: warning, priority, actual handoff and assessment debrief');

  await page.setViewportSize({ width: 390, height: 844 });
  await enter();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'mobile has no horizontal overflow');
  await act('scene'); await act('observe'); await act('introduce');
  await page.getByRole('button', { name: 'Acercar vista' }).click();
  await page.getByLabel('Reducir movimientos', { exact: false }).check();
  await page.waitForTimeout(400);
  assert.equal(await page.getByTestId('patient-world').getAttribute('data-active'), 'false');
  await page.screenshot({ path: '/tmp/pap-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Guía de PAP' }).click();
  await page.getByRole('dialog').waitFor();
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(), 0);
  await page.getByRole('button', { name: 'Continuar atención' }).click();
  console.log('PASS mobile: layout, actions, reduced motion, guide and resume');

  await page.setViewportSize({ width: 1440, height: 1100 });
  await enter();
  for (const id of opening) await act(id);
  await act('event-response');
  for (const id of ['risk', 'validate', 'supports', 'silence', 'water', 'information', 'contact']) await act(id);
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar atención' }).click();
  await page.getByRole('button', { name: 'Acercar vista' }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/pap-prototype-desktop.png', fullPage: true });
  assert.deepEqual(errors, [], 'no runtime page errors');
  console.log('PASS no uncaught browser errors; screenshots saved in /tmp');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exit(1); });
