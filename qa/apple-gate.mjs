import puppeteer from 'puppeteer-core';
import { serve, CHROME, ROOT } from './lib.mjs';
const server = await serve(ROOT, 8137, { csp: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
const W = 'C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots';
const vps = [[390,844,'390'],[360,740,'360'],[844,390,'844x390']];
for (const [w,h,label] of vps) {
  const p = await b.newPage();
  const errs = []; p.on('console', m => { if (m.type()==='error') errs.push(m.text()); }); p.on('pageerror', e => errs.push('PE '+e.message));
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await p.goto('http://localhost:8137/', { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 500));
  const m = await p.evaluate(() => {
    const g = document.getElementById('mobile-gate');
    const title = document.querySelector('.gate__title');
    const btn = document.getElementById('gate-copy');
    const inner = document.querySelector('.gate__inner');
    const cs = getComputedStyle(title);
    return {
      gated: document.documentElement.classList.contains('is-gated'),
      scrollH: document.documentElement.scrollHeight, vh: innerHeight,
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      title: title.textContent, font: cs.fontFamily.split(',')[0], size: cs.fontSize, tracking: cs.letterSpacing, leading: cs.lineHeight,
      btnH: Math.round(btn.getBoundingClientRect().height),
      footVisible: !!document.querySelector('.gate__foot').getBoundingClientRect().height
    };
  });
  await p.screenshot({ path: W + '/apple-gate-' + label + '.png' });
  console.log(label, JSON.stringify(m), 'errs', errs.length);
  await p.close();
}
// interaction: tap the copy button
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const ctx = b.defaultBrowserContext();
await ctx.overridePermissions('http://localhost:8137', ['clipboard-read', 'clipboard-write']);
await p.goto('http://localhost:8137/', { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise(r => setTimeout(r, 400));
const before = await p.evaluate(() => document.getElementById('gate-copy').getAttribute('data-state'));
await p.tap('#gate-copy');
await new Promise(r => setTimeout(r, 400));
const after = await p.evaluate(() => ({ state: document.getElementById('gate-copy').getAttribute('data-state'), label: document.querySelector('.gate__copy-done').textContent.trim(), status: document.getElementById('gate-status').textContent, clip: navigator.clipboard.readText().catch(() => 'n/a') }));
console.log('tap:', JSON.stringify({ before, ...after }));
await p.screenshot({ path: W + '/apple-gate-copied.png' });
await b.close(); server.close();
