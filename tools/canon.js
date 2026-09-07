let puppeteer; const path=require('path');
const OUT=path.join(__dirname,'shots8'); require('fs').mkdirSync(OUT,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  puppeteer=(await import('puppeteer')).default;
  const b=await puppeteer.launch({args:['--no-sandbox','--font-render-hinting=none']});
  const p=await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push('JS: '+e.message));
  p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE: '+m.text());});
  p.on('response',r=>{if(r.status()>=400)errs.push('HTTP'+r.status()+' '+r.url().slice(-44));});
  await p.setViewport({width:1440,height:1000});
  await p.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
  await sleep(2600);

  // scroll everything so lazy images load
  const H=await p.evaluate(()=>document.body.scrollHeight);
  for(let y=0;y<H;y+=500){ await p.evaluate(v=>scrollTo(0,v),y); await sleep(200); }
  await sleep(1500);

  const out=await p.evaluate(()=>{
    const txt=document.body.innerText;
    return {
      badWords:['Kaelmarch','Lucious','Athelgard','seven cycles','loss of his sight','Captain of the Guard']
        .filter(w=>txt.includes(w)),
      caelmarch:txt.includes('Caelmarch'),
      lucius:txt.includes('Lucius'),
      roots:!!document.querySelector('.roots'),
      rootParts:[...document.querySelectorAll('.roots__part b')].map(e=>e.textContent),
      facts:!!document.querySelector('.facts'),
      placeImgsBroken:[...document.querySelectorAll('#places img,#artefacts img')]
        .filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.getAttribute('src')),
      pins:document.querySelectorAll('.pin').length,
      cms:document.querySelectorAll('[data-cms]').length
    };
  });
  await p.evaluate(()=>document.querySelector('.roots').scrollIntoView({block:'center'}));
  await sleep(1200);
  await p.screenshot({path:path.join(OUT,'roots.jpg'),quality:88,type:'jpeg'});
  await p.evaluate(()=>document.querySelector('.facts').scrollIntoView({block:'center'}));
  await sleep(1200);
  await p.screenshot({path:path.join(OUT,'facts.jpg'),quality:88,type:'jpeg'});
  console.log(JSON.stringify(out,null,1));
  console.log(errs.length?errs.join('\n'):'NO ERRORS');
  await b.close();
})();
