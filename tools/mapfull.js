let puppeteer; const path=require('path');
const OUT=path.join(__dirname,'shots6');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  puppeteer=(await import('puppeteer')).default;
  const b=await puppeteer.launch({args:['--no-sandbox','--font-render-hinting=none']});
  const p=await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push('JS: '+e.message));
  p.on('requestfailed',r=>errs.push('REQFAIL: '+r.url().slice(-46)));
  await p.setViewport({width:1440,height:1000});
  await p.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
  await sleep(2200);
  await p.evaluate(()=>document.querySelector('#map').scrollIntoView({block:'start'}));
  await sleep(1600);
  // click Solkar (index 3)
  await p.evaluate(()=>document.querySelector('.pin[data-i="3"]').click());
  await sleep(900);
  await p.screenshot({path:path.join(OUT,'ring-solkar.jpg'),quality:88,type:'jpeg'});
  const sel=await p.evaluate(()=>({
    tag:document.querySelector('#mpTag').textContent,
    name:document.querySelector('#mpName').textContent,
    text:document.querySelector('#mpText').textContent.slice(0,60),
    detailShown:document.querySelector('#mapDetail').hidden===false,
    emptyHidden:document.querySelector('#mapEmpty').hidden,
    onPins:document.querySelectorAll('.pin.is-on').length
  }));
  // artefacts
  await p.evaluate(()=>document.querySelector('#artefacts').scrollIntoView({block:'start'}));
  await sleep(1800);
  await p.screenshot({path:path.join(OUT,'artefacts.jpg'),quality:86,type:'jpeg'});
  const art=await p.evaluate(()=>[...document.querySelectorAll('#artefacts .place')].map(f=>({
    name:f.querySelector('.place__name').textContent,
    loaded:f.querySelector('img').naturalWidth>0
  })));
  // mobile
  await p.setViewport({width:390,height:844,isMobile:true});
  await p.reload({waitUntil:'networkidle0'}); await sleep(2000);
  await p.evaluate(()=>document.querySelector('#map').scrollIntoView({block:'start'}));
  await sleep(1400);
  await p.screenshot({path:path.join(OUT,'ring-mobile.jpg'),quality:84,type:'jpeg'});
  const mob=await p.evaluate(()=>({overflowX:document.documentElement.scrollWidth-document.documentElement.clientWidth}));
  console.log(JSON.stringify({sel,art,mob},null,1));
  console.log(errs.length?errs.join('\n'):'NO ERRORS');
  await b.close();
})();
