import React, { useEffect, useRef } from 'react'
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Gauge,
  Layers,
  Subtitles,
  Volume2,
  Maximize2,
  PictureInPicture,
  Camera,
  Info,
  ExternalLink,
  Repeat
} from 'lucide-react'
import {
  usePlayerStore,
  togglePlay,
  seekRelative,
  stepFrame,
  setPlaybackRate,
  setAspectRatio,
  selectSubtitleTrack,
  toggleFullscreen,
  togglePiP,
  toggleInfoModal,
  toggleABRepeatPoint,
  captureScreenshot
} from '../../stores/usePlayerStore'
import { AspectRatioMode } from '@shared/types'

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const {
    isPlaying,
    playbackRate,
    aspectRatio,
    subtitles,
    activeSubtitleId,
    currentVideo,
    abRepeat
  } = usePlayerStore()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  // Keep menu within screen boundaries
  const adjustedX = Math.min(x, window.innerWidth - 240)
  const adjustedY = Math.min(y, window.innerHeight - 380)

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]
  const aspectOptions: AspectRatioMode[] = ['original', '16:9', '4:3', '21:9', 'fill', 'stretch']

  return (
    <div
      ref={menuRef}
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
      className="fixed z-50 w-56 rounded-xl glass-dropdown p-1.5 text-xs text-sid-300 shadow-2xl border border-white/10 select-none animate-scale-in"
    >
      {/* Play/Pause */}
      <button
        onClick={() => {
          togglePlay()
          onClose()
        }}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-blue-600/30 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2">
          {isPlaying ? <Pause className="w-3.5 h-3.5 text-blue-400" /> : <Play className="w-3.5 h-3.5 text-blue-400" />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </div>
        <kbd className="text-[10px] text-sid-500 font-mono">Space</kbd>
      </button>

      {/* Frame stepping */}
      <div className="grid grid-cols-2 gap-1 my-0.5">
        <button
          onClick={() => {
            stepFrame(false)
            onClose()
          }}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/[0.08] hover:text-white transition-colors text-[11px]"
        >
          <SkipBack className="w-3 h-3 text-sid-400" />
          <span>Frame -1</span>
        </button>
        <button
          onClick={() => {
            stepFrame(true)
            onClose()
          }}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/[0.08] hover:text-white transition-colors text-[11px]"
        >
          <SkipForward className="w-3 h-3 text-sid-400" />
          <span>Frame +1</span>
        </button>
      </div>

      <div className="h-px bg-white/[0.08] my-1" />

      {/* Speed Selector */}
      <div className="px-2 py-1">
        <div className="flex items-center gap-1.5 text-sid-400 text-[11px] mb-1">
          <Gauge className="w-3 h-3 text-amber-400" />
          <span>Playback Speed</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {speedOptions.map((s) => (
            <button
              key={s}
              onClick={() => {
                setPlaybackRate(s)
                onClose()
              }}
              className={`py-1 rounded text-center text-[10px] font-mono transition-colors ${
                playbackRate === s
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-sid-800 text-sid-400 hover:text-white hover:bg-sid-700'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-white/[0.08] my-1" />

      {/* Aspect Ratio */}
      <div className="px-2 py-1">
        <div className="flex items-center gap-1.5 text-sid-400 text-[11px] mb-1">
          <Layers className="w-3 h-3 text-indigo-400" />
          <span>Aspect Ratio</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {aspectOptions.map((m) => (
            <button
              key={m}
              onClick={() => {
                setAspectRatio(m)
                onClose()
              }}
              className={`py-1 rounded text-center text-[10px] uppercase font-mono transition-colors ${
                aspectRatio === m
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-sid-800 text-sid-400 hover:text-white hover:bg-sid-700'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-white/[0.08] my-1" />

      {/* A-B Loop */}
      <button
        onClick={() => {
          toggleABRepeatPoint()
          onClose()
        }}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-blue-600/30 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2">
          <Repeat className={`w-3.5 h-3.5 ${abRepeat.enabled ? 'text-amber-400' : 'text-sid-400'}`} />
          <span>{abRepeat.enabled ? 'A-B Loop: Next Step' : 'Set A-B Loop'}</span>
        </div>
        <kbd className="text-[10px] text-sid-500 font-mono">R</kbd>
      </button>

      {/* Screenshot */}
      <button
        onClick={() => {
          captureScreenshot()
          onClose()
        }}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-blue-600/30 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2">
          <Camera className="w-3.5 h-3.5 text-emerald-400" />
          <span>Capture Screenshot</span>
        </div>
        <kbd className="text-[10px] text-sid-500 font-mono">Alt S</kbd>
      </button>

      {/* PiP & Fullscreen */}
      <button
        onClick={() => {
          togglePiP()
          onClose()
        }}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-blue-600/30 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2">
          <PictureInPicture className="w-3.5 h-3.5 text-cyan-400" />
          <span>Picture in Picture</span>
        </div>
        <kbd className="text-[10px] text-sid-500 font-mono">P</kbd>
      </button>

      <button
        onClick={() => {
          toggleFullscreen()
          onClose()
        }}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-blue-600/30 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2">
          <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
          <span>Fullscreen</span>
        </div>
        <kbd className="text-[10px] text-sid-500 font-mono">F</kbd>
      </button>

      <div className="h-px bg-white/[0.08] my-1" />

      {/* Media Stats */}
      <button
        onClick={() => {
          toggleInfoModal()
          onClose()
        }}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-blue-600/30 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-purple-400" />
          <span>Media Stats</span>
        </div>
        <kbd className="text-[10px] text-sid-500 font-mono">I</kbd>
      </button>

      {/* Open Explorer */}
      {currentVideo && (
        <button
          onClick={() => {
            window.electronAPI?.dialogs.showItemInFolder(currentVideo.path)
            onClose()
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.08] hover:text-white transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5 text-sid-400" />
          <span>Open File Location</span>
        </button>
      )}
    </div>
  )
}
