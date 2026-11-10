import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const W = 'C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const p = await b.newPage();
const errs = []; p.on('console', m => { if (m.type()==='error') errs.push(m.text()); }); p.on('pageerror', e => errs.push('PE '+e.message));
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await p.setUserAgent(UA);
await p.goto('https://novin-robotic-mirzania-site.vercel.app/', { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise(r => setTimeout(r, 700));
const st = await p.evaluate(() => {
  const t = document.querySelector('.gate__title');
  return {
    gated: document.documentElement.classList.contains('is-gated'),
    title: t.textContent, font: getComputedStyle(t).fontFamily.split(',')[0],
    btn: (document.getElementById('gate-copy')||{}).innerText?.trim(),
    foot: document.querySelector('.gate__foot').textContent.trim(),
    fits: document.documentElement.scrollHeight <= innerHeight + 1
  };
});
await p.screenshot({ path: W + '/prod-apple-gate-390.png' });
console.log('prod notice:', JSON.stringify(st), 'errs', errs.length);
await b.close();
