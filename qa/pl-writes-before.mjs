import puppeteer from 'puppeteer-core';
import { serve, CHROME } from './lib.mjs';
const OLD = 'C:\\Users\\USER\\.openclaw-autoclaw\\agents\\auto-coder\\workspace\\.openclaw\\tmp\\oldsite';
const server = await serve(OLD, 8145, { csp: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
async function band(from, to, steps, label) {
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await p.goto('http://localhost:8145/', { waitUntil: 'networkidle0', timeout: 90000 });
  await p.waitForFunction('document.documentElement.dataset.ready === "true"', { timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 500));
  const res = await p.evaluate(async ({ from, to, steps }) => {
    const heroH = document.getElementById('story').offsetHeight - innerHeight;
    window.scrollTo(0, Math.round(from * heroH));
    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => requestAnimationFrame(r));
    window.__plWrites = 0;
    let frames = 0;
    for (let i = 1; i <= steps; i++) {
      window.scrollTo(0, Math.round((from + (to - from) * (i / steps)) * heroH));
      await new Promise(r => requestAnimationFrame(r));
      frames++;
    }
    return { frames, writes: window.__plWrites };
  }, { from, to, steps });
  await p.close();
  return { label, frames: res.frames, writes: res.writes, perFrame: +(res.writes / res.frames).toFixed(2) };
}
console.log('BEFORE', JSON.stringify(await band(0.62, 0.68, 60, 'fade-in')));
console.log('BEFORE', JSON.stringify(await band(0.68, 0.74, 60, 'hold')));
console.log('BEFORE', JSON.stringify(await band(0.74, 0.80, 60, 'fade-out')));
await b.close(); server.close();

