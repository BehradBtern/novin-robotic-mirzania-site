import puppeteer from 'puppeteer-core';
import { serve, CHROME, ROOT } from './lib.mjs';
const server = await serve(ROOT, 8138, { csp: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await p.goto('http://localhost:8138/', { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise(r => setTimeout(r, 300));
// simulate an environment with no async clipboard and a blocked legacy path
await p.evaluate(() => {
  try { Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true }); } catch (e) {}
  document.execCommand = () => false;
});
await p.tap('#gate-copy');
await new Promise(r => setTimeout(r, 400));
const st = await p.evaluate(() => ({
  state: document.getElementById('gate-copy').getAttribute('data-state'),
  label: document.getElementById('gate-copy').innerText.trim(),
  urlShown: !document.getElementById('gate-url').hidden,
  url: document.getElementById('gate-url').textContent,
  status: document.getElementById('gate-status').textContent
}));
await p.screenshot({ path: 'C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots/apple-gate-fail.png' });
console.log('failure path:', JSON.stringify(st));
await b.close(); server.close();
