let puppeteer; const path=require('path');
const OUT=path.join(__dirname,'shots12'); require('fs').mkdirSync(OUT,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  puppeteer=(await import('puppeteer')).default;
  const b=await puppeteer.launch({args:['--no-sandbox','--font-render-hinting=none']});
  const out={}; const errs=[];
  const p=await b.newPage();
  p.on('pageerror',e=>errs.push('HOME JS: '+e.message));
  p.on('console',m=>{const t=m.text(); if(m.type()==='error' && !/402|Failed to load resource/.test(t)) errs.push('HOME: '+t);});
  await p.setViewport({width:1440,height:1000});
  await p.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
  await sleep(2500);
  const H=await p.evaluate(()=>document.body.scrollHeight);
  for(let y=0;y<H;y+=560){ await p.evaluate(v=>scrollTo(0,v),y); await sleep(160); }
  await sleep(1200);
  out.home=await p.evaluate(()=>({
    plates:document.querySelectorAll('.plate').length,
    brokenPlates:[...document.querySelectorAll('.plate img')].filter(i=>i.complete&&i.naturalWidth===0).length,
    atlasNav:document.querySelector('.nav__links a[href="/atlas/"]')?.textContent,
    atlasCard:!!document.querySelector('.atlas-invitation'),
    pins:document.querySelectorAll('.pin').length,
    ringIntro:document.querySelector('.ring__intro').innerText.includes('clockwise'),
    zoomExists:!!document.querySelector('#zoom')
  }));
  // zoom still works after the merge
  await p.evaluate(()=>document.querySelector('#platesCities .plate').click());
  await sleep(1300);
  out.zoom=await p.evaluate(()=>{
    const st=document.querySelector('#zoomStage').getBoundingClientRect();
    const ir=document.querySelector('#zoomImg').getBoundingClientRect();
    return { open:document.querySelector('#zoom').hidden===false,
             name:document.querySelector('#zoomName').textContent,
             fits: ir.width<=st.width+1 && ir.height<=st.height+1 };
  });
  await p.evaluate(()=>document.querySelector('#zoomClose').click());
  await p.close();

  // the atlas the other session built must still work
  const a=await b.newPage();
  a.on('pageerror',e=>errs.push('ATLAS JS: '+e.message));
  a.on('console',m=>{const t=m.text(); if(m.type()==='error' && !/402|Failed to load resource/.test(t)) errs.push('ATLAS: '+t);});
  await a.setViewport({width:1440,height:900});
  const resp=await a.goto('http://localhost:4321/atlas/',{waitUntil:'networkidle0',timeout:60000});
  await sleep(4500);
  out.atlas={ status:resp.status(), canvas:await a.evaluate(()=>!!document.querySelector('canvas')) };
  await a.screenshot({path:path.join(OUT,'atlas.jpg'),quality:84,type:'jpeg'});
  await a.close();

  console.log(JSON.stringify(out,null,1));
  console.log(errs.length?errs.join('\n'):'NO ERRORS');
  await b.close();
})();
