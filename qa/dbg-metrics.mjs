import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
for (const [w, h] of [[884,1104],[1104,884],[1024,768],[1194,834],[1280,900]]) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await p.goto('http://localhost:8080/?qa=0.696', { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 350));
  const m = await p.evaluate(() => {
    if (document.documentElement.classList.contains('is-gated')) return { gated: true };
    const ph = document.querySelector('.hp-photo').getBoundingClientRect();
    let maxRight = 0;
    document.querySelectorAll('.hp-row').forEach(r => r.querySelectorAll('.hp-year,.hp-flag,.hp-name,.hp-rank').forEach(el => {
      const rr = el.getBoundingClientRect(); if (rr.right > maxRight) maxRight = rr.right;
    }));
    return { gated: false, contentRight: Math.round(maxRight), photoLeft: Math.round(ph.left), photoW: Math.round(ph.width), vw: innerWidth };
  });
  console.log(w + 'x' + h, JSON.stringify(m));
  await p.close();
}
await b.close();
