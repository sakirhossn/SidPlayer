# SidPlayer — Premium Local Video Player for Windows

**SidPlayer** is a modern, high-performance, distraction-free desktop media player engineered specifically for Windows desktops and laptops. Built with hardware-accelerated playback, byte-range streaming, automated HEVC/H.265 fallback, multi-track audio switching, embedded MKV subtitle extraction, real-time NTFS folder watching, timeline bookmarks, loudness normalization, and GitHub Releases auto-updating.

---

## ⬇️ Download for Windows (Latest v2.0.0)

| Package | Type | Architecture | Download Link |
| :--- | :--- | :--- | :--- |
| **SidPlayer Installer** | Windows Setup (`.exe`) | x64 | [📥 Download Installer (80.5 MB)](https://github.com/sakirhossn/SidPlayer/releases/download/v2.0.0/SidPlayer-Setup-2.0.0.exe) |
| **SidPlayer Portable** | Standalone Executable (`.exe`) | x64 | [⚡ Download Portable (80.3 MB)](https://github.com/sakirhossn/SidPlayer/releases/download/v2.0.0/SidPlayer.2.0.0.exe) |

> **Upgrading from v1.0.0**: Simply download and run `SidPlayer-Setup-2.0.0.exe`. It automatically detects and updates your existing installation without losing any watch history, playlists, bookmarks, or settings.  
> **Portable version**: Simply download and double-click to launch immediately without installation.

---

## 🚀 What's New in v2.0.0

- 🔄 **Automated HEVC / H.265 Fallback**: Zero-latency transcode fallback (`libx264 -crf 20`) seamlessly activates if your Windows setup lacks native hardware HEVC decoders.
- 🎧 **Multi-Track Audio Switcher**: Real audio stream switching (`-map 0:v:0 -map 0:a:<id>`) hot-swaps streams in real time while preserving playback position.
- 💬 **Embedded Subtitle Extractor**: Automatically extracts and parses embedded subtitles from MKV and MP4 files into standard WebVTT cues on demand.
- ⌨️ **Customizable Shortcuts & Collision Detection**: Rebind any player action in Settings with live recording and automatic conflict warnings.
- 📁 **Live Windows NTFS Folder Watcher**: Automatically detects newly added, modified, or deleted videos in your watched folders with debounced rescan.
- 🎞️ **Filmstrip Hover Preview**: Timeline seekbar displays thumbnail previews as you hover over different timestamps.
- 🏷️ **Timeline Bookmarks**: Press `B` to drop amber diamond markers along the seekbar and jump directly from the Media Diagnostics modal (`I`).
- 🔊 **Zero-Latency Loudness Normalizer**: Built-in Web Audio API `DynamicsCompressorNode` levels audio in real time—softening loud explosions and boosting quiet dialogue.
- 🎨 **Real-Time Video Filters**: Adjust Brightness (50–150%), Contrast (50–150%), Saturation (0–200%), and Gamma (50–150%) on the fly.
- 📌 **Always-On-Top Floating Mini-Player**: Pin the player above all other windows to multitask effortlessly.
- 🔒 **PIN-Protected Folders**: Secure private folders behind a 4-digit SHA-256 PIN with blurred thumbnail previews.
- 💾 **Offline Library Backup & Restore**: Export and import your library, history, playlists, and settings to JSON with Merge or Replace options.
- 🎮 **Controller / Gamepad Support**: Navigate, seek, step frames, and control volume using standard USB and Bluetooth gamepads.
- 🚀 **GitHub Auto-Update System**: One-click in-app update checks and seamless upgrades directly from GitHub Releases.

---

## Highlights & Key Features

### 🎬 Playback & Video Engine
- **Byte-Range Streaming Protocol (`media://`)**: Direct disk streaming with HTTP Range 206 responses for zero-latency seeking in large 4K and 1080p files.
- **Hardware Acceleration**: Full GPU decoding (NVDEC/Intel QuickSync/AMD) powered by Chromium and Electron.
- **Aspect Ratio Control**: Toggle between Original, 16:9, 4:3, 21:9 Ultrawide, Fill, and Stretch modes.
- **Zoom & Pan Engine**: Dynamic scaling from 50% to 200% with mouse wheel and drag-to-pan when zoomed in.
- **Frame-by-Frame Stepping**: Step forward (`.`) or backward (`,`) by exactly 1 frame when analyzing video details.
- **J / K / L Editing Shuttle**: Professional NLE-style controls (`J` rewind 10s, `K` pause/play, `L` speed step up to 2x/4x/8x).
- **A-B Repeat Looping & GIF Export**: Set points A and B (`R` key) to loop segments, and right-click to export the loop directly as an animated GIF.
- **High-Res Screenshot Capture**: Capture current video frame at native resolution to Windows clipboard and save to `Pictures/SidPlayer/` with `Alt + S`.
- **Playback Statistics HUD (Nerd Stats)**: Real-time diagnostics modal (`I` key) showing resolution, codec, FPS, bitrate, buffer ahead time, and dropped frames.
- **Resume Watching & Autoplay**: Automatic playback position saving with prompt to resume or start over, plus 5-second countdown "Up Next" card.

### 📚 Library & Local File Management
- **Live Folder Watcher**: Seamless NTFS filesystem monitoring automatically keeps your library up to date.
- **Folder Scanner**: Recursive or top-level scanning with live progress bar and cancellation.
- **Deduplication**: Reliable identification by normalized path, file size, and timestamp fingerprinting.
- **Rename-Independent Relinking**: Composite fingerprinting allows locating and relinking moved or renamed files without losing watch history.
- **Missing File Detection**: Identifies removed or relocated files with visual badges and one-click "Locate File" relinker.
- **Folder Tree View**: View all videos organized by their folder directories with "Play All" and Explorer shortcuts.
- **Smart Sorting & Filtering**: Sort by Recently Added, Date Modified, Name, Duration, Size, and Most Watched. Filter by Unwatched, Favorites, or Large Files (>1GB).
- **Playlists**: Create custom playlists, queue videos, shuffle, and loop.
- **Safe File Operations**: "Remove from Library" only removes the database entry; original files on disk are never deleted.

### 💬 Subtitles & Audio
- **Multi-Format Support**: `.srt`, `.vtt`, `.ass`, `.ssa`, plus embedded tracks from MKV/MP4 containers.
- **Automatic Sibling Detection**: Auto-detects matching subtitle files in the same folder (e.g. `movie.srt`, `movie.en.srt`).
- **Real-Time Sync Adjustment**: Fine-tune delay in +/- 100ms increments (`Z` / `X` shortcuts) with on-screen HUD.
- **Customizable Styling**: Adjust font size, background opacity, font family, color, and vertical position in Settings.
- **Loudness Normalization**: Dynamic range compression keeps volume consistent across varying scenes.

### 🪟 Windows Native Polish
- **Frameless Window**: Custom Windows titlebar with seamless window dragging, minimize, maximize, and close controls.
- **Windows Taskbar Progress**: Live playback progress reflected directly on the Windows taskbar icon.
- **Native Drag & Drop**: Drop video files to play immediately, or drop folders to index them into your library.
- **Global Command Palette (`Ctrl + K`)**: Fuzzy launcher for commands and instant search across all library videos.
- **100% Local-First & Privacy-Focused**: No remote analytics, no telemetry, and all data stored locally on your machine.

---

## Keyboard Shortcuts Reference

Shortcuts are fully customizable under **Settings → Keyboard Shortcuts**. Default bindings:

| Shortcut | Action | Category |
| :--- | :--- | :--- |
| **Space** / **K** | Play / Pause | Playback |
| **J** / **L** | Shuttle Rewind (10s) / Fast Forward (2x, 4x) | Playback |
| **[** / **]** | Decrease / Increase Playback Speed (0.25x steps) | Playback |
| **0** / **Home** | Jump to beginning | Seeking |
| **End** | Jump to end | Seeking |
| **←** / **→** | Seek backward / forward 5 seconds | Seeking |
| **Shift + ←** / **→** | Seek backward / forward 30 seconds (Macro Seek) | Seeking |
| **, (comma)** | Step 1 frame backward (paused) | Seeking |
| **. (period)** | Step 1 frame forward (paused) | Seeking |
| **R** | A-B Loop: Set Point A → Set Point B → Clear | Seeking |
| **B** | Add Bookmark at current timestamp | Seeking |
| **Ctrl + ←** / **→** | Previous / Next video in playlist queue | Navigation |
| **↑** / **↓** | Volume up / down 5% | Audio |
| **M** | Mute / Unmute audio | Audio |
| **F** | Toggle Fullscreen | Display |
| **P** | Picture-in-Picture | Display |
| **Alt + S** | Capture high-res screenshot (Clipboard + Disk) | Video |
| **I** | Toggle Video Technical Statistics HUD | Diagnostics |
| **S** / **C** | Toggle / Cycle Subtitle Track | Subtitles |
| **Z** / **X** | Subtitle Delay -100ms / +100ms | Subtitles |
| **Ctrl + K** | Open Command Palette | General |
| **Esc** | Exit Fullscreen / Close Player / Close Modals | General |

---

## Supported Media Formats

- **Containers**: MP4, MKV, WebM, AVI, MOV, M4V, MPG, MPEG, WMV, TS, FLV
- **Video Codecs**: H.264 (AVC), VP8, VP9, AV1, H.265 (HEVC with native acceleration or automated remux fallback)
- **Audio Codecs**: AAC, MP3, Opus, Vorbis, PCM, FLAC, AC3, EAC3, DTS (with transparent transmuxing)
- **Subtitles**: SubRip (`.srt`), WebVTT (`.vtt`), Advanced SubStation Alpha (`.ass`, `.ssa`), and embedded MKV/MP4 tracks

---

## Technology Stack

- **Runtime**: [Electron 33](https://www.electronjs.org/)
- **UI Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite 6](https://vitejs.dev/) + `vite-plugin-electron`
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Media Engine**: Chromium Hardware Decoders + Custom `media://` Byte-Range Protocol
- **Media Transmuxing & Probing**: FFmpeg / FFprobe (bundled/system at `C:\ffmpeg\bin\`)
- **Audio Processing**: Web Audio API (`DynamicsCompressorNode`)
- **Auto-Updater**: `electron-updater` + GitHub Releases Integration
- **Database**: Atomic JSON Store with debounced disk persistence
- **Testing**: [Vitest](https://vitest.dev/)

---

## Development & Build Commands

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```

### Run Unit Tests
```bash
npm test
```

### Build Production Bundle
```bash
npm run build
```

### Build Windows Installer & Portable Executable
```bash
npm run dist:win
```

Output files will be generated in `release/`:
- `release/SidPlayer Setup 2.0.0.exe` (NSIS Windows Installer)
- `release/SidPlayer 2.0.0.exe` (Standalone Portable Executable)
- `release/latest.yml` (Auto-update manifest)

---

## License

MIT License. Crafted with ❤️ for Windows users.
