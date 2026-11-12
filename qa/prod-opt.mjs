import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const URL = 'https://novin-robotic-mirzania-site.vercel.app/';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto(URL, { waitUntil: 'networkidle0', timeout: 90000 });
await p.waitForFunction('document.documentElement.dataset.ready === "true"', { timeout: 20000 }).catch(() => {});
await new Promise(r => setTimeout(r, 500));
const res = await p.evaluate(async () => {
  const heroH = document.getElementById('story').offsetHeight - innerHeight;
  const go = async (q) => { window.scrollTo(0, Math.round(q * heroH)); await new Promise(r => requestAnimationFrame(r)); await new Promise(r => requestAnimationFrame(r)); };
  await go(0.62); window.__plWrites = 0;
  for (let i = 1; i <= 40; i++) { window.scrollTo(0, Math.round((0.62 + 0.0015 * i) * heroH)); await new Promise(r => requestAnimationFrame(r)); }
  const fade = window.__plWrites;
  await go(0.69); window.__plWrites = 0;
  for (let i = 1; i <= 40; i++) { window.scrollTo(0, Math.round((0.69 + 0.0015 * i) * heroH)); await new Promise(r => requestAnimationFrame(r)); }
  const hold = window.__plWrites;
  await go(0.70);
  await new Promise(r => setTimeout(r, 600));
  const mid = Math.max(...Array.from(document.querySelectorAll('#hero-places .hp-row')).map(el => parseFloat(el.style.opacity || '0')));
  window.scrollTo(0, Math.round(1.0 * heroH));
  await new Promise(r => setTimeout(r, 900));
  const end = Math.max(...Array.from(document.querySelectorAll('#hero-places .hp-row')).map(el => parseFloat(el.style.opacity || '0')));
  return { fadeWritesPerFrame: +(fade / 40).toFixed(2), holdWritesPerFrame: +(hold / 40).toFixed(2), opacityInHold: mid, opacityAfterJumpToEnd: end };
});
console.log('PROD', JSON.stringify(res));
await b.close();
