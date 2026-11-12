import puppeteer from 'puppeteer-core';
import { serve, CHROME, ROOT } from './lib.mjs';
const server = await serve(ROOT, 8149, { csp: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
for (const [w, h] of [[1024,768],[1080,810],[1120,834],[1194,834],[1280,800]]) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await p.goto('http://localhost:8149/?qa=0.696', { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 400));
  const m = await p.evaluate(() => {
    const ph = document.querySelector('#hero-places .hp-photo').getBoundingClientRect();
    let maxRight = 0;
    document.querySelectorAll('#hero-places .hp-row').forEach((row) => {
      row.querySelectorAll('.hp-year, .hp-flag, .hp-name, .hp-rank').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > maxRight) maxRight = r.right;
      });
    });
    const nameSize = getComputedStyle(document.querySelector('#hero-places .hp-name')).fontSize;
    return { photoLeft: Math.round(ph.left), contentRight: Math.round(maxRight), gap: Math.round(ph.left - maxRight), nameSize };
  });
  console.log(w + 'x' + h, JSON.stringify(m));
  await p.close();
}
await b.close(); server.close();
