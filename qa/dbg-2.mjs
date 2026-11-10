import puppeteer from 'puppeteer-core';
import { serve, CHROME, ROOT, PORT } from './lib.mjs';
const server = await serve(ROOT, 8133, { csp: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
for (const [w,h,label] of [[1440,900,'desktop'],[390,844,'phone']]) {
  const p = await b.newPage();
  const errs = []; p.on('console', m => { if (m.type()==='error') errs.push(m.text()); }); p.on('pageerror', e => errs.push('PE '+e.message));
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await p.goto('http://localhost:8133/', { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 700));
  const st = await p.evaluate(() => ({
    children: Array.from(document.body.children).map(el => el.tagName + '#' + el.id).slice(0,6),
    gated: document.documentElement.classList.contains('is-gated'),
    dataGated: document.documentElement.getAttribute('data-gated'),
    ready: document.documentElement.dataset.ready,
    heroState: typeof window.__heroState,
    innerWidth, brand: (document.getElementById('gate-brand')||{}).textContent
  }));
  console.log(label, JSON.stringify(st), 'errors:', JSON.stringify(errs.slice(0,2)));
  await p.close();
}
await b.close(); server.close();
