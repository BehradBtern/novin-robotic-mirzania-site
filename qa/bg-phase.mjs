import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const W = 'C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto('http://localhost:8080/?qa=0.696', { waitUntil: 'networkidle0', timeout: 60000 });
await p.waitForFunction('document.documentElement.dataset.ready === "true"', { timeout: 20000 }).catch(() => {});
for (const [i, ms] of [[1, 400], [2, 3000], [3, 8000]]) {
  await new Promise(r => setTimeout(r, ms));
  const st = await p.evaluate(() => {
    const c = document.querySelector('#page-bg canvas');
    return { cw: c && c.width, ch: c && c.height, ready: document.getElementById('page-bg').dataset.ready };
  });
  await p.screenshot({ path: W + '/.openclaw/tmp/shots/bg2-places-' + i + '.png' });
  console.log('phase', i, JSON.stringify(st));
}
await b.close();
