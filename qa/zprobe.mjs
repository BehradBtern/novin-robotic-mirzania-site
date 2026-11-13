import puppeteer from "puppeteer-core";
import { CHROME } from "./lib.mjs";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto("http://localhost:8080/?qa=0.90", { waitUntil: "networkidle0", timeout: 90000 });
await new Promise(r => setTimeout(r, 600));
const m = await p.evaluate(() => {
  const mark = document.getElementById("hero-mark");
  const chain = [];
  let el = mark;
  while (el && el !== document.body) {
    const cs = getComputedStyle(el);
    chain.push({ tag: el.tagName + (el.id ? "#" + el.id : "") + (el.className && typeof el.className === "string" ? "." + el.className.split(" ")[0] : ""), z: cs.zIndex, pos: cs.position });
    el = el.parentElement;
  }
  const g = document.getElementById("gallery");
  return { chain, galleryZ: getComputedStyle(g).zIndex };
});
console.log(JSON.stringify(m, null, 1));
await b.close();
