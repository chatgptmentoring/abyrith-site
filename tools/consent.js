let puppeteer; const path=require('path');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  puppeteer=(await import('puppeteer')).default;
  const b=await puppeteer.launch({args:['--no-sandbox','--font-render-hinting=none']});
  const p=await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push('JS: '+e.message));
  await p.setViewport({width:1440,height:900});
  await p.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
  await sleep(2600);
  await p.screenshot({path:path.join(__dirname,'shots4','03-gdpr.jpg'),quality:88,type:'jpeg'});
  const out={};
  out.overlapsCTA = await p.evaluate(()=>{
    const g=document.querySelector('#gdpr').getBoundingClientRect();
    const c=document.querySelector('#wantBtn').getBoundingClientRect();
    return !(g.right<c.left||g.left>c.right||g.bottom<c.top||g.top>c.bottom);
  });
  // decline
  await p.click('#gdprMin'); await sleep(800);
  out.afterDecline = await p.evaluate(()=>({consent:localStorage.getItem('abyrith.consent.v1'),
                                            hidden:document.querySelector('#gdpr').hidden}));
  // enrol while declined -> must still work, but must NOT be remembered
  await p.click('#wantBtn'); await sleep(800);
  await p.type('#enFirst','Declined');
  await p.type('#enEmail','declined'+Date.now()+'@abyrith.test');
  await p.click('#enBtn'); await sleep(4200);
  out.declinedEnrol = await p.evaluate(()=>({
    verdictShown: document.querySelector('#scrVerdict').textContent,
    storedRecord: localStorage.getItem('abyrith.record.v1'),
    welcomeHidden: document.querySelector('#welcome').hidden
  }));
  await p.reload({waitUntil:'networkidle0'}); await sleep(2200);
  out.afterReload = await p.evaluate(()=>({
    noticeShown: document.querySelector('#gdpr').hidden===false,
    welcomeHidden: document.querySelector('#welcome').hidden
  }));
  console.log(JSON.stringify(out,null,1));
  console.log(errs.length?errs.join('\n'):'NO ERRORS');
  await b.close();
})();
