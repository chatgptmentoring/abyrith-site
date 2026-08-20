let puppeteer;
const path=require('path'); const OUT=path.join(__dirname,'shots2');
require('fs').mkdirSync(OUT,{recursive:true});
(async()=>{
  puppeteer=(await import('puppeteer')).default;
  const b=await puppeteer.launch({args:['--no-sandbox','--font-render-hinting=none']});
  const p=await b.newPage();
  const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE: '+m.text());});
  p.on('requestfailed',r=>errs.push('REQFAIL: '+r.url().slice(0,90)));
  await p.setViewport({width:1440,height:900});
  await p.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
  await new Promise(r=>setTimeout(r,2500));
  await p.screenshot({path:path.join(OUT,'01-hero.jpg'),quality:82,type:'jpeg'});

  // places
  await p.evaluate(()=>document.querySelector('.places-head').scrollIntoView());
  await new Promise(r=>setTimeout(r,1800));
  await p.screenshot({path:path.join(OUT,'02-places.jpg'),quality:82,type:'jpeg'});

  // open the corrupted Axiom record (last card)
  await p.evaluate(()=>document.querySelector('#archive').scrollIntoView());
  await new Promise(r=>setTimeout(r,1200));
  await p.evaluate(()=>{const c=document.querySelectorAll('.card');c[c.length-1].click();});
  await new Promise(r=>setTimeout(r,900));
  await p.screenshot({path:path.join(OUT,'03-axiom-corrupt.jpg'),quality:82,type:'jpeg'});
  const corrupt=await p.evaluate(()=>({
     name:document.querySelector('#lbName').textContent.slice(0,30),
     text:document.querySelector('#lbText').textContent.slice(0,60),
     cls:document.querySelector('#lb').className
  }));
  // confirm it re-scrambles
  const t1=await p.evaluate(()=>document.querySelector('#lbText').textContent);
  await new Promise(r=>setTimeout(r,500));
  const t2=await p.evaluate(()=>document.querySelector('#lbText').textContent);
  await p.evaluate(()=>document.querySelector('#lbClose').click());

  // open a normal record to confirm it still reads plainly
  await new Promise(r=>setTimeout(r,400));
  await p.evaluate(()=>document.querySelectorAll('.card')[0].click());
  await new Promise(r=>setTimeout(r,700));
  const normal=await p.evaluate(()=>({name:document.querySelector('#lbName').textContent,
     text:document.querySelector('#lbText').textContent.slice(0,45), cls:document.querySelector('#lb').className}));
  await p.evaluate(()=>document.querySelector('#lbClose').click());

  await p.setViewport({width:390,height:844,isMobile:true});
  await p.reload({waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,2000));
  await p.screenshot({path:path.join(OUT,'04-mobile-hero.jpg'),quality:82,type:'jpeg'});

  console.log(JSON.stringify({corrupt,glitching:t1!==t2,normal},null,1));
  console.log(errs.length?errs.join('\n'):'NO ERRORS');
  await b.close();
})();
