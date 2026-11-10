import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
async function cadence(url) {
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await p.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await p.waitForFunction('document.documentElement.dataset.ready === "true"', { timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 600));
  const res = await p.evaluate(() => new Promise((done) => {
    const d = []; let last = performance.now();
    function f(now) { d.push(now - last); last = now; if (now - d[0] > 0 && d.length < 180) requestAnimationFrame(f); else finish(); }
    function finish() { const s = d.slice(2).sort((a,b)=>a-b); done({ n: s.length, med: +s[Math.floor(s.length/2)].toFixed(1), p95: +s[Math.floor(s.length*0.95)].toFixed(1), max: +s[s.length-1].toFixed(1), over20: s.filter(x=>x>20).length }); }
    requestAnimationFrame(f);
  }));
  await p.close();
  return res;
}
for (let i = 0; i < 3; i++) {
  console.log('plane ', i, JSON.stringify(await cadence('http://localhost:8080/?qa=0.55')));
  console.log('flat  ', i, JSON.stringify(await cadence('http://localhost:8080/?qa=0.55&bg=0')));
}
await b.close();
