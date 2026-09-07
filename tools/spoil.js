let puppeteer; const path=require('path');
const OUT=path.join(__dirname,'shots9'); require('fs').mkdirSync(OUT,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  puppeteer=(await import('puppeteer')).default;
  const b=await puppeteer.launch({args:['--no-sandbox','--font-render-hinting=none']});
  const p=await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push('JS: '+e.message));
  p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE: '+m.text());});
  await p.setViewport({width:1440,height:1000});
  await p.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
  await sleep(2600);
  const H=await p.evaluate(()=>document.body.scrollHeight);
  for(let y=0;y<H;y+=520){ await p.evaluate(v=>scrollTo(0,v),y); await sleep(190); }
  await sleep(1400);

  const SPOILERS=['Absent Light','Ith —','binding that tells','Museum of Civilization',
    'killing every one of his own squad','98,000','complete in itself','severed',
    'radiance','Rift events: 0','hunts by sound and pressure','Titanfall','Star-Bone',
    'what their destiny is actually worth','bought and sold for','Grand Alignment',
    'Volt-Stalker','microgram'];
  const out=await p.evaluate((SP)=>{
    const txt=document.body.innerText;
    const html=document.documentElement.innerHTML;
    return {
      leaksVisible: SP.filter(w=>txt.includes(w)),
      leaksInSource: SP.filter(w=>html.includes(w)),
      heroLine: document.querySelector('.hero__line').innerText.replace(/\s+/g,' '),
      worldTitle: document.querySelector('.world .display').innerText.replace(/\s+/g,' ').split(' ').slice(0,8).join(' '),
      lede: document.querySelector('.world__col .lede').innerText.replace(/\s+/g,' '),
      prophecy: document.querySelector('.roots__verse')?.innerText,
      prophecyLine: document.querySelector('.roots__text')?.innerText,
      facts: document.querySelector('.facts__row').innerText.replace(/\s+/g,' '),
      erikTail: document.querySelector('.world__close').innerText.slice(-90)
    };
  }, SPOILERS);
  await p.evaluate(()=>document.querySelector('#hero').scrollIntoView());
  await sleep(1400);
  await p.screenshot({path:path.join(OUT,'hero.jpg'),quality:88,type:'jpeg'});
  await p.evaluate(()=>document.querySelector('.roots').scrollIntoView({block:'center'}));
  await sleep(1200);
  await p.screenshot({path:path.join(OUT,'prophecy.jpg'),quality:88,type:'jpeg'});
  console.log(JSON.stringify(out,null,1));
  console.log(errs.length?errs.join('\n'):'NO ERRORS');
  await b.close();
})();
