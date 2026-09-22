export interface ShortcutItem {
  key: string
  action: string
  category: 'Playback' | 'Seeking' | 'Audio & Video' | 'Subtitles' | 'General'
}

export const SHORTCUT_LIST: ShortcutItem[] = [
  { key: 'Space / K', action: 'Play / Pause', category: 'Playback' },
  { key: 'J / L', action: 'Shuttle Rewind / Fast Forward (2x, 4x, 8x)', category: 'Playback' },
  { key: '[ / ]', action: 'Decrease / Increase Playback Speed', category: 'Playback' },
  { key: '0 / Home', action: 'Jump to beginning', category: 'Seeking' },
  { key: 'End', action: 'Jump to end', category: 'Seeking' },
  { key: '← / →', action: 'Seek backward / forward 5s', category: 'Seeking' },
  { key: 'Shift + ← / →', action: 'Seek backward / forward 30s', category: 'Seeking' },
  { key: ', (comma)', action: 'Step 1 frame backward (paused)', category: 'Seeking' },
  { key: '. (period)', action: 'Step 1 frame forward (paused)', category: 'Seeking' },
  { key: 'R', action: 'A-B Loop (Set A -> Set B -> Clear)', category: 'Seeking' },
  { key: 'Ctrl + ← / →', action: 'Previous / Next video in playlist', category: 'Playback' },
  { key: '↑ / ↓', action: 'Volume up / down 5%', category: 'Audio & Video' },
  { key: 'M', action: 'Mute / Unmute', category: 'Audio & Video' },
  { key: 'F', action: 'Toggle Fullscreen', category: 'Audio & Video' },
  { key: 'P', action: 'Picture-in-Picture', category: 'Audio & Video' },
  { key: 'Alt + S', action: 'Capture High-Res Screenshot', category: 'Audio & Video' },
  { key: 'I', action: 'Show Video Technical Stats', category: 'Audio & Video' },
  { key: 'S', action: 'Toggle Subtitles', category: 'Subtitles' },
  { key: 'C', action: 'Cycle Subtitle Track', category: 'Subtitles' },
  { key: 'Z / X', action: 'Adjust Subtitle Delay (-100ms / +100ms)', category: 'Subtitles' },
  { key: 'Ctrl + K', action: 'Open Command Palette', category: 'General' },
  { key: 'Esc', action: 'Exit Fullscreen / Close Dialogs', category: 'General' }
]
