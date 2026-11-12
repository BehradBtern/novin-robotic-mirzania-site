import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto('http://localhost:8080/', { waitUntil: 'networkidle0', timeout: 90000 });
await p.waitForFunction('document.documentElement.dataset.ready === "true"', { timeout: 20000 }).catch(() => {});
const res = await p.evaluate(async () => {
  const heroH = document.getElementById('story').offsetHeight - innerHeight;
  // park inside the hold, then jump past the window in one tick
  window.scrollTo(0, Math.round(0.70 * heroH));
  await new Promise(r => setTimeout(r, 700));
  const mid = Math.max(...Array.from(document.querySelectorAll('#hero-places .hp-row')).map(el => parseFloat(el.style.opacity || '0')));
  window.scrollTo(0, Math.round(1.0 * heroH));
  await new Promise(r => setTimeout(r, 900));
  const after = Math.max(...Array.from(document.querySelectorAll('#hero-places .hp-row')).map(el => parseFloat(el.style.opacity || '0')));
  const st = window.__heroState ? window.__heroState() : {}; return { insideWindow: mid, afterJumpToEnd: after, p: st.p, scrollY: Math.round(scrollY), heroH: document.getElementById('story').offsetHeight - innerHeight };
});
console.log(JSON.stringify(res));
await p.screenshot({ path: 'C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots/stale-check.png' });
await b.close();
