import React from 'react'
import { Play, Clock, Sparkles, FolderPlus, FilePlus, ChevronRight } from 'lucide-react'
import { useLibraryStore, setActiveTab } from '../../stores/useLibraryStore'
import { playVideo } from '../../stores/usePlayerStore'
import { VideoCard } from '../library/VideoCard'
import { getGreeting, formatDuration, formatTimeAgo } from '../../utils/formatters'

interface HomeViewProps {
  onOpenFile: () => void
  onOpenFolder: () => void
}

export const HomeView: React.FC<HomeViewProps> = ({ onOpenFile, onOpenFolder }) => {
  const { videos } = useLibraryStore()
  const greeting = getGreeting()

  // Continue Watching: videos with resumePosition > 10s and not completed
  const continueWatchingVideos = videos
    .filter((v) => v.resumePosition > 10 && !v.completed)
    .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))

  // Recently Added: latest 10 videos
  const recentlyAddedVideos = [...videos]
    .sort((a, b) => b.dateAdded - a.dateAdded)
    .slice(0, 10)

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 select-none">
      {/* Hero Welcome Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to SidPlayer</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{greeting}</h1>
          <p className="text-xs text-sid-400 mt-1">
            {videos.length === 0
              ? 'Your video library is empty. Open a video file or scan a folder to start.'
              : `${videos.length} videos indexed in your local library`}
          </p>
        </div>

        {/* Quick Open Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenFile}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <FilePlus className="w-4 h-4" />
            <span>Open Video</span>
          </button>
          <button
            onClick={onOpenFolder}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sid-900 hover:bg-sid-850 text-sid-200 border border-white/[0.08] hover:border-white/20 font-medium text-xs transition-all cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-blue-400" />
            <span>Scan Folder</span>
          </button>
        </div>
      </div>

      {/* Continue Watching Section */}
      {continueWatchingVideos.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Continue Watching</h2>
            </div>
            <button
              onClick={() => setActiveTab('continue-watching')}
              className="text-xs text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View all ({continueWatchingVideos.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {continueWatchingVideos.slice(0, 4).map((video) => {
              const progressPercent =
                video.duration > 0
                  ? Math.min(100, Math.round((video.resumePosition / video.duration) * 100))
                  : 0

              return (
                <div
                  key={video.id}
                  onClick={() => playVideo(video)}
                  className="group relative flex flex-col bg-sid-900 border border-white/[0.08] hover:border-blue-500/50 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-black/50 hover:-translate-y-0.5"
                >
                  <div className="relative aspect-video w-full bg-sid-950 flex items-center justify-center overflow-hidden">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <Play className="w-8 h-8 text-sid-600" />
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>

                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">
                      {formatDuration(video.duration)}
                    </div>

                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                      <div className="h-full bg-blue-500" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>

                  <div className="p-3">
                    <h4 className="text-xs font-semibold text-sid-200 group-hover:text-blue-400 truncate">
                      {video.title}
                    </h4>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-sid-400">
                      <span>Watched {formatDuration(video.resumePosition)}</span>
                      <span className="text-blue-400 font-medium">{progressPercent}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Recently Added Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Recently Added</h2>
          {videos.length > 10 && (
            <button
              onClick={() => setActiveTab('videos')}
              className="text-xs text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View all ({videos.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentlyAddedVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {recentlyAddedVideos.map((video, idx) => (
              <VideoCard
                key={video.id}
                video={video}
                queue={recentlyAddedVideos}
                queueIndex={idx}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-sid-900/30 rounded-2xl border border-white/[0.04]">
            <p className="text-xs text-sid-500 mb-4">No videos in your library yet.</p>
            <button
              onClick={onOpenFile}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              Choose a video to play
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
