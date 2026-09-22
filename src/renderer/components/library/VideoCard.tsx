import React, { useState } from 'react'
import {
  Play,
  Heart,
  MoreVertical,
  Folder,
  Trash2,
  ListPlus,
  AlertTriangle,
  FileQuestion,
  ExternalLink
} from 'lucide-react'
import { VideoItem } from '@shared/types'
import { formatDuration, formatFileSize } from '../../utils/formatters'
import { playVideo } from '../../stores/usePlayerStore'
import { toggleFavoriteVideo, removeVideoFromLibrary, useLibraryStore, addVideoToPlaylist } from '../../stores/useLibraryStore'

interface VideoCardProps {
  video: VideoItem
  queue?: VideoItem[]
  queueIndex?: number
  onRelink?: (video: VideoItem) => void
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, queue = [], queueIndex = 0, onRelink }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [playlistMenuOpen, setPlaylistMenuOpen] = useState(false)
  const { playlists } = useLibraryStore()

  const progressPercent =
    video.duration > 0 && video.resumePosition > 0
      ? Math.min(100, Math.round((video.resumePosition / video.duration) * 100))
      : 0

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    playVideo(video, queue, queueIndex)
  }

  const handleToggleFav = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavoriteVideo(video.id)
  }

  const handleShowInFolder = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpen(false)
    window.electronAPI?.dialogs.showItemInFolder(video.path)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpen(false)
    removeVideoFromLibrary(video.id)
  }

  return (
    <div
      onClick={handlePlay}
      className={`group relative flex flex-col bg-sid-900/80 hover:bg-sid-850 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${
        video.isMissing
          ? 'border-amber-500/40 opacity-75'
          : 'border-white/[0.06] hover:border-white/20 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-0.5'
      }`}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full bg-sid-950 overflow-hidden flex items-center justify-center">
        {video.thumbnailUrl && !video.isMissing ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              // Hide image on error and fallback
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-sid-900 to-sid-950 text-sid-600">
            {video.isMissing ? (
              <AlertTriangle className="w-10 h-10 text-amber-500/80 mb-1" />
            ) : (
              <Play className="w-10 h-10 text-sid-600 group-hover:text-blue-500 transition-colors" />
            )}
          </div>
        )}

        {/* Hover Center Play Button */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
          <div className="w-12 h-12 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg shadow-blue-600/40 transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Favorite Button (Top Right) */}
        <button
          onClick={handleToggleFav}
          className={`absolute top-2 right-2 p-1.5 rounded-full transition-all ${
            video.isFavorite
              ? 'bg-rose-500 text-white shadow-md'
              : 'bg-black/60 text-white/70 hover:text-white hover:bg-black/80 opacity-0 group-hover:opacity-100'
          }`}
          title={video.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
        >
          <Heart className={`w-3.5 h-3.5 ${video.isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Missing File Indicator */}
        {video.isMissing && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-amber-500/90 text-black font-semibold text-[10px] flex items-center gap-1 shadow">
            <AlertTriangle className="w-3 h-3" />
            <span>Missing</span>
          </div>
        )}

        {/* Resolution Badge */}
        {video.width > 0 && (
          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/75 text-sid-300 text-[10px] font-mono font-medium backdrop-blur-xs">
            {video.width >= 3800 ? '4K' : video.width >= 1900 ? '1080p' : video.width >= 1200 ? '720p' : 'SD'}
          </div>
        )}

        {/* Duration Badge */}
        {video.duration > 0 && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono font-medium backdrop-blur-xs">
            {formatDuration(video.duration)}
          </div>
        )}

        {/* Watch Progress Bar */}
        {progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className={`h-full ${video.completed ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-3 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4
            className="text-xs font-semibold text-sid-200 group-hover:text-blue-400 transition-colors line-clamp-2 leading-relaxed"
            title={video.title}
          >
            {video.title}
          </h4>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-sid-400 font-medium">
            <span>{formatFileSize(video.size)}</span>
            <span>•</span>
            <span className="uppercase text-[10px] text-sid-400">{video.format}</span>
            {progressPercent > 0 && !video.completed && (
              <>
                <span>•</span>
                <span className="text-blue-400 text-[10px]">{progressPercent}%</span>
              </>
            )}
          </div>
        </div>

        {/* More Menu Toggle */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(!menuOpen)
              setPlaylistMenuOpen(false)
            }}
            className="p-1 rounded-lg text-sid-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            title="Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Context Dropdown */}
          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 bottom-full mb-1 w-48 rounded-lg glass-dropdown p-1 z-40 text-xs shadow-xl border border-white/10"
            >
              <button
                onClick={handleShowInFolder}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-sid-300 hover:text-white hover:bg-blue-600/30 text-left transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                <span>Show in Explorer</span>
              </button>

              {playlists.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setPlaylistMenuOpen(!playlistMenuOpen)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-sid-300 hover:text-white hover:bg-blue-600/30 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ListPlus className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Add to Playlist</span>
                    </div>
                  </button>

                  {playlistMenuOpen && (
                    <div className="pl-4 pr-1 py-1 flex flex-col gap-0.5 border-l border-white/10 my-0.5">
                      {playlists.map((pl) => (
                        <button
                          key={pl.id}
                          onClick={() => {
                            addVideoToPlaylist(pl.id, video.id)
                            setMenuOpen(false)
                          }}
                          className="w-full text-left truncate px-2 py-1 rounded text-sid-400 hover:text-white hover:bg-white/10 text-[11px]"
                        >
                          {pl.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {video.isMissing && onRelink && (
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    onRelink(video)
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-amber-300 hover:bg-amber-600/30 text-left transition-colors"
                >
                  <FileQuestion className="w-3.5 h-3.5" />
                  <span>Locate File...</span>
                </button>
              )}

              <div className="h-px bg-white/[0.08] my-1" />

              <button
                onClick={handleRemove}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-600/20 text-left transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove from Library</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
