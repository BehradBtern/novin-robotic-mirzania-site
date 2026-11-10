import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
async function measure(url) {
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await p.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await p.waitForFunction('document.documentElement.dataset.ready === "true"', { timeout: 20000 }).catch(() => {});
  const cdp = await p.target().createCDPSession();
  await cdp.send('Performance.enable');
  const before = (await cdp.send('Performance.getMetrics')).metrics;
  const t0 = Date.now();
  for (let i = 0; i <= 40; i++) {
    await p.evaluate((y) => window.scrollTo(0, y), Math.round(i * 90));
    await new Promise(r => setTimeout(r, 16));
  }
  await new Promise(r => setTimeout(r, 300));
  const after = (await cdp.send('Performance.getMetrics')).metrics;
  const pick = (m, n) => (m.find(x => x.name === n) || {}).value || 0;
  const out = {
    ms: Date.now() - t0,
    TaskMs: +((pick(after,'TaskDuration') - pick(before,'TaskDuration')) * 1000).toFixed(1),
    ScriptMs: +((pick(after,'ScriptDuration') - pick(before,'ScriptDuration')) * 1000).toFixed(1),
    LayoutMs: +((pick(after,'LayoutDuration') - pick(before,'LayoutDuration')) * 1000).toFixed(1)
  };
  await p.close();
  return out;
}
const withBg = await measure('http://localhost:8080/?qa=0.55');
const noBg = await measure('http://localhost:8080/?qa=0.55&bg=0');
console.log('with-plane', JSON.stringify(withBg));
console.log('flat-stage', JSON.stringify(noBg));
await b.close();
