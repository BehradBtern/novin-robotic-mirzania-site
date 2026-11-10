import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const W = 'C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
for (const vp of [[1440,900],[1920,1080]]) {
  const p = await b.newPage();
  await p.setViewport({ width: vp[0], height: vp[1], deviceScaleFactor: 1 });
  await p.goto('http://localhost:8080/?qa=0.696', { waitUntil: 'networkidle0', timeout: 60000 });
  await p.waitForFunction('document.documentElement.dataset.ready === "true"', { timeout: 20000 }).catch(() => {});
  for (const [i, ms] of [[1,300],[2,2600],[3,6000]]) {
    await new Promise(r => setTimeout(r, ms));
    await p.screenshot({ path: W + '/stab-' + vp[0] + '-' + i + '.png' });
  }
  await p.close();
}
await b.close();
console.log('captured');
