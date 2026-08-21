let puppeteer; const path=require('path');
(async()=>{
  puppeteer=(await import('puppeteer')).default;
  const b=await puppeteer.launch({args:['--no-sandbox','--font-render-hinting=none']});
  const p=await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.setViewport({width:1440,height:900});
  await p.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
  await new Promise(r=>setTimeout(r,2400));
  await p.screenshot({path:path.join(__dirname,'shots2','06-hero-fixed.jpg'),quality:88,type:'jpeg'});
  await (await p.$('.hero__title')).screenshot({path:path.join(__dirname,'shots2','07-title.jpg'),quality:94,type:'jpeg'});
  console.log(JSON.stringify(await p.evaluate(()=>({
    beamGone: !document.querySelector('.rift__beam'),
    glowKept: !!document.querySelector('.rift__glow'),
    seams: document.querySelectorAll('.hero__seam').length
  }))));
  console.log(errs.length?errs:'no js errors');
  await b.close();
})();
