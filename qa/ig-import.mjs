// Import Instagram frames: reads qa/ig-frames.json ([{url, caption}]) and rebuilds the
// gallery block in content.js with those images. Usage: node qa/ig-import.mjs [--dry]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = "D:/novin3d";
const OUT = path.join(ROOT, "assets/gallery");
const SRC = path.join(ROOT, "qa/ig-frames.json");
const CREDIT = "Instagram @robotic_mirzania";
const dry = process.argv.includes("--dry");

const frames = JSON.parse(fs.readFileSync(SRC, "utf8"));
if (!Array.isArray(frames) || !frames.length) { console.error("no frames in ig-frames.json"); process.exit(2); }

// 1. download
const local = [];
frames.forEach((f, i) => {
  const name = "i" + String(i + 1).padStart(2, "0") + ".jpg";
  const target = path.join(OUT, name);
  if (!dry && (!fs.existsSync(target) || fs.statSync(target).size < 8000)) {
    execFileSync("python", ["-c", [
      "import sys,urllib.request",
      "u=sys.argv[1]; p=sys.argv[2]",
      "req=urllib.request.Request(u, headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0','Referer':'https://www.instagram.com/'})",
      "open(p,'wb').write(urllib.request.urlopen(req, timeout=40).read())"
    ].join(";"), f.url, target], { stdio: "inherit" });
  }
  local.push({ name, caption: f.caption || "Competition moment" });
});

// 2. square crop via python/PIL
if (!dry) {
  const script = [
    "import sys, os",
    "from PIL import Image",
    "for name in sys.argv[1:]:",
    "    p = os.path.join(r'" + OUT.replace("\\", "/") + "', name)",
    "    im = Image.open(p).convert('RGB')",
    "    w, h = im.size; side = min(w, h)",
    "    x = int((w - side) * 0.5); y = int((h - side) * 0.24)",
    "    im = im.crop((x, y, x + side, y + side)).resize((640, 640), Image.LANCZOS)",
    "    im.save(p, quality=78, optimize=True, progressive=True)",
    "    print(name, os.path.getsize(p), (w, h))"
  ].join("\n");
  const tmp = path.join(ROOT, ".openclaw-tmp-crop.py");
  fs.writeFileSync(tmp, script);
  execFileSync("python", [tmp, ...local.map(l => l.name)], { stdio: "inherit" });
  fs.unlinkSync(tmp);
}

// 3. rebuild the gallery block in content.js
const cp = path.join(ROOT, "content.js");
let s = fs.readFileSync(cp, "utf8");
const i = s.indexOf("gallery: [");
const j = s.indexOf("\n  ],", i) + "\n  ],".length;
const items = local.map(l => '    { src: "assets/gallery/' + l.name + '", credit: "' + CREDIT + '", caption: ' + JSON.stringify(l.caption) + " }").join(",\n");
const block = "gallery: [\n" + items + "\n  ],";
s = s.slice(0, i) + block + s.slice(j);
if (!dry) fs.writeFileSync(cp, s);
console.log("gallery rebuilt with", local.length, "Instagram frames", dry ? "(dry)" : "");
