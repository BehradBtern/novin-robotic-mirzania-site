# QA log — environment, commands, honesty notes

## Environment

- OS: win32 x64 · Node: v22.22.0 · puppeteer-core: 25.12.0
- Chrome: Chrome/153.0.8010.54 · Edge: Edg/154.0.4258.37
- Revision: 52fd9fd · 2026-09-28T13:58:21.331Z

## How to re-run

```
npm install        # dev-only (puppeteer-core)
npm run qa         # full suite -> qa/qa-report.md + qa/evidence/**
node qa/shot.mjs chrome <url> <w> <h> out.png [qa]   # single screenshot
```

## Browser matrix (honest)

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | EXECUTED — full suite | via puppeteer-core; version above |
| Edge | EXECUTED — subset | SAME Chromium engine family as Chrome; NOT independent engine coverage |
| Firefox | NOT PERFORMED — not installed on QA host | risk notes below are inspection-based only |
| Safari / iOS Safari | NOT PERFORMED — cannot run on Windows | inspection-based risk notes only; no test results claimed |
| Android Chrome (device) | NOT PERFORMED — no device | viewport emulation in desktop Chromium only (layout proxy) |

Reduced-motion checks used DevTools emulation (`emulateMediaFeatures`), labeled as such — not a real OS setting test.

## Code-inspection risk notes (Safari/iOS — NOT test results)

- `position: sticky` pinned hero: PRESENT — ancestor chain from `.hero__sticky` up to `body` is overflow/transform/filter-free by construction; JS recomputes pin math on resize.
- `100vh` (and no `100svh` fallback) usage: fallback pattern present (`100vh` line before `100svh`)
- `backface-visibility: hidden` on flip faces: present
- passive wheel/touch listeners: present (`{passive:true}`)
- modern-JS above Safari 15.4 baseline (`?.`/`??`): not found (safe)
- CSS scroll-driven animations (`animation-timeline`/ScrollTimeline): absent (safe)
- `overflow: clip`: used (Safari 16+; fallback `hidden` line present where it matters)
- `aspect-ratio`: used (Safari 15+; supported at baseline)

Known residual risk: on iOS < 16 `overflow: clip` is unsupported; the only clipped element is the pinned hero stage and
its overflow is left/right-negative only, which does not create document scrollbars in LTR — risk judged LOW; not executed.

## Rollback drill

See `qa/evidence/rollback/` (tag-show.txt, dist-sha256.txt, drill log).
