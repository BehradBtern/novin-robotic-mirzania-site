import puppeteer from 'puppeteer-core';
import { serve, CHROME, ROOT } from './lib.mjs';
const server = await serve(ROOT, 8142, { csp: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto('http://localhost:8142/', { waitUntil: 'networkidle0', timeout: 60000 });
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await new Promise(r => setTimeout(r, 1000));
const m = await p.evaluate(() => {
  const a = document.getElementById('footer-address');
  const r = a.getBoundingClientRect();
  const col = document.getElementById('contact').getBoundingClientRect();
  return { text: a.textContent, lines: Math.round(r.height / parseFloat(getComputedStyle(a).lineHeight)), width: Math.round(r.width), colWidth: Math.round(col.width), overflow: r.right > col.right + 1 };
});
await p.screenshot({ path: 'C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots/footer-address-149.png' });
console.log(JSON.stringify(m));
await b.close(); server.close();
