import React from 'react'
import { Film, Play, Heart, Clock, HardDrive, Trash2 } from 'lucide-react'
import { VideoItem } from '@shared/types'
import { VideoCard } from './VideoCard'
import { formatDuration, formatFileSize, formatDate } from '../../utils/formatters'
import { playVideo } from '../../stores/usePlayerStore'
import { toggleFavoriteVideo, removeVideoFromLibrary } from '../../stores/useLibraryStore'

interface VideoGridProps {
  videos: VideoItem[]
  viewMode: 'grid' | 'list'
  emptyTitle?: string
  emptyDescription?: string
  onOpenFile?: () => void
  onOpenFolder?: () => void
  onRelink?: (video: VideoItem) => void
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  videos,
  viewMode,
  emptyTitle = 'No videos found',
  emptyDescription = 'Open a video file or scan a folder to populate your library.',
  onOpenFile,
  onOpenFolder,
  onRelink
}) => {
  if (videos.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-sid-900 border border-white/[0.08] flex items-center justify-center text-sid-500 mb-4 shadow-xl">
          <Film className="w-8 h-8 text-blue-500/60" />
        </div>
        <h3 className="text-sm font-semibold text-sid-200 mb-1">{emptyTitle}</h3>
        <p className="text-xs text-sid-500 max-w-sm mb-6 leading-relaxed">{emptyDescription}</p>

        {(onOpenFile || onOpenFolder) && (
          <div className="flex items-center gap-3">
            {onOpenFile && (
              <button
                onClick={onOpenFile}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                Open Video
              </button>
            )}
            {onOpenFolder && (
              <button
                onClick={onOpenFolder}
                className="px-4 py-2 rounded-lg bg-sid-850 hover:bg-sid-800 text-sid-200 border border-white/[0.08] font-medium text-xs transition-all cursor-pointer"
              >
                Scan Folder
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-sid-900/60 border border-white/[0.06] rounded-xl overflow-hidden divide-y divide-white/[0.04]">
          {videos.map((video, idx) => {
            const progress =
              video.duration > 0 && video.resumePosition > 0
                ? Math.min(100, Math.round((video.resumePosition / video.duration) * 100))
                : 0

            return (
              <div
                key={video.id}
                onClick={() => playVideo(video, videos, idx)}
                className="group flex items-center justify-between p-3 hover:bg-sid-850 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Small thumbnail */}
                  <div className="relative w-16 h-10 rounded bg-sid-950 overflow-hidden shrink-0 flex items-center justify-center">
                    {video.thumbnailUrl && !video.isMissing ? (
                      <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Play className="w-4 h-4 text-sid-600" />
                    )}
                    {progress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" style={{ width: `${progress}%` }} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-medium text-sid-200 group-hover:text-blue-400 truncate">
                      {video.title}
                    </h4>
                    <p className="text-[11px] text-sid-500 truncate mt-0.5">
                      {video.folder}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs text-sid-400 shrink-0 px-2 font-mono">
                  <span>{formatDuration(video.duration)}</span>
                  <span>{formatFileSize(video.size)}</span>
                  <span className="hidden sm:inline-block text-sid-500">{formatDate(video.dateAdded)}</span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavoriteVideo(video.id)
                    }}
                    className={`p-1 rounded-full ${
                      video.isFavorite ? 'text-rose-500' : 'text-sid-500 hover:text-sid-300'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${video.isFavorite ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeVideoFromLibrary(video.id)
                    }}
                    className="p-1 rounded-full text-sid-500 hover:text-rose-400"
                    title="Remove from library"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {videos.map((video, idx) => (
          <VideoCard
            key={video.id}
            video={video}
            queue={videos}
            queueIndex={idx}
            onRelink={onRelink}
          />
        ))}
      </div>
    </div>
  )
}
