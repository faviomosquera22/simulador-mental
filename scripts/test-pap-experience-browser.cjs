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
    const input = page.getByRole('textbox', { name: 'Tu pregunta o respuesta a Valeria' });
    const world = page.getByTestId('patient-world');
    const log = page.getByRole('log', { name: 'Mensajes de la conversación' });
    assert.equal(await page.getByRole('navigation', { name: 'Principios de PAP' }).count(), 0);
    assert.equal(await page.getByRole('navigation', { name: 'Herramientas', exact: true }).getByRole('button').count(), 2);
    assert.ok((await log.boundingBox()).height >= 500, 'expanded chat');
    const responseCount = () => page.getByTestId('patient-message').count();
    async function say(text, keyboard = false) {
      const before = await responseCount();
      await input.fill(text);
      if (keyboard) await input.press('Enter'); else await page.getByRole('button', { name: 'Decir a Valeria' }).click();
      await page.waitForFunction(count => document.querySelectorAll('[data-testid="patient-message"]').length > count, before);
      await page.getByRole('status').filter({ hasText: 'Valeria está respondiendo' }).waitFor({ state: 'hidden' });
    }
    await page.getByRole('button', { name: 'Ofrecer un asiento' }).click();
    assert.equal(await responseCount(), 0, 'suggestions edit the draft without sending');
    assert.match(await input.inputValue(), /sentarte/);
    // Dispatch both immediately; scrolling the enlarged chat back to the header
    // can otherwise take longer than the deliberate 550 ms reply delay.
    await page.evaluate(() => {
      document.querySelector('button[aria-label="Decir a Valeria"]').click();
      [...document.querySelectorAll('button')].find(button => button.textContent === 'Pausar').click();
    });
    await page.waitForTimeout(850);
    assert.equal(await responseCount(), 0, 'pause cancels the pending reply');
    await page.getByRole('button', { name: 'Continuar atención' }).click();
    assert.match(await input.inputValue(), /sentarte/, 'draft is retained on cancellation');
    await say('¿Te gustaría sentarte un momento?', true);
    await page.waitForFunction(() => document.querySelector('[data-testid="patient-world"]')?.dataset.posture === 'seated', { timeout: 20000 });
    await page.screenshot({ path: '/tmp/pap-v3-seated.png', fullPage: true });
    await say('¿Prefieres levantarte?', true);
    await page.waitForFunction(() => document.querySelector('[data-testid="patient-world"]')?.dataset.posture === 'standing');
    await say('Cálmate, no pasa nada.');
    await page.waitForFunction(() => document.querySelector('[data-testid="patient-world"]')?.dataset.motion === 'agitated');
    await page.waitForFunction(() => document.querySelector('[data-testid="patient-world"]')?.dataset.gesture === 'marca-un-limite');
    await page.waitForFunction(() => document.querySelector('[data-testid="patient-world"]')?.dataset.gesture === 'protesta');
    assert.equal(await world.getAttribute('data-locomotion'), 'standing');
    await page.screenshot({ path: '/tmp/pap-v4-protesta.png', fullPage: true });
    await say('Perdón por lo que dije. Me equivoqué.');
    assert.ok(await page.getByTestId('scene-event').count() > 0);
    for (const text of await page.getByTestId('patient-message').locator('p').allTextContents()) assert.doesNotMatch(text, /\[|\]|^[“"]|[”"]$/);
    await page.evaluate(() => { window.__papSpoken = ''; window.speechSynthesis.speak = utterance => { window.__papSpoken = utterance.text; }; });
    await log.getByRole('button', { name: 'Escuchar este mensaje de Valeria' }).last().click();
    const spoken = await page.evaluate(() => window.__papSpoken);
    assert.ok(spoken.length > 5); assert.doesNotMatch(spoken, /\[|\]|Baja un poco/);
    await say('No te voy a presionar. Respeto tu espacio.');
    await page.screenshot({ path: '/tmp/pap-v4-desktop.png', fullPage: true });
    await input.fill('Primera línea'); await input.press('Shift+Enter'); await input.type('Segunda línea');
    assert.match(await input.inputValue(), /\n/);
    console.log('PASS message layout, scene events, voice without narration, editable suggestions, keyboard, cancelled pending reply, seated posture and standing');

    await page.setViewportSize({ width: 390, height: 844 });
    await input.fill('¿Qué es lo que más te preocupa?'); await page.getByRole('button', { name: 'Decir a Valeria' }).click();
    await page.getByRole('status').filter({ hasText: 'Valeria está respondiendo' }).waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: '/tmp/pap-v4-mobile.png', fullPage: true });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await say('¿Te gustaría sentarte un momento?');
    await page.waitForFunction(() => document.querySelector('[data-testid="patient-world"]')?.dataset.posture === 'seated');
    assert.equal(await world.getAttribute('data-active'), 'false');
    assert.deepEqual(errors, []);
    console.log('PASS mobile layout, reduced-motion seated snapshot and no runtime errors');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exit(1); });
