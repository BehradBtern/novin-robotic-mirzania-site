import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage();
const errs = []; p.on('console', m => { if (m.type()==='error') errs.push(m.text()); }); p.on('pageerror', e => errs.push('PE ' + e.message));
await p.setViewport({ width: 884, height: 1104, deviceScaleFactor: 1 });
await p.goto('http://localhost:8080/?qa=0.696', { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise(r => setTimeout(r, 600));
const st = await p.evaluate(() => ({
  gated: document.documentElement.classList.contains('is-gated'),
  ready: document.documentElement.dataset.ready,
  heroState: typeof window.__heroState,
  rows: document.querySelectorAll('#hero-places .hp-row').length,
  photos: document.querySelectorAll('#hero-places .hp-photo').length,
  placeWrap: !!document.getElementById('hero-places')
}));
console.log(JSON.stringify(st), 'errors:', JSON.stringify(errs.slice(0,3)));
await b.close();
