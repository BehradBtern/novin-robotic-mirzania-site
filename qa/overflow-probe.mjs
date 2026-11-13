import puppeteer from "puppeteer-core";
import { CHROME } from "./lib.mjs";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage();
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
await p.goto("http://localhost:8080/", { waitUntil: "networkidle0", timeout: 90000 });
await new Promise(r => setTimeout(r, 600));
const m = await p.evaluate(() => ({
  doc: { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth },
  body: { sw: document.body.scrollWidth },
  sticky: { sw: document.querySelector(".hero__sticky").scrollWidth, ov: getComputedStyle(document.querySelector(".hero__sticky")).overflow },
  gallery: { sw: document.querySelector("#gallery").scrollWidth, rect: Math.round(document.querySelector("#gallery").getBoundingClientRect().right) },
  cyl: { rect: Math.round(document.querySelector(".gallery__cylinder").getBoundingClientRect().right) }
}));
console.log(JSON.stringify(m, null, 1));
await b.close();
