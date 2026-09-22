import { useState, useEffect } from 'react'
import { VideoItem, SubtitleTrack, SubtitleCue, AudioTrack, AspectRatioMode, VideoFilters, ABRepeat } from '../../shared/types'
import { showToast } from './useToastStore'
import { loadLibrary } from './useLibraryStore'

export interface PlayerState {
  currentVideo: VideoItem | null
  isPlaying: boolean
  currentTime: number
  duration: number
  bufferedEnd: number
  volume: number
  isMuted: boolean
  playbackRate: number
  isFullscreen: boolean
  isPiP: boolean
  aspectRatio: AspectRatioMode
  zoom: number
  panX: number
  panY: number
  filters: VideoFilters
  abRepeat: ABRepeat
  subtitles: SubtitleTrack[]
  activeSubtitleId: string | null
  subtitleCues: SubtitleCue[]
  activeCueText: string
  subtitleDelay: number // in seconds
  audioTracks: AudioTrack[]
  activeAudioTrackId: number
  queue: VideoItem[]
  queueIndex: number
  shuffle: boolean
  repeatMode: 'none' | 'one' | 'all'
  showInfoModal: boolean
  resumePrompt: { show: boolean; position: number } | null
  upNextCountdown: number | null
  doubleClickFeedback: { side: 'left' | 'right'; label: string; key: number } | null
  volumeHUD: { show: boolean; volume: number; isMuted: boolean } | null
  videoElement: HTMLVideoElement | null
}

const initialPlayerState: PlayerState = {
  currentVideo: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  bufferedEnd: 0,
  volume: 80,
  isMuted: false,
  playbackRate: 1.0,
  isFullscreen: false,
  isPiP: false,
  aspectRatio: 'original',
  zoom: 1.0,
  panX: 0,
  panY: 0,
  filters: {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    deinterlace: false
  },
  abRepeat: {
    start: null,
    end: null,
    enabled: false
  },
  subtitles: [],
  activeSubtitleId: null,
  subtitleCues: [],
  activeCueText: '',
  subtitleDelay: 0,
  audioTracks: [],
  activeAudioTrackId: 0,
  queue: [],
  queueIndex: 0,
  shuffle: false,
  repeatMode: 'none',
  showInfoModal: false,
  resumePrompt: null,
  upNextCountdown: null,
  doubleClickFeedback: null,
  volumeHUD: null,
  videoElement: null
}

let playerState: PlayerState = { ...initialPlayerState }
let playerListeners: Array<(state: PlayerState) => void> = []
let volumeHUDTimeout: NodeJS.Timeout | null = null
let upNextInterval: NodeJS.Timeout | null = null

function notify() {
  playerListeners.forEach((l) => l({ ...playerState }))
}

export function registerVideoElement(el: HTMLVideoElement | null): void {
  playerState.videoElement = el
  if (el) {
    el.volume = playerState.volume / 100
    el.muted = playerState.isMuted
    el.playbackRate = playerState.playbackRate
  }
}

export async function playVideo(
  video: VideoItem,
  queue: VideoItem[] = [],
  queueIndex = 0
): Promise<void> {
  if (upNextInterval) {
    clearInterval(upNextInterval)
    upNextInterval = null
  }

  // Detect subtitles if not already loaded
  let subs = video.subtitles || []
  if (window.electronAPI && subs.length === 0) {
    try {
      const found = await window.electronAPI.subtitles.getSiblingSubtitles(video.path)
      subs = found || []
    } catch (e) {
      console.warn('Could not auto-detect subtitles:', e)
    }
  }

  playerState.currentVideo = video
  playerState.subtitles = subs
  playerState.activeSubtitleId = null
  playerState.subtitleCues = []
  playerState.activeCueText = ''
  playerState.subtitleDelay = 0
  playerState.audioTracks = video.audioTracks || []
  playerState.activeAudioTrackId = video.audioTracks?.[0]?.id ?? 0
  playerState.queue = queue.length > 0 ? queue : [video]
  playerState.queueIndex = queueIndex
  playerState.currentTime = 0
  playerState.duration = video.duration || 0
  playerState.upNextCountdown = null
  playerState.abRepeat = { start: null, end: null, enabled: false }
  playerState.zoom = 1.0
  playerState.panX = 0
  playerState.panY = 0

  // Check resume position
  if (video.resumePosition && video.resumePosition > 10 && !video.completed) {
    playerState.resumePrompt = { show: true, position: video.resumePosition }
  } else {
    playerState.resumePrompt = null
  }

  notify()

  // Auto-select English or first subtitle track if available
  const defaultSub = subs.find((s) => s.language === 'en' || s.language === 'eng') || subs[0]
  if (defaultSub) {
    selectSubtitleTrack(defaultSub.id)
  }

  if (playerState.videoElement) {
    playerState.videoElement.play().catch(() => {})
  }
}

