import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
for (const [w, h, label] of [[1104, 884, 'foldable landscape'], [884, 1104, 'foldable portrait'], [1024, 768, 'tablet 1024']]) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await p.goto('http://localhost:8080/?qa=0.696', { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 400));
  const m = await p.evaluate(() => {
    const gated = document.documentElement.classList.contains('is-gated');
    if (gated) return { gated };
    const ph = document.querySelector('.hp-photo');
    let maxRight = 0;
    document.querySelectorAll('.hp-row').forEach(r => r.querySelectorAll('.hp-year,.hp-flag,.hp-name,.hp-rank').forEach(el => {
      const rr = el.getBoundingClientRect(); if (rr.right > maxRight) maxRight = rr.right;
    }));
    return { gated, gap: Math.round(ph.getBoundingClientRect().left - maxRight), photoW: Math.round(ph.getBoundingClientRect().width) };
  });
  console.log(label, w + 'x' + h, JSON.stringify(m));
  await p.close();
}
await b.close();
