import puppeteer from 'puppeteer-core';
import { serve, CHROME } from './lib.mjs';
const server = await serve('D:/novin3d', 8131, { csp: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await b.newPage();
const errs = []; p.on('console', m => { if (m.type()==='error') errs.push(m.text()); }); p.on('pageerror', e => errs.push('PE '+e.message));
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto('http://localhost:8131/', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 800));
const st = await p.evaluate(() => ({
  gated: document.documentElement.classList.contains('is-gated'),
  dataGated: document.documentElement.getAttribute('data-gated'),
  ready: document.documentElement.dataset.ready,
  heroState: typeof window.__heroState,
  innerWidth: innerWidth,
  gateHidden: document.getElementById('mobile-gate').hidden
}));
console.log(JSON.stringify(st), 'errors:', JSON.stringify(errs.slice(0,3)));
await b.close(); server.close();
