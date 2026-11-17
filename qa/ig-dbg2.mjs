import puppeteer from "puppeteer-core";
import { CHROME } from "./lib.mjs";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage();
await p.setCacheEnabled(false);
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto("http://localhost:8080/?qa=0.86&v=" + Date.now(), { waitUntil: "networkidle0", timeout: 90000 });
await new Promise(r => setTimeout(r, 700));
const info = await p.evaluate(() => {
  const imgs = [...document.querySelectorAll(".gallery__face img")];
  return { n: imgs.length, srcs: imgs.map(i => i.getAttribute("src")), w: imgs.map(i => i.naturalWidth), contentLen: window.SITE_CONTENT.gallery.length, first: window.SITE_CONTENT.gallery[0] };
});
console.log(JSON.stringify(info));
await b.close();
