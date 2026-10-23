/* eslint-disable @typescript-eslint/no-require-imports -- Optional external Playwright runtime. */
const assert=require('node:assert/strict');const{chromium}=require(process.env.PAP_PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.PAP_BASE_URL || 'http://127.0.0.1:3100';
const output=require('node:path').resolve('docs');
(async()=>{const b=await chromium.launch({executablePath:process.env.PAP_CHROME_PATH,headless:true});try{const p=await b.newPage({viewport:{width:1440,height:1050}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
async function quiz(){const modal=p.locator('.mandatory-question-modal[open]');if(await modal.count()){await modal.getByRole('radio').nth(1).check();await modal.getByRole('button',{name:'Confirmar respuesta',exact:true}).click();await modal.getByRole('button',{name:'Continuar el caso',exact:true}).click();}}
await p.goto(base+'/critical-care');assert.equal(await p.locator('.immersive-case-tile:visible').count(),7);await p.getByRole('button').filter({hasText:'Hemorragia obstétrica'}).click();await p.getByRole('button',{name:'Iniciar simulación'}).click();assert.equal(await p.locator('.bleeding-overlay').count(),1);await p.getByRole('button',{name:'Traje antichoque',exact:true}).click();
const procedure=p.getByRole('region',{name:'Colocación del traje antichoque',exact:true});
assert.ok(await procedure.isVisible());
assert.equal(await procedure.locator('[data-garment-step="0"]').isDisabled(),true);
await procedure.getByRole('button',{name:'Activar equipo de hemorragia',exact:true}).click();await quiz();
assert.equal(await procedure.locator('[data-garment-step="0"]').isEnabled(),true);
await p.getByRole('button',{name:'Pausar simulación',exact:true}).click();
assert.equal(await procedure.locator('[data-garment-step="0"]').isDisabled(),true);
await procedure.getByRole('button',{name:'Continuar atención para colocar el traje',exact:true}).click();
assert.equal(await procedure.locator('[data-garment-step="0"]').isEnabled(),true);
for(let n=0;n<8;n++){await p.getByRole('button',{name:'Realizar este paso',exact:true}).click();await quiz();if(n>0)assert.equal(await p.locator('[data-tann-segment]').count(),Math.min(6,n));}
await p.waitForTimeout(650);await p.screenshot({path:output+'/critical-hemorrhage-review.png'});assert.equal(await p.locator('.tann-segment-overlay').getAttribute('data-verified'),'true');
await p.goto(base+'/critical-care');await p.getByRole('button').filter({hasText:'Ventilación y oxigenación'}).click();await p.getByRole('button',{name:'Iniciar simulación'}).click();await p.getByRole('button',{name:'Oxígeno / ventilador',exact:true}).click();assert.equal(await p.getByLabel('Dispositivo de oxígeno').count(),0);assert.equal(await p.locator('#vent-fio2').count(),1);assert.equal(await p.getByRole('button',{name:'Aplicar ajustes'}).isDisabled(),true);
await p.getByRole('button',{name:'Traje antichoque',exact:true}).click();
const modal=p.locator('.immersive-modal[open]');
assert.match(await modal.innerText(),/Vas a preparar: Hemorragia obstétrica/);
await modal.getByRole('button',{name:'Conservar la sesión en pausa',exact:true}).click();
assert.equal(await p.locator('#vent-fio2').count(),1,'opening TANN cannot replace the current case without confirmation');
await p.setViewportSize({width:390,height:844});await p.screenshot({path:output+'/critical-ventilation-mobile.png'});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);console.log('TANN access, visible prerequisites, resume, sequential placement, case confirmation and mobile PASS');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
