# QA log — environment, commands, honesty notes (v1.3.6)

## Environment

- OS: win32 x64 · Node: v22.22.0 · puppeteer-core: 25.12.0
- Chrome: Chrome/154.0.8037.95 · Edge: Edg/154.0.4258.53
- Revision: dff602a · 2026-10-06T18:07:21.134Z

## How to re-run

```
npm install        # dev-only
npm run qa         # full suite -> qa/qa-report.md + qa/evidence/**
node qa/shot.mjs chrome <url> <w> <h> out.png [qa]
```

## Browser matrix (honest)

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | EXECUTED — full suite | via puppeteer-core |
| Edge | EXECUTED — subset | same Chromium engine as Chrome — not independent coverage |
| Firefox | NOT PERFORMED — not installed | inspection-based notes only |
| Safari / iOS Safari | NOT PERFORMED — cannot run on Windows | inspection-based notes only |
| Android Chrome (device) | NOT PERFORMED — no device | viewport emulation only |

Reduced-motion checks used DevTools emulation (`emulateMediaFeatures`) — labeled, not a real OS test.

## Code-inspection risk notes (NOT test results)

- sticky pinning: present; ancestor chain clean; JS recomputes geometry on resize.
- 100vh/100svh fallback: fallback pair present.
- passive listeners: present.
- modern JS above Safari 15.4 baseline: not found (safe).
- scroll-driven animations API: absent (safe).
- overflow: clip: used (Safari 16+; hidden fallback present on the sticky).

## Rollback drill

Rollback path: annotated git tags (per release). Dist zip archives are no longer produced; older archives live in git history.

## Rollback drill (lite) — v1.4.2
- Annotated tag v1.4.2 -> commit 667a5709ac8f370e6b01f064c6d6047bd932228c (QA revision 8a5be7e on the same tree).
- Change: giant outline footer text restored (draw-in + hover); the footer's big centred mark and its landing area removed (per user correction). Rollback path = git tags (dist zip archives no longer produced — user removed the archive-tracking pattern).
- Worktree smoke: v1.4.2 served on 8081; shot qa/evidence/d/rollback-v1.4.2-intro.png.

## Rollback drill (lite) — v1.4.3
- Annotated tag v1.4.3 -> peeled commit a89943b (code revision 2e4d7d5).
- Change: the grown phase reveals the original (OG) mark art via a 0.575-0.615 crossfade; Cormorant Garamond (self-hosted variable woff2, latin) for the founder/side texts and the footer blurb; QA adds OG-opacity + font-load pins; roundtrip copy list now includes assets/fonts/; qa-log regeneration preserves appended drill notes.
- Worktree smoke: v1.4.3 served on 8081 -> og=1, fontOk=true, sig=3, zero errors; shot qa/evidence/d/rollback-v1.4.3-big-og.png.

## Rollback drill (lite) — v1.4.4
- Annotated tag v1.4.4 -> peeled commit 2b5d821 (code revert revision fb883c7).
- Change: reverted the big-phase OG overlay (element, styles, content key, JS crossfade, asset removed; QA pins inverted to “OG gone”) — Cormorant Garamond texts retained. Rollback path = git tags.
- Worktree smoke: v1.4.4 served on 8081 -> ogCount=0, fontOk=true, sig=3, zero errors; shot qa/evidence/d/rollback-v1.4.4-big.png.

## Rollback drill (lite) — v1.4.5
- Annotated tag v1.4.5 -> peeled commit 4dd8bca (code revision 5b2dd90).
- Change: founder column (left side copy) +20% type (kicker/title/body), moved closer to the mark (left clamp 6vw -> 9vw); mobile anchor 18% -> 22% so the larger block clears the top edge. Rollback path = git tags.
- Worktree smoke: v1.4.5 served on 8081 -> leftX=129.6, titleFs=24px, bodyFs=16.8px, fontOk=true, sig=3, zero errors; shot qa/evidence/d/rollback-v1.4.5-founder.png.
