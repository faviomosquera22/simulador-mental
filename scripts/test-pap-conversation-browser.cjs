/* eslint-disable @typescript-eslint/no-require-imports -- Optional external Playwright runtime. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PAP_PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PAP_BASE_URL || 'http://127.0.0.1:3101';
async function main() {
  const browser = await chromium.launch({ executablePath: process.env.PAP_CHROME_PATH, headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/psychological-first-aid`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Entrar a la sala' }).click();
    await page.locator('[data-loaded="true"]').waitFor({ timeout: 60000 });
    const world = page.getByTestId('patient-world');
    const input = page.getByRole('textbox', { name: 'Tu pregunta o respuesta a Valeria' });
    async function say(words) { const count = await page.getByTestId('patient-message').count(); await input.fill(words); await page.getByRole('button', { name: 'Decir a Valeria' }).click(); await page.waitForFunction(value => document.querySelectorAll('[data-testid="patient-message"]').length > value, count); }
    async function motion(expected) { await page.waitForFunction(value => document.querySelector('[data-testid="patient-world"]')?.dataset.motion === value, expected); }
    await say('¿Cuántos años tienes?');
    assert.ok((await page.getByRole('region', { name: 'Conversación con Valeria' }).textContent()).includes('28 años'));
    await say('Cálmate, no pasa nada.'); await motion('agitated');
    await page.getByRole('button', { name: 'Acercar vista' }).click();
    await page.waitForTimeout(1700);
    await page.screenshot({ path: '/tmp/pap-agitated.png', fullPage: true });
    await page.getByRole('button', { name: 'Pausar', exact: true }).click();
    const frozen = await world.getAttribute('data-actor-x');
    await page.waitForTimeout(1000);
    assert.equal(await world.getAttribute('data-actor-x'), frozen);
    assert.equal(await input.isDisabled(), true);
    await page.getByRole('button', { name: 'Continuar atención' }).click();
    await say('Deja de llorar.'); await say('Cuéntame todo con cada detalle aunque no quieras.');
    await motion('withdrawing'); await page.waitForTimeout(1600);
    await page.screenshot({ path: '/tmp/pap-withdrawn.png', fullPage: true });
    await say('¿Qué necesitas ahora?');
    assert.ok((await page.getByRole('region', { name: 'Conversación con Valeria' }).textContent()).includes('no quiero seguir respondiendo'));
    await say('Perdón por lo que dije. Me equivoqué.'); await motion('tearful');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/tmp/pap-tearful.png', fullPage: true });
    await say('No te voy a presionar. Respeto tu espacio y me aparto.'); await motion('recovering');
    await page.waitForTimeout(1400);
    await page.screenshot({ path: '/tmp/pap-free-conversation.png', fullPage: true });
    await say('¿Cuál es tu película favorita?');
    await page.getByText('Esta frase no se interpretó con suficiente certeza.', { exact: false }).waitFor();
    await say('¿Quieres que llamemos a tu tía?');
    assert.ok((await page.getByRole('region', { name: 'Conversación con Valeria' }).textContent()).includes('Todavía no la hemos llamado'));
    await page.getByRole('button', { name: 'Terminar práctica y ver pendientes' }).click();
    await page.getByRole('heading', { name: 'Práctica finalizada con elementos pendientes.' }).waitFor();
    assert.ok((await page.getByRole('region', { name: 'Devolución educativa' }).textContent()).includes('30 puntos'));
    console.log('PASS free text, agitation, withdrawal, refusal, gradual repair, uncertain input, consent, pause, incomplete debrief');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/psychological-first-aid`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Entrar a la sala' }).click();
    await page.locator('[data-loaded="true"]').waitFor({ timeout: 60000 });
    await input.fill('¿En qué te puedo ayudar?');
    await page.getByRole('button', { name: 'Libreta ·' }).click();
    await page.getByRole('button', { name: 'Intervenir', exact: true }).click();
    assert.equal(await input.inputValue(), '¿En qué te puedo ayudar?');
    await page.getByRole('button', { name: 'Decir a Valeria' }).click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.getByRole('button', { name: 'Acción en la sala' }).click();
    await page.getByRole('textbox', { name: 'Describe la acción que decides realizar' }).fill('Observo el entorno y si la salida está libre.');
    await page.getByRole('button', { name: 'Realizar acción' }).click();
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => /Libreta ·.*2/.test(button.textContent || '')));
    assert.ok((await page.getByRole('button', { name: 'Libreta ·' }).textContent()).includes('2'));
    await page.screenshot({ path: '/tmp/pap-free-mobile.png', fullPage: true });
    assert.deepEqual(errors, []);
    console.log('PASS mobile free speech, free actions, retained draft, layout and no runtime errors');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exit(1); });