export function resumeFromSavedPosition(): void {
  if (playerState.resumePrompt && playerState.videoElement) {
    playerState.videoElement.currentTime = playerState.resumePrompt.position
    playerState.resumePrompt = null
    notify()
    showToast('Resumed from previous position', 'info')
  }
}

export function dismissResumePrompt(): void {
  playerState.resumePrompt = null
  notify()
}

export function togglePlay(): void {
  const el = playerState.videoElement
  if (!el) return

  if (el.paused) {
    el.play().catch(() => {})
    playerState.isPlaying = true
  } else {
    el.pause()
    playerState.isPlaying = false
  }
  notify()
}

export function seek(seconds: number): void {
  const el = playerState.videoElement
  if (!el) return
  const clamped = Math.max(0, Math.min(seconds, el.duration || playerState.duration))
  el.currentTime = clamped
  playerState.currentTime = clamped
  notify()
}

export function seekRelative(deltaSeconds: number, isMacro = false): void {
  const el = playerState.videoElement
  if (!el) return
  const newTime = el.currentTime + deltaSeconds
  seek(newTime)

  // Show visual ripple feedback
  const side = deltaSeconds < 0 ? 'left' : 'right'
  const label = `${Math.abs(deltaSeconds)}s`
  playerState.doubleClickFeedback = { side, label, key: Date.now() }
  notify()
}

export function stepFrame(forward: boolean): void {
  const el = playerState.videoElement
  if (!el) return

  if (!el.paused) {
    el.pause()
    playerState.isPlaying = false
  }

  const fps = playerState.currentVideo?.fps || 24
  const frameDuration = 1 / fps
  const target = forward ? el.currentTime + frameDuration : el.currentTime - frameDuration
  seek(target)
  showToast(forward ? 'Frame +1' : 'Frame -1', 'info', 1000)
}

export function setVolume(vol: number): void {
  const el = playerState.videoElement
  const clamped = Math.max(0, Math.min(100, Math.round(vol)))
  playerState.volume = clamped
  playerState.isMuted = clamped === 0

  if (el) {
    el.volume = clamped / 100
    el.muted = playerState.isMuted
  }

  showVolumeHUD(clamped, playerState.isMuted)
  notify()
}

export function toggleMute(): void {
  const el = playerState.videoElement
  playerState.isMuted = !playerState.isMuted
  if (el) {
    el.muted = playerState.isMuted
  }
  showVolumeHUD(playerState.volume, playerState.isMuted)
  notify()
}

function showVolumeHUD(volume: number, isMuted: boolean) {
  if (volumeHUDTimeout) clearTimeout(volumeHUDTimeout)
  playerState.volumeHUD = { show: true, volume, isMuted }
  volumeHUDTimeout = setTimeout(() => {
    playerState.volumeHUD = null
    notify()
  }, 1500)
}

export function setPlaybackRate(rate: number): void {
  const el = playerState.videoElement
  const clamped = Math.max(0.25, Math.min(4.0, rate))
  playerState.playbackRate = clamped
  if (el) {
    el.playbackRate = clamped
  }
  notify()
  showToast(`Speed: ${clamped}x`, 'info', 1500)
}

