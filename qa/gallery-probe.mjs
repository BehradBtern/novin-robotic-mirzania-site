import puppeteer from "puppeteer-core";
import { CHROME } from "./lib.mjs";
const W = "C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage();
const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto("http://localhost:8080/", { waitUntil: "networkidle0", timeout: 90000 });
await new Promise(r => setTimeout(r, 600));
const st = await p.evaluate(() => {
  const g = document.getElementById("gallery");
  const faces = document.querySelectorAll(".gallery__face");
  const imgs = Array.from(document.querySelectorAll(".gallery__face img"));
  return {
    section: !!g,
    faces: faces.length,
    firstTransform: faces[0] ? faces[0].style.transform : null,
    loaded: imgs.filter(i => i.naturalWidth > 0).length,
    hasSrc: imgs.filter(i => i.getAttribute("src")).length,
    cylW: document.querySelector(".gallery__cylinder").style.width
  };
});
// scroll the gallery into view and let the observer arm it
await p.evaluate(() => document.getElementById("gallery").scrollIntoView({ block: "center" }));
await new Promise(r => setTimeout(r, 1400));
const after = await p.evaluate(() => {
  const imgs = Array.from(document.querySelectorAll(".gallery__face img"));
  return { loaded: imgs.filter(i => i.naturalWidth > 0).length, withSrc: imgs.filter(i => i.getAttribute("src")).length };
});
await p.screenshot({ path: W + "/gallery-1440.png" });
console.log(JSON.stringify({ st, after, errs: errs.slice(0,3) }));
await b.close();
