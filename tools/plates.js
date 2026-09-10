let puppeteer; const path=require('path');
const OUT=path.join(__dirname,'shots11'); require('fs').mkdirSync(OUT,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// does the close button actually receive the tap at its own centre?
const hitTest=(sel)=>{
  const el=document.querySelector(sel);
  if(!el) return 'missing';
  const r=el.getBoundingClientRect();
  const cx=Math.round(r.left+r.width/2), cy=Math.round(r.top+r.height/2);
  const top=document.elementFromPoint(cx,cy);
  return { size:Math.round(r.width)+'x'+Math.round(r.height),
           at:cx+','+cy,
           hits: !!(top && (top===el || el.contains(top))),
           actual: top ? (top.id||top.className||top.tagName).toString().slice(0,34) : 'none' };
};
(async()=>{
  puppeteer=(await import('puppeteer')).default;
  const b=await puppeteer.launch({args:['--no-sandbox','--font-render-hinting=none']});
  const out={};
  // ── desktop ──
  const p=await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push('JS: '+e.message));
  p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE: '+m.text());});
  p.on('response',r=>{if(r.status()>=400)errs.push('HTTP'+r.status()+' '+r.url().slice(-42));});
  await p.setViewport({width:1440,height:1000});
  await p.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
  await sleep(2400);
  const H=await p.evaluate(()=>document.body.scrollHeight);
  for(let y=0;y<H;y+=520){ await p.evaluate(v=>scrollTo(0,v),y); await sleep(170); }
  await sleep(1500);
  out.grid=await p.evaluate(()=>({
    plates:document.querySelectorAll('.plate').length,
    broken:[...document.querySelectorAll('.plate img')].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.getAttribute('src'))
  }));
  await p.evaluate(()=>document.querySelector('#platesHunter').scrollIntoView({block:'center'}));
  await sleep(1200);
  await p.screenshot({path:path.join(OUT,'grid.jpg'),quality:86,type:'jpeg'});

  // open a plate and zoom
  await p.evaluate(()=>document.querySelector('#platesHunter .plate').click());
  await sleep(1200);
  await p.screenshot({path:path.join(OUT,'zoom-open.jpg'),quality:88,type:'jpeg'});
  out.zoomOpen=await p.evaluate(()=>({
    shown:document.querySelector('#zoom').hidden===false,
    name:document.querySelector('#zoomName').textContent,
    src:document.querySelector('#zoomImg').getAttribute('src'),
    lvl:document.querySelector('#zoomLvl').textContent
  }));
  await p.click('#zoomIn'); await sleep(350); await p.click('#zoomIn'); await sleep(500);
  out.afterZoomIn=await p.evaluate(()=>({
    lvl:document.querySelector('#zoomLvl').textContent,
    transform:document.querySelector('#zoomImg').style.transform,
    isZoomed:document.querySelector('#zoom').classList.contains('is-zoomed')
  }));
  await p.screenshot({path:path.join(OUT,'zoom-in.jpg'),quality:88,type:'jpeg'});
  await p.click('#zoomReset'); await sleep(400);
  out.afterReset=await p.evaluate(()=>document.querySelector('#zoomLvl').textContent);
  out.closeDesktop=await p.evaluate(hitTest,'#zoomClose');
  await p.click('#zoomClose'); await sleep(400);
  out.closedOK=await p.evaluate(()=>document.querySelector('#zoom').hidden);
  await p.close();

  // ── mobile ──
  const m=await b.newPage();
  m.on('pageerror',e=>errs.push('MOBILE JS: '+e.message));
  await m.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
  await m.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
  await sleep(2200);
  await m.evaluate(()=>document.querySelector('#platesHunter').scrollIntoView({block:'center'}));
  await sleep(1200);
  await m.evaluate(()=>document.querySelector('#platesHunter .plate').click());
  await sleep(1200);
  await m.screenshot({path:path.join(OUT,'zoom-mobile.jpg'),quality:86,type:'jpeg'});
  out.closeMobile=await m.evaluate(hitTest,'#zoomClose');
  await m.evaluate(()=>document.querySelector('#zoomClose').click());
  await sleep(400);
  out.mobileClosed=await m.evaluate(()=>document.querySelector('#zoom').hidden);
  // and the character-record close, the one reported broken
  await m.evaluate(()=>document.querySelector('#archive').scrollIntoView());
  await sleep(900);
  await m.evaluate(()=>document.querySelector('.card').click());
  await sleep(900);
  out.lbCloseMobile=await m.evaluate(hitTest,'#lbClose');
  await m.screenshot({path:path.join(OUT,'lb-mobile.jpg'),quality:86,type:'jpeg'});
  await m.evaluate(()=>document.querySelector('#lbClose').click());
  await sleep(400);
  out.lbClosed=await m.evaluate(()=>document.querySelector('#lb').hidden);
  out.overflowX=await m.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  await m.close();

  console.log(JSON.stringify(out,null,1));
  console.log(errs.length?errs.join('\n'):'NO ERRORS');
  await b.close();
})();
