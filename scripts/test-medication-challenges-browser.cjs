/* eslint-disable @typescript-eslint/no-require-imports -- Optional external Playwright runtime. */
const assert=require('node:assert/strict');const path=require('node:path');
const {chromium}=require(process.env.PAP_PLAYWRIGHT_MODULE||'playwright');
const {loadTypeScript}=require('../tests/helpers/load-ts.cjs');
const {MEDICATION_CHALLENGES:cases,PRACTICE_DRUGS:drugs}=loadTypeScript('src/lib/medicationChallenges.ts');
const base=process.env.PAP_BASE_URL||'http://127.0.0.1:3101';const out=path.resolve('docs');
(async()=>{const browser=await chromium.launch({executablePath:process.env.PAP_CHROME_PATH,headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1050}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/medications');await page.getByRole('heading',{name:'Tu próxima decisión.',exact:true}).waitFor();
 assert.equal(await page.getByLabel('Caso clínico').count(),0);await page.screenshot({path:out+'/medication-challenges-welcome.png'});
 await page.getByRole('button',{name:'Generar caso aleatorio'}).click();
 let completed=0;
 for(const [index,level] of ['easy','medium','hard'].entries()){
  if(index)await page.getByRole('button').filter({has:page.getByText(index===1?'Medio':'Difícil',{exact:true})}).click();
  const seen=[];
  for(let n=0;n<cases.filter(c=>c.difficulty===level).length;n++){
   const body=await page.getByLabel('Caso clínico',{exact:true}).innerText();const c=cases.find(c=>body.includes(c.context));assert.ok(c);assert.equal(c.difficulty,level);assert.ok(!seen.includes(c.id),'no repeats before exhaustion');seen.push(c.id);
   assert.equal(await page.getByLabel('Resultado del caso').count(),0);
   if(!completed){
    await page.getByRole('searchbox',{name:'Buscar medicamento'}).fill('no-existe-zx');assert.equal(await page.getByRole('heading',{name:'No encontramos ese medicamento.'}).count(),1);
    await page.getByRole('button',{name:'Ver todo el botiquín',exact:true}).click();
    await page.getByRole('searchbox',{name:'Buscar medicamento'}).fill('acetaminofen');assert.ok(await page.getByRole('button').filter({has:page.getByText('Paracetamol',{exact:true})}).count());
   }
   const wrong=level==='medium'&&n===0;const wrongDose=level==='easy'&&n===1;
   if(c.decision==='hold')await page.getByRole('button',{name:'Retener el tratamiento y consultar',exact:true}).click();
   else {
    const accepted=wrong?{drugId:'insulin',route:'SC'}:c.accepted[0];const d=drugs.find(d=>d.id===accepted.drugId);
    await page.getByRole('searchbox',{name:'Buscar medicamento'}).fill(d.name);
    await page.getByRole('button').filter({has:page.getByText(d.name,{exact:true})}).click();
    assert.equal(await page.getByRole('button',{name:'Preparar administración →',exact:true}).isDisabled(),true);
    await page.waitForFunction(()=>document.querySelector('[aria-label="Preparación del medicamento"]').getBoundingClientRect().bottom<=innerHeight+1);
    const f=d.forms.find(f=>f.route===accepted.route&&(!accepted.formIds||accepted.formIds.includes(f.id)));await page.getByLabel('Presentación y vía del medicamento').selectOption(f.id);
    assert.equal(await page.getByRole('button',{name:'Preparar administración →',exact:true}).isDisabled(),true,'dose required after presentation');
    const chosenDose=wrong?f.doses[0]:wrongDose?f.doses.find(value=>!c.accepted.some(a=>a.drugId===d.id&&a.route===f.route&&a.doses.includes(value))):accepted.doses[0];await page.getByLabel('Dosis total del medicamento',{exact:true}).selectOption(String(chosenDose));
    assert.equal(await page.getByRole('button',{name:'Preparar administración →',exact:true}).isDisabled(),false);
    if(!completed)await page.screenshot({path:out+'/medication-challenges-selection.png'});
    await page.getByRole('button',{name:'Preparar administración →',exact:true}).click();
   }
   const modal=page.getByRole('dialog');assert.ok(await modal.isVisible());if(c.decision==='administer')assert.match(await modal.innerText(),/Dosis total:/);assert.equal(await page.getByLabel('Resultado del caso').count(),0);
   if(!completed){
    await page.screenshot({path:out+'/medication-challenges-confirmation.png'});
    await modal.getByRole('button',{name:'Volver a revisar',exact:true}).click();assert.match(await page.getByLabel('Tu sesión').innerText(),/0 casos completados/);
    await page.getByRole('button',{name:'Preparar administración →',exact:true}).click();
   }
   await modal.getByRole('button',{name:c.decision==='hold'?'Confirmar retención y consulta':'Administrar en la simulación',exact:true}).click();
   const result=page.getByLabel('Resultado del caso');await result.waitFor();assert.match(await result.innerText(),(wrong||wrongDose)?/Una decisión para revisar/:/Buena decisión para este caso/);
   completed++;assert.match(await page.getByLabel('Tu sesión').innerText(),new RegExp(`${completed} casos completados`));
   assert.equal(await page.getByRole('button',{name:'Retener el tratamiento y consultar',exact:true}).count(),0,'one grading per case');
   if(wrong||wrongDose)assert.match(await result.innerText(),/Respuesta compatible/);
   if(completed===1)await page.screenshot({path:out+'/medication-challenges-feedback.png'});
   if(n<cases.filter(c=>c.difficulty===level).length-1)await page.getByRole('button',{name:'Siguiente caso aleatorio →',exact:true}).click();
  }
 }
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/medication-challenges-mobile.png'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.getByRole('button',{name:'Otro caso aleatorio'}).click();
 const latest=await page.getByLabel('Caso clínico',{exact:true}).innerText();assert.ok(cases.some(c=>c.difficulty==='hard'&&latest.includes(c.context)));
 await page.getByRole('searchbox',{name:'Buscar medicamento'}).fill('enalapril');await page.getByRole('button').filter({has:page.getByText('Enalapril',{exact:true})}).click();
 await page.getByLabel('Presentación y vía del medicamento').selectOption('tablet');await page.getByLabel('Dosis total del medicamento',{exact:true}).selectOption('20');
 await page.getByLabel('Presentación y vía del medicamento').selectOption('tablet-20');assert.equal(await page.getByLabel('Dosis total del medicamento',{exact:true}).inputValue(),'','presentation change clears dose');
 assert.equal(await page.getByRole('button',{name:'Preparar administración →',exact:true}).isDisabled(),true);
 await page.getByLabel('Dosis total del medicamento',{exact:true}).selectOption('10');await page.getByLabel('Preparación del medicamento',{exact:true}).scrollIntoViewIfNeeded();
 await page.screenshot({path:out+'/medication-doses-mobile.png'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.getByRole('button',{name:'Órdenes y cálculo ↗',exact:true}).click();await page.getByRole('heading',{name:'Órdenes y cálculo de medicamentos',exact:true}).waitFor();
 await page.getByRole('button',{name:'← Volver a los retos de medicación',exact:true}).click();assert.match(await page.getByLabel('Tu sesión').innerText(),/30 casos completados/);
 assert.deepEqual(errors,[]);console.log('PASS: all 30 cases, all levels, search and synonyms, preparation cancellation, explicit dose and unit selection, confirmation, correct/incorrect/hold decisions, session stats, mobile layout and legacy calculations.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
