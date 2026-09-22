import React, { useState } from 'react'
import { History, Trash2, Play, Clock, AlertTriangle } from 'lucide-react'
import { useLibraryStore, clearWatchHistory } from '../../stores/useLibraryStore'
import { playVideo } from '../../stores/usePlayerStore'
import { formatDuration, formatTimeAgo } from '../../utils/formatters'

export const HistoryView: React.FC = () => {
  const { videos } = useLibraryStore()
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)

  // Videos that have been played (lastPlayed > 0)
  const playedVideos = videos
    .filter((v) => (v.lastPlayed || 0) > 0)
    .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Recently Played History</h1>
            <p className="text-xs text-sid-400 mt-0.5">
              Tracks playback progress and completion history across all videos
            </p>
          </div>
        </div>

        {playedVideos.length > 0 && (
          <button
            onClick={() => setConfirmClearOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sid-900 hover:bg-rose-600/20 text-sid-400 hover:text-rose-400 border border-white/[0.08] text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {playedVideos.length > 0 ? (
        <div className="bg-sid-900/60 border border-white/[0.06] rounded-xl overflow-hidden divide-y divide-white/[0.04]">
          {playedVideos.map((video, idx) => {
            const progress =
              video.duration > 0 && video.resumePosition > 0
                ? Math.min(100, Math.round((video.resumePosition / video.duration) * 100))
                : 0

            return (
              <div
                key={video.id}
                onClick={() => playVideo(video, playedVideos, idx)}
                className="group flex items-center justify-between p-3.5 hover:bg-sid-850 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-20 aspect-video rounded-lg bg-sid-950 overflow-hidden shrink-0 relative flex items-center justify-center">
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Play className="w-5 h-5 text-sid-600" />
                    )}
                    {progress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                        <div
                          className={`h-full ${video.completed ? 'bg-emerald-500' : 'bg-blue-500'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-sid-200 group-hover:text-blue-400 truncate">
                      {video.title}
                    </h4>
                    <p className="text-[11px] text-sid-500 truncate mt-0.5">{video.folder}</p>
                    <div className="flex items-center gap-3 text-[10px] text-sid-400 mt-1 font-mono">
                      <span>Played {formatTimeAgo(video.lastPlayed)}</span>
                      <span>•</span>
                      <span>
                        Watched {formatDuration(video.resumePosition)} of {formatDuration(video.duration)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      video.completed
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    {video.completed ? 'Finished' : `${progress}%`}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-blue-600/10 group-hover:bg-blue-600 text-blue-400 group-hover:text-white flex items-center justify-center transition-all">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-16 text-center text-sid-500">
          <Clock className="w-12 h-12 mx-auto mb-3 text-sid-600" />
          <h3 className="text-sm font-semibold text-sid-300 mb-1">No watch history yet</h3>
          <p className="text-xs max-w-sm mx-auto">
            Videos you watch will appear here along with their resume position and completion status.
          </p>
        </div>
      )}

      {/* Confirm Clear Modal */}
      {confirmClearOpen && (
        <div
          onClick={() => setConfirmClearOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-sid-900 border border-white/10 rounded-2xl p-6 text-xs text-sid-300 select-none shadow-2xl animate-scale-in"
          >
            <div className="flex items-center gap-2.5 text-rose-400 mb-3 font-semibold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Clear Watch History?</span>
            </div>
            <p className="text-sid-400 mb-6 leading-relaxed">
              This will reset the last watched timestamp and resume positions on all indexed videos. Your files and library items will remain untouched.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmClearOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-sid-800 hover:bg-sid-700 text-sid-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearWatchHistory()
                  setConfirmClearOpen(false)
                }}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-md shadow-rose-600/30"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
