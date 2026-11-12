import puppeteer from 'puppeteer-core';
import { serve, CHROME, ROOT } from './lib.mjs';
const server = await serve(ROOT, 8143, { csp: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });

async function probe(w, h) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  const rows = [];
  for (let i = 0; i <= 40; i++) {
    const q = +(0.60 + i * 0.005).toFixed(3);
    await p.goto('http://localhost:8143/?qa=' + q, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(r => setTimeout(r, 220));
    const m = await p.evaluate(() => {
      const els = Array.from(document.querySelectorAll('#hero-places .hp-row'));
      const ops = els.map(el => parseFloat(el.style.opacity || '0'));
      return { min: ops.length ? Math.min(...ops) : 0, n: ops.length };
    });
    rows.push({ q, ...m });
  }
  const full = rows.filter(r => r.min >= 0.99).map(r => r.q);
  const span = full.length ? +(full[full.length-1] - full[0]).toFixed(3) : 0;
  await p.close();
  return { vp: w + 'x' + h, fullFrom: full[0], fullTo: full[full.length-1], spanP: span, spanPx: Math.round(span * 340 * h / 100), visibleRows: rows[0].n };
}
for (const [w, h] of [[1440,900],[1920,1080],[2560,1440]]) console.log(JSON.stringify(await probe(w, h)));
await b.close(); server.close();
