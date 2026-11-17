import puppeteer from "puppeteer-core";
import { CHROME } from "./lib.mjs";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-application-cache"] });
const p = await b.newPage();
await p.setCacheEnabled(false);
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto("http://localhost:8080/?qa=0.86&fresh=" + Date.now(), { waitUntil: "networkidle0", timeout: 90000 });
await new Promise(r => setTimeout(r, 1000));
const m = await p.evaluate(() => ({
  title: document.querySelector(".gallery__title")?.textContent.trim(),
  faces: document.querySelectorAll(".gallery__face").length,
  srcs: [...document.querySelectorAll(".gallery__face img")].map(i => i.getAttribute("src").replace(/^.*\//, "")),
  loaded: [...document.querySelectorAll(".gallery__face img")].filter(i => i.naturalWidth > 0).length
}));
console.log("STATE", JSON.stringify(m));
await p.screenshot({ path: "C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots/gal6.png" });
await b.close();
