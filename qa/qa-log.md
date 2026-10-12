# QA log — environment, commands, honesty notes (v1.3.6)

## Environment

- OS: win32 x64 · Node: v22.22.0 · puppeteer-core: 25.12.0
- Chrome: Chrome/154.0.8037.98 · Edge: Edg/155.0.4283.45
- Revision: 419f87e · 2026-10-12T15:53:43.269Z

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

## Rollback drill (lite) — v1.4.6
- Annotated tag v1.4.6 -> peeled commit 7d301e6 (code revision 8c6fb9c).
- Change: founder column widened 280px -> min(340px, 27vw) so each line runs longer (title back to 2 lines; block shorter, desktop bottom margin improved). Rollback path = git tags.
- Worktree smoke: v1.4.6 served on 8081 -> w=340, titleFs=24px, fontOk=true, sig=3, zero errors; shot qa/evidence/d/rollback-v1.4.6-founder.png.

## Rollback drill (lite) — v1.4.7
- Annotated tag v1.4.7 -> peeled commit 7294bd9 (code revision 560ab8b).
- Change: the small mark beside the founder text enlarged (side-copy scale geo.sC 0.58 -> 0.68, ~+17% diameter: 326px -> 382px at 1440). Chosen bound: 0.72 would collide with the widened founder column at 1280 (QA no-overlap margin). Rollback path = git tags.
- Worktree smoke: v1.4.7 served on 8081 -> markW=382, fontOk=true, sig=3, zero errors; shot qa/evidence/d/rollback-v1.4.7-mark.png.

## Rollback drill (lite) — v1.4.8
- Annotated tag v1.4.8 -> peeled commit 64fae85 (code revision 849ac04).
- Change: side-copy mark +15% (geo.sC 0.68 -> 0.782: 382px -> 439px at 1440). Added a narrow-width clearance guard: below ~1350px the scale tapers (1280 -> 0.692) so the mark never touches the widened founder column; floor at the old 0.58. Rollback path = git tags.
- Worktree smoke: v1.4.8 served on 8081 -> markW=439, sig=3, zero errors; shot qa/evidence/d/rollback-v1.4.8-mark.png.

## Rollback drill (lite) — v1.4.9
- Annotated tag v1.4.9 -> peeled commit bbad4d4 (code revision 367a481).
- Change: phase-2 blueprint diagram (spin guide) fills the previously empty spin/shrink stretch: hairline circle with 4 ticks + counter-rotating dashed ring + two mono labels (Institute for applied robotics / Novin Robotic Mirzania). The diagram tracks the mark’s actual centre (off×cos(rad)×(1-cb)) so the diamond stays centred inside the circle; fades out as the side copy arrives. QA now 27 checks (new phase-2 diagram probe incl. centring). Rollback path = git tags.
- Worktree smoke: v1.4.9 served on 8081 -> diagOp=1 at p=0.24, labels set, sig=3, zero errors; shot qa/evidence/d/rollback-v1.4.9-diagram.png.

## Rollback drill (lite) — v1.5.0
- Annotated tag v1.5.0 -> peeled commit ee8a133 (code revision 94fe046).
- Change: phase-2 binary rain (matrix 0/1) on a canvas behind the diagram/mark: morphs in (wrapper opacity + scale 1.04 -> 1.0 + staggered column materialisation) and morphs out (dissolve before the side copy). rAF loop runs only while the phase is active; cleared on deactivate; hidden in reduced motion; DPR capped at 1.5; resize-safe. QA now 28 checks (rain lit-pixel probe + morph-out probe). Rollback path = git tags.
- Worktree smoke: v1.5.0 served on 8081 -> mtxOp=1, lit=3235, sig=3, zero errors; shot qa/evidence/d/rollback-v1.5.0-matrix.png.

## Rollback drill (lite) — v1.5.1
- Annotated tag v1.5.1 -> peeled commit 6d59c51 (code revision 101204b).
- Change: binary rain moved from the spin phase to the founder-text phase (morph-in 0.34–0.42 with the side copy, morph-out 0.51–0.58 before the growth); the guide/hologram diagram (circle, ticks, labels, content key) fully removed. QA now 29 checks (founder-rain + morph-out + spin-off + diagram-gone). Rollback path = git tags.
- Worktree smoke: v1.5.1 served on 8081 -> mtxOp=1 at p=0.47, band=0, sig=3, zero errors; shot qa/evidence/d/rollback-v1.5.1-rain.png.

## Rollback drill (lite) — v1.6.0
- Annotated tag v1.6.0 -> peeled commit f1ac029 (code revision be7f28d).
- Change: new “International places” section between the story and the footer: five flag+name rows (India, Malaysia, Turkey, United Kingdom, United States) rendered from content.js (places.items); flags copied into assets/flags/; optional year + text fields per row (hidden until filled). QA now 30 checks (rows + flag loads + no overflow); roundtrip also copies assets/flags. Rollback path = git tags.
- Worktree smoke: v1.6.0 served on 8081 -> 5 rows, flagsOk=true, sig=3, zero errors; shot qa/evidence/d/rollback-v1.6.0-places.png.

## Rollback drill (lite) — v1.6.1
- Annotated tag v1.6.1 -> peeled commit 016c2f2 (code revision fd2d05f).
- Change: the international places feature moved into the animation — five flag+name rows form a staircase on the right side while the mark grows big at the left (desktop window p 0.615–0.76; compact lower window on phones); the standalone page section was removed. QA now 32 checks (staircase stepping, mark clearance, in/out windows, phones); independent verifier ran 17 probes (all consistent, 0 errors).
- Worktree smoke: v1.6.1 served on 8081 -> rows 5, ops all 1, flagsOk=true, band=0, sig=3, zero errors; shot qa/evidence/d/rollback-v1.6.1-places.png.

## Rollback drill (lite) — v1.6.2
- Annotated tag v1.6.2 -> peeled commit fee7abd (code revision 4c1b536).
- Change: the international places staircase is mirrored — each row now steps down-right (India top-left … USA bottom-right) and rows slide in from the right. Composed envelope unchanged (left edges 793.6–923.6px, right reach 1353.6px at 1440). QA 32 checks incl. mirrored stepping and mark clearance (min gap 234px at p=0.66, 1280 also passing); no overflow anywhere.
- Worktree smoke: v1.6.2 served on 8081 -> rows 5, ops all 1, lefts [820, 846, 872, 898, 924], flagsOk=true, band=0, sig=3, zero errors; shot qa/evidence/d/rollback-v1.6.2-places.png.

## Rollback drill (lite) — v1.6.3
- Annotated tag v1.6.3 -> peeled commit 6670dc4 (code revision 43f12b5).
- Change: international-places rows enlarged (flag chips 58x40 -> 76x52, name 1.12 -> 1.45rem, row height 58 -> 74px) and the block moved left (right margin 6vw -> 13vw, ~100px at 1440). Formation transient verified at p=0.62–0.66: bright mark stroke clears the first chip by 44px at the tightest instant (p=0.63); full-state bbox gap 133px. QA 32 checks pass, no overflow.
- Worktree smoke: v1.6.3 served on 8081 -> rows 5, ops all 1, lefts [719, 745, 771, 797, 823], flagsOk=true, band=0, sig=3, zero errors; shot qa/evidence/d/rollback-v1.6.3-places.png.
