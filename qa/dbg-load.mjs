import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
for (const [w,h,label] of [[1440,900,'1440'],[884,1104,'884']]) {
  const p = await b.newPage();
  const failed = [], errs = [];
  p.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url()); });
  p.on('pageerror', e => errs.push('PE ' + e.message));
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await p.goto('http://localhost:8080/?qa=0.696', { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 500));
  const st = await p.evaluate(() => ({ ready: document.documentElement.dataset.ready, gated: document.documentElement.classList.contains('is-gated'), heroState: typeof window.__heroState, places: !!document.getElementById('hero-places'), scripts: Array.from(document.scripts).map(s => s.getAttribute('src')).filter(Boolean) }));
  console.log(label, JSON.stringify(st));
  console.log('  failed:', JSON.stringify(failed.slice(0,4)), 'errors:', JSON.stringify(errs.slice(0,2)));
  await p.close();
}
await b.close();
