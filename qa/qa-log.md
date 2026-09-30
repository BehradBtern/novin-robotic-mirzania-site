# QA log â€” environment, commands, honesty notes (v1.3.3)

## Environment

- OS: win32 x64 Â· Node: v22.22.0 Â· puppeteer-core: 25.12.0
- Chrome: Chrome/154.0.8037.58 Â· Edge: Edg/154.0.4258.37
- Revision: fe38c43 Â· 2026-09-30T13:27:49.851Z

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

## Rollback drill — executed evidence (v1.3.3)
- Annotated tag v1.3.3 -> commit 84510db3e30578121a28035c47f0ce4f70ca582b (QA revision in qa-report.md = fe38c43, the code parent; identical site tree).
- Kept releases for one-step restore: v1.3.2, v1.3.1, v1.3.0, v1.2.0, v1.1.0, v1.0.0 — tags + archives under qa/evidence/rollback/.
- git show v1.3.3 --stat -> qa/evidence/rollback/tag-show-v1.3.3.txt
- Worktree checkout smoke: a clean worktree of v1.3.3 served on port 8081; screenshot qa/evidence/rollback/v1.3.3-bigright.png (1440x900; zero console errors; shot exit=0).
- Archive: qa/evidence/rollback/dist-v1.3.3.zip (excludes nested rollback archives); SHA-256: 4A482862412869EDFA2BB36A63B34520B96F39551196EE60D1DF4D0DCB0A74B1
- Limits: repository-level restore demonstrated on this machine; hosting/CDN rollback not covered. Remote: none configured.
