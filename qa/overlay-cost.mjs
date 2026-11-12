// Frame-cost probe for the places overlay window vs a control band.
// Usage: node qa/overlay-cost.mjs [url]
import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';

const URL = process.argv[2] || 'http://localhost:8080/';
const b = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});

async function band(w, h, from, to, label) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await p.goto(URL, { waitUntil: 'networkidle0', timeout: 90000 });
  await p.waitForFunction('document.documentElement.dataset.ready === "true"', { timeout: 20000 }).catch(() => {});
  // park at the start of the band
  await p.evaluate((v) => { location.search = '?qa=' + v; }, from);
  await p.waitForFunction('document.documentElement.dataset.ready === "true"', { timeout: 20000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 600));

  const cdp = await p.target().createCDPSession();
  await cdp.send('Performance.enable');
  const m0 = (await cdp.send('Performance.getMetrics')).metrics;
  const pick = (m, n) => (m.find((x) => x.name === n) || {}).value || 0;

  const frames = await p.evaluate(async ({ from, to }) => {
    const de = document.documentElement;
    const max = de.scrollHeight - innerHeight;
    const heroH = document.getElementById('story').offsetHeight - innerHeight;
    const yFor = (q) => Math.round(q * heroH);
    window.scrollTo(0, yFor(from));
    await new Promise((r) => requestAnimationFrame(r));
    const deltas = [];
    let last = performance.now();
    const steps = 160;
    for (let i = 1; i <= steps; i++) {
      const q = from + (to - from) * (i / steps);
      window.scrollTo(0, Math.min(yFor(q), max));
      await new Promise((r) => requestAnimationFrame(r));
      const now = performance.now();
      deltas.push(now - last);
      last = now;
    }
    const s = deltas.slice(2).sort((a, b) => a - b);
    return {
      n: s.length,
      med: +s[Math.floor(s.length / 2)].toFixed(1),
      p95: +s[Math.floor(s.length * 0.95)].toFixed(1),
      max: +s[s.length - 1].toFixed(1),
      over20: s.filter((x) => x > 20).length,
      over33: s.filter((x) => x > 33).length
    };
  }, { from, to });

  const m1 = (await cdp.send('Performance.getMetrics')).metrics;
  await p.close();
  return {
    label,
    vp: w + 'x' + h,
    frames,
    taskMs: +((pick(m1, 'TaskDuration') - pick(m0, 'TaskDuration')) * 1000).toFixed(1),
    scriptMs: +((pick(m1, 'ScriptDuration') - pick(m0, 'ScriptDuration')) * 1000).toFixed(1),
    layoutMs: +((pick(m1, 'LayoutDuration') - pick(m0, 'LayoutDuration')) * 1000).toFixed(1),
    recalcMs: +((pick(m1, 'RecalcStyleDuration') - pick(m0, 'RecalcStyleDuration')) * 1000).toFixed(1)
  };
}

const out = [];
for (const [w, h] of [[1440, 900], [2560, 1440]]) {
  out.push(await band(w, h, 0.30, 0.50, 'control (no overlay)'));
  out.push(await band(w, h, 0.60, 0.82, 'overlay window'));
}
for (const r of out) console.log(JSON.stringify(r));
await b.close();
