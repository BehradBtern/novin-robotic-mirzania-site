import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const URL = 'https://novin-robotic-mirzania-site.vercel.app/';
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
async function probe(w, h, ua, label) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1, hasTouch: true });
  await p.setUserAgent(ua);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL + '?qa=0.696', { waitUntil: 'networkidle0', timeout: 90000 });
  await new Promise(r => setTimeout(r, 500));
  const m = await p.evaluate(() => {
    const gated = document.documentElement.classList.contains('is-gated');
    let gap = null;
    const ph = document.querySelector('#hero-places .hp-photo');
    if (!gated && ph) {
      const pr = ph.getBoundingClientRect();
      let maxRight = 0;
      document.querySelectorAll('#hero-places .hp-row').forEach((r) => r.querySelectorAll('.hp-year,.hp-flag,.hp-name,.hp-rank').forEach((el) => {
        const rr = el.getBoundingClientRect(); if (rr.right > maxRight) maxRight = rr.right;
      }));
      gap = Math.round(pr.left - maxRight);
    }
    return { gated, gap, rows: document.querySelectorAll('#hero-places .hp-row').length };
  });
  await p.close();
  return { label, vp: w + 'x' + h, ...m, errs: errs.length };
}
console.log('PROD', JSON.stringify(await probe(810, 1080, IPAD, 'iPad portrait')));
console.log('PROD', JSON.stringify(await probe(1024, 768, IPAD, 'iPad landscape')));
console.log('PROD', JSON.stringify(await probe(1194, 834, IPAD, 'iPad Air landscape')));
console.log('PROD', JSON.stringify(await probe(980, 844, IPHONE, 'iPhone desktop-mode')));
await b.close();
