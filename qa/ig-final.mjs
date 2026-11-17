import puppeteer from "puppeteer-core";
import { CHROME } from "./lib.mjs";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage();
await p.setCacheEnabled(false);
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto("http://localhost:8080/?qa=0.86&v=" + Date.now(), { waitUntil: "networkidle0", timeout: 90000 });
await new Promise(r => setTimeout(r, 900));
const g = await p.evaluate(() => {
  const f = [...document.querySelectorAll(".gallery__face")].map(e => e.getBoundingClientRect()).filter(r => r.width > 40);
  const xs = f.map(r => [Math.round(r.left), Math.round(r.right)]).sort((a,b)=>a[0]-b[0]);
  return { faces: document.querySelectorAll(".gallery__face").length, strip: xs.length ? [xs[0][0], xs[xs.length-1][1]] : null, loaded: [...document.querySelectorAll(".gallery__face img")].filter(i=>i.naturalWidth>0).length };
});
console.log("LOCAL", JSON.stringify(g));
await p.screenshot({ path: "C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots/ig-final-1440.png" });
await b.close();
