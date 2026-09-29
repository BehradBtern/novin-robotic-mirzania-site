# QA log â€” environment, commands, honesty notes (v1.3.2)

## Environment

- OS: win32 x64 Â· Node: v22.22.0 Â· puppeteer-core: 25.12.0
- Chrome: Chrome/154.0.8037.58 Â· Edge: Edg/154.0.4258.37
- Revision: e22ec49 Â· 2026-09-29T17:47:54.806Z

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

## Rollback drill — executed evidence (v1.3.2)
- Annotated tag v1.3.2 -> commit 9e3af991eb7057860192ae2d6b8c6a754f871488 (QA revision in qa-report.md = e22ec49, the code parent; identical site tree).
- Kept releases for one-step restore: v1.3.1, v1.3.0, v1.2.0, v1.1.0, v1.0.0 — tags + archives under qa/evidence/rollback/.
- git show v1.3.2 --stat -> qa/evidence/rollback/tag-show-v1.3.2.txt
- Worktree checkout smoke: a clean worktree of v1.3.2 served on port 8081; screenshot qa/evidence/rollback/v1.3.2-footer.png (1440x900; zero console errors; shot exit=0).
- Archive: qa/evidence/rollback/dist-v1.3.2.zip (excludes nested rollback archives); SHA-256: 6A28401B5B34807025387B8717B8D522DBE12E5BF6B500BCF6EB028240E5720D
- Limits: repository-level restore demonstrated on this machine; hosting/CDN rollback not covered. Remote: none configured.

