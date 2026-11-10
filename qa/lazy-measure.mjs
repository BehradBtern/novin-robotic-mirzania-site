import puppeteer from 'puppeteer-core';
import { serve, CHROME, ROOT } from './lib.mjs';
const server = await serve(ROOT, 8134, { csp: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });

async function cold(w, h, url) {
  const p = await b.newPage();
  const bytes = { total: 0, images: 0, count: 0 };
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  p.on('response', async (r) => {
    try {
      const len = Number(r.headers()['content-length'] || 0);
      bytes.total += len; bytes.count += 1;
      if (/\.(jpg|jpeg|png|webp)$/i.test(r.url())) bytes.images += len;
    } catch (e) {}
  });
  await p.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 900));
  await p.close();
  return bytes;
}
const desk = await cold(1440, 900, 'http://localhost:8134/');
const phone = await cold(390, 844, 'http://localhost:8134/');
const overlay = await cold(1440, 900, 'http://localhost:8134/?qa=0.69');
console.log('cold desktop :', JSON.stringify(desk));
console.log('cold phone   :', JSON.stringify(phone));
console.log('overlay pinned:', JSON.stringify(overlay));
await b.close(); server.close();
