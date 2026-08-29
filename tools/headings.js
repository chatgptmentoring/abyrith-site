let puppeteer; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  puppeteer=(await import('puppeteer')).default;
  const b=await puppeteer.launch({args:['--no-sandbox']});
  const p=await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push('JS: '+e.message));
  await p.setViewport({width:1440,height:900});
  await p.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
  await sleep(2500);
  // slow, human-like scroll all the way down
  const H=await p.evaluate(()=>document.body.scrollHeight);
  for(let y=0;y<H;y+=450){ await p.evaluate(v=>window.scrollTo(0,v),y); await sleep(230); }
  await sleep(2500);
  const res=await p.evaluate(()=>[...document.querySelectorAll('.display, .places-title')].map(h=>{
    const chars=[...h.querySelectorAll('[data-char]')];
    const minChar = chars.length ? Math.min(...chars.map(c=>+getComputedStyle(c).opacity)) : null;
    return {text:h.innerText.replace(/\s+/g,' ').trim().slice(0,26),
            el:+getComputedStyle(h).opacity, chars:chars.length, minCharOpacity:minChar};
  }));
  console.log(JSON.stringify(res,null,1));
  console.log('all visible:', res.every(r=>r.el===1 && (r.chars===0 || r.minCharOpacity===1)));
  console.log(errs.length?errs.join('\n'):'NO ERRORS');
  await b.close();
})();
