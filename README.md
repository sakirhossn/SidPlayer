# SidPlayer - Premium Local Video Player for Windows

**SidPlayer** is a modern, distraction-free desktop video player application built for Windows desktops and laptops. Engineered with hardware acceleration, byte-range streaming, frame-accurate stepping, automatic subtitle detection, folder scanning, command palette (`Ctrl+K`), and a cinematic dark interface.

---

## Highlights & Key Features

### 🎬 Playback & Video Engine
- **Byte-Range Streaming Protocol (`media://`)**: Direct disk streaming with HTTP Range 206 responses for zero-latency seeking in large 4K and 1080p files.
- **Hardware Acceleration**: Full GPU decoding (NVDEC/Intel QuickSync/AMD) powered by Chromium and Electron.
- **Aspect Ratio Control**: Toggle between Original, 16:9, 4:3, 21:9 Ultrawide, Fill, and Stretch modes.
- **Zoom & Pan Engine**: Dynamic scaling from 50% to 200% with mouse wheel and drag-to-pan when zoomed in.
- **Frame-by-Frame Stepping**: Step forward (`.`) or backward (`,`) by exactly 1 frame when analyzing video details.
- **J / K / L Editing Shuttle**: Professional NLE-style controls (`J` rewind 10s, `K` pause/play, `L` speed step up to 2x/4x/8x).
- **A-B Repeat Looping**: Cycle points A and B (`R` key) to loop specific segments seamlessly with visual seekbar markers.
- **High-Res Screenshot Capture**: Capture current video frame at native resolution to Windows clipboard and save to `Pictures/SidPlayer/` with `Alt + S`.
- **Playback Statistics HUD (Nerd Stats)**: Real-time diagnostics modal (`I` key) showing resolution, codec, FPS, bitrate, buffer ahead time, and dropped frames.
- **Resume Watching & Autoplay**: Automatic playback position saving with prompt to resume or start over, plus 5-second countdown "Up Next" card.

### 📚 Library & Local File Management
- **Folder Scanner**: Recursive or top-level scanning with live progress bar and cancellation.
- **Deduplication**: Reliable identification by normalized path, file size, and timestamp fingerprinting.
- **Rename-Independent Relinking**: Composite fingerprinting allows locating and relinking moved or renamed files without losing watch history.
- **Missing File Detection**: Identifies removed or relocated files with visual badges and one-click "Locate File" relinker.
- **Folder Tree View**: View all videos organized by their folder directories with "Play All" and Explorer shortcuts.
- **Smart Sorting & Filtering**: Sort by Recently Added, Date Modified, Name, Duration, Size, and Most Watched. Filter by Unwatched, Favorites, or Large Files (>1GB).
- **Playlists**: Create custom playlists, queue videos, shuffle, and loop.
- **Safe File Operations**: "Remove from Library" only removes the database entry; original files on disk are never deleted.

### 💬 Subtitles & Audio
- **Multi-Format Support**: `.srt`, `.vtt`, `.ass`, `.ssa`.
- **Automatic Sibling Detection**: Auto-detects matching subtitle files in the same folder (e.g. `movie.srt`, `movie.en.srt`, `movie.hi.srt`).
- **Real-Time Sync Adjustment**: Fine-tune delay in +/- 100ms increments (`Z` / `X` shortcuts) with on-screen HUD.
- **Customizable Styling**: Adjust font size, background opacity, font family, color, and vertical position in Settings.

### 🪟 Windows Native Polish
- **Frameless Window**: Custom Windows titlebar with seamless window dragging, minimize, maximize, and close controls.
- **Windows Taskbar Progress**: Live playback progress reflected directly on the Windows taskbar icon.
- **Native Drag & Drop**: Drop video files to play immediately, or drop folders to index them into your library.
- **Global Command Palette (`Ctrl + K`)**: Fuzzy launcher for commands and instant search across all library videos.
- **100% Offline First**: Operates with zero internet connectivity and zero cloud telemetry.

---

## Keyboard Shortcuts Reference

| Shortcut | Action | Category |
| :--- | :--- | :--- |
| **Space** / **K** | Play / Pause | Playback |
| **J** / **L** | Shuttle Rewind / Fast Forward (2x, 4x, 8x) | Playback |
| **[** / **]** | Decrease / Increase Playback Speed (0.25x steps) | Playback |
| **0** / **Home** | Jump to beginning | Seeking |
| **End** | Jump to end | Seeking |
| **←** / **→** | Seek backward / forward 5 seconds | Seeking |
| **Shift + ←** / **→** | Seek backward / forward 30 seconds (Macro Seek) | Seeking |
| **, (comma)** | Step 1 frame backward (paused) | Seeking |
| **. (period)** | Step 1 frame forward (paused) | Seeking |
| **R** | A-B Loop: Set Point A → Set Point B → Clear | Seeking |
| **Ctrl + ←** / **→** | Previous / Next video in playlist queue | Playback |
| **↑** / **↓** | Volume up / down 5% | Audio |
| **M** | Mute / Unmute audio | Audio |
| **F** | Toggle Fullscreen | Video |
| **P** | Picture-in-Picture | Video |
| **Alt + S** | Capture high-res screenshot (Clipboard + Disk) | Video |
| **I** | Toggle Video Technical Statistics HUD | Video |
| **S** / **C** | Toggle / Cycle Subtitle Track | Subtitles |
| **Z** / **X** | Subtitle Delay -100ms / +100ms | Subtitles |
| **Ctrl + K** | Open Command Palette | General |
| **Esc** | Exit Fullscreen / Close Player / Close Modals | General |

---

## Supported Media Formats

- **Containers**: MP4, MKV, WebM, AVI, MOV, M4V, MPG, MPEG, WMV, TS, FLV
- **Video Codecs**: H.264 (AVC), VP8, VP9, AV1, H.265 (HEVC where system hardware decoder is enabled)
- **Audio Codecs**: AAC, MP3, Opus, Vorbis, PCM, FLAC
- **Subtitles**: SubRip (`.srt`), WebVTT (`.vtt`), Advanced SubStation Alpha (`.ass`, `.ssa`)

---

## Technology Stack

- **Runtime**: [Electron 33](https://www.electronjs.org/)
- **UI Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite 6](https://vitejs.dev/) + `vite-plugin-electron`
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Media Engine**: Chromium Hardware Decoders + Custom `media://` Range Protocol
- **Media Probing**: FFmpeg / FFprobe (installed at `C:\ffmpeg\bin\`)
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
- `release/SidPlayer Setup 1.0.0.exe` (NSIS Windows Installer)
- `release/win-unpacked/SidPlayer.exe` (Standalone Windows Executable)
