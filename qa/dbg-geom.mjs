import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage();
await p.setViewport({ width: 884, height: 1104, deviceScaleFactor: 1 });
await p.goto('http://localhost:8080/?qa=0.696', { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise(r => setTimeout(r, 400));
const m = await p.evaluate(() => {
  const wrap = document.querySelector('#hero-places .hp-photos') || document.querySelector('.hp-photos');
  const stage = document.querySelector('.hero__stage');
  const ph = document.querySelector('.hp-photo');
  const cs = ph ? getComputedStyle(ph) : null;
  let maxRight = 0;
  document.querySelectorAll('.hp-row').forEach(r => r.querySelectorAll('.hp-year,.hp-flag,.hp-name,.hp-rank').forEach(el => {
    const rr = el.getBoundingClientRect(); if (rr.right > maxRight) maxRight = rr.right;
  }));
  return {
    wrapRect: wrap ? { left: Math.round(wrap.getBoundingClientRect().left), right: Math.round(wrap.getBoundingClientRect().right), width: Math.round(wrap.getBoundingClientRect().width) } : null,
    stageRect: stage ? { left: Math.round(stage.getBoundingClientRect().left), right: Math.round(stage.getBoundingClientRect().right), width: Math.round(stage.getBoundingClientRect().width) } : null,
    photoRect: ph ? { left: Math.round(ph.getBoundingClientRect().left), width: Math.round(ph.getBoundingClientRect().width), height: Math.round(ph.getBoundingClientRect().height) } : null,
    cssRight: cs ? cs.right : null,
    contentRight: Math.round(maxRight), vw: innerWidth
  };
});
console.log(JSON.stringify(m, null, 1));
await b.close();
