# SidPlayer — Remediation Log & Audit Ledger

**Date:** 2026-10-18  
**Repository:** https://github.com/sakirhossn/SidPlayer  
**Version:** v2.0.1  
**Scope:** Remediation of confirmed defects, security vulnerabilities, and over-engineering findings  

---

## 1. Consolidated Review & Audit Findings

### Ponytail Complexity & Bloat Scoreboard
```
  ponytail gain                     benchmark median · 5 tasks · 3 models

  Lines of code   no-skill  ████████████████████  100%
                  ponytail  ██▌·················    6–20%   ▼ 80–94%
  Cost            no-skill  ████████████████████  100%
                  ponytail  █████▌··············   23–53%  ▼ 47–77%
  Speed           ponytail  ▸ 3–6× faster

  This repo:  /ponytail-debt  (shortcuts you deferred)
              /ponytail-audit (what's still cuttable)
```

### Repo-Wide Ponytail Audit Results:
1. `src/main/binaries.ts`: Centralized 3 duplicate implementations of `findFfmpeg` and `findFfprobe` (`yagni`, `shrink`). Single canonical location for binary discovery supporting `process.resourcesPath`, `C:\ffmpeg\bin`, and PATH.
2. `src/main/transmuxer.ts`: Eliminated unsafe non-atomic direct disk write in `switchAudioTrack` (`shrink`, `delete`). Replaced with atomic temporary file promotion.
3. `src/main/store.ts`: Replaced unbounded, non-sanitized JSON merging with standard deep prototype sanitizer `sanitizeBackupPayload` and transactional rollback.
4. `src/renderer/components/player/VideoPlayer.tsx`: Streamlined single-key fallback handling so customized bindings are never hijacked by default keys.

---

## 2. File-by-File Remediation Ledger

### 1. `src/main/binaries.ts` (NEW)
- **Role:** Centralized binary resolution module.
- **Changes:**
  - Implemented `findFfmpeg()` and `findFfprobe()` with caching and multi-environment priority:
    1. Electron packaged resources (`process.resourcesPath/ffmpeg.exe`, `process.resourcesPath/bin/ffmpeg.exe`).
    2. Standard Windows installation directory (`C:\ffmpeg\bin\ffmpeg.exe`).
    3. Project / executable local directory (`bin/ffmpeg.exe`, `ffmpeg.exe`).
    4. System PATH fallback.
  - Implemented `resetBinaryCacheForTesting()` for clean unit testing.
- **Verification:** `tests/binaries.test.ts` (2 tests passing).

---

### 2. `src/main/protocol.ts`
- **Role:** Custom `media://` streaming protocol handler for HTML5 `<video>` and thumbnails.
- **Defects Fixed:**
  - `FIND-01` (Critical): Arbitrary local file disclosure. Implemented `isPathAuthorized()` and `authorizeMediaPath()`. Requests targeting files outside the authorized media registry, library items, thumbnails, or cache are blocked with HTTP 403 Forbidden.
  - `FIND-02` (High): Malformed Range header parsing and Windows file handle leaks.
    - Implemented RFC 7233 compliant `parseHttpRange(rangeHeader, fileSize)` supporting prefix ranges (`bytes=0-499`), open-ended ranges (`bytes=500-`), and suffix ranges (`bytes=-200`).
    - Handled zero-byte files (returns HTTP 200 with `Content-Length: 0`).
    - Converted Node streams to Web Streams with explicit `cancel()` hook to destroy the underlying `fs.ReadStream` on client abort, preventing file locking on Windows.
- **Verification:** `tests/protocolSecurity.test.ts` (16 tests passing).

---

### 3. `src/main/index.ts`
- **Role:** Electron main process entry point, window management, and IPC dispatcher.
- **Defects Fixed:**
  - `FIND-01` (Critical): Removed `bypassCSP: true` from privileged scheme registration `protocol.registerSchemesAsPrivileged`.
  - `FIND-03` (High): Missing navigation barriers and child window handling.
    - Added `mainWindow.webContents.setWindowOpenHandler` (denying internal popups and delegating external `http:`/`https:` URLs to system browser).
    - Added `mainWindow.webContents.on('will-navigate')` preventing frame hijacking from dragged HTML files or redirect links.
  - Wired `authorizeMediaPath` to:
    - CLI / double-click startup files (`extractVideoFromArgv`)
    - File dialog picks (`dialog-open-file`, `dialog-open-subtitle`)
    - Single file processor (`process-single-file`)
- **Verification:** Compiler check and build verification (`npx tsc --noEmit`, `npm run build`).

---

### 4. `src/main/transmuxer.ts`
- **Role:** Transmuxing, audio track switching, and video stream preparation via FFmpeg.
- **Defects Fixed:**
  - `FIND-05` (Medium): Fixed race condition and corrupted cache file creation in `switchAudioTrack`.
    - FFmpeg now writes to `${cachedPath}.tmp_${Date.now()}`.
    - Only upon verified clean exit code 0 and file size > 1024 bytes is the file atomically promoted via `fs.renameSync(tempPath, cachedPath)`.
    - Any failure or abort immediately unlinks the temporary file.
  - `FIND-06` (Medium): Removed duplicated `findFfmpeg` definition and re-exported from `./binaries`.
- **Verification:** `tests/transmuxer.test.ts` (6 tests passing).

---

### 5. `src/main/mediaInfo.ts` & `src/main/thumbnails.ts`
- **Role:** Media probing and thumbnail generation.
- **Defects Fixed:**
  - `FIND-06` (Medium): Replaced duplicate `findFfprobe` and `findFfmpeg` implementations with imports from `./binaries`.
- **Verification:** `tests/binaries.test.ts` and `npm test`.

---

### 6. `src/main/store.ts`
- **Role:** Local JSON database, configuration store, and backup management.
- **Defects Fixed:**
  - `FIND-04` (High): Backup import vulnerability and memory exhaustion.
    - Added 50 MB file size limit before reading.
    - Implemented recursive `sanitizeBackupPayload` stripping `__proto__`, `constructor`, and `prototype` keys.
    - Added deep snapshot rollback ensuring store state is restored if any mutation or disk write fails.
  - Handled cases where `app.getPath` is not available in unit testing environments.
- **Verification:** `tests/backupSanitizer.test.ts` (3 tests passing).

---

### 7. `src/renderer/components/player/VideoPlayer.tsx`
- **Role:** Primary video playback interface and hotkey handler.
- **Defects Fixed:**
  - `FIND-08` (Low): Fixed hardcoded shortcut collision. Added `isBoundToOtherAction` check so default single-key fallbacks (e.g. `'k'`, `' '`, `'m'`, `'f'`) only trigger if the key is not explicitly assigned to another action in the user's custom keybindings.
- **Verification:** TypeScript compilation and production build (`npm run build`).

---

## 3. Test & Verification Summary

- **Total Test Suites:** 9 (3 newly created)
- **Total Tests:** 46 (21 newly created)
- **Test Pass Rate:** 100% (46 / 46 passed)
- **TypeScript Compiler:** 0 errors
- **Production Build:** Success (Vite + Electron packaging)
- **Regressions Introduced:** 0
