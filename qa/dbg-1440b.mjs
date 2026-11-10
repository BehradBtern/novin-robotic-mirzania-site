import puppeteer from 'puppeteer-core';
import { serve, CHROME } from './lib.mjs';
const server = await serve('D:/novin3d', 8132, { csp: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await b.newPage();
const errs = []; p.on('console', m => { if (m.type()==='error') errs.push(m.text()); }); p.on('pageerror', e => errs.push('PE '+e.message));
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto('http://localhost:8132/', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 700));
const st = await p.evaluate(() => ({
  children: Array.from(document.body.children).map(el => el.tagName + '#' + el.id + '.' + (el.className || '')).slice(0, 8),
  gated: document.documentElement.classList.contains('is-gated'),
  ready: document.documentElement.dataset.ready,
  heroState: typeof window.__heroState,
  innerWidth
}));
console.log(JSON.stringify(st, null, 1), 'errors:', JSON.stringify(errs.slice(0,4)));
await b.close(); server.close();
