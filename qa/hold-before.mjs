import puppeteer from 'puppeteer-core';
import { serve, CHROME } from './lib.mjs';
const OLD = 'C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/oldsite';
const server = await serve(OLD, 8144, { csp: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
async function probe(w, h) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  const full = [];
  for (let i = 0; i <= 60; i++) {
    const q = +(0.64 + i * 0.002).toFixed(3);
    await p.goto('http://localhost:8144/?qa=' + q, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(r => setTimeout(r, 200));
    const m = await p.evaluate(() => {
      const els = Array.from(document.querySelectorAll('#hero-places .hp-row'));
      const ops = els.map(el => parseFloat(el.style.opacity || '0'));
      return ops.length ? Math.min(...ops) : 0;
    });
    if (m >= 0.99) full.push(q);
  }
  await p.close();
  const span = full.length ? +(full[full.length-1] - full[0]).toFixed(3) : 0;
  return { vp: w + 'x' + h, fullFrom: full[0] ?? null, fullTo: full[full.length-1] ?? null, spanP: span, spanPx: +(span * 340 * h / 100).toFixed(1) };
}
for (const [w, h] of [[1440,900],[2560,1440]]) console.log('BEFORE', JSON.stringify(await probe(w, h)));
await b.close(); server.close();
