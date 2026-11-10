import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const W = 'C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots';
async function probe(args, opts = {}) {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args });
  const p = await b.newPage();
  if (opts.reduced) await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const url = opts.url || 'http://localhost:8080/?qa=0.696';
  await p.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await p.waitForFunction('document.documentElement.dataset.ready === "true"', { timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 500));
  const a = await p.screenshot({ encoding: 'base64' });
  await new Promise(r => setTimeout(r, 1200));
  const c = await p.screenshot({ encoding: 'base64' });
  const info = await p.evaluate(() => {
    const host = document.getElementById('page-bg');
    const cv = host && host.querySelector('canvas');
    return { host: !!host, canvas: !!cv, shown: cv ? getComputedStyle(cv).display !== 'none' : false, ready: host && host.dataset.ready };
  });
  await p.screenshot({ path: W + '/fb-' + (opts.tag || 'x') + '.png' });
  await b.close();
  return { ...info, changedOverTime: a !== c, errors: errs };
}
const gl = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'];
console.log('reduced-motion', JSON.stringify(await probe(gl, { reduced: true, tag: 'reduced' })));
console.log('no-webgl      ', JSON.stringify(await probe(['--disable-webgl','--disable-3d-apis'], { tag: 'nowebgl' })));
console.log('escape ?bg=0  ', JSON.stringify(await probe(gl, { url: 'http://localhost:8080/?qa=0.696&bg=0', tag: 'noBgFlag' })));
