import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto('https://novin-robotic-mirzania-site.vercel.app/', { waitUntil: 'networkidle0', timeout: 60000 });
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await new Promise(r => setTimeout(r, 900));
const t = await p.evaluate(() => ({
  credit: (document.getElementById('footer-credit')||{}).textContent,
  legal: (document.getElementById('footer-legal')||{}).textContent,
  contact: (document.getElementById('contact')||{}).innerText,
  sideLeft: (document.getElementById('hero-side-left')||{}).innerText
}));
await p.screenshot({ path: 'C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots/status-footer2.png' });
console.log(JSON.stringify(t, null, 1).slice(0, 900));
await b.close();
