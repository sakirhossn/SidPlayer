# SidPlayer — Security, Correctness, and Quality Findings

**Date:** 2026-10-18  
**Repository:** https://github.com/sakirhossn/SidPlayer  
**Scope:** Complete Codebase Audit (`src/main`, `src/preload`, `src/renderer`, `src/shared`, `tests`)  

---

## Summary of Findings

| ID | Title | Severity | Confidence | Category | Affected File(s) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FIND-01** | Arbitrary Local File Disclosure via `media://` Protocol | **Critical** | Confirmed | Security (LFI) | `src/main/protocol.ts:26-97` |
| **FIND-02** | RFC 7233 Range Header Parsing Defects & Stream Handle Leaks | **High** | Confirmed | Correctness / Resource Leak | `src/main/protocol.ts:49-92` |
| **FIND-03** | Missing Navigation Guards & Unrestricted Window Open Handler | **High** | Confirmed | Security (Electron Boundary) | `src/main/index.ts:74-95` |
| **FIND-04** | Unbounded Backup Import, Prototype Pollution Risk & Lack of Atomic Rollback | **High** | Confirmed | Security / Integrity | `src/main/store.ts:323-369` |
| **FIND-05** | Race Condition and Cache Corruption in Audio Track Switching | **Medium** | Confirmed | Correctness / Concurrency | `src/main/transmuxer.ts:274-345` |
| **FIND-06** | Duplicated Binary Resolution Lacking Packaged Resource Discovery | **Medium** | Confirmed | Maintainability / Packaging | `src/main/mediaInfo.ts`, `transmuxer.ts`, `thumbnails.ts` |
| **FIND-07** | Dead Code & Phantom Configuration: Incomplete `folderLocks` | **Low** | Confirmed | Maintainability / Dead Code | `src/main/store.ts:296-309`, `src/shared/types.ts:140` |
| **FIND-08** | Hardcoded Keyboard Fallbacks Overriding Custom Keybindings | **Low** | Confirmed | UX / Correctness | `src/renderer/components/player/VideoPlayer.tsx:300-360` |

---

## Detailed Findings

### FIND-01: Arbitrary Local File Disclosure via `media://` Protocol
- **Severity:** Critical
- **Confidence:** Confirmed
- **Affected File:** `src/main/protocol.ts` (Lines 26–97), `src/main/index.ts` (Lines 21–33)
- **Root Cause:**
  `protocol.handle('media', ...)` extracts the requested path directly from `url.searchParams.get('path')` or `decodeURIComponent(url.pathname)` and checks only `fs.existsSync(targetPath)`. It performs no authorization against known library media, thumbnails, subtitles, or temporary cache files. Furthermore, `protocol.registerSchemesAsPrivileged` specifies `bypassCSP: true`, and the response headers include `Access-Control-Allow-Origin: *`.
- **Impact:**
  Any script running or injected into the renderer could read any arbitrary file on the user's filesystem (such as system configuration, private keys, documents) by requesting `media://local?path=C:/Users/...`.
- **Recommended Correction:**
  1. Maintain an authorized path registry in the main process (including registered library video paths, active temp transmux/thumbnail outputs, extracted subtitle paths, and paths explicitly chosen via open dialogs).
  2. Normalize and canonicalize paths using `path.resolve` and verify against allowed directories or authorized IDs.
  3. Remove `bypassCSP: true` from `registerSchemesAsPrivileged`.
- **Regression Test:**
  Unit test validating that attempts to access unauthorized files (e.g. `C:\Windows\System32\drivers\etc\hosts`) via `media://` protocol return 403 Forbidden.

---

### FIND-02: RFC 7233 Range Header Parsing Defects & Stream Handle Leaks
- **Severity:** High
- **Confidence:** Confirmed
- **Affected File:** `src/main/protocol.ts` (Lines 49–92)
- **Root Cause:**
  Range parsing splits on `-`:
  ```ts
  const parts = rangeHeader.replace(/bytes=/, '').split('-')
  const start = parseInt(parts[0], 10)
  const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
  ```
  1. For suffix byte ranges (e.g., `bytes=-500`), `parts[0]` is empty, producing `start = NaN`. The boundary check `start >= fileSize` evaluates to `false`, and `fs.createReadStream` is called with `start: NaN`.
  2. For zero-byte files (`fileSize === 0`), `end` is `-1`, resulting in invalid ranges.
  3. When the client seeks or cancels playback, the underlying Node.js stream converted via `Readable.toWeb(nodeStream)` is not cleanly closed on request abort, resulting in file descriptor leaks on Windows.
- **Impact:**
  Failed seeks, audio/video playback stalls, and locked files on Windows preventing deletion or renaming of played media.
- **Recommended Correction:**
  Implement standard RFC 7233 range parser with support for prefix, suffix, and bounded ranges. Attach abort signal listener to destroy the Node stream when the Web stream is aborted or closed.
- **Regression Test:**
  Unit tests covering prefix ranges (`bytes=0-100`), suffix ranges (`bytes=-500`), out-of-bounds ranges (`bytes=99999-`), and zero-byte files.

---

