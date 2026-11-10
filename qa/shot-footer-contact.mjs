import puppeteer from 'puppeteer-core';
import { serve, CHROME, ROOT } from './lib.mjs';
const server = await serve(ROOT, 8141, { csp: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto('http://localhost:8141/', { waitUntil: 'networkidle0', timeout: 60000 });
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await new Promise(r => setTimeout(r, 1200));
await p.screenshot({ path: 'C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots/footer-real-contact.png' });
const t = await p.evaluate(() => {
  const box = document.getElementById('contact').getBoundingClientRect();
  return { contact: document.getElementById('contact').innerText, top: Math.round(box.top) };
});
console.log(JSON.stringify(t, null, 1));
await b.close(); server.close();
