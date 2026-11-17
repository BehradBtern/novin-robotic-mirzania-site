import puppeteer from "puppeteer-core";
import { CHROME } from "./lib.mjs";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-http-cache"] });
const p = await b.newPage();
await p.setCacheEnabled(false);
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto("http://localhost:8080/?qa=0.86&cb=" + Date.now(), { waitUntil: "networkidle0", timeout: 90000 });
await new Promise(r => setTimeout(r, 800));
const bust = await p.evaluate(async () => {
  const imgs = [...document.querySelectorAll(".gallery__face img")];
  const stamp = Date.now();
  await Promise.all(imgs.map(i => new Promise(res => {
    i.onload = () => res();
    i.onerror = () => res();
    i.src = i.getAttribute("data-orig") || i.src.replace(/\?.*$/, "") + "?cb=" + stamp;
  })));
  return imgs.map(i => i.naturalWidth);
});
console.log("busted loads", JSON.stringify(bust));
await new Promise(r => setTimeout(r, 400));
await p.screenshot({ path: "C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots/ig-bust-1440.png" });
await b.close();
