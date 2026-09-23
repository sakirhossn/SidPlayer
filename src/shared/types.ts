export interface SubtitleCue {
  id?: string
  startTime: number // in seconds
  endTime: number // in seconds
  text: string
}

export interface SubtitleTrack {
  id: string
  label: string
  language: string
  path?: string
  format: 'srt' | 'vtt' | 'ass' | 'ssa'
  isExternal: boolean
  cues?: SubtitleCue[]
}

export interface AudioTrack {
  id: number
  title: string
  language: string
  codec: string
  channels: number
  sampleRate: number
}

export interface VideoItem {
  id: string
  path: string
  filename: string
  title: string
  duration: number
  size: number
  resolution: string
  width: number
  height: number
  fps: number
  format: string
  videoCodec: string
  audioCodec: string
  bitrate: number
  dateAdded: number
  dateModified: number
  lastPlayed: number
  playCount: number
  resumePosition: number
  completed: boolean
  isFavorite: boolean
  thumbnailUrl: string | null
  subtitles: SubtitleTrack[]
  audioTracks: AudioTrack[]
  isMissing: boolean
  folder: string
  fingerprint: string
}

export interface Playlist {
  id: string
  name: string
  description?: string
  videoIds: string[]
  createdAt: number
  updatedAt: number
}

export interface WatchHistoryItem {
  videoId: string
  videoPath: string
  title: string
  timestamp: number
  playbackPosition: number
  duration: number
  completedPercentage: number
}

export interface SubtitleSettings {
  fontSize: number
  fontFamily: string
  color: string
  backgroundColor: string
  backgroundOpacity: number
  position: 'bottom' | 'top'
  defaultDelay: number
}

export interface AppSettings {
  theme: 'dark' | 'midnight' | 'light' | 'system'
  autoplayNext: boolean
  resumePlayback: boolean
  defaultVolume: number
  defaultPlaybackRate: number
  skipBackwardSeconds: number
  skipForwardSeconds: number
  hardwareAcceleration: boolean
  enableAnimations: boolean
  compactMode: boolean
  subtitles: SubtitleSettings
  watchedFolders: string[]
  autoScanWatchedFolders: boolean
}

export interface ScanProgress {
  current: number
  total: number
  currentFile: string
  phase: 'counting' | 'scanning' | 'thumbnails' | 'done' | 'cancelled'
}

export interface PlaybackStats {
  resolution: string
  frameRate: number
  videoCodec: string
  audioCodec: string
  droppedFrames: number
  bufferAhead: number
  bufferHealth: number
  bitrate: string
  colorspace?: string
}

export interface ABRepeat {
  start: number | null
  end: number | null
  enabled: boolean
}

export type AspectRatioMode = 'original' | '16:9' | '4:3' | '21:9' | 'fill' | 'stretch'

export interface VideoFilters {
  brightness: number // 50 - 150 (default 100)
  contrast: number // 50 - 150 (default 100)
  saturation: number // 0 - 200 (default 100)
  deinterlace: boolean
}

export interface ScreenshotResult {
  success: boolean
  filePath?: string
  dataUrl?: string
  error?: string
}

export interface PrepareMediaProgress {
  videoId: string
  percent: number // 0 - 100
  status: string
}

export interface PrepareMediaResult {
  ready: boolean
  playablePath: string
  isOptimized: boolean
  error?: string
}

