# Novin Robotic Mirzania — logo-sequence page

A single page built around one scroll-linked sequence — two full clockwise
turns. The page opens on the **big mark half-clipped at the right edge**; it
**spins left across the screen** to the left edge, winds down to the small
centred mark, **grows into the big wordmark with the text dawning in**, spins
away into the small mark again, **side copy appears left and right**, then it
**grows big once more at the left edge — half clipped, at the exact 45°
diamond pose** — and dives down to dock above the bottom edge, handing off to
a copy **centred inside the footer landing area**. Below the sequence sits the
**programmes grid** (4–7 photo slots with text). No top navigation bar.

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
index.html                     page skeleton (logo stage + side copy + programmes + footer)
content.js                     ✏️ THE single content source — copy, photo slots, theme, animation tuning
assets/css/style.css           design system + the animation styles
assets/js/main.js              the sequence engine + QA hook
assets/logo/logo-wordmark.svg  vector lockup (diamond + "NOVIN ROBOTIC MIRZANIA" + Persian line)
assets/logo/logo-mark.svg      vector mark (diamond only)
assets/logo/*@2x.png / *@3x.png  raster fallbacks (not used by default)
assets/img/gallery-0*.svg      programme photo placeholders — swap for real photos
assets/favicon.svg             favicon (the mark)
tools/export-logo-from-cdr.py  regenerate the logo assets from "LOGO MIRZANIA.cdr"
qa/                            headless QA harness + evidence + reports (tooling only)
server.js                      zero-dependency local preview server
```

---

## The sequence (and how to tune it)

Scroll progress drives nine states: **opening — big mark half-clipped at the
RIGHT edge → spins left across the screen, still big → winds down, shrinking
back to the centred small mark → the wordmark dawns (the lockup grows to full
size and settles upright) → classic spin + shrink (wordmark swaps to the mark
mid-turn) → side copy left/right of the small symbol → big again at the LEFT
edge, half-clipped, exact 45° pose → travel down to the dock holding that
pose → settle upright, centred horizontally, just above the bottom edge**
(the footer below the programmes grid carries its own centred copy of the
mark, so the end state at the very bottom of the page is "logo in the middle
of the footer"). The whole journey is two full clockwise turns (720°);
scrolling up plays everything in reverse.

Tuning lives in `content.js` → `animation`:

| key | default | meaning |
| --- | --- | --- |
| `spinTurns` | `1` | scales the designed journey (the journey itself is two full clockwise turns — 720°) |
| `heroWidthVw` / `heroWidthVh` | `92` / `96` | hero logo max share of viewport width / height |
| `heroWidthMaxPx` | `1600` | absolute cap for the hero logo |
| `bigDiameterVh` | `0.96` | diameter of the enlarged state (share of viewport height; half hangs past the left edge) |
| `footerScale` | `0.42` | landing size inside the footer (share of footer height) |
| `footerMaxPx` | `330` | absolute cap for the landing size |
| `edgeMarginPx` | `12` | minimum gap kept to the screen edges |

Stage boundaries live in `assets/js/main.js` (the `render()` windows:
opening hold 0–0.12, sweep left 0.12–0.26, wind-down 0.26–0.40, wordmark dawn
0.40–0.54 (hold to 0.60), classic spin 0.60–0.72, side copy 0.72–0.86, big
left 0.86–0.92, dock 0.92–0.98). Hero heights: 340vh desktop / 300vh tablet /
260vh phone.

**Reduced motion** (`prefers-reduced-motion: reduce`): no animation — the
wordmark shows fully in the hero, no side copy, the programmes grid renders
statically, the footer signature is drawn statically, and the mark rests fully
visible, centred in the footer's landing area.

**Footer:** columns row → the sequence's landing area (the mark docks into
its centre) → the giant animated brand text (stroke draw-in on first view;
hover reveals a cursor-following rainbow) over a radial glow. The text is
`footer.signature.text` in `content.js`; the glow tint and effect colors live
in `style.css` (`.footer__glow`, `.sig__*` — swap `--accent`/the tint for a
different brand colour).

**QA hook**: `?qa=<0..1>` pins the sequence for automated screenshots
(`?qa=0.06` opening big-right, `?qa=0.19` mid-sweep, `?qa=0.78` side-copy
stage, `?qa=0.92` the 45° big-left state, `?qa=0.995` hero dock); zero effect
without the parameter.

## Edit the copy

Open **`content.js`**:

- `heroSide` — the two text blocks that appear left/right of the small symbol.
- `gallery` — the programmes section: heading, intro, and the 4–7 photo slots
  (`img`, `alt`, `title`, `text`). Add or remove items freely; the grid adapts.
- `footer` — blurb, section links, contact lines, legal line, and
  `footer.signature.text` (the giant animated footer text).
- `theme` — colors (the `stage` token is the single background color).

Save + refresh; no rebuild.

## Replace the photos

The six files in `assets/img/` are placeholder illustrations. Either overwrite
them (keep the names) or add real photos anywhere and point `gallery.items[].img`
at them. Use roughly 4:3 images; `object-fit: cover` handles the rest.

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

- **`v1.3.0`** — current (bigger hero, side copy restored, programmes grid, dock + footer-centre landing).
- **`v1.2.0`** — logo-only page (bigger hero, half-clipped growth, footer-centre landing).
- **`v1.1.0`** — small hero, footer-top dock.
- **`v1.0.0`** — original (flip animation, gallery page).

Restore: `git checkout v1.3.0` (or any tag), then re-upload. Static archives:
`qa/evidence/rollback/dist-v1.3.0.zip` (SHA-256 next to it), plus the older
`dist-v1.2.0.zip` / `dist-v1.1.0.zip` / `dist-v1.0.0.zip`. Ship fixes as
`v1.3.1`; never move a published tag.

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
