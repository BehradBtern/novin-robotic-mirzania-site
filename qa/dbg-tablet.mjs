import puppeteer from 'puppeteer-core';
import { serve, CHROME, ROOT } from './lib.mjs';
const server = await serve(ROOT, 8147, { csp: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage();
await p.setViewport({ width: 1024, height: 768, deviceScaleFactor: 1 });
await p.goto('http://localhost:8147/', { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise(r => setTimeout(r, 500));
const m = await p.evaluate(() => {
  const ph = document.querySelector('#hero-places .hp-photo');
  const row = document.querySelector('#hero-places .hp-row');
  const cs = getComputedStyle(ph);
  const rr = row.getBoundingClientRect();
  const pr = ph.getBoundingClientRect();
  return {
    photoW: cs.width, photoH: cs.height, photoRight: cs.right,
    photoLeftPx: Math.round(pr.left), rowRightPx: Math.round(rr.right),
    overlap: Math.round(rr.right - pr.left),
    mq: matchMedia('(min-width: 1024px) and (max-width: 1150px)').matches,
    vw: innerWidth
  };
});
console.log(JSON.stringify(m));
await b.close(); server.close();
