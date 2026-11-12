// Counts overlay style writes per frame band. Requires main.js instrumented with
// window.__plWrites. Usage: node qa/pl-writes.mjs [url]
import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';

const URL = process.argv[2] || 'http://localhost:8080/';
const b = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});

async function band(from, to, steps, label) {
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await p.goto(URL + '?qa=' + from, { waitUntil: 'networkidle0', timeout: 90000 });
  await p.waitForFunction('document.documentElement.dataset.ready === "true"', { timeout: 20000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 600));
  const res = await p.evaluate(async ({ from, to, steps }) => {
    const hero = document.getElementById('story');
    const heroH = hero.offsetHeight - innerHeight;
    const yFor = (q) => Math.round(q * heroH);
    window.__plWrites = 0;
    const t0 = performance.now();
    let frames = 0;
    for (let i = 1; i <= steps; i++) {
      window.scrollTo(0, yFor(from + (to - from) * (i / steps)));
      await new Promise((r) => requestAnimationFrame(r));
      frames++;
    }
    const ms = performance.now() - t0;
    return { frames, writes: window.__plWrites, ms: Math.round(ms) };
  }, { from, to, steps });
  await p.close();
  return {
    label,
    from,
    to,
    frames: res.frames,
    writes: res.writes,
    writesPerFrame: +(res.writes / res.frames).toFixed(2),
    ms: res.ms
  };
}

console.log(JSON.stringify(await band(0.62, 0.68, 60, 'fade-in'))); 
console.log(JSON.stringify(await band(0.68, 0.74, 60, 'hold')));
console.log(JSON.stringify(await band(0.74, 0.80, 60, 'fade-out')));
await b.close();

