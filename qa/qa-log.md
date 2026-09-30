# QA log â€” environment, commands, honesty notes (v1.3.4)

## Environment

- OS: win32 x64 Â· Node: v22.22.0 Â· puppeteer-core: 25.12.0
- Chrome: Chrome/154.0.8037.58 Â· Edge: Edg/154.0.4258.37
- Revision: 93f502c Â· 2026-09-30T13:49:31.166Z

## How to re-run

```
npm install        # dev-only
npm run qa         # full suite -> qa/qa-report.md + qa/evidence/**
node qa/shot.mjs chrome <url> <w> <h> out.png [qa]
```

## Browser matrix (honest)

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | EXECUTED â€” full suite | via puppeteer-core |
| Edge | EXECUTED â€” subset | same Chromium engine as Chrome â€” not independent coverage |
| Firefox | NOT PERFORMED â€” not installed | inspection-based notes only |
| Safari / iOS Safari | NOT PERFORMED â€” cannot run on Windows | inspection-based notes only |
| Android Chrome (device) | NOT PERFORMED â€” no device | viewport emulation only |

Reduced-motion checks used DevTools emulation (`emulateMediaFeatures`) â€” labeled, not a real OS test.

## Code-inspection risk notes (NOT test results)

- sticky pinning: present; ancestor chain clean; JS recomputes geometry on resize.
- 100vh/100svh fallback: fallback pair present.
- passive listeners: present.
- modern JS above Safari 15.4 baseline: not found (safe).
- scroll-driven animations API: absent (safe).
- overflow: clip: used (Safari 16+; hidden fallback present on the sticky).

## Rollback drill — executed evidence (v1.3.4)
- Annotated tag v1.3.4 -> commit dad8ab8352b4b7dbee3004181e7d03d712612cf5 (QA revision in qa-report.md = dad8ab8; site code identical to release commit 93f502c).
- Kept releases for one-step restore: v1.3.3, v1.3.2, v1.3.1, v1.3.0, v1.2.0, v1.1.0, v1.0.0 — tags + archives under qa/evidence/rollback/.
- git show v1.3.4 --stat -> qa/evidence/rollback/tag-show-v1.3.4.txt
- Worktree checkout smoke: a clean worktree of v1.3.4 served on port 8081; screenshot qa/evidence/rollback/v1.3.4-intro.png (1440x900; zero console errors; shot exit=0).
- Archive: qa/evidence/rollback/dist-v1.3.4.zip (excludes nested rollback archives); SHA-256: 0E251715DDAA7F14988A6ABC578F4BE7164A0E860F924E55251A5E5089049A16
- Limits: repository-level restore demonstrated on this machine; hosting/CDN rollback not covered. Remote: none configured.
