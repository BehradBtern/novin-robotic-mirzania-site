import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
async function probe(w, h) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  const full = [];
  for (let i = 0; i <= 40; i++) {
    const q = +(0.64 + i * 0.003).toFixed(3);
    await p.goto('https://novin-robotic-mirzania-site.vercel.app/?qa=' + q, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(r => setTimeout(r, 260));
    const m = await p.evaluate(() => {
      const els = Array.from(document.querySelectorAll('#hero-places .hp-row'));
      const ops = els.map(el => parseFloat(el.style.opacity || '0'));
      return ops.length ? Math.min(...ops) : 0;
    });
    if (m >= 0.99) full.push(q);
  }
  await p.close();
  const span = full.length ? +(full[full.length-1] - full[0]).toFixed(3) : 0;
  return { vp: w + 'x' + h, from: full[0] ?? null, to: full[full.length-1] ?? null, spanP: span, spanPx: +(span * 340 * h / 100).toFixed(0) };
}
console.log('PROD', JSON.stringify(await probe(1920, 1080)));
console.log('PROD', JSON.stringify(await probe(2560, 1440)));
await b.close();
