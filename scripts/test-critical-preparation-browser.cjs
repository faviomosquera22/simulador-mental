/* eslint-disable @typescript-eslint/no-require-imports -- Optional external Playwright runtime. */
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PAP_PLAYWRIGHT_MODULE || 'playwright');
const output=require('node:path').resolve('docs');
const base=process.env.PAP_BASE_URL || 'http://127.0.0.1:3100';
(async()=>{const b=await chromium.launch({executablePath:process.env.PAP_CHROME_PATH,headless:true});try{
const page=await b.newPage({viewport:{width:1440,height:1050}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(base+'/critical-care');
await page.getByRole('button').filter({hasText:'Crisis asmática grave'}).click();await page.getByRole('button',{name:'Iniciar simulación'}).click();
await page.getByRole('button',{name:'Oxígeno / ventilador',exact:true}).click();
await page.getByLabel('Flujo de oxígeno en litros por minuto').fill('1.5');await page.getByRole('button',{name:'Conectar / aplicar oxígeno',exact:true}).click();await quiz();
assert.equal(await page.getByRole('img',{name:'Cánula nasal · 1.5 L/min',exact:true}).count(),1);
await page.screenshot({path:output+'/critical-oxygen-review.png'});
await page.getByLabel('Dispositivo de oxígeno').selectOption('mask');assert.equal(await page.getByLabel('Flujo de oxígeno en litros por minuto').inputValue(),'5');
await page.getByRole('button',{name:'Conectar / aplicar oxígeno',exact:true}).click();await quiz();assert.equal(await page.getByRole('img',{name:'Mascarilla simple · 5 L/min',exact:true}).count(),1);
await page.getByRole('button',{name:'Retirar oxígeno',exact:true}).click();await quiz();assert.equal(await page.getByRole('img',{name:'Mascarilla simple · 5 L/min',exact:true}).count(),0);
await page.getByRole('button',{name:'Medicación',exact:true}).click();await page.getByLabel('Buscar en Medicación').fill('paracetamol');
await page.getByLabel('Cantidad de Paracetamol').fill('1.5');await page.getByRole('button',{name:'Preparar Paracetamol',exact:true}).click();
assert.match(await page.locator('.medication-confirm').innerText(),/750 mg/);
await page.getByRole('button',{name:'Confirmar administración de Paracetamol',exact:true}).click();await quiz();assert.match(await page.locator('.medication-effect').innerText(),/750 mg/);
await page.screenshot({path:output+'/critical-medication-review.png'});
 async function quiz(){const modal=page.locator('.mandatory-question-modal[open]');if(await modal.count()){await modal.getByRole('radio').nth(1).check();await modal.getByRole('button',{name:'Confirmar respuesta',exact:true}).click();await modal.getByRole('button',{name:'Continuar el caso',exact:true}).click();}}
 await page.goto(base+'/clinical-room');await page.getByRole('button',{name:'Cambiar caso ↗',exact:true}).click();await page.getByRole('button').filter({has:page.getByText('Hemorragia posparto · traje antichoque TANN',{exact:true})}).click();await page.getByRole('button',{name:'Preparar escenario →',exact:true}).click();await page.getByRole('button',{name:'Iniciar simulación ▷',exact:true}).click();
 assert.equal(await page.locator('.bleeding-overlay').count(),1);await page.getByRole('button',{name:'✥ Claves y TANN',exact:true}).click();

 await page.locator('[data-tann-action="consent"]').click();await quiz();
 await page.getByRole('button',{name:'✥ Claves y TANN',exact:true}).click();
 await page.locator('[data-tann-action="key-roja"]').click();await quiz();
 await page.locator('[data-tann-action="tann-assess"]').click();await quiz();await page.locator('[data-tann-action="tann-prepare"]').click();await quiz();
 for(let n=1;n<=6;n++){if(n<6)assert.equal(await page.locator(`[data-tann-action="tann-${n+1}"]`).isDisabled(),true);await page.locator(`[data-tann-action="tann-${n}"]`).click();await quiz();assert.equal(await page.locator('.tann-segment-overlay [data-tann-segment]').count(),n);if(n===1||n===3||n===6){await page.waitForTimeout(600);await page.screenshot({path:output+`/gyn-tann-step-${n}.png`});}}
 await page.locator('[data-tann-action="tann"]').click();await quiz();assert.equal(await page.locator('.tann-segment-overlay').getAttribute('data-verified'),'true');
 assert.equal(await page.locator('.bleeding-overlay .blood-flow').count(),1,'garment does not cure hemorrhage');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:output+'/gyn-tann-mobile-review.png'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);console.log('Gynecology visual procedure PASS');
console.log('errors',errors);assert.deepEqual(errors,[]);
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
