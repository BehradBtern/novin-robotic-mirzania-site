import puppeteer from 'puppeteer-core';
import { serve, CHROME, ROOT } from './lib.mjs';
const W = 'C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots';
const server = await serve(ROOT, 8146, { csp: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const ANDROID_TAB = 'Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
async function probe(w, h, ua, label, shot) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1, hasTouch: true });
  if (ua) await p.setUserAgent(ua);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8146/', { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 500));
  const st = await p.evaluate(() => ({
    gated: document.documentElement.classList.contains('is-gated'),
    rows: document.querySelectorAll('#hero-places .hp-row').length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
  }));
  if (shot) await p.screenshot({ path: W + '/' + shot });
  await p.close();
  return { label, vp: w + 'x' + h, ...st, errs: errs.length };
}
console.log(JSON.stringify(await probe(390, 844, IPHONE, 'iPhone portrait', 'tab-gate-390.png')));
console.log(JSON.stringify(await probe(980, 844, IPHONE, 'iPhone desktop-mode', null)));
console.log(JSON.stringify(await probe(810, 1080, IPAD, 'iPad portrait', 'tab-gate-810.png')));
console.log(JSON.stringify(await probe(1024, 768, IPAD, 'iPad landscape 1024', null)));
console.log(JSON.stringify(await probe(1080, 810, IPAD, 'iPad 10.9 landscape', null)));
console.log(JSON.stringify(await probe(1194, 834, IPAD, 'iPad Air landscape', null)));
console.log(JSON.stringify(await probe(1280, 800, ANDROID_TAB, 'Android tablet', null)));
await b.close(); server.close();