### FIND-03: Missing Navigation Guards & Unrestricted Window Open Handler
- **Severity:** High
- **Confidence:** Confirmed
- **Affected File:** `src/main/index.ts` (Lines 74–95)
- **Root Cause:**
  `BrowserWindow` initialization lacks:
  1. `webContents.setWindowOpenHandler(...)`: Allows renderer or child frames to spawn new Electron windows with default privileges.
  2. `webContents.on('will-navigate', ...)`: If a user drags and drops an HTML file or an external URL is clicked, Electron navigates the top-level window away from the app.
- **Impact:**
  Potential escape from the application frame or hijacking of renderer context.
- **Recommended Correction:**
  1. Set `mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))`.
  2. Intercept `will-navigate` to prevent navigation away from the local app entry point.

---

### FIND-04: Unbounded Backup Import, Prototype Pollution Risk & Lack of Rollback
- **Severity:** High
- **Confidence:** Confirmed
- **Affected File:** `src/main/store.ts` (Lines 323–369)
- **Root Cause:**
  1. `importBackup` synchronously reads the entire file with `fs.readFileSync(sourcePath, 'utf-8')` without verifying file size (vulnerable to memory exhaustion / DoS with oversized JSON).
  2. Object merging via `{ ...this.data.videos, ...(parsed.videos || {}) }` does not sanitize keys such as `__proto__`, `constructor`, or validate field types.
  3. If saving or schema verification fails, the existing memory store may already be partially overwritten with invalid data.
- **Impact:**
  Denial of service (app crash on huge file) and potential prototype pollution or store corruption upon importing a malformed backup.
- **Recommended Correction:**
  1. Enforce a maximum file size limit (e.g. 50 MB) before reading.
  2. Implement strict recursive key sanitization (filtering out `__proto__`, `prototype`, `constructor`).
  3. Validate schema types before mutating store state, keeping a snapshot for rollback if writing fails.
- **Regression Test:**
  Unit tests importing a malicious backup with `__proto__` properties, oversized files, and corrupt payloads.

---

### FIND-05: Race Condition and Cache Corruption in Audio Track Switching
- **Severity:** Medium
- **Confidence:** Confirmed
- **Affected File:** `src/main/transmuxer.ts` (Lines 274–345)
- **Root Cause:**
  In `switchAudioTrack`, FFmpeg writes directly to `cachedPath`:
  ```ts
  const cachedPath = path.join(cacheDir, `${cacheKey}.mp4`)
  ```
  If the process is killed or fails during remuxing, a partial file remains. The subsequent check `if (fs.existsSync(cachedPath) && fs.statSync(cachedPath).size > 1024)` sees the partial file and returns it as valid.
- **Impact:**
  Corrupted or frozen audio playback when switching tracks after an interruption.
- **Recommended Correction:**
  Write to a temporary file (`${cachedPath}.tmp_${Date.now()}`) and atomically rename it to `cachedPath` upon verified zero exit code.
- **Regression Test:**
  Unit test asserting atomic rename logic and verifying partial files are discarded.

---

### FIND-06: Duplicated Binary Resolution Lacking Packaged Resource Discovery
- **Severity:** Medium
- **Confidence:** Confirmed
- **Affected File:** `src/main/mediaInfo.ts` (Lines 23–47), `src/main/transmuxer.ts` (Lines 10–33), `src/main/thumbnails.ts` (Lines 9–32)
- **Root Cause:**
  `findFfmpeg` and `findFfprobe` are triplicated with identical candidate arrays. None check `process.resourcesPath` (where extra resources are placed when packaged with electron-builder).
- **Impact:**
  Code duplication and failure to locate bundled binaries in packaged releases on non-standard installations.
- **Recommended Correction:**
  Consolidate into `src/main/binaries.ts` checking `process.resourcesPath`, user-configured paths, `C:\ffmpeg\bin`, and PATH.

---

### FIND-07: Dead Code & Phantom Configuration: Incomplete `folderLocks`
- **Severity:** Low
- **Confidence:** Confirmed
- **Affected File:** `src/main/store.ts` (Lines 296–309), `src/shared/types.ts` (Line 140)
- **Root Cause:**
  `setFolderLock` and `removeFolderLock` exist in `store.ts`, but no UI exposes this functionality and no scanner or access control layer checks `folderLocks`.
- **Impact:**
  Misleading security expectations and unnecessary code maintenance.
- **Recommended Correction:**
  Document the feature status or prune/complete the access checks in `store.ts` and `scanner.ts`.

---

### FIND-08: Hardcoded Keyboard Fallbacks Overriding Custom Keybindings
- **Severity:** Low
- **Confidence:** Confirmed
- **Affected File:** `src/renderer/components/player/VideoPlayer.tsx` (Lines 300–360)
- **Root Cause:**
  Keydown checks include hardcoded fallbacks:
  `if (matchesAction('togglePlay') || e.key === ' ' || e.key === 'k')`
  If a user rebinds `k` to another action (e.g. Next Frame or Mute), pressing `k` still triggers `togglePlay`.
- **Impact:**
  Customized key bindings can conflict with hardcoded defaults.
- **Recommended Correction:**
  Only trigger default keys if no custom binding is explicitly assigned to that key.
