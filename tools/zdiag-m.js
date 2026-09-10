let puppeteer; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  puppeteer=(await import('puppeteer')).default;
  const b=await puppeteer.launch({args:['--no-sandbox']});
  const p=await b.newPage();
  await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
  await p.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
  await sleep(2200);
  await p.evaluate(()=>document.querySelector('#platesHunter .plate').click());
  await sleep(1500);
  console.log(JSON.stringify(await p.evaluate(()=>{
    const st=document.querySelector('#zoomStage').getBoundingClientRect();
    const im=document.querySelector('#zoomImg');
    const ir=im.getBoundingClientRect();
    const cs=getComputedStyle(im);
    return { stage:Math.round(st.width)+'x'+Math.round(st.height),
             img:Math.round(ir.width)+'x'+Math.round(ir.height),
             natural:im.naturalWidth+'x'+im.naturalHeight,
             maxW:cs.maxWidth, maxH:cs.maxHeight, objFit:cs.objectFit,
             overflowsStage: ir.width>st.width+1 || ir.height>st.height+1,
             zoomBg:getComputedStyle(document.querySelector('#zoom')).backgroundColor };
  }),null,1));
  await b.close();
})();
