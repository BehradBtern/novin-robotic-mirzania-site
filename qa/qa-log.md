# QA log â€” environment, commands, honesty notes

## Environment

- OS: win32 x64 Â· Node: v22.22.0 Â· puppeteer-core: 25.12.0
- Chrome: Chrome/153.0.8010.54 Â· Edge: Edg/154.0.4258.37
- Revision: 52fd9fd Â· 2026-09-28T13:58:21.331Z

## How to re-run

```
npm install        # dev-only (puppeteer-core)
npm run qa         # full suite -> qa/qa-report.md + qa/evidence/**
node qa/shot.mjs chrome <url> <w> <h> out.png [qa]   # single screenshot
```

## Browser matrix (honest)

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | EXECUTED â€” full suite | via puppeteer-core; version above |
| Edge | EXECUTED â€” subset | SAME Chromium engine family as Chrome; NOT independent engine coverage |
| Firefox | NOT PERFORMED â€” not installed on QA host | risk notes below are inspection-based only |
| Safari / iOS Safari | NOT PERFORMED â€” cannot run on Windows | inspection-based risk notes only; no test results claimed |
| Android Chrome (device) | NOT PERFORMED â€” no device | viewport emulation in desktop Chromium only (layout proxy) |

Reduced-motion checks used DevTools emulation (`emulateMediaFeatures`), labeled as such â€” not a real OS setting test.

## Code-inspection risk notes (Safari/iOS â€” NOT test results)

- `position: sticky` pinned hero: PRESENT â€” ancestor chain from `.hero__sticky` up to `body` is overflow/transform/filter-free by construction; JS recomputes pin math on resize.
- `100vh` (and no `100svh` fallback) usage: fallback pattern present (`100vh` line before `100svh`)
- `backface-visibility: hidden` on flip faces: present
- passive wheel/touch listeners: present (`{passive:true}`)
- modern-JS above Safari 15.4 baseline (`?.`/`??`): not found (safe)
- CSS scroll-driven animations (`animation-timeline`/ScrollTimeline): absent (safe)
- `overflow: clip`: used (Safari 16+; fallback `hidden` line present where it matters)
- `aspect-ratio`: used (Safari 15+; supported at baseline)

Known residual risk: on iOS < 16 `overflow: clip` is unsupported; the only clipped element is the pinned hero stage and
its overflow is left/right-negative only, which does not create document scrollbars in LTR â€” risk judged LOW; not executed.

## Rollback drill — executed evidence (final tag)
- Annotated tag v1.0.0 -> commit 63e1834b28961c35fb1240573987401963b5f7e4 (release commit; the QA report revision 52fd9fd is its code parent and had an identical code tree).
- git show v1.0.0 --stat -> qa/evidence/rollback/tag-show.txt
- Worktree checkout smoke: a clean worktree of v1.0.0 was served on port 8081; intro screenshot qa/evidence/rollback/v1.0.0-intro.png (1440x900; zero console errors; shot exit=0).
- Archive: qa/evidence/rollback/dist-v1.0.0.zip (git archive of v1.0.0); SHA-256: ABA9DD1445F06CA7C721C5E2B7A0DEB83D774D6897A90992D9EC262F4CF8DC75
- Limits: demonstrates repository-level restore on this machine; does NOT verify hosting/CDN rollback. Remote: none configured (local repo only).
- History note: the repository was re-initialised during release packaging; the tag additionally carries the final QA evidence next to the verified code.
