# Novin Robotic Mirzania — logo-sequence page

A single page built around one scroll-linked sequence: the logo starts **big**
at the top, spins clockwise while shrinking, **side copy appears left and
right of the small symbol**, then it **grows big at the left edge and spins
right across the screen** — ending up roughly **half clipped** past the right
edge, with both big states at the mark's **45° diamond pose** — and finally
travels down and docks, upright, just above the bottom edge, handing off to a
copy **centred inside the footer landing area**. No top navigation bar.

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
index.html                     page skeleton (logo stage + side copy + footer)
content.js                     ✏️ THE single content source — copy, theme, animation tuning
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

Scroll progress drives seven states: **hold (big logo) → clockwise spin +
shrink (wordmark swaps to the mark mid-turn) → side copy left/right of the
small symbol → grow big at the LEFT edge (half past it) → spin right across
the screen, still big, landing at the RIGHT edge half-clipped — both big
states at the mark's exact 45° pose — → travel down to the dock holding that
pose → settle upright, centred horizontally, just above the bottom edge**
(the footer carries its own centred copy of the
mark, so the end state at the very bottom of the page is "logo in the middle
of the footer"). Scrolling up plays everything in reverse.

Tuning lives in `content.js` → `animation`:

| key | default | meaning |
| --- | --- | --- |
| `spinTurns` | `1` | full clockwise turns across the whole sequence (1 = 360°) |
| `heroWidthVw` / `heroWidthVh` | `92` / `96` | hero logo max share of viewport width / height |
| `heroWidthMaxPx` | `1600` | absolute cap for the hero logo |
| `bigDiameterVh` | `0.96` | diameter of the enlarged state (share of viewport height; half hangs past the left edge) |
| `footerScale` | `0.42` | landing size inside the footer (share of footer height) |
| `footerMaxPx` | `330` | absolute cap for the landing size |
| `edgeMarginPx` | `12` | minimum gap kept to the screen edges |

Stage boundaries live in `assets/js/main.js` (the `render()` windows:
hold 0–0.10, spin 0.10–0.34, side-copy hold 0.34–0.58, grow left 0.58–0.70,
sweep right 0.70–0.84, dock travel 0.84–0.94). Hero heights: 340vh desktop /
300vh tablet / 260vh phone.

**Reduced motion** (`prefers-reduced-motion: reduce`): no animation — the
wordmark shows fully in the hero, no side copy, the footer signature
is drawn statically, and the mark rests fully
visible, centred in the footer's landing area.

**Footer:** columns row → the sequence's landing area (the mark docks into
its centre) → the giant animated brand text (stroke draw-in on first view;
hover reveals a cursor-following rainbow) over a radial glow. The text is
`footer.signature.text` in `content.js`; the glow tint and effect colors live
in `style.css` (`.footer__glow`, `.sig__*` — swap `--accent`/the tint for a
different brand colour).

**QA hook**: `?qa=<0..1>` pins the sequence for automated screenshots
(`?qa=0.5` side-copy stage, `?qa=0.86` half-clipped enlarged state,
`?qa=0.995` hero dock); zero effect without the parameter.

## Edit the copy

Open **`content.js`**:

- `heroSide` — the two text blocks that appear left/right of the small symbol.
- `footer` — blurb, section links, contact lines, legal line, and
  `footer.signature.text` (the giant animated footer text).
- `theme` — colors (the `stage` token is the single background color).

Save + refresh; no rebuild.

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

- **`v1.3.6`** — current (programmes section removed; sequence as of v1.3.3).
- **`v1.3.5`** — the v1.3.3 sequence, re-tagged after the revert (Ctrl+Z of v1.3.4).
- **`v1.3.4`** — the reordered sequence (big right first; undone on request).
- **`v1.3.3`** — big right phase added after the side copy; wordmark intro first.
- **`v1.2.0`** — logo-only page (bigger hero, half-clipped growth, footer-centre landing).
- **`v1.1.0`** — small hero, footer-top dock.
- **`v1.0.0`** — original (flip animation, gallery page).

Restore: `git checkout v1.3.6` (or any tag), then re-upload. Static archives:
`qa/evidence/rollback/dist-v1.3.6.zip` (SHA-256 next to it), plus the older
`dist-v1.3.5.zip` … `dist-v1.0.0.zip`. Ship fixes as
`v1.3.7`; never move a published tag.

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
