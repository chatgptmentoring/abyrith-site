let puppeteer; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  puppeteer=(await import('puppeteer')).default;
  const b=await puppeteer.launch({args:['--no-sandbox','--font-render-hinting=none']});
  const out={};
  for (const vw of [1440, 390]) {
    const p=await b.newPage();
    const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.setViewport({width:vw,height:vw<500?844:900,isMobile:vw<500});
    await p.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
    await sleep(2200);
    const top=await p.evaluate(()=>document.querySelector('.word-drop').getBoundingClientRect().top+scrollY);
    const widths=[];
    for (const frac of [0,0.3,0.55,0.8,1]) {
      await p.evaluate((t,f)=>window.scrollTo(0,t-innerHeight+f*innerHeight), top, frac);
      await sleep(420);
      widths.push(await p.evaluate(()=>{
        const d=document.querySelector('.word-drop__text');
        const r=d.getBoundingClientRect();
        return {w:Math.round(r.width), overflowX:document.documentElement.scrollWidth-document.documentElement.clientWidth,
                on:d.querySelectorAll('.wd-on').length};
      }));
    }
    out['vw'+vw]={widths, errs:errs.length?errs:'none'};
    await p.close();
  }
  console.log(JSON.stringify(out,null,1));
  await b.close();
})();
