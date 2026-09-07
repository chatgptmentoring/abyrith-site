let puppeteer; const path=require('path');
const OUT=path.join(__dirname,'shots10'); require('fs').mkdirSync(OUT,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  puppeteer=(await import('puppeteer')).default;
  const b=await puppeteer.launch({args:['--no-sandbox','--font-render-hinting=none']});
  const p=await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push('JS: '+e.message));
  p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE: '+m.text());});
  await p.setViewport({width:1440,height:1000});
  await p.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
  await sleep(2400);
  await p.evaluate(()=>document.querySelector('#archive').scrollIntoView());
  await sleep(1600);

  const out={};
  out.artefacts = await p.evaluate(()=>[...document.querySelectorAll('#artefacts .place')].map(f=>({
    name:f.querySelector('.place__name').textContent,
    text:f.querySelector('.place__text').textContent.slice(0,70)
  })));

  // open the Seer (index 7)
  await p.evaluate(()=>document.querySelector('.card[data-i="7"]').click());
  await sleep(900);
  const el=await p.$('.lb__meta'); await el.screenshot({path:path.join(OUT,'seer-branch.jpg'),quality:94,type:'jpeg'});
  out.seer = await p.evaluate(()=>({
    name:document.querySelector('#lbName').textContent,
    text:document.querySelector('#lbText').textContent,
    branchShown:document.querySelector('#lbBranch').hidden===false,
    branch:document.querySelector('.branchtext')?.textContent,
    before:getComputedStyle(document.querySelector('.branchtext'),'::before').color
  }));
  await p.evaluate(()=>document.querySelector('#lbClose').click());
  await sleep(500);
  // a normal record must NOT show the branch line
  await p.evaluate(()=>document.querySelector('.card[data-i="0"]').click());
  await sleep(700);
  out.normalBranchHidden = await p.evaluate(()=>document.querySelector('#lbBranch').hidden);
  await p.evaluate(()=>document.querySelector('#lbClose').click());

  console.log(JSON.stringify(out,null,1));
  console.log(errs.length?errs.join('\n'):'NO ERRORS');
  await b.close();
})();
