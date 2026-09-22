import React, { useState, useEffect } from 'react'
import { X, Info, HardDrive, Cpu, Volume2, ShieldCheck, Film } from 'lucide-react'
import { usePlayerStore, toggleInfoModal } from '../../stores/usePlayerStore'
import { formatDuration, formatFileSize, formatBitrate } from '../../utils/formatters'

export const VideoInfoModal: React.FC = () => {
  const { currentVideo, videoElement, currentTime, bufferedEnd, playbackRate } = usePlayerStore()
  const [droppedFrames, setDroppedFrames] = useState(0)
  const [totalFrames, setTotalFrames] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoElement && (videoElement as any).getVideoPlaybackQuality) {
        const quality = (videoElement as any).getVideoPlaybackQuality()
        setDroppedFrames(quality.droppedVideoFrames || 0)
        setTotalFrames(quality.totalVideoFrames || 0)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [videoElement])

  if (!currentVideo) return null

  const bufferAhead = Math.max(0, Math.round((bufferedEnd - currentTime) * 10) / 10)

  return (
    <div
      onClick={toggleInfoModal}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-sid-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 text-xs text-sid-300 select-none animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-white">Media Technical Statistics</span>
          </div>
          <button
            onClick={toggleInfoModal}
            className="p-1 rounded-lg text-sid-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Grid */}
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* File Section */}
          <div className="bg-sid-950/60 p-3 rounded-xl border border-white/[0.04]">
            <div className="flex items-center gap-2 text-sid-200 font-medium mb-2">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" />
              <span>File Details</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-sid-500">Name: </span>
                <span className="text-white truncate block font-mono">{currentVideo.filename}</span>
              </div>
              <div>
                <span className="text-sid-500">Container: </span>
                <span className="text-white uppercase font-mono">{currentVideo.format}</span>
              </div>
              <div>
                <span className="text-sid-500">Size: </span>
                <span className="text-white font-mono">{formatFileSize(currentVideo.size)}</span>
              </div>
              <div>
                <span className="text-sid-500">Duration: </span>
                <span className="text-white font-mono">{formatDuration(currentVideo.duration)}</span>
              </div>
              <div className="col-span-2 truncate">
                <span className="text-sid-500">Path: </span>
                <span className="text-sid-400 truncate block font-mono">{currentVideo.path}</span>
              </div>
            </div>
          </div>

          {/* Video Stream */}
          <div className="bg-sid-950/60 p-3 rounded-xl border border-white/[0.04]">
            <div className="flex items-center gap-2 text-sid-200 font-medium mb-2">
              <Film className="w-3.5 h-3.5 text-indigo-400" />
              <span>Video Stream</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-sid-500">Resolution: </span>
                <span className="text-white font-mono">{currentVideo.width} × {currentVideo.height}</span>
              </div>
              <div>
                <span className="text-sid-500">Codec: </span>
                <span className="text-white uppercase font-mono">{currentVideo.videoCodec}</span>
              </div>
              <div>
                <span className="text-sid-500">Frame Rate: </span>
                <span className="text-white font-mono">{currentVideo.fps} FPS</span>
              </div>
              <div>
                <span className="text-sid-500">Bitrate: </span>
                <span className="text-white font-mono">{formatBitrate(currentVideo.bitrate)}</span>
              </div>
            </div>
          </div>

          {/* Audio Stream */}
          <div className="bg-sid-950/60 p-3 rounded-xl border border-white/[0.04]">
            <div className="flex items-center gap-2 text-sid-200 font-medium mb-2">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Audio Stream</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-sid-500">Codec: </span>
                <span className="text-white uppercase font-mono">{currentVideo.audioCodec}</span>
              </div>
              <div>
                <span className="text-sid-500">Channels: </span>
                <span className="text-white font-mono">
                  {currentVideo.audioTracks?.[0]?.channels ? `${currentVideo.audioTracks[0].channels} Channels` : 'Stereo'}
                </span>
              </div>
              <div>
                <span className="text-sid-500">Sample Rate: </span>
                <span className="text-white font-mono">
                  {currentVideo.audioTracks?.[0]?.sampleRate ? `${currentVideo.audioTracks[0].sampleRate} Hz` : '44.1 kHz'}
                </span>
              </div>
              <div>
                <span className="text-sid-500">Tracks: </span>
                <span className="text-white font-mono">{currentVideo.audioTracks?.length || 1} available</span>
              </div>
            </div>
          </div>

          {/* Realtime Playback Stats */}
          <div className="bg-sid-950/60 p-3 rounded-xl border border-white/[0.04]">
            <div className="flex items-center gap-2 text-sid-200 font-medium mb-2">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>Real-Time Engine Diagnostics</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div>
                <span className="text-sid-500">Buffer Ahead: </span>
                <span className="text-emerald-400 font-mono font-semibold">{bufferAhead}s</span>
              </div>
              <div>
                <span className="text-sid-500">Dropped Frames: </span>
                <span className="text-white font-mono">{droppedFrames} / {totalFrames}</span>
              </div>
              <div>
                <span className="text-sid-500">Speed: </span>
                <span className="text-white font-mono">{playbackRate}x</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-sid-500">
          <span>Press <kbd className="bg-sid-800 text-sid-300 px-1 py-0.5 rounded font-mono">I</kbd> or <kbd className="bg-sid-800 text-sid-300 px-1 py-0.5 rounded font-mono">Esc</kbd> to close</span>
          <button
            onClick={toggleInfoModal}
            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
