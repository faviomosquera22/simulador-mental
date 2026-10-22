/* eslint-disable @typescript-eslint/no-require-imports -- Optional external Playwright runtime. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PAP_PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PAP_BASE_URL || 'http://127.0.0.1:3100';
async function main() {
  const browser = await chromium.launch({ executablePath: process.env.PAP_CHROME_PATH, headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const bounds = async () => page.locator('.psyke-workspace > main').first().boundingBox();
    let reference;
    for (const route of ['/simulation-hub/enfermeria', '/simulation-hub/medicina', '/simulation-hub/psicologia', '/medical-cases', '/cases', '/procedures', '/pae-assistant', '/critical-care', '/clinical-room', '/psychological-first-aid']) {
      const response = await page.goto(base + route, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200, route);
      const box = await bounds();
      if (!reference) reference = box;
      assert.ok(Math.abs(box.x - reference.x) < 2, `same left edge: ${route}`);
      assert.ok(Math.abs(box.width - reference.width) < 2, `same width: ${route}, ${box.width}/${reference.width}`);
    }
    await page.goto(base + '/simulation-hub/psicologia', { waitUntil: 'networkidle' });
    assert.ok(await page.locator('[data-module="psychological-first-aid"]').count());
    assert.equal(await page.locator('[data-module="pae"]').count(), 0);
    await page.getByRole('searchbox', { name: 'Buscar en Psicología' }).fill('primeros psicologicos');
    assert.equal(await page.locator('[data-module]').count(), 1);
    await page.getByRole('searchbox', { name: 'Buscar en Psicología' }).fill('sin resultados xyz');
    await page.getByRole('button', { name: 'Limpiar búsqueda' }).click();
    await page.getByRole('button', { name: 'Colapsar menú lateral' }).click();
    const compact = await page.getByTestId('desktop-navigation').boundingBox();
    assert.equal(Math.round(compact.width), 76);
    await page.getByRole('navigation', { name: 'Carreras' }).getByRole('link', { name: /Medicina/ }).click();
    await page.getByRole('heading', { name: 'Simuladores de Medicina', exact: true }).waitFor();
    assert.equal(Math.round((await page.getByTestId('desktop-navigation').boundingBox()).width), 76);
    await page.getByRole('button', { name: 'Expandir menú lateral' }).click();
    const cards = await page.locator('[data-module]').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
    assert.ok(cards.every(height => height >= 239));
    await page.screenshot({ path: '/tmp/psyke-catalog-desktop.png', fullPage: true });
    await page.goto(base + '/critical-care', { waitUntil: 'networkidle' });
    const library = await bounds();
    await page.locator('.immersive-case-tile').first().click();
    await page.getByRole('button', { name: 'Iniciar simulación' }).waitFor();
    assert.ok(Math.abs((await bounds()).width - library.width) < 2);
    await page.getByRole('button', { name: 'Iniciar simulación' }).click();
    await page.getByRole('button', { name: 'Pausar simulación', exact: true }).waitFor();
    assert.ok(Math.abs((await bounds()).width - library.width) < 2, 'case entry preserves navigation geometry');
    await page.getByRole('button', { name: 'Pausar simulación', exact: true }).click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    console.log('PASS career classification, search, clear, shared cards, persistent sidebar width and stable module/case entry geometry');

    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of ['/simulation-hub', '/simulation-hub/enfermeria', '/simulation-hub/medicina', '/simulation-hub/psicologia', '/clinical-room', '/psychological-first-aid']) {
      await page.goto(base + route, { waitUntil: 'networkidle' });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, route);
    }
    await page.goto(base + '/simulation-hub/psicologia', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Abrir menú principal' }).click();
    await page.getByRole('link', { name: 'Enfermería', exact: true }).click();
    await page.getByRole('heading', { name: 'Simuladores de Enfermería', exact: true }).waitFor();
    await page.screenshot({ path: '/tmp/psyke-catalog-mobile.png', fullPage: true });
    assert.deepEqual(errors, []);
    console.log('PASS mobile catalogs, drawer navigation, clinical room, psychological support and no runtime errors');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exit(1); });
