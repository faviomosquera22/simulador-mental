/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.BRAIN_PLAYWRIGHT || 'playwright');
const base = process.env.BRAIN_BASE_URL || 'http://127.0.0.1:3130';
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BRAIN_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } }); const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => { const Original = window.Audio; window.brainMedia = []; window.Audio = class extends Original { constructor(...args) { super(...args); window.brainMedia.push(this); } }; });
    await page.goto(base + '/brain-explorer'); await page.locator('[data-status="ready"]').waitFor({ timeout: 45000 });
    const media = () => page.evaluate(() => window.brainMedia.map(a => ({ kind: a.dataset.brainAudio, src: a.src, time: a.currentTime, volume: a.volume, paused: a.paused, duration: a.duration })));
    for (const [name, id, moment] of [['Depresión','depression','Rumiación'],['Ansiedad generalizada','anxiety','Anticipación'],['Claustrofobia','claustrophobia','Dentro del ascensor']]) {
      await page.getByRole('button', { name: new RegExp(`0[123] ${name}`) }).click();
      await page.getByRole('button', { name: new RegExp(moment) }).click();
      await page.getByRole('button', { name: 'Activar sonido', exact: true }).click();
      await page.waitForFunction(() => window.brainMedia.filter(a => !a.paused && a.currentTime > .1 && a.readyState >= 2).length === 2);
      const playing = await media(); assert.ok(playing.every(a => a.src.includes(id + '-experience') && !a.paused && a.duration > 1));
      assert.equal(await page.getByTestId('brain-audio-panel').getAttribute('data-playing'), 'true');
      await page.getByRole('checkbox', { name: 'Voz del personaje', exact: true }).uncheck();
      assert.equal((await media()).find(a => a.kind === 'voice').paused, true); assert.equal((await media()).find(a => a.kind === 'ambience').paused, false);
      await page.getByRole('slider', { name: 'Volumen del ambiente' }).fill('0.8');
      await page.waitForFunction(() => window.brainMedia.find(a => a.dataset.brainAudio === 'ambience').volume === .8);
      await page.getByRole('checkbox', { name: 'Voz del personaje', exact: true }).check();
      await page.getByRole('button', { name: 'Pausar pulsos', exact: true }).click(); assert.ok((await media()).every(a => a.paused));
      await page.getByRole('button', { name: 'Reanudar pulsos', exact: true }).click(); await page.waitForFunction(() => !window.brainMedia.find(a => a.dataset.brainAudio === 'ambience').paused);
      await page.keyboard.press('Escape'); assert.ok((await media()).every(a => a.paused));
      await page.getByRole('button', { name: 'Activar sonido', exact: true }).click();
      await page.getByRole('button', { name: /03Apoyo inicial|03 Apoyo inicial/ }).click();
      await page.waitForFunction(() => window.brainMedia.every(a => a.src.includes('-support') && !a.paused));
      await page.getByRole('button', { name: 'Desactivar sonido', exact: true }).click(); assert.ok((await media()).every(a => a.paused));
      console.log(`PASS: ${id} native media playback, voice, volume, pause/resume, Escape, phase change, stop`);
    }
    await page.getByRole('button', { name: 'Activar sonido', exact: true }).click();
    await page.getByRole('button', { name: /01 Depresión/ }).click(); assert.ok((await media()).every(a => a.paused));
    await page.screenshot({ path: '/tmp/brain-audio-desktop.png', fullPage: true }); await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.getByTestId('brain-audio-panel').scrollIntoViewIfNeeded(); await page.screenshot({ path: '/tmp/brain-audio-mobile.png' });
    await page.getByRole('button', { name: 'Activar sonido', exact: true }).click(); await page.getByRole('link', { name: /Psicología \/ Laboratorio de neurociencia/ }).click(); await page.waitForURL('**/simulation-hub/psicologia');
    assert.equal((await media()).length, 2); assert.ok((await media()).every(a => a.paused)); assert.deepEqual(errors, []); console.log('PASS: case change, route cleanup, mobile layout, no runtime errors');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
