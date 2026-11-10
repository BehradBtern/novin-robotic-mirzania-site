import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const WS = 'C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
for (const k of ['g','h','i','j']) {
  const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await p.goto('file:///' + WS + '/.openclaw/tmp/bg-lab.html?v=' + k, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 900));
  await p.screenshot({ path: WS + '/.openclaw/tmp/shots/bg-' + k + '.png' });
  console.log('shot', k);
  await p.close();
}
await b.close();
