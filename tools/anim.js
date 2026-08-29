let puppeteer; const path=require('path');
const OUT=path.join(__dirname,'shots4'); require('fs').mkdirSync(OUT,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  puppeteer=(await import('puppeteer')).default;
  const b=await puppeteer.launch({args:['--no-sandbox','--font-render-hinting=none']});
  const p=await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push('JS: '+e.message));
  p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE: '+m.text());});
  p.on('requestfailed',r=>errs.push('REQFAIL: '+r.url().slice(-50)));
  await p.setViewport({width:1440,height:900});
  await p.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
  await sleep(2600);
  const out={};
  out.gdprBefore = await p.evaluate(()=>document.querySelector('#gdpr').hidden);
  await p.screenshot({path:path.join(OUT,'01-gdpr.jpg'),quality:86,type:'jpeg'});

  // headings split?
  out.splits = await p.evaluate(()=>{
    const h=document.querySelector('.world .display');
    return {chars:h.querySelectorAll('[data-char]').length, text:h.innerText.replace(/\s+/g,' ').trim().slice(0,40)};
  });

  // scroll through and let things fire
  for (const sel of ['#world','.quote','#trailer','#archive','.places-head','#preorder']) {
    await p.evaluate(s=>document.querySelector(s).scrollIntoView({block:'center'}), sel);
    await sleep(1700);
  }
  await p.screenshot({path:path.join(OUT,'02-preorder.jpg'),quality:86,type:'jpeg'});

  out.after = await p.evaluate(()=>{
    const h=document.querySelector('.world .display');
    const bars=[...document.querySelectorAll('.player__bars i')].map(b=>getComputedStyle(b).transform);
    return {
      headingVisible:+getComputedStyle(h).opacity,
      headingChars:h.querySelectorAll('[data-char]').length,
      firstCharOpacity:+getComputedStyle(h.querySelector('[data-char]')).opacity,
      barsCollapsed:bars.every(t=>t.includes('0)')||t==='matrix(1, 0, 0, 0, 0, 0)'),
      riftScale:getComputedStyle(document.querySelector('#riftline')).transform,
      wordDrop:document.querySelector('.word-drop__text').textContent,
      quoteWords:document.querySelectorAll('.quote blockquote [data-word]').length,
      cardsIn:document.querySelectorAll('.card.in').length,
      tallyShown:document.querySelector('#tally').hidden===false
    };
  });

  // scroll back to hero, test gdpr accept
  await p.evaluate(()=>window.scrollTo(0,0)); await sleep(900);
  await p.click('#gdprAll'); await sleep(900);
  out.gdprAfterAccept = await p.evaluate(()=>({
    hidden:document.querySelector('#gdpr').hidden,
    consent:localStorage.getItem('abyrith.consent.v1')
  }));

  console.log(JSON.stringify(out,null,1));
  console.log(errs.length?errs.join('\n'):'NO ERRORS');
  await b.close();
})();