export function stepPlaybackRate(increase: boolean): void {
  const rates = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0]
  const current = playerState.playbackRate
  let next = 1.0
  if (increase) {
    next = rates.find((r) => r > current) || 2.0
  } else {
    const rev = [...rates].reverse()
    next = rev.find((r) => r < current) || 0.25
  }
  setPlaybackRate(next)
}

// Shuttle J / K / L controls
export function shuttleRewind(): void {
  const el = playerState.videoElement
  if (!el) return
  seekRelative(-10)
}

export function shuttleFastForward(): void {
  const el = playerState.videoElement
  if (!el) return
  if (playerState.playbackRate === 1.0) {
    setPlaybackRate(2.0)
  } else if (playerState.playbackRate === 2.0) {
    setPlaybackRate(4.0)
  } else {
    setPlaybackRate(1.0)
  }
}

export function toggleFullscreen(): void {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {})
    playerState.isFullscreen = true
  } else {
    document.exitFullscreen().catch(() => {})
    playerState.isFullscreen = false
  }
  notify()
}

export function togglePiP(): void {
  const el = playerState.videoElement
  if (!el) return

  if (document.pictureInPictureElement) {
    document.exitPictureInPicture().catch(() => {})
    playerState.isPiP = false
  } else if (el.requestPictureInPicture) {
    el.requestPictureInPicture().then(() => {
      playerState.isPiP = true
      notify()
    }).catch(() => {
      showToast('Picture-in-Picture not supported for this media', 'warning')
    })
  } else {
    showToast('Picture-in-Picture is not supported in this environment', 'warning')
  }
  notify()
}

export function setAspectRatio(mode: AspectRatioMode): void {
  playerState.aspectRatio = mode
  notify()
  showToast(`Aspect ratio: ${mode.toUpperCase()}`, 'info', 1500)
}

export function setZoom(zoom: number): void {
  playerState.zoom = Math.max(0.5, Math.min(2.0, Math.round(zoom * 100) / 100))
  if (playerState.zoom === 1.0) {
    playerState.panX = 0
    playerState.panY = 0
  }
  notify()
}

export function setPan(x: number, y: number): void {
  playerState.panX = x
  playerState.panY = y
  notify()
}

export function resetZoomPan(): void {
  playerState.zoom = 1.0
  playerState.panX = 0
  playerState.panY = 0
  notify()
}

export function setVideoFilters(filters: Partial<VideoFilters>): void {
  playerState.filters = { ...playerState.filters, ...filters }
  notify()
}

export function toggleABRepeatPoint(): void {
  const cur = playerState.currentTime
  const ab = playerState.abRepeat

  if (ab.start === null) {
    // Set point A
    playerState.abRepeat = { start: cur, end: null, enabled: true }
    showToast(`A-B Loop: Point A set (${formatSecs(cur)})`, 'info')
  } else if (ab.end === null) {
    // Set point B
    if (cur > ab.start) {
      playerState.abRepeat = { start: ab.start, end: cur, enabled: true }
      showToast(`A-B Loop active (${formatSecs(ab.start)} → ${formatSecs(cur)})`, 'success')
    } else {
      playerState.abRepeat = { start: cur, end: null, enabled: true }
      showToast(`Point A updated to ${formatSecs(cur)}`, 'info')
    }
  } else {
    // Clear loop
    playerState.abRepeat = { start: null, end: null, enabled: false }
    showToast('A-B Loop cleared', 'info')
  }
  notify()
}

