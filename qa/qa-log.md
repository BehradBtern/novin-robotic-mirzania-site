# QA log â€” environment, commands, honesty notes (v1.2.0)

## Environment

- OS: win32 x64 Â· Node: v22.22.0 Â· puppeteer-core: 25.12.0
- Chrome: Chrome/153.0.8010.54 Â· Edge: Edg/154.0.4258.37
- Revision: 4ac298f Â· 2026-09-28T16:34:11.699Z

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

## Rollback drill — executed evidence (v1.2.0)
- Annotated tag v1.2.0 -> commit 9642c9bc5504afbcda91c3aff01ff082c393baab (QA revision in qa-report.md = 4ac298f, the code parent; identical code tree).
- Kept releases for one-step restore: v1.1.0 (previous) and v1.0.0 (original) — tags + archives under qa/evidence/rollback/.
- git show v1.2.0 --stat -> qa/evidence/rollback/tag-show-v1.2.0.txt
- Worktree checkout smoke: a clean worktree of v1.2.0 served on port 8081; screenshot qa/evidence/rollback/v1.2.0-intro.png (1440x900; zero console errors; shot exit=0).
- Archive: qa/evidence/rollback/dist-v1.2.0.zip; SHA-256: 8E5CE98267AC93751D31F24AE07128AA7B9959166E607B2B144F9E6BA8C96FC5
- Limits: repository-level restore demonstrated on this machine; hosting/CDN rollback not covered. Remote: none configured.
