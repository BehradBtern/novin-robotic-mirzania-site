import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
for (const [w, h] of [[884,1104],[900,1200],[1024,768]]) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await p.goto('http://localhost:8080/?qa=0.696', { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 400));
  const m = await p.evaluate(() => {
    const gated = document.documentElement.classList.contains('is-gated');
    let gap = null, credit = null, ph = null;
    if (!gated) {
      ph = document.querySelector('#hero-places .hp-photo');
      const pr = ph.getBoundingClientRect();
      let maxRight = 0;
      document.querySelectorAll('#hero-places .hp-row').forEach((r) => r.querySelectorAll('.hp-year,.hp-flag,.hp-name,.hp-rank').forEach((el) => {
        const rr = el.getBoundingClientRect(); if (rr.right > maxRight) maxRight = rr.right;
      }));
      gap = Math.round(pr.left - maxRight);
      const cc = ph.querySelector('.hp-photo-credit');
      credit = cc ? { text: cc.textContent, h: Math.round(cc.getBoundingClientRect().height) } : null;
    }
    return { gated, gap, credit, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  console.log(w + 'x' + h, JSON.stringify(m));
  await p.close();
}
await b.close();
