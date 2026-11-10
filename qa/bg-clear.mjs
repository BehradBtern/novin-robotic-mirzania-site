import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const W = 'C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto('http://localhost:8080/?qa=0.696', { waitUntil: 'networkidle0', timeout: 60000 });
await p.waitForFunction('document.documentElement.dataset.ready === "true"', { timeout: 20000 }).catch(() => {});
for (const [i, ms] of [[1, 400], [2, 2800], [3, 6500]]) {
  await new Promise(r => setTimeout(r, ms));
  await p.screenshot({ path: W + '/clear-places-' + i + '.png' });
}
await p.close();
const p2 = await b.newPage();
await p2.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p2.goto('http://localhost:8080/?qa=0', { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise(r => setTimeout(r, 1200));
await p2.screenshot({ path: W + '/clear-intro.png' });
await p2.close();
await b.close();
console.log('captured');
