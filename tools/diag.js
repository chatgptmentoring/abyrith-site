let puppeteer;
(async()=>{
  puppeteer=(await import('puppeteer')).default;
  const b=await puppeteer.launch({args:['--no-sandbox','--font-render-hinting=none']});
  const p=await b.newPage();
  for(const w of [1920,1600,1440,1280,1100,1000,950]){
    await p.setViewport({width:w,height:900});
    await p.goto('http://localhost:4321',{waitUntil:'networkidle0',timeout:60000});
    await new Promise(r=>setTimeout(r,900));
    const d=await p.evaluate(()=>{
      const t=document.querySelector('.hero__title');
      const col=document.querySelector('.hero__copy');
      const h=document.querySelector('.hero__title-c');
      const cs=getComputedStyle(t);
      return {
        font:Math.round(parseFloat(cs.fontSize)),
        titleBox:Math.round(t.getBoundingClientRect().width),
        titleScroll:t.scrollWidth,
        colBox:Math.round(col.getBoundingClientRect().width),
        overflow:Math.round(t.scrollWidth-t.getBoundingClientRect().width),
        hRight:Math.round(h.getBoundingClientRect().right),
        colRight:Math.round(col.getBoundingClientRect().right),
        clip:cs.webkitBackgroundClip||cs.backgroundClip
      };
    });
    console.log(w+' -> '+JSON.stringify(d));
  }
  await b.close();
})();
