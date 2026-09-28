# QA log â€” environment, commands, honesty notes (v1.1.0)

## Environment

- OS: win32 x64 Â· Node: v22.22.0 Â· puppeteer-core: 25.12.0
- Chrome: Chrome/153.0.8010.54 Â· Edge: Edg/154.0.4258.37
- Revision: ca0993c Â· 2026-09-28T15:51:49.218Z

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

## Rollback drill — executed evidence (v1.1.0)
- Annotated tag v1.1.0 -> commit b442a6dfa3da6820b24cd7bbcd58b405e2e259e1 (QA revision in qa-report.md = ca0993c, the code parent; identical code tree).
- Previous release v1.0.0 (flip/gallery version) is kept: tag + qa/evidence/rollback/dist-v1.0.0.zip remain untouched for one-step restore.
- git show v1.1.0 --stat -> qa/evidence/rollback/tag-show-v1.1.0.txt
- Worktree checkout smoke: a clean worktree of v1.1.0 served on port 8081; screenshot qa/evidence/rollback/v1.1.0-intro.png (1440x900; zero console errors; shot exit=0).
- Archive: qa/evidence/rollback/dist-v1.1.0.zip; SHA-256: DB6CF71ED40DB58841ABAB9DA8362D349B0DD39F65BCBB2E60862CA1CCADCD5B
- Limits: repository-level restore demonstrated on this machine; hosting/CDN rollback not covered. Remote: none configured.
