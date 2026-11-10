import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
async function cold(w, h, url, ua) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  if (ua) await p.setUserAgent(ua);
  await p.goto(url, { waitUntil: 'networkidle0', timeout: 90000 });
  await new Promise(r => setTimeout(r, 1200));
  const m = await p.evaluate(() => {
    const e = performance.getEntriesByType('resource');
    const img = e.filter(x => /\.(jpg|jpeg|png|webp)(\?|$)/i.test(x.name));
    return { req: e.length, bytes: Math.round(e.reduce((a,x)=>a+(x.transferSize||0),0)), imgReq: img.length, imgBytes: Math.round(img.reduce((a,x)=>a+(x.transferSize||0),0)), gated: document.documentElement.classList.contains('is-gated'), withSrc: document.querySelectorAll('#hero-places img[src]').length };
  });
  await p.close();
  return m;
}
console.log('prod desktop cold:', JSON.stringify(await cold(1440, 900, 'https://novin-robotic-mirzania-site.vercel.app/')));
console.log('prod phone cold  :', JSON.stringify(await cold(390, 844, 'https://novin-robotic-mirzania-site.vercel.app/', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')));
console.log('prod overlay     :', JSON.stringify(await cold(1440, 900, 'https://novin-robotic-mirzania-site.vercel.app/?qa=0.69')));
await b.close();
