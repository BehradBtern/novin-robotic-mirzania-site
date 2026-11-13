import puppeteer from "puppeteer-core";
import { CHROME } from "./lib.mjs";
const W = "C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
for (const q of [0.80, 0.86, 0.90]) {
  await p.goto("http://localhost:8080/?qa=" + q, { waitUntil: "networkidle0", timeout: 90000 });
  await new Promise(r => setTimeout(r, 800));
  const m = await p.evaluate(() => {
    const g = document.getElementById("gallery").getBoundingClientRect();
    const mk = document.getElementById("hero-mark").getBoundingClientRect();
    return { opacity: +getComputedStyle(document.getElementById("gallery")).opacity, g: [Math.round(g.left), Math.round(g.right), Math.round(g.top), Math.round(g.bottom)], mark: [Math.round(mk.left), Math.round(mk.right)] };
  });
  console.log("p=" + q, JSON.stringify(m));
  await p.screenshot({ path: W + "/left-phase-" + String(q).replace(".", "") + ".png" });
}
await b.close();
