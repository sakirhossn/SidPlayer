import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Camera,
  Info,
  Layers,
  AlertTriangle
} from 'lucide-react'
import {
  usePlayerStore,
  registerVideoElement,
  togglePlay,
  seek,
  seekRelative,
  stepFrame,
  setVolume,
  toggleMute,
  stepPlaybackRate,
  shuttleRewind,
  shuttleFastForward,
  toggleFullscreen,
  togglePiP,
  toggleABRepeatPoint,
  cycleSubtitles,
  adjustSubtitleDelay,
  captureScreenshot,
  toggleInfoModal,
  playNext,
  playPrev,
  closePlayer,
  resumeFromSavedPosition,
  dismissResumePrompt,
  setZoom,
  setPan,
  getPlayerState
} from '../../stores/usePlayerStore'
import { Controls } from './Controls'
import { SubtitleOverlay } from './SubtitleOverlay'
import { ContextMenu } from './ContextMenu'
import { VideoInfoModal } from './VideoInfoModal'
import { UpNextOverlay } from './UpNextOverlay'
import { useSettings } from '../../stores/useSettingsStore'
import { formatDuration } from '../../utils/formatters'

export const VideoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const {
    currentVideo,
    isPlaying,
    currentTime,
    duration,
    aspectRatio,
    zoom,
    panX,
    panY,
    filters,
    abRepeat,
    resumePrompt,
    volumeHUD,
    doubleClickFeedback,
    showInfoModal,
    queue,
    queueIndex
  } = usePlayerStore()

  const { settings } = useSettings()

  const [controlsVisible, setControlsVisible] = useState(true)
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null)
  const [upNextCountdown, setUpNextCountdown] = useState<number | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [playError, setPlayError] = useState<string | null>(null)

  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null)
  const upNextInterval = useRef<NodeJS.Timeout | null>(null)

  // Autohide controls on inactivity
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true)
    if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current)
    if (isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
        setControlsVisible(false)
      }, 2500)
    }
  }, [isPlaying])

  useEffect(() => {
    resetHideTimer()
    return () => {
      if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current)
    }
  }, [isPlaying, resetHideTimer])

  // Register video element
  useEffect(() => {
    if (videoRef.current) {
      registerVideoElement(videoRef.current)
    }
    return () => {
      registerVideoElement(null)
    }
  }, [])

  // Clear error on video change
  useEffect(() => {
    setPlayError(null)
    setUpNextCountdown(null)
  }, [currentVideo?.id])

  // Handle Video Time Updates
  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const cur = videoRef.current.currentTime

    // A-B loop check
    if (abRepeat.enabled && abRepeat.start !== null && abRepeat.end !== null) {
      if (cur >= abRepeat.end) {
        videoRef.current.currentTime = abRepeat.start
        return
      }
    }

    // Persist resume position periodically (every 5s)
    if (currentVideo && window.electronAPI && Math.floor(cur) % 5 === 0) {
      const isCompleted = videoRef.current.duration > 0 && cur / videoRef.current.duration > 0.95
      window.electronAPI.db.updateResume(currentVideo.id, Math.floor(cur), isCompleted)
      window.electronAPI.window.setProgressBar(
        videoRef.current.duration > 0 ? cur / videoRef.current.duration : -1
      )
    }

    // Up next check (within 5 seconds of end)
    const dur = videoRef.current.duration
    if (
      dur > 15 &&
      dur - cur <= 5 &&
      settings.autoplayNext &&
      queue.length > 1 &&
      queueIndex < queue.length - 1 &&
      upNextCountdown === null
    ) {
      startUpNextCountdown()
    }
  }

  const startUpNextCountdown = () => {
    let count = 5
    setUpNextCountdown(count)
    if (upNextInterval.current) clearInterval(upNextInterval.current)
    upNextInterval.current = setInterval(() => {
      count -= 1
      if (count <= 0) {
        if (upNextInterval.current) clearInterval(upNextInterval.current)
        setUpNextCountdown(null)
        playNext()
      } else {
        setUpNextCountdown(count)
      }
    }, 1000)
  }

  const cancelUpNext = () => {
    if (upNextInterval.current) clearInterval(upNextInterval.current)
    setUpNextCountdown(null)
  }

  const handleVideoEnded = () => {
    if (currentVideo && window.electronAPI) {
      window.electronAPI.db.updateResume(currentVideo.id, 0, true)
      window.electronAPI.window.setProgressBar(-1)
    }
    if (settings.autoplayNext && queue.length > 1 && queueIndex < queue.length - 1) {
      playNext()
    }
  }

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return

      resetHideTimer()

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (e.ctrlKey) {
            playPrev()
          } else if (e.shiftKey) {
            seekRelative(-30, true)
          } else {
            seekRelative(-5)
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (e.ctrlKey) {
            playNext()
          } else if (e.shiftKey) {
            seekRelative(30, true)
          } else {
            seekRelative(5)
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolume(getPlayerState().volume + 5)
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolume(getPlayerState().volume - 5)
          break
        case 'm':
        case 'M':
          e.preventDefault()
          toggleMute()
          break
        case 'f':
        case 'F':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'p':
        case 'P':
          e.preventDefault()
          togglePiP()
          break
        case 's':
        case 'S':
          e.preventDefault()
          if (e.altKey) {
            captureScreenshot()
          } else {
            cycleSubtitles()
          }
          break
        case 'c':
        case 'C':
          e.preventDefault()
          cycleSubtitles()
          break
        case 'z':
        case 'Z':
          e.preventDefault()
          adjustSubtitleDelay(-0.1)
          break
        case 'x':
        case 'X':
          e.preventDefault()
          adjustSubtitleDelay(0.1)
          break
        case '[':
          e.preventDefault()
          stepPlaybackRate(false)
          break
        case ']':
          e.preventDefault()
          stepPlaybackRate(true)
          break
        case 'j':
        case 'J':
          e.preventDefault()
          shuttleRewind()
          break
        case 'l':
        case 'L':
          e.preventDefault()
          shuttleFastForward()
          break
        case ',':
          e.preventDefault()
          stepFrame(false)
          break
        case '.':
          e.preventDefault()
          stepFrame(true)
          break
        case 'r':
        case 'R':
          e.preventDefault()
          toggleABRepeatPoint()
          break
        case '0':
        case 'Home':
          e.preventDefault()
          seek(0)
          break
        case 'End':
          e.preventDefault()
          seek(duration)
          break
        case 'i':
        case 'I':
          e.preventDefault()
          toggleInfoModal()
          break
        case 'Escape':
          e.preventDefault()
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {})
          } else if (showInfoModal) {
            toggleInfoModal()
          } else {
            closePlayer()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [resetHideTimer, duration, showInfoModal])

  // Mouse Wheel: Volume or Zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      // Zoom
      const delta = e.deltaY < 0 ? 0.05 : -0.05
      setZoom(zoom + delta)
    } else {
      // Volume
      const delta = e.deltaY < 0 ? 5 : -5
      setVolume(getPlayerState().volume + delta)
    }
  }

  // Double Click Zones (Left -10s, Center Play/Pause, Right +10s)
  const handleDoubleClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const xRatio = (e.clientX - rect.left) / rect.width

    if (xRatio < 0.35) {
      seekRelative(-10)
    } else if (xRatio > 0.65) {
      seekRelative(10)
    } else {
      toggleFullscreen()
    }
  }

  // Single Click on video: Toggle Play
  const handleClick = (e: React.MouseEvent) => {
    if (e.detail === 1) {
      togglePlay()
    }
  }

  // Right Click: Context Menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenuPos({ x: e.clientX, y: e.clientY })
  }

  // Pan when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1.0 && e.button === 0) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    resetHideTimer()
    if (isPanning && zoom > 1.0) {
      setPan(e.clientX - panStart.x, e.clientY - panStart.y)
    }
  }

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false)
  }

  if (!currentVideo) return null

  // Compute aspect ratio CSS style
  const getAspectRatioStyle = () => {
    switch (aspectRatio) {
      case '16:9':
        return { aspectRatio: '16/9' }
      case '4:3':
        return { aspectRatio: '4/3' }
      case '21:9':
        return { aspectRatio: '21/9' }
      case 'fill':
        return { width: '100%', height: '100%', objectFit: 'cover' as const }
      case 'stretch':
        return { width: '100%', height: '100%', objectFit: 'fill' as const }
      default:
        return { objectFit: 'contain' as const }
    }
  }

  // Stream URL using custom Range-supported media protocol
  const streamUrl = `media://stream?path=${encodeURIComponent(currentVideo.path)}`

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
      className={`relative w-full h-full bg-black flex items-center justify-center overflow-hidden select-none ${
        !controlsVisible ? 'cursor-none' : ''
      }`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={streamUrl}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnded}
        onError={() => {
          setPlayError(
            `Unable to play this media file directly (${currentVideo.format.toUpperCase()} / ${currentVideo.videoCodec}). The video codec might not be supported natively by the browser engine.`
          )
        }}
        style={{
          ...getAspectRatioStyle(),
          transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
          transition: isPanning ? 'none' : 'transform 0.15s ease',
          filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`
        }}
        className="w-full h-full max-h-full max-w-full"
        playsInline
      />

      {/* Subtitles Overlay */}
      <SubtitleOverlay />

      {/* Top Bar (Back, Title, Stats) */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/90 via-black/60 to-transparent flex items-center justify-between z-30 transition-opacity duration-300 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={closePlayer}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all transform hover:-translate-x-0.5"
            title="Back to Library (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white truncate max-w-xl" title={currentVideo.title}>
              {currentVideo.title}
            </h2>
            <p className="text-[11px] text-sid-400 truncate mt-0.5">{currentVideo.folder}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {zoom > 1.0 && (
            <div className="px-2 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono">
              Zoom {Math.round(zoom * 100)}% (Drag to Pan)
            </div>
          )}
          <button
            onClick={captureScreenshot}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-400 hover:text-emerald-300 transition-colors"
            title="Snapshot (Alt+S)"
          >
            <Camera className="w-4 h-4" />
          </button>
          <button
            onClick={toggleInfoModal}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-sid-300 hover:text-white transition-colors"
            title="Media Statistics (I)"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <Controls />
      </div>

      {/* Resume Prompt Toast Banner */}
      {resumePrompt && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-sid-900/95 border border-blue-500/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md flex items-center gap-4 text-xs animate-scale-in">
          <div className="flex items-center gap-2 text-sid-200">
            <Play className="w-4 h-4 text-blue-400" />
            <span>Resume playback from <strong>{formatDuration(resumePrompt.position)}</strong>?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resumeFromSavedPosition}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md shadow-blue-500/30 transition-all cursor-pointer"
            >
              Resume
            </button>
            <button
              onClick={dismissResumePrompt}
              className="px-3 py-1.5 rounded-lg bg-sid-800 hover:bg-sid-700 text-sid-300 font-medium transition-colors cursor-pointer"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Double-Click Visual Feedback Animation */}
      {doubleClickFeedback && (
        <div
          key={doubleClickFeedback.key}
          className={`absolute top-1/2 -translate-y-1/2 pointer-events-none z-30 flex flex-col items-center justify-center p-6 rounded-full bg-black/60 text-white backdrop-blur-sm seek-ripple ${
            doubleClickFeedback.side === 'left' ? 'left-1/4' : 'right-1/4'
          }`}
        >
          {doubleClickFeedback.side === 'left' ? (
            <RotateCcw className="w-8 h-8 text-blue-400" />
          ) : (
            <RotateCw className="w-8 h-8 text-blue-400" />
          )}
          <span className="text-xs font-mono font-bold mt-1">{doubleClickFeedback.label}</span>
        </div>
      )}

      {/* Volume Adjustment HUD */}
      {volumeHUD && (
        <div className="absolute top-20 right-6 z-40 bg-black/75 border border-white/10 rounded-xl px-4 py-2.5 shadow-2xl backdrop-blur-md flex items-center gap-3 animate-fade-in pointer-events-none">
          {volumeHUD.isMuted || volumeHUD.volume === 0 ? (
            <VolumeX className="w-5 h-5 text-rose-400" />
          ) : (
            <Volume2 className="w-5 h-5 text-blue-400" />
          )}
          <div className="flex flex-col">
            <span className="text-[10px] text-sid-400 uppercase font-semibold">Volume</span>
            <span className="text-xs font-mono font-bold text-white">
              {volumeHUD.isMuted ? 'Muted' : `${volumeHUD.volume}%`}
            </span>
          </div>
        </div>
      )}

      {/* Up Next Overlay */}
      {upNextCountdown !== null && queue[queueIndex + 1] && (
        <UpNextOverlay
          nextVideo={queue[queueIndex + 1]}
          countdown={upNextCountdown}
          onCancel={cancelUpNext}
        />
      )}

      {/* Playback Error Alert */}
      {playError && (
        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center z-40">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
          <h3 className="text-base font-semibold text-white mb-2">Video Playback Issue</h3>
          <p className="text-xs text-sid-400 max-w-md mb-6 leading-relaxed">{playError}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.electronAPI?.dialogs.showItemInFolder(currentVideo.path)}
              className="px-4 py-2 rounded-lg bg-sid-800 hover:bg-sid-700 text-sid-200 text-xs font-medium transition-colors"
            >
              Open in Explorer
            </button>
            <button
              onClick={closePlayer}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
            >
              Back to Library
            </button>
          </div>
        </div>
      )}

      {/* Right Click Context Menu */}
      {contextMenuPos && (
        <ContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          onClose={() => setContextMenuPos(null)}
        />
      )}

      {/* Technical Media Stats Modal */}
      {showInfoModal && <VideoInfoModal />}
    </div>
  )
}
