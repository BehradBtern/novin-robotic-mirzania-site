import puppeteer from "puppeteer-core";
import { CHROME } from "./lib.mjs";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
for (const q of [0.80, 0.86, 0.90, 0.94, 0.97, 1.0]) {
  await p.goto("http://localhost:8080/?qa=" + q, { waitUntil: "networkidle0", timeout: 90000 });
  await new Promise(r => setTimeout(r, 500));
  const m = await p.evaluate(() => {
    const mk = document.getElementById("hero-mark").getBoundingClientRect();
    const box = document.getElementById("hero-markbox").getBoundingClientRect();
    return { markX: Math.round(mk.x), markW: Math.round(mk.width), boxX: Math.round(box.x), boxW: Math.round(box.width) };
  });
  console.log("p=" + q, JSON.stringify(m));
}
await b.close();
