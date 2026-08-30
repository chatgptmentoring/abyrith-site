let puppeteer; const path=require('path');
const OUT=path.join(__dirname,'shots7'); require('fs').mkdirSync(OUT,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  puppeteer=(await import('puppeteer')).default;
  const b=await puppeteer.launch({args:['--no-sandbox','--font-render-hinting=none']});
  const out={};
  // front page must be unchanged and error-free
  const p=await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push('JS: '+e.message));
  p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE: '+m.text());});
  await p.setViewport({width:1440,height:900});
  await p.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
  await sleep(3000);
  out.front=await p.evaluate(()=>({
    cmsMarks:document.querySelectorAll('[data-cms]').length,
    places:document.querySelectorAll('#places .place').length,
    artefacts:document.querySelectorAll('#artefacts .place').length,
    pins:document.querySelectorAll('.pin').length,
    heroTitle:+getComputedStyle(document.querySelector('.hero__title')).opacity,
    worldHeading:document.querySelector('.world .display').innerText.replace(/\s+/g,' ').slice(0,30)
  }));
  await p.close();

  // admin gate
  const a=await b.newPage();
  const aerr=[]; a.on('pageerror',e=>aerr.push('JS: '+e.message));
  a.on('requestfailed',r=>aerr.push('REQFAIL: '+r.url().slice(-40)));
  await a.setViewport({width:1440,height:900});
  await a.goto('http://localhost:4321/bookadmindeni/',{waitUntil:'networkidle0',timeout:60000});
  await sleep(1400);
  await a.screenshot({path:path.join(OUT,'admin-gate.jpg'),quality:88,type:'jpeg'});
  out.admin=await a.evaluate(()=>({
    gateShown:document.querySelector('#gate').hidden===false,
    shellHidden:document.querySelector('#shell').hidden,
    userPrefill:document.querySelector('#lgUser').value
  }));
  // wrong password path
  await a.type('#lgPass','definitely-wrong');
  await a.click('#lgBtn'); await sleep(2500);
  out.admin.badLogin=await a.evaluate(()=>document.querySelector('#lgMsg').textContent);
  await a.close();

  // dynamic page renderer with a missing slug
  const q=await b.newPage();
  await q.goto('http://localhost:4321/p/?s=does-not-exist',{waitUntil:'networkidle0',timeout:60000});
  await sleep(1800);
  out.pageRenderer=await q.evaluate(()=>document.querySelector('#pgTitle').textContent);
  await q.close();

  console.log(JSON.stringify(out,null,1));
  console.log('front errors:',errs.length?errs:'none');
  console.log('admin errors:',aerr.length?aerr:'none');
  await b.close();
})();
