# Novin Robotic Mirzania — logo-sequence page

A minimal single page: the institute's logo plays a scroll-linked sequence —
it **spins clockwise** while shrinking (the wordmark turns into the symbol
mark), **travels to the left** while growing, **descends**, and docks
**half-hidden at the footer**, where it stays. Everything else is the footer.
No top navigation bar.

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

Scroll progress drives five phases: **hold → clockwise spin + shrink (the
wordmark swaps to the mark mid-turn) → left travel + grow → descend → dock.**
After the pin releases, the mark rides up with the footer and rests with
roughly half visible above the footer's edge (on phones the footer is taller
than the screen, so the same dock reads against the top of the viewport).

Tuning lives in `content.js` → `animation`:

| key | default | meaning |
| --- | --- | --- |
| `spinTurns` | `1` | full clockwise turns during the spin (1 = 360°) |
| `dockXFrac` | `0.30` | where the logo ends horizontally (share of viewport width) |
| `maxRadiusVh` | `0.46` | cap for the final logo radius (share of viewport height) |
| `edgeMarginPx` | `12` | minimum gap kept to the screen edges |

Stage boundaries live in `assets/js/main.js` (the `render()` windows).
Hero heights: 340vh desktop / 300vh tablet / 260vh phone.

**Reduced motion** (`prefers-reduced-motion: reduce`): no spin — the page
shows the static wordmark and the end state (the mark docked at the footer).

**QA hook**: `?qa=<0..1>` pins the sequence for automated screenshots; it has
no effect without the parameter.

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
places so the spin stays continuous:

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
size — see `qa/qa-report.md` §e for the sharpness evidence.

## Deploy

Upload `index.html`, `content.js` and the `assets/` folder to any static host
(all references are relative; the page performs **zero external requests**).
In this environment the AutoClaw preview channel handles staging; formal
publish is the **Publish** action in the browser panel.

## Rollback

Releases are git-tagged in this repository:

- **`v1.1.0`** — current (clockwise-spin + footer-dock sequence, CDR-derived vector logo).
- **`v1.0.0`** — previous behaviour (flip animation, gallery page) — kept for one-step restore.

Restore: `git checkout v1.0.0` (or `git worktree add <dir> v1.0.0`), then
re-upload. Static archives: `qa/evidence/rollback/dist-v1.1.0.zip` and
`dist-v1.0.0.zip` (SHA-256 recorded next to each). Ship fixes as `v1.1.1`;
never move a published tag.

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
