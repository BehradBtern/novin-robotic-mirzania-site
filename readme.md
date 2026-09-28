# Novin Robotic Mirzania — one-page website

A static, single-page website for the institute: a four-stage scroll-linked logo
choreography (wordmark → flip + shrink to the mark → copy left and right → the
mark rotates left, grows, and stays half visible at the left edge), followed by
a six-slot gallery and a footer. **No top navigation bar** — the footer is the
only navigation.

No framework, no build step: plain HTML/CSS/JS. All content lives in one file.

---

## Quick start (local)

```bash
node server.js          # serves this folder, prints its URL
# → open http://localhost:8080/
```

Change the port with the `PORT` environment variable (`$env:PORT=9000; node server.js`).
`npm run dev` is an alias for the same command.

> The page requires JavaScript for content rendering; with JS disabled a short
> notice is shown instead.

## File map

```
index.html                page skeleton (static chrome only; content injected from content.js)
content.js                ✏️ THE single content source — every string, image path, and theme color
server.js                 zero-dependency static server for local preview
package.json              scripts: dev, qa (QA needs devDependencies only)
assets/css/style.css      design system + layout + animation styles
assets/js/main.js         content rendering + the four-stage scroll choreography + QA hook
assets/logo/logo-wordmark.svg   vector lockup (diamond + "NOVIN ROBOTIC MIRZANIA" + Persian line)
assets/logo/logo-mark.svg       vector mark (diamond only)
assets/img/gallery-01..06.svg   placeholder artworks (replace with real photos)
assets/favicon.svg        favicon (the mark)
tools/make-logo-assets.py regenerate the two logo SVGs from source PNGs
qa/                       headless QA harness + evidence + reports (tooling; not needed to serve)
```

---

## Edit copy / retheme

- Open **`content.js`** — every user-visible string is there: `meta`, `brand`,
  `hero` (including the four chapter labels), `gallery` (titles, texts, alt
  texts, image paths), `footer` (blurb, links, contact, legal).
- **Background color**: change `theme.stage` (one token) in `content.js`.
  If you change it, re-check text contrast (the QA report lists the measured
  ratios; teal-on-stage is ≈8.2:1 with the shipped values).
- Save + refresh. No rebuild, no other file.
- Keep replacement copy roughly the same length — the hero reserves fixed space for the mark
  between the two copy columns, and very long text will tighten that gap.

## Replace the logo

**Drop-in (recommended):** replace these two files, keeping the same names:

- `assets/logo/logo-wordmark.svg` — lockup above text; canvas ≈ 1304×1024.
- `assets/logo/logo-mark.svg` — mark only; canvas ≈ 167×165.

The animation reads only these two files; keep a transparent background and a
similar aspect ratio and nothing else needs changing.

**From new source PNGs:** put them at the repo root as `logo-mirzania.png`
(wordmark) and `logo-mirzania-mark.png` (mark only), then:

```bash
python -m pip install vtracer   # one-time
python tools/make-logo-assets.py
```

**Important geometry note:** the flip animation keeps the diamond continuous by
aligning the mark's box to the diamond's box inside the wordmark. Those two
fractions live in `content.js` → `constants`
(`wordmarkDiamondWidthFrac`, `wordmarkDiamondCenterYFrac`). If the new artwork's
diamond sits differently, update these values (measure: diamond width ÷ lockup
width; diamond center-Y ÷ lockup height).

## Photos

- Replace each `gallery.items[i].image` path in `content.js` with a real photo
  (recommended: 3:2 aspect, ≤ ~400 KB, e.g. 1200×800 JPG/WebP). Keep each
  `alt` meaningful — it is read by screen readers.
- **Add or remove slots:** edit the `gallery.items` array — keep **4–7 items**.
  The layout adapts automatically (alternating rows on desktop, stacked on
  mobile; verified with 4, 6 and 7 items).

## Accessibility & motion

- `prefers-reduced-motion: reduce` → the page shows a static, fully readable
  layout (no pinned choreography). Toggling the OS setting reloads the page.
- Keyboard: “Skip to gallery” is the first focusable element; footer links are
  reachable with visible focus rings; nothing focusable inside the hero.
- Automated checks (contrast, alt text, reduced motion, overlap scans) are in
  the QA report — see below.
- QA hook for tooling only: `?qa=<0..1>` pins the hero progress for
  deterministic screenshots; it has no effect without the parameter.

## Deploy

Upload `index.html`, `content.js` and the `assets/` folder to any static host
(server.js / package.json / tools / qa are development tooling and are not
required to serve the site). All asset references are relative; no external
requests are made (the hosting platform’s strict CSP is satisfied out of the
box). In this environment the AutoClaw preview channel handles staging; formal
publish is the **Publish** action in the browser panel.

## Rollback

Releases are git-tagged in this repository. Current: `v1.0.0`.

- Restore the code: `git checkout v1.0.0` (or `git worktree add <dir> v1.0.0`).
- Static archive for hosts without git: `qa/evidence/rollback/dist-v1.0.0.zip`
  (SHA-256 recorded in `qa/evidence/rollback/dist-sha256.txt`).
- Re-upload the restored files to the host. Hosting-level rollback (CDN cache,
  platform versions) is outside this repository — keep the archive for manual
  restore.
- Fixes after a release ship as `v1.0.1`; never move a published tag.

## Browser support log (honest summary)

| Browser | Status | Notes |
| --- | --- | --- |
| Chrome (desktop) | **EXECUTED** — full automated suite | via puppeteer-core on Windows |
| Edge (desktop) | **EXECUTED** — subset | same Chromium engine as Chrome — not independent engine coverage |
| Firefox | **NOT PERFORMED** | not installed on the QA host; risks assessed by code inspection only |
| Safari / iOS Safari | **NOT PERFORMED** | cannot run on Windows; inspection-based risk notes in `qa/qa-log.md` |
| Android Chrome (device) | **NOT PERFORMED** | layouts exercised via desktop viewport emulation only |

Reduced-motion checks were performed via DevTools emulation (`emulateMediaFeatures`)
— labeled as such in the log. Full details, commands and artifacts: `qa/qa-log.md`,
`qa/qa-report.md`.

## QA — regenerate evidence

```bash
npm install        # dev-only: installs puppeteer-core (no browser download)
npm run qa         # runs the full suite, writes qa/qa-report.md + qa/qa-log.md
```

The harness uses puppeteer-core with the machine’s installed Chrome
(`C:\Program Files\Google\Chrome\Application\chrome.exe`) and, for a subset,
Edge (`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`).

> Note: the Chrome/Edge `--screenshot` CLI does **not** work on some hosts
> (a running browser session steals the launch). The harness never uses it —
> puppeteer-core launches with its own temporary profile.

Screenshots and measurement JSON land in `qa/evidence/`; a machine-readable
summary is at `qa/qa-summary.json`.
