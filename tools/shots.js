let puppeteer;
const path = require('path');
const OUT = path.join(__dirname, 'shots');
require('fs').mkdirSync(OUT, { recursive: true });

(async () => {
  puppeteer = (await import('puppeteer')).default;
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--font-render-hinting=none'] });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
  page.on('requestfailed', r => errs.push('REQFAIL: ' + r.url().slice(0, 90)));

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://localhost:4321', { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2500));

  await page.screenshot({ path: path.join(OUT, '01-hero.jpg'), quality: 82, type: 'jpeg' });

  const sections = ['#world', '#trailer', '#census', '#archive', '#close'];
  for (const sel of sections) {
    await page.evaluate(s => document.querySelector(s).scrollIntoView(), sel);
    await new Promise(r => setTimeout(r, 1600));
    await page.screenshot({ path: path.join(OUT, '0' + (sections.indexOf(sel) + 2) + '-' + sel.slice(1) + '.jpg'), quality: 82, type: 'jpeg' });
  }

  // census result state
  await page.evaluate(() => document.querySelector('#census').scrollIntoView());
  await page.type('#nameInput', 'Dejan');
  await page.evaluate(() => document.querySelector('#censusForm').dispatchEvent(new Event('submit', {cancelable:true,bubbles:true})));
  await new Promise(r => setTimeout(r, 3600));
  await page.screenshot({ path: path.join(OUT, '07-census-result.jpg'), quality: 82, type: 'jpeg' });

  // mobile
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2200));
  await page.screenshot({ path: path.join(OUT, '08-mobile-hero.jpg'), quality: 82, type: 'jpeg' });
  await page.evaluate(() => document.querySelector('#archive').scrollIntoView());
  await new Promise(r => setTimeout(r, 1600));
  await page.screenshot({ path: path.join(OUT, '09-mobile-archive.jpg'), quality: 82, type: 'jpeg' });

  console.log(errs.length ? errs.join('\n') : 'NO ERRORS');
  await browser.close();
})();
