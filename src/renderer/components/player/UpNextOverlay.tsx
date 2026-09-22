import React from 'react'
import { Play, X, SkipForward } from 'lucide-react'
import { VideoItem } from '@shared/types'
import { formatDuration } from '../../utils/formatters'
import { playNext } from '../../stores/usePlayerStore'

interface UpNextOverlayProps {
  nextVideo: VideoItem
  countdown: number
  onCancel: () => void
}

export const UpNextOverlay: React.FC<UpNextOverlayProps> = ({ nextVideo, countdown, onCancel }) => {
  return (
    <div className="absolute bottom-20 right-6 z-40 bg-sid-900/95 border border-white/20 rounded-2xl shadow-2xl p-4 max-w-sm w-80 backdrop-blur-md animate-scale-in text-xs select-none">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5 text-blue-400 font-semibold uppercase tracking-wider text-[10px]">
          <SkipForward className="w-3.5 h-3.5" />
          <span>Up Next in {countdown}s</span>
        </div>
        <button
          onClick={onCancel}
          className="p-1 rounded-full text-sid-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Cancel Autoplay"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-20 aspect-video rounded-lg bg-sid-950 overflow-hidden shrink-0 relative flex items-center justify-center">
          {nextVideo.thumbnailUrl ? (
            <img src={nextVideo.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <Play className="w-5 h-5 text-sid-600" />
          )}
          <span className="absolute bottom-1 right-1 text-[9px] px-1 rounded bg-black/80 text-white font-mono">
            {formatDuration(nextVideo.duration)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-white truncate text-xs" title={nextVideo.title}>
            {nextVideo.title}
          </h4>
          <p className="text-[11px] text-sid-400 truncate mt-0.5">{nextVideo.folder}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/[0.08]">
        <button
          onClick={onCancel}
          className="flex-1 py-1.5 rounded-lg bg-sid-800 hover:bg-sid-700 text-sid-300 font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={playNext}
          className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center justify-center gap-1 shadow-md shadow-blue-600/30 transition-all"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Play Now</span>
        </button>
      </div>
    </div>
  )
}
