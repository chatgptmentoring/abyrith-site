let puppeteer; const path=require('path');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  puppeteer=(await import('puppeteer')).default;
  const b=await puppeteer.launch({args:['--no-sandbox']});
  const out={};
  // mobile
  const p=await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push('JS: '+e.message));
  await p.setViewport({width:390,height:844,isMobile:true});
  await p.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
  await sleep(3000);
  await p.screenshot({path:path.join(__dirname,'shots3','08-mobile.jpg'),quality:84,type:'jpeg'});
  out.mobile=await p.evaluate(()=>({
    heroTitleOpacity:+getComputedStyle(document.querySelector('.hero__title')).opacity,
    btnWidth:Math.round(document.querySelector('#wantBtn').getBoundingClientRect().width),
    bodyOverflowX:document.documentElement.scrollWidth-document.documentElement.clientWidth
  }));
  await p.click('#wantBtn'); await sleep(900);
  await p.screenshot({path:path.join(__dirname,'shots3','09-mobile-modal.jpg'),quality:84,type:'jpeg'});
  await p.close();

  // reduced motion
  const p2=await b.newPage();
  p2.on('pageerror',e=>errs.push('RM JS: '+e.message));
  await p2.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await p2.setViewport({width:1440,height:900});
  await p2.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
  await sleep(2200);
  out.reducedMotion=await p2.evaluate(()=>({
    heroVisible:+getComputedStyle(document.querySelector('.hero__title')).opacity,
    coverVisible:+getComputedStyle(document.querySelector('.hero__cover')).opacity,
    revealsIn:document.querySelectorAll('.reveal.in').length
  }));
  await p2.close();
  console.log(JSON.stringify(out,null,1));
  console.log(errs.length?errs.join('\n'):'NO ERRORS');
  await b.close();
})();
