import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const W = 'C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1200, height: 900, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('file:///' + W + '/DELIVERY/animated-background-v1.6.44.html', { waitUntil: 'load' });
const info = await p.evaluate(() => ({ h: document.documentElement.scrollHeight, imgs: [...document.images].map(i => i.naturalWidth + 'x' + i.naturalHeight), broken: [...document.images].filter(i => !i.naturalWidth).length }));
await p.screenshot({ path: W + '/.openclaw/tmp/shots/bg-report-figs.png', clip: { x: 0, y: 1500, width: 1200, height: 900 } });
console.log(JSON.stringify(info), 'errors:', errs.length);
await b.close();



