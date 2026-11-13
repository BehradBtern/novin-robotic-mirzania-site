import puppeteer from "puppeteer-core";
import { CHROME } from "./lib.mjs";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto("http://localhost:8080/?qa=0.86", { waitUntil: "networkidle0", timeout: 90000 });
await new Promise(r => setTimeout(r, 900));
const m = await p.evaluate(() => {
  const f = [...document.querySelectorAll(".gallery__face")].map(e => e.getBoundingClientRect()).filter(r => r.right > 0 && r.left < innerWidth && r.width > 20);
  const xs = f.map(r => [Math.round(r.left), Math.round(r.right)]).sort((a,b)=>a[0]-b[0]);
  const st = document.querySelector(".gallery__stage").getBoundingClientRect();
  const mk = document.getElementById("hero-mark").getBoundingClientRect();
  return { stripLeft: xs.length ? xs[0][0] : 0, stripRight: xs.length ? xs[xs.length-1][1] : 0, faceW: xs.length ? xs[0][1]-xs[0][0] : 0, stageH: Math.round(st.height), mark: [Math.round(mk.left), Math.round(mk.right)] };
});
console.log("GEOM", JSON.stringify(m));
await p.screenshot({ path: "C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots/big-gallery-1440.png" });
await b.close();
