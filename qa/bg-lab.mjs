import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
import path from 'path';
const WS = 'C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const keys = ['a','b','c','d','e','f'];
for (const k of keys) {
  const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file:///' + WS + '/.openclaw/tmp/bg-lab.html?v=' + k, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 900));
  const st = await p.evaluate(() => { const c = document.querySelector('#page-bg canvas'); const gl = c && (c.getContext('webgl2') || {}); return { canvas: !!c, w: c && c.width, h: c && c.height, ready: document.getElementById('page-bg').dataset.ready, err: window.__bgErr || null }; });
  await p.screenshot({ path: WS + '/.openclaw/tmp/shots/bg-' + k + '.png' });
  console.log(k, JSON.stringify(st), 'errors:', errs.slice(0,2));
  await p.close();
}
await b.close();
