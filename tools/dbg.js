let puppeteer; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  puppeteer=(await import('puppeteer')).default;
  const b=await puppeteer.launch({args:['--no-sandbox']});
  const p=await b.newPage();
  await p.setViewport({width:1440,height:900});
  await p.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
  await sleep(2500);
  const before=await p.evaluate(()=>{
    const h=document.querySelector('.world .display');
    return {shown:h.dataset.shown||null, inClass:h.classList.contains('in'),
            elOpacity:getComputedStyle(h).opacity, chars:h.querySelectorAll('[data-char]').length,
            charOpacity:+getComputedStyle(h.querySelector('[data-char]')).opacity,
            html:h.innerHTML.slice(0,150)};
  });
  await p.evaluate(()=>document.querySelector('#world').scrollIntoView({block:'center'}));
  await sleep(2200);
  const after=await p.evaluate(()=>{
    const h=document.querySelector('.world .display');
    const c=h.querySelector('[data-char]');
    return {shown:h.dataset.shown||null, inClass:h.classList.contains('in'),
            elOpacity:getComputedStyle(h).opacity, elInline:h.style.cssText,
            charOpacity:+getComputedStyle(c).opacity, charInline:c.style.cssText,
            parentOfChar:c.parentElement.className, parentOpacity:getComputedStyle(c.parentElement).opacity};
  });
  console.log('BEFORE', JSON.stringify(before,null,1));
  console.log('AFTER ', JSON.stringify(after,null,1));
  await b.close();
})();
