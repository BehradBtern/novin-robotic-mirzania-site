import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1200, height: 900, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('file:///C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/DELIVERY/award-photo-sourcing-v1.6.40.html', { waitUntil: 'load' });
await p.screenshot({ path: 'C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots/report-top.png' });
await p.screenshot({ path: 'C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots/report-full.png', fullPage: true });
const info = await p.evaluate(() => ({ h: document.documentElement.scrollHeight, imgs: [...document.images].map(i => i.naturalWidth + 'x' + i.naturalHeight), tables: document.querySelectorAll('table').length }));
console.log(JSON.stringify(info), 'errors:', errs.length);
await b.close();

