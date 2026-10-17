# SidPlayer — Initial Audit Baseline

**Date:** 2026-10-18  
**Repository:** https://github.com/sakirhossn/SidPlayer  
**Active Workspace:** `D:\Coding\Agent\SidPlayer`  
**Target Release:** v2.0.1  

---

## 1. Git State

- **Branch:** `main` (synchronized with `origin/main`)
- **Current Head Commit:** `d8abcfe9aafdc0fcba173fb6673323a0aad5c222`
- **Working Tree Status:** Clean (no untracked or uncommitted changes prior to audit document initialization)
- **Recent Commit Log:**
  - `d8abcfe` feat: Add SidPlayer to Windows 'Open with' menu and right-click context menu
  - `1b970ec` chore: bump version to 2.0.1
  - `333d20a` fix: advance playback timer, duration, and playing state in real time
  - `494d838` docs: Update README.md with v2.0.0 features, downloads, and auto-updater docs
  - `fd9c441` feat: Add GitHub Releases auto-update integration, Settings updater UI, and latest release package

---

## 2. Environment & Tooling Verification

| Component | Detected Version / Path | Status |
| :--- | :--- | :--- |
| **OS** | Windows 10/11 x64 (PowerShell environment) | Supported |
| **Node.js** | `v22.19.0` | Active |
| **npm** | `10.9.3` | Active |
| **TypeScript** | `5.7.3` | Active |
| **Vite** | `6.4.3` | Active |
| **Vitest** | `2.1.9` | Active |
| **Electron** | `33.4.11` | Active |
| **FFmpeg** | `2025-09-22-git-c9168717bf-full_build-www.gyan.dev` (`C:\ffmpeg\bin\ffmpeg.exe`) | Active |
| **FFprobe** | `2025-09-22-git-c9168717bf-full_build-www.gyan.dev` (`C:\ffmpeg\bin\ffprobe.exe`) | Active |

---

## 3. Package Configuration & Scripts

From `package.json`:
- `dev`: `vite`
- `build`: `tsc && vite build`
- `preview`: `vite preview`
- `test`: `vitest run`
- `test:watch`: `vitest`
- `dist`: `npm run build && electron-builder`

Dependencies:
- Runtime: `lucide-react` (^1.16.0), `zustand` (^5.0.3), `electron-updater` (^6.3.9)
- Dev Dependencies: `electron` (^33.4.11), `electron-builder` (^25.1.8), `react` (^18.3.1), `react-dom` (^18.3.1), `vite` (^6.0.7), `vitest` (^2.1.8), `tailwindcss` (^3.4.17), `typescript` (^5.7.3)

---

## 4. Test Suite Baseline Execution

Command executed: `npm test` (`vitest run`)

```text
 RUN  v2.1.9 D:/Coding/Agent/SidPlayer

 ✓ tests/libraryLogic.test.ts (3 tests) 29ms
 ✓ tests/transmuxer.test.ts (6 tests) 8ms
 ✓ tests/formatters.test.ts (5 tests) 11ms
 ✓ tests/subtitles.test.ts (5 tests) 15ms
 ✓ tests/shellIntegration.test.ts (3 tests) 13ms
 ✓ tests/playerStore.test.ts (3 tests) 9ms

 Test Files  6 passed (6)
      Tests  25 passed (25)
   Start at  00:28:29
   Duration  3.35s
```
- **Test files:** 6
- **Total tests:** 25
- **Pre-existing test failures:** 0 (all passing)

---

## 5. Typecheck & Build Baseline Execution

### TypeScript Check (`npx tsc --noEmit`)
- **Status:** Clean. Exited with code 0, 0 compiler errors.

### Production Build (`npm run build`)
```text
vite v6.4.3 building for production...
✓ 1921 modules transformed.
dist/index.html                   0.74 kB │ gzip:  0.44 kB
dist/assets/index-kFjEBVNf.css   41.30 kB │ gzip:  7.37 kB
dist/assets/index-nZMbkVbF.js   344.13 kB │ gzip: 90.10 kB
✓ built in 6.56s

vite v6.4.3 building for production...
✓ 248 modules transformed.
dist-electron/main/index.js      421.31 kB │ gzip: 111.46 kB
✓ built in 2.13s

vite v6.4.3 building for production...
✓ 1 modules transformed.
dist-electron/preload/index.cjs   4.68 kB │ gzip:  1.22 kB
✓ built in 64ms
```
- **Status:** All targets built cleanly with code 0.

---

## 6. Security Vulnerability Scan Baseline (`npm audit`)

`npm audit` reported:
- **Total:** 33 vulnerabilities (9 moderate, 21 high, 3 critical)
- **Breakdown:**
  - `tinypool` (Critical): Prototype pollution in worker options (dev dependency in Vitest tree).
  - `tar` (Critical): Arbitrary file overwrite / traversal in node-tar (dev dependency in electron-builder / node-gyp).
  - `extract-zip` (High): Symlink path traversal (dev dependency in Electron get/installer).
  - `esbuild` / `vite` (Moderate): Dev server CORS/request forwarding in development mode.
- **Exposure Assessment:**
  All 33 flagged vulnerabilities reside in developer tooling and build-time bundlers (`vitest`, `electron-builder`, `esbuild`), not packaged renderer or production bundles. However, runtime security within the application itself (IPC boundaries, custom protocols, process execution, file path traversal) requires strict verification as documented in `audit/FINDINGS.md`.
