let puppeteer; const path=require('path');
const OUT=path.join(__dirname,'shots5'); require('fs').mkdirSync(OUT,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  puppeteer=(await import('puppeteer')).default;
  const b=await puppeteer.launch({args:['--no-sandbox','--font-render-hinting=none']});
  const p=await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push('JS: '+e.message));
  p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE: '+m.text());});
  await p.setViewport({width:1440,height:900});
  await p.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
  await sleep(2500);

  const top = await p.evaluate(()=>document.querySelector('.word-drop').getBoundingClientRect().top + window.scrollY);
  const steps=[];
  // approach the word-drop gradually
  for (const frac of [0.0,0.25,0.45,0.6,0.75,0.9,1.0,1.15]) {
    const y = Math.max(0, top - 900 + frac*900);
    await p.evaluate(v=>window.scrollTo(0,v), y);
    await sleep(420);
    const s = await p.evaluate(()=>{
      const d=document.querySelector('.word-drop__text');
      return {text:d.textContent, on:d.querySelectorAll('.wd-on').length, off:d.querySelectorAll('.wd-off').length};
    });
    steps.push({frac, ...s});
  }
  await p.screenshot({path:path.join(OUT,'01-mid.jpg'),quality:88,type:'jpeg'});

  // scroll fully past it
  await p.evaluate(v=>window.scrollTo(0,v), top+1400);
  await sleep(900);
  const past = await p.evaluate(()=>{
    const d=document.querySelector('.word-drop__text');
    return {text:d.textContent, on:d.querySelectorAll('.wd-on').length};
  });
  // and scroll it back into view centred
  await p.evaluate(()=>document.querySelector('.word-drop').scrollIntoView({block:'center'}));
  await sleep(900);
  await p.screenshot({path:path.join(OUT,'02-resolved.jpg'),quality:88,type:'jpeg'});
  const centred = await p.evaluate(()=>{
    const d=document.querySelector('.word-drop__text');
    return {text:d.textContent, on:d.querySelectorAll('.wd-on').length,
            srLabel:document.querySelector('.word-drop .sr-only')?.textContent,
            ariaHidden:d.getAttribute('aria-hidden')};
  });

  console.log(JSON.stringify({steps,past,centred},null,1));
  console.log(errs.length?errs.join('\n'):'NO ERRORS');
  await b.close();
})();
