import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });

// 1) lazy loading: cold load, no scroll -> images must not be requested
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const urls = [];
p.on('request', r => urls.push(r.url()));
await p.goto('http://localhost:8080/', { waitUntil: 'networkidle0', timeout: 60000 });
await p.waitForFunction('document.documentElement.dataset.ready === "true"', { timeout: 20000 }).catch(() => {});
await new Promise(r => setTimeout(r, 900));
const before = urls.filter(u => /assets\/photos\/|assets\/flags\//.test(u));
const noSrc = await p.evaluate(() => Array.from(document.querySelectorAll('#hero-places img')).map(i => ({ hasSrc: !!i.getAttribute('src'), dataSrc: !!i.getAttribute('data-src'), loading: i.loading })));
// now jump into the overlay window
await p.evaluate(() => { location.href = 'http://localhost:8080/?qa=0.696'; });
await p.waitForLoadState?.();
await new Promise(r => setTimeout(r, 1200));
await p.goto('http://localhost:8080/?qa=0.696', { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise(r => setTimeout(r, 900));
const afterImgs = await p.evaluate(() => Array.from(document.querySelectorAll('#hero-places img')).map(i => ({ hasSrc: !!i.getAttribute('src'), complete: i.complete, nw: i.naturalWidth })));
console.log('COLD image requests:', before.length, before.slice(0,3));
console.log('COLD img attrs:', JSON.stringify(noSrc.slice(0,3)), 'total imgs', noSrc.length);
console.log('OVERLAY img state:', JSON.stringify(afterImgs.slice(0,3)), 'loaded', afterImgs.filter(x=>x.nw>0).length, '/', afterImgs.length);
await p.close();

// 2) gate by width and by UA
async function gate(width, height, ua) {
  const pp = await b.newPage();
  await pp.setViewport({ width, height, deviceScaleFactor: 1, isMobile: width < 900, hasTouch: width < 900 });
  if (ua) await pp.setUserAgent(ua);
  await pp.goto('http://localhost:8080/', { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 400));
  const st = await pp.evaluate(() => ({
    gated: document.documentElement.classList.contains('is-gated'),
    gateHidden: document.getElementById('mobile-gate').hidden,
    rows: document.querySelectorAll('#hero-places .hp-row').length,
    scroll: document.documentElement.scrollHeight,
    viewport: [innerWidth, innerHeight]
  }));
  await pp.close();
  return st;
}
console.log('390x844 mobile :', JSON.stringify(await gate(390, 844)));
console.log('768x1024 tablet:', JSON.stringify(await gate(768, 1024)));
console.log('900x700       :', JSON.stringify(await gate(900, 700)));
console.log('1440x900      :', JSON.stringify(await gate(1440, 900)));
console.log('1440 + iphoneUA:', JSON.stringify(await gate(1440, 900, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')));
console.log('390 + ?desktop=1:', JSON.stringify(await (async () => { const pp = await b.newPage(); await pp.setViewport({ width: 390, height: 844, isMobile: true }); await pp.goto('http://localhost:8080/?desktop=1', { waitUntil: 'networkidle0', timeout: 60000 }); await new Promise(r=>setTimeout(r,300)); const s = await pp.evaluate(() => ({ gated: document.documentElement.classList.contains('is-gated'), rows: document.querySelectorAll('#hero-places .hp-row').length })); await pp.close(); return s; })()));
await b.close();
