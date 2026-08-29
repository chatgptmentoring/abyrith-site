let puppeteer; const path=require('path');
const OUT=path.join(__dirname,'shots3'); require('fs').mkdirSync(OUT,{recursive:true});
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
  await sleep(3200);
  await p.screenshot({path:path.join(OUT,'01-hero.jpg'),quality:86,type:'jpeg'});

  const heroVis=await p.evaluate(()=>{
    const g=s=>{const e=document.querySelector(s);return e?+getComputedStyle(e).opacity:null;};
    return {title:g('.hero__title'),cover:g('.hero__cover'),form:g('.hero__form'),
            sub:g('.hero__sub'),seam:g('.hero__seam'),anime:typeof window.anime};
  });

  // open the screening modal
  await p.click('#wantBtn');
  await sleep(900);
  await p.screenshot({path:path.join(OUT,'02-modal.jpg'),quality:86,type:'jpeg'});

  const uniq='flow'+Date.now();
  await p.type('#enFirst','Erik');
  await p.type('#enLast','Swordstrong');
  await p.type('#enEmail',uniq+'@abyrith.test');
  await p.click('#enBtn');
  await sleep(1200);
  await p.screenshot({path:path.join(OUT,'03-scanning.jpg'),quality:86,type:'jpeg'});
  await sleep(2600);
  await p.screenshot({path:path.join(OUT,'04-result.jpg'),quality:86,type:'jpeg'});

  const res=await p.evaluate(()=>({
    verdict:document.querySelector('#scrVerdict').textContent,
    desig:document.querySelector('#scrDesig').textContent,
    enrolled:document.querySelector('#scrEnrolled').textContent,
    sigilPaths:document.querySelectorAll('#scrSigil svg *').length,
    stored:localStorage.getItem('abyrith.record.v1'),
    welcome:document.querySelector('#welcome').hidden===false
      ? document.querySelector('.welcome__text').textContent : null
  }));

  await p.click('#scrDone'); await sleep(500);

  // reload -> should be recognised from storage
  await p.reload({waitUntil:'networkidle0'}); await sleep(2500);
  const back=await p.evaluate(()=>({
    welcomeShown:document.querySelector('#welcome').hidden===false,
    welcomeText:document.querySelector('.welcome__text').textContent
  }));
  await p.screenshot({path:path.join(OUT,'05-returning.jpg'),quality:86,type:'jpeg'});

  console.log(JSON.stringify({heroVis,res:{...res,stored:res.stored?'saved':'none'},back},null,1));
  console.log(errs.length?errs.join('\n'):'NO ERRORS');
  await b.close();
})();
