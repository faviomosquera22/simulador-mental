/* eslint-disable @typescript-eslint/no-require-imports -- Optional external Playwright runtime. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PAP_PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PAP_BASE_URL || 'http://127.0.0.1:3100';
async function main() {
  const browser = await chromium.launch({ executablePath: process.env.PAP_CHROME_PATH, headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    let count = 0; let mode = 'success'; let captured; let release;
    await page.route('**/api/ai/pap-turn', async route => {
      count++; captured = route.request().postDataJSON();
      if (mode === 'hold') await new Promise(resolve => { release = resolve; });
      const payload = mode === 'invalid' ? { turn: { intent: 'finish', message: 'Todo completado.' } } : { turn: { intent: 'needs', message: 'Quédate aquí conmigo. Esperar sin noticias de mi hermana se me hace difícil.' }, provider: 'gemini' };
      await route.fulfill({ status: mode === 'failure' ? 503 : 200, contentType: 'application/json', body: JSON.stringify(payload) }).catch(() => {});
    });
    await page.goto(`${base}/psychological-first-aid`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Entrar a la sala' }).click();
    const input = page.getByRole('textbox', { name: 'Tu pregunta o respuesta a Valeria' });
    const send = page.getByRole('button', { name: 'Decir a Valeria' });
    async function say(words) { await input.fill(words); await send.click(); await send.waitFor({ state: 'visible' }); await page.waitForFunction(() => document.querySelector('#pap-free-input')?.disabled === false); }
    await say('¿Qué podría ser prioritario resolver para ti?');
    await page.getByText('Quédate aquí conmigo. Esperar sin noticias de mi hermana se me hace difícil.', { exact: true }).waitFor();
    assert.equal(captured.kind, 'speech');
    assert.equal(captured.message, '¿Qué podría ser prioritario resolver para ti?');
    assert.ok(captured.run.history.length <= 12);
    assert.match(await page.getByRole('status').last().textContent(), /Gemini/);
    mode = 'failure'; await say('Hola');
    await page.getByText('Gemini no está disponible. Esta respuesta procede del guion local del caso.', { exact: true }).waitFor();
    mode = 'invalid'; await say('¿Cuántos años tienes?');
    await page.getByTestId('patient-message').filter({ hasText: '28 años' }).waitFor();
    assert.equal(await page.getByText('Todo completado.', { exact: true }).count(), 0);
    mode = 'hold'; const held = page.waitForRequest('**/api/ai/pap-turn');
    await input.fill('¿Qué te preocupa ahora?'); await send.click();
    await page.waitForFunction(() => document.querySelector('#pap-free-input')?.disabled === true);
    await held;
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent === 'Pausar').click());
    await page.getByRole('button', { name: 'Continuar atención' }).waitFor();
    release(); await page.waitForTimeout(250);
    assert.equal(await input.inputValue(), '¿Qué te preocupa ahora?');
    await page.getByRole('button', { name: 'Continuar atención' }).click();
    await page.getByRole('combobox', { name: 'Motor de conversación' }).selectOption('local');
    const localBefore = count; await say('¿Cómo te llamas?');
    assert.equal(count, localBefore, 'local mode makes no provider request');
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const unauthenticated = await page.request.post(`${base}/api/ai/pap-turn`, { data: captured });
    assert.equal(unauthenticated.status(), 401);
    assert.deepEqual(errors, []);
    console.log('PASS mocked Gemini response, semantic intent, malformed JSON fallback, provider failure, in-flight pause, retained draft, local mode, mobile and protected API');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exit(1); });
