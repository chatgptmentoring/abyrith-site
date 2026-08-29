let puppeteer; const path=require('path');
const OUT=path.join(__dirname,'shots5');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  puppeteer=(await import('puppeteer')).default;
  const b=await puppeteer.launch({args:['--no-sandbox','--font-render-hinting=none']});
  const p=await b.newPage();
  await p.setViewport({width:1440,height:900});
  await p.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
  await sleep(2400);
  const top=await p.evaluate(()=>document.querySelector('.word-drop').getBoundingClientRect().top+scrollY);
  let i=1;
  for (const frac of [0.18,0.42,0.66,0.95]) {
    await p.evaluate(v=>window.scrollTo(0,v), top-900+frac*900);
    await sleep(500);
    const el=await p.$('.word-drop'); await el.screenshot({path:path.join(OUT,`wd-${i++}.jpg`),quality:92,type:'jpeg'});
  }
  await b.close();
})();
