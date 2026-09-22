import React, { useState } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture,
  Subtitles,
  Gauge,
  Layers,
  Repeat,
  Camera,
  Info,
  Sliders,
  ChevronDown,
  Plus
} from 'lucide-react'
import {
  usePlayerStore,
  togglePlay,
  seekRelative,
  setVolume,
  toggleMute,
  setPlaybackRate,
  setAspectRatio,
  toggleFullscreen,
  togglePiP,
  toggleABRepeatPoint,
  selectSubtitleTrack,
  adjustSubtitleDelay,
  captureScreenshot,
  toggleInfoModal,
  playNext,
  playPrev,
  setZoom,
  resetZoomPan
} from '../../stores/usePlayerStore'
import { SeekBar } from './SeekBar'
import { formatDuration } from '../../utils/formatters'
import { AspectRatioMode } from '@shared/types'

export const Controls: React.FC = () => {
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    isFullscreen,
    aspectRatio,
    zoom,
    abRepeat,
    subtitles,
    activeSubtitleId,
    subtitleDelay,
    audioTracks,
    activeAudioTrackId,
    queue,
    queueIndex
  } = usePlayerStore()

  const [showTimeRemaining, setShowTimeRemaining] = useState(false)
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false)
  const [subMenuOpen, setSubMenuOpen] = useState(false)
  const [aspectMenuOpen, setAspectMenuOpen] = useState(false)
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false)

  const hasNext = queue.length > 1
  const hasPrev = queue.length > 1

  const speedOptions = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0]
  const aspectOptions: AspectRatioMode[] = ['original', '16:9', '4:3', '21:9', 'fill', 'stretch']

  const handleOpenExternalSubtitle = async () => {
    if (!window.electronAPI) return
    const path = await window.electronAPI.dialogs.openSubtitleDialog()
    if (path) {
      const newTrack = {
        id: 'ext_' + Date.now(),
        label: 'External Subtitle',
        language: 'Custom',
        path,
        format: 'srt' as any,
        isExternal: true
      }
      selectSubtitleTrack(newTrack.id)
    }
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-8 pb-3 px-4 flex flex-col gap-2 transition-opacity duration-300 z-30 select-none"
    >
      {/* Top: Seek Bar */}
      <SeekBar />

      {/* Bottom: Main Control Bar */}
      <div className="flex items-center justify-between text-xs text-sid-300">
        {/* Left Section: Playback, Skip, Volume, Time */}
        <div className="flex items-center gap-2">
          {/* Previous Video */}
          <button
            onClick={playPrev}
            disabled={!hasPrev}
            className={`p-1.5 rounded-lg transition-colors ${
              hasPrev ? 'hover:bg-white/10 hover:text-white' : 'opacity-30 cursor-not-allowed'
            }`}
            title="Previous (Ctrl+←)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Seek -5s */}
          <button
            onClick={() => seekRelative(-5)}
            className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
            title="Rewind 5s (←)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-white hover:bg-blue-400 text-sid-950 flex items-center justify-center shadow-lg transition-all transform hover:scale-105"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Seek +5s */}
          <button
            onClick={() => seekRelative(5)}
            className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
            title="Forward 5s (→)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Next Video */}
          <button
            onClick={playNext}
            disabled={!hasNext}
            className={`p-1.5 rounded-lg transition-colors ${
              hasNext ? 'hover:bg-white/10 hover:text-white' : 'opacity-30 cursor-not-allowed'
            }`}
            title="Next (Ctrl+→)"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Volume Group */}
          <div className="flex items-center gap-2 group ml-2">
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
              title="Mute (M)"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : volume < 50 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            {/* Volume Slider on hover */}
            <div className="w-0 group-hover:w-20 overflow-hidden transition-all duration-200 flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-20 h-1 bg-white/20 rounded cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          {/* Time Display */}
          <div
            onClick={() => setShowTimeRemaining(!showTimeRemaining)}
            className="ml-2 font-mono text-[11px] text-sid-400 hover:text-sid-200 cursor-pointer transition-colors"
            title="Click to toggle remaining time"
          >
            {showTimeRemaining ? (
              <span>-{formatDuration(Math.max(0, duration - currentTime))}</span>
            ) : (
              <span>
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </span>
            )}
          </div>
        </div>

        {/* Right Section: Subtitles, Speed, Aspect, Loop, Info, PiP, Fullscreen */}
        <div className="flex items-center gap-1.5">
          {/* A-B Loop Toggle */}
          <button
            onClick={toggleABRepeatPoint}
            className={`p-1.5 rounded-lg transition-all ${
              abRepeat.enabled
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'hover:bg-white/10 hover:text-white'
            }`}
            title="A-B Repeat (R)"
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Subtitles Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setSubMenuOpen(!subMenuOpen)
                setSpeedMenuOpen(false)
                setAspectMenuOpen(false)
                setZoomMenuOpen(false)
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                activeSubtitleId ? 'text-blue-400 bg-blue-500/10' : 'hover:bg-white/10 hover:text-white'
              }`}
              title="Subtitles (S)"
            >
              <Subtitles className="w-4 h-4" />
            </button>

            {subMenuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-56 glass-dropdown rounded-xl p-2 z-50 text-xs shadow-2xl border border-white/10">
                <div className="flex items-center justify-between px-2 py-1 text-sid-400 font-semibold text-[11px] border-b border-white/[0.06] mb-1">
                  <span>Subtitles</span>
                  {activeSubtitleId && (
                    <div className="flex items-center gap-1 font-mono text-[10px]">
                      <button
                        onClick={() => adjustSubtitleDelay(-0.1)}
                        className="px-1 py-0.5 rounded bg-sid-800 hover:bg-sid-700"
                        title="Delay -100ms (Z)"
                      >
                        -0.1s
                      </button>
                      <span className="text-white">{subtitleDelay >= 0 ? `+${subtitleDelay}` : subtitleDelay}s</span>
                      <button
                        onClick={() => adjustSubtitleDelay(0.1)}
                        className="px-1 py-0.5 rounded bg-sid-800 hover:bg-sid-700"
                        title="Delay +100ms (X)"
                      >
                        +0.1s
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    selectSubtitleTrack(null)
                    setSubMenuOpen(false)
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors ${
                    activeSubtitleId === null ? 'bg-blue-600 text-white font-medium' : 'hover:bg-white/10 text-sid-300'
                  }`}
                >
                  Off
                </button>

                {subtitles.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => {
                      selectSubtitleTrack(track.id)
                      setSubMenuOpen(false)
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg truncate transition-colors ${
                      activeSubtitleId === track.id ? 'bg-blue-600 text-white font-medium' : 'hover:bg-white/10 text-sid-300'
                    }`}
                  >
                    {track.label}
                  </button>
                ))}

                <div className="h-px bg-white/[0.08] my-1" />

                <button
                  onClick={() => {
                    handleOpenExternalSubtitle()
                    setSubMenuOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-blue-600/30 text-blue-400 hover:text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Load Subtitle File...</span>
                </button>
              </div>
            )}
          </div>

          {/* Playback Speed Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setSpeedMenuOpen(!speedMenuOpen)
                setSubMenuOpen(false)
                setAspectMenuOpen(false)
                setZoomMenuOpen(false)
              }}
              className="px-2 py-1 rounded-lg hover:bg-white/10 hover:text-white font-mono text-[11px] font-medium transition-colors"
              title="Playback Speed ([ / ])"
            >
              {playbackRate}x
            </button>

            {speedMenuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-36 glass-dropdown rounded-xl p-1.5 z-50 text-xs shadow-2xl border border-white/10">
                <div className="px-2 py-1 text-sid-400 text-[11px] font-semibold">Speed</div>
                <div className="grid grid-cols-2 gap-1">
                  {speedOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setPlaybackRate(s)
                        setSpeedMenuOpen(false)
                      }}
                      className={`py-1 rounded text-center font-mono text-[11px] transition-colors ${
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
            )}
          </div>

          {/* Aspect Ratio Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setAspectMenuOpen(!aspectMenuOpen)
                setSpeedMenuOpen(false)
                setSubMenuOpen(false)
                setZoomMenuOpen(false)
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
              title="Aspect Ratio"
            >
              <Layers className="w-4 h-4" />
            </button>

            {aspectMenuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-36 glass-dropdown rounded-xl p-1.5 z-50 text-xs shadow-2xl border border-white/10">
                <div className="px-2 py-1 text-sid-400 text-[11px] font-semibold">Aspect Ratio</div>
                <div className="flex flex-col gap-0.5">
                  {aspectOptions.map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setAspectRatio(m)
                        setAspectMenuOpen(false)
                      }}
                      className={`px-2 py-1 rounded text-left uppercase font-mono text-[11px] transition-colors ${
                        aspectRatio === m
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'hover:bg-white/10 text-sid-400 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Zoom & Pan Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setZoomMenuOpen(!zoomMenuOpen)
                setSpeedMenuOpen(false)
                setSubMenuOpen(false)
                setAspectMenuOpen(false)
              }}
              className={`px-2 py-1 rounded-lg hover:bg-white/10 hover:text-white font-mono text-[11px] font-medium transition-colors ${
                zoom !== 1.0 ? 'text-amber-400' : ''
              }`}
              title="Zoom Video (50% - 200%)"
            >
              {Math.round(zoom * 100)}%
            </button>

            {zoomMenuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-48 glass-dropdown rounded-xl p-2.5 z-50 text-xs shadow-2xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sid-400 font-semibold text-[11px]">Zoom Scale</span>
                  <button
                    onClick={resetZoomPan}
                    className="text-[10px] text-blue-400 hover:underline"
                  >
                    Reset
                  </button>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/20 rounded cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-sid-500 font-mono mt-1">
                  <span>50%</span>
                  <span>100%</span>
                  <span>200%</span>
                </div>
              </div>
            )}
          </div>

          {/* Screenshot capture */}
          <button
            onClick={captureScreenshot}
            className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
            title="Snapshot (Alt+S)"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Media Info Stats */}
          <button
            onClick={toggleInfoModal}
            className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
            title="Media Statistics (I)"
          >
            <Info className="w-4 h-4 text-purple-400" />
          </button>

          {/* PiP */}
          <button
            onClick={togglePiP}
            className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
            title="Picture-in-Picture (P)"
          >
            <PictureInPicture className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors ml-1"
            title="Fullscreen (F)"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
