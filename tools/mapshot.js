let puppeteer; const path=require('path');
const OUT=path.join(__dirname,'shots6'); require('fs').mkdirSync(OUT,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  puppeteer=(await import('puppeteer')).default;
  const b=await puppeteer.launch({args:['--no-sandbox','--font-render-hinting=none']});
  const p=await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push('JS: '+e.message));
  p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE: '+m.text());});
  p.on('requestfailed',r=>errs.push('REQFAIL: '+r.url().slice(-46)));
  await p.setViewport({width:1440,height:1000});
  await p.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
  await sleep(2200);
  await p.evaluate(()=>document.querySelector('#map').scrollIntoView({block:'start'}));
  await sleep(1800);
  // force all pin labels visible so I can check alignment
  await p.addStyleTag({content:'.pin__name{opacity:1 !important;transform:none !important}'});
  await sleep(300);
  const el=await p.$('#mapStage');
  await el.screenshot({path:path.join(OUT,'map-pins.jpg'),quality:92,type:'jpeg'});
  console.log(JSON.stringify(await p.evaluate(()=>({
    pins:document.querySelectorAll('.pin').length,
    artefacts:document.querySelectorAll('#artefacts .place').length,
    imgW:document.querySelector('.ringmap__img').naturalWidth
  }))));
  console.log(errs.length?errs.join('\n'):'NO ERRORS');
  await b.close();
})();
