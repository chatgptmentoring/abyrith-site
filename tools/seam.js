let puppeteer; const path=require('path');
(async()=>{
  puppeteer=(await import('puppeteer')).default;
  const b=await puppeteer.launch({args:['--no-sandbox','--font-render-hinting=none']});
  const p=await b.newPage();
  await p.setViewport({width:1440,height:900});
  await p.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
  await new Promise(r=>setTimeout(r,2200));
  const el=await p.$('.hero__title');
  await el.screenshot({path:path.join(__dirname,'shots2','05-seam.jpg'),quality:90,type:'jpeg'});
  console.log(JSON.stringify(await p.evaluate(()=>({
    a:document.querySelector('.hero__title-a').textContent,
    b:document.querySelector('.hero__title-b').textContent,
    full:document.querySelector('.hero__title').textContent
  }))));
  await b.close();
})();
