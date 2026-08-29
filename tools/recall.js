let puppeteer; const path=require('path');
const OUT=path.join(__dirname,'shots3');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  puppeteer=(await import('puppeteer')).default;
  const b=await puppeteer.launch({args:['--no-sandbox']});
  const p=await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push('JS: '+e.message));
  await p.setViewport({width:1440,height:900});
  await p.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
  await p.evaluate(()=>localStorage.clear());
  const tag='amb'+Date.now();
  const out={};

  // enrol two people sharing a first name
  for (const [f,l,e] of [['Kaelan','Vance',tag+'a@abyrith.test'],['Kaelan','Roth',tag+'b@abyrith.test']]) {
    await p.reload({waitUntil:'networkidle0'}); await sleep(1500);
    await p.evaluate(()=>localStorage.clear());
    await p.click('#wantBtn'); await sleep(700);
    await p.type('#enFirst',f); await p.type('#enLast',l); await p.type('#enEmail',e);
    await p.click('#enBtn'); await sleep(4200);
  }

  // recall by first name only -> expect ambiguous
  await p.reload({waitUntil:'networkidle0'}); await sleep(1500);
  await p.evaluate(()=>localStorage.clear());
  await p.click('#recallLink'); await sleep(700);
  await p.type('#rcFirst','Kaelan');
  await p.click('#rcBtn'); await sleep(1800);
  out.ambiguous = await p.evaluate(()=>document.querySelector('#rcMsg').textContent);
  await p.screenshot({path:path.join(OUT,'06-ambiguous.jpg'),quality:86,type:'jpeg'});

  // add last name -> expect found
  await p.type('#rcLast','Roth');
  await p.click('#rcBtn'); await sleep(2200);
  out.afterLastName = await p.evaluate(()=>({
    step: document.querySelector('#scrResult').hidden ? 'still-recall' : 'result',
    verdict: document.querySelector('#scrVerdict').textContent,
    body: document.querySelector('#scrBody').textContent.slice(0,40),
    welcome: document.querySelector('.welcome__text').textContent
  }));
  await p.screenshot({path:path.join(OUT,'07-recalled.jpg'),quality:86,type:'jpeg'});

  // recall by email on a clean slate
  await p.reload({waitUntil:'networkidle0'}); await sleep(1500);
  await p.evaluate(()=>localStorage.clear());
  await p.click('#recallLink'); await sleep(700);
  await p.type('#rcEmail',tag+'a@abyrith.test');
  await p.click('#rcBtn'); await sleep(2200);
  out.byEmail = await p.evaluate(()=>({
    step: document.querySelector('#scrResult').hidden ? 'still-recall' : 'result',
    welcome: document.querySelector('.welcome__text').textContent
  }));

  // unknown name
  await p.reload({waitUntil:'networkidle0'}); await sleep(1500);
  await p.click('#recallLink'); await sleep(700);
  await p.type('#rcFirst','Zzzznobody');
  await p.click('#rcBtn'); await sleep(1800);
  out.unknown = await p.evaluate(()=>document.querySelector('#rcMsg').textContent);

  console.log(JSON.stringify(out,null,1));
  console.log(errs.length?errs.join('\n'):'NO ERRORS');
  await b.close();
})();
