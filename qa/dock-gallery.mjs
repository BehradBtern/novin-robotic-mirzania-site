import puppeteer from "puppeteer-core";
import { CHROME } from "./lib.mjs";
const W = "C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
for (const q of [0.86, 0.98]) {
  await p.goto("http://localhost:8080/?qa=" + q, { waitUntil: "networkidle0", timeout: 90000 });
  await new Promise(r => setTimeout(r, 900));
  const m = await p.evaluate(() => {
    const g = document.getElementById("gallery");
    const mk = document.getElementById("hero-mark").getBoundingClientRect();
    const dr = document.querySelector(".gallery__stage").getBoundingClientRect();
    return { opacity: +getComputedStyle(g).opacity, loaded: Array.from(document.querySelectorAll(".gallery__face img")).filter(i => i.naturalWidth > 0).length, markRight: Math.round(mk.right), stageLeft: Math.round(dr.left) };
  });
  console.log("p=" + q, JSON.stringify(m));
  await p.screenshot({ path: W + "/dock-gallery-" + String(q).replace(".", "") + ".png" });
}
await b.close();
