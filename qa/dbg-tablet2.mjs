import puppeteer from 'puppeteer-core';
import { serve, CHROME, ROOT } from './lib.mjs';
const server = await serve(ROOT, 8148, { csp: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
for (const [w, h] of [[1024,768],[1080,810],[1120,834],[1194,834]]) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await p.goto('http://localhost:8148/?qa=0.696', { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 400));
  const m = await p.evaluate(() => {
    const ph = document.querySelector('#hero-places .hp-photo');
    const rows = Array.from(document.querySelectorAll('#hero-places .hp-row'));
    const pr = ph.getBoundingClientRect();
    const rowRight = Math.max(...rows.map(r => r.getBoundingClientRect().right));
    const cs = getComputedStyle(ph);
    return { photoW: cs.width, photoLeft: Math.round(pr.left), rowRight: Math.round(rowRight), gap: Math.round(pr.left - rowRight), right: cs.right };
  });
  console.log(w + 'x' + h, JSON.stringify(m));
  await p.close();
}
await b.close(); server.close();
