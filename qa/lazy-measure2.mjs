import puppeteer from 'puppeteer-core';
import { serve, CHROME, ROOT } from './lib.mjs';
const server = await serve(ROOT, 8135, { csp: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
async function cold(w, h, url) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await p.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 900));
  const m = await p.evaluate(() => {
    const e = performance.getEntriesByType('resource');
    const img = e.filter(x => /\.(jpg|jpeg|png|webp)(\?|$)/i.test(x.name));
    return {
      requests: e.length,
      totalBytes: Math.round(e.reduce((a, x) => a + (x.transferSize || 0), 0)),
      imageRequests: img.length,
      imageBytes: Math.round(img.reduce((a, x) => a + (x.transferSize || 0), 0)),
      imgsWithSrc: document.querySelectorAll('#hero-places img[src]').length,
      imgsDeferred: document.querySelectorAll('#hero-places img[data-src]').length
    };
  });
  await p.close();
  return m;
}
console.log('cold desktop  :', JSON.stringify(await cold(1440, 900, 'http://localhost:8135/')));
console.log('cold phone    :', JSON.stringify(await cold(390, 844, 'http://localhost:8135/')));
console.log('overlay pinned:', JSON.stringify(await cold(1440, 900, 'http://localhost:8135/?qa=0.69')));
await b.close(); server.close();
