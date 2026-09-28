# Novin Robotic Mirzania — logo-sequence page

A minimal single page built around one scroll-linked sequence: the logo starts
**big** at the top, spins clockwise while shrinking, **grows again** as it
travels left — ending up roughly **half clipped** past the left edge — then
travels down **into the middle of the footer**, where it settles centred at a
footer-appropriate size. Everything else is the footer. No top navigation bar.

No framework, no build step: plain HTML/CSS/JS. All content lives in one file.

---

## Quick start (local)

```bash
node server.js          # serves this folder, prints its URL
# → open http://localhost:8080/
```

Change the port with the `PORT` environment variable (`$env:PORT=9000; node server.js`).
`npm run dev` is an alias for the same command.

> The page requires JavaScript; with JS disabled a short notice is shown.

## File map

```
index.html                     page skeleton (logo stage + footer)
content.js                     ✏️ THE single content source — footer copy, theme, animation tuning
assets/css/style.css           design system + the animation styles
assets/js/main.js              the sequence engine + QA hook
assets/logo/logo-wordmark.svg  vector lockup (diamond + "NOVIN ROBOTIC MIRZANIA" + Persian line)
assets/logo/logo-mark.svg      vector mark (diamond only)
assets/logo/*@2x.png / *@3x.png  raster fallbacks (not used by default)
assets/favicon.svg             favicon (the mark)
tools/export-logo-from-cdr.py  regenerate the logo assets from "LOGO MIRZANIA.cdr"
qa/                            headless QA harness + evidence + reports (tooling only)
server.js                      zero-dependency local preview server
```

---

## The sequence (and how to tune it)

Scroll progress drives five states: **hold (big logo) → clockwise spin +
shrink (wordmark swaps to the mark mid-turn) → left travel + grow until half
is clipped → travel to the middle of the footer → settle centred inside the
footer band.** The landing rides with the footer; scrolling up plays
everything in reverse.

Tuning lives in `content.js` → `animation`:

| key | default | meaning |
| --- | --- | --- |
| `spinTurns` | `1` | full clockwise turns across the whole sequence (1 = 360°) |
| `heroWidthVw` / `heroWidthVh` | `92` / `86` | hero logo max share of viewport width / height |
| `heroWidthMaxPx` | `1250` | absolute cap for the hero logo |
| `bigDiameterVh` | `0.96` | diameter of the enlarged state (share of viewport height; half hangs past the left edge) |
| `footerScale` | `0.42` | landing size inside the footer (share of footer height) |
| `footerMaxPx` | `330` | absolute cap for the landing size |
| `edgeMarginPx` | `12` | minimum gap kept to the screen edges |

Stage boundaries live in `assets/js/main.js` (the `render()` windows:
hold 0–0.12, spin 0.12–0.40, left+grow 0.40–0.68, footer travel 0.68–0.92).
Hero heights: 340vh desktop / 300vh tablet / 260vh phone.

**Reduced motion** (`prefers-reduced-motion: reduce`): no animation — the
wordmark shows fully in the hero and the mark rests fully visible, centred in
the footer band.

**QA hook**: `?qa=<0..1>` pins the sequence for automated screenshots
(`?qa=0.68` is the half-clipped enlarged state); zero effect without the
parameter.

## Edit the footer copy

Open **`content.js`** → `footer` — blurb, section links, contact lines, legal
line. Theme colors live under `theme` (the `stage` token is the single
background color). Save + refresh; no rebuild.

## Replace the logo

**Option A — drop-in:** replace these two files, keeping the names and a
transparent background:

- `assets/logo/logo-wordmark.svg` — lockup above text.
- `assets/logo/logo-mark.svg` — mark only. (Also copy it over `assets/favicon.svg`.)

If the new artwork's diamond sits differently, update the geometry in two
places so the spin and clip stay continuous:

- `content.js` → `constants.wordmarkDiamondWidthFrac` / `wordmarkDiamondCenterYFrac`
  (diamond width ÷ lockup width; diamond centre-Y ÷ lockup height)
- `assets/css/style.css` → `.hero__markbox` (`left`, `top`, `width`, `aspect-ratio`).

**Option B — regenerate from the CorelDRAW master:**

```bash
python tools/export-logo-from-cdr.py     # needs LibreOffice installed
```

This reads `LOGO MIRZANIA.cdr` through LibreOffice, rebuilds a clean SVG of
the lockup and the mark, recolours to `#56C1C9`, writes the 2x/3x PNG
fallbacks and prints a summary. Notes: the exporter compensates for a known
libcdr limitation (four “I” glyphs are rebuilt from measured stem/cap
metrics), and the resulting SVGs are validated by rendering them at large
size — see the QA report §e for the sharpness evidence.

## Deploy

Upload `index.html`, `content.js` and the `assets/` folder to any static host
(all references are relative; the page performs **zero external requests**).
In this environment the AutoClaw preview channel handles staging; formal
publish is the **Publish** action in the browser panel.

## Rollback

Releases are git-tagged in this repository:

- **`v1.2.0`** — current (big hero logo, half-clipped growth, footer-centre landing).
- **`v1.1.0`** — previous behaviour (small hero logo, footer-top dock).
- **`v1.0.0`** — original (flip animation, gallery page).

Restore: `git checkout v1.2.0` (or any tag), then re-upload. Static archives:
`qa/evidence/rollback/dist-v1.2.0.zip` (SHA-256 next to it), plus the older
`dist-v1.1.0.zip` / `dist-v1.0.0.zip`. Ship fixes as `v1.2.1`; never move a
published tag.

## QA — regenerate evidence

```bash
npm install        # dev-only: installs puppeteer-core (no browser download)
npm run qa         # full suite -> qa/qa-report.md + qa/evidence/**
node qa/shot.mjs chrome <url> <w> <h> out.png [qa]   # single screenshot
```

The harness uses puppeteer-core with the machine's installed Chrome
(`C:\Program Files\Google\Chrome\Application\chrome.exe`) and Edge for a
subset. The Chrome/Edge `--screenshot` CLI is not used (it fails on hosts
with a running browser session — puppeteer-core launches with its own
temp profile). Browser coverage is recorded honestly in `qa/qa-log.md`:
Chrome (full) + Edge (subset, same engine); Firefox/Safari/iOS/Android were
**not executable on the QA host** and are covered by inspection notes only.
