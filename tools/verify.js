let puppeteer; const path=require('path');
(async()=>{
  puppeteer=(await import('puppeteer')).default;
  const b=await puppeteer.launch({args:['--no-sandbox','--font-render-hinting=none']});
  const p=await b.newPage();
  const fails=[]; p.on('requestfailed',r=>fails.push(r.url().slice(-40)));
  const bad=[]; p.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url().slice(-42));});
  p.on('pageerror',e=>fails.push('JS: '+e.message));
  await p.setViewport({width:1440,height:900});
  await p.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
  await new Promise(r=>setTimeout(r,2200));
  await (await p.$('.hero__title')).screenshot({path:path.join(__dirname,'shots2','05-seam.jpg'),quality:92,type:'jpeg'});
  const geo=await p.evaluate(()=>{
    const a=document.querySelector('.hero__title-a'),s=document.querySelector('.hero__seam'),b=document.querySelector('.hero__title-b');
    const A=a.getBoundingClientRect(),S=s.getBoundingClientRect(),B=b.getBoundingClientRect();
    return {before:a.textContent,after:b.textContent,
      seamAfterA:Math.round(S.left-A.right),seamBeforeB:Math.round(B.left-S.right),
      icons:[...document.querySelectorAll('link[rel*=icon],link[rel=manifest]')].map(l=>l.getAttribute('href'))};
  });
  console.log(JSON.stringify(geo,null,1));
  console.log('failed:',fails.length?fails:'none');
  console.log('http>=400:',bad.length?bad:'none');
  await b.close();
})();