function formatSecs(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// Subtitles
export async function selectSubtitleTrack(subId: string | null): Promise<void> {
  playerState.activeSubtitleId = subId
  playerState.activeCueText = ''
  playerState.subtitleCues = []

  if (!subId) {
    notify()
    showToast('Subtitles off', 'info')
    return
  }

  const track = playerState.subtitles.find((s) => s.id === subId)
  if (track && track.path && window.electronAPI) {
    try {
      const cues = await window.electronAPI.subtitles.parseSubtitle(track.path)
      playerState.subtitleCues = cues || []
      showToast(`Subtitles: ${track.label}`, 'info')
    } catch (e) {
      showToast('Failed to load subtitle file', 'error')
    }
  }
  notify()
}

export function cycleSubtitles(): void {
  const tracks = playerState.subtitles
  if (tracks.length === 0) {
    showToast('No subtitles available', 'info')
    return
  }

  if (playerState.activeSubtitleId === null) {
    selectSubtitleTrack(tracks[0].id)
  } else {
    const idx = tracks.findIndex((t) => t.id === playerState.activeSubtitleId)
    if (idx === tracks.length - 1) {
      selectSubtitleTrack(null)
    } else {
      selectSubtitleTrack(tracks[idx + 1].id)
    }
  }
}

export function adjustSubtitleDelay(deltaSec: number): void {
  playerState.subtitleDelay = Math.round((playerState.subtitleDelay + deltaSec) * 100) / 100
  notify()
  const sign = playerState.subtitleDelay >= 0 ? '+' : ''
  showToast(`Subtitle sync: ${sign}${playerState.subtitleDelay}s`, 'info', 1500)
}

// Screenshot capture
export async function captureScreenshot(): Promise<void> {
  const el = playerState.videoElement
  if (!el || !playerState.currentVideo || !window.electronAPI) return

  try {
    const canvas = document.createElement('canvas')
    canvas.width = el.videoWidth || 1920
    canvas.height = el.videoHeight || 1080
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(el, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/png')

    const res = await window.electronAPI.media.saveScreenshot(dataUrl, playerState.currentVideo.title)
    if (res.success) {
      showToast(`Screenshot copied to clipboard and saved to Pictures/SidPlayer`, 'success', 3500)
    } else {
      showToast(`Screenshot error: ${res.error}`, 'error')
    }
  } catch (err: any) {
    showToast(`Failed to capture screenshot: ${err.message}`, 'error')
  }
}

// Queue / Playlist navigation
export function playNext(): void {
  const q = playerState.queue
  if (q.length <= 1) return

  let nextIdx = playerState.queueIndex + 1
  if (playerState.shuffle) {
    nextIdx = Math.floor(Math.random() * q.length)
  } else if (nextIdx >= q.length) {
    if (playerState.repeatMode === 'all') {
      nextIdx = 0
    } else {
      return
    }
  }

  const nextVid = q[nextIdx]
  if (nextVid) {
    playVideo(nextVid, q, nextIdx)
  }
}

export function playPrev(): void {
  const q = playerState.queue
  if (q.length <= 1) return

  let prevIdx = playerState.queueIndex - 1
  if (prevIdx < 0) {
    prevIdx = q.length - 1
  }

  const prevVid = q[prevIdx]
  if (prevVid) {
    playVideo(prevVid, q, prevIdx)
  }
}

export function toggleShuffle(): void {
  playerState.shuffle = !playerState.shuffle
  notify()
  showToast(playerState.shuffle ? 'Shuffle on' : 'Shuffle off', 'info')
}

export function toggleRepeat(): void {
  const modes: Array<'none' | 'one' | 'all'> = ['none', 'all', 'one']
  const curIdx = modes.indexOf(playerState.repeatMode)
  const next = modes[(curIdx + 1) % modes.length]
  playerState.repeatMode = next
  notify()
  showToast(`Repeat: ${next.toUpperCase()}`, 'info')
}

export function toggleInfoModal(): void {
  playerState.showInfoModal = !playerState.showInfoModal
  notify()
}

export function closePlayer(): void {
  if (playerState.videoElement) {
    playerState.videoElement.pause()
  }
  playerState.currentVideo = null
  playerState.isPlaying = false
  playerState.resumePrompt = null
  playerState.upNextCountdown = null
  notify()
  loadLibrary()
}

export function getPlayerState(): PlayerState {
  return playerState
}

// Hook for components
export function usePlayerStore(): PlayerState {
  const [state, setState] = useState<PlayerState>(playerState)

  useEffect(() => {
    playerListeners.push(setState)
    return () => {
      playerListeners = playerListeners.filter((l) => l !== setState)
    }
  }, [])

  return state
}

usePlayerStore.getState = getPlayerState

