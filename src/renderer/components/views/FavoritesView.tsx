import React from 'react'
import { Heart } from 'lucide-react'
import { useLibraryStore } from '../../stores/useLibraryStore'
import { VideoGrid } from '../library/VideoGrid'
import { VideoItem } from '@shared/types'

interface FavoritesViewProps {
  onRelink: (video: VideoItem) => void
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({ onRelink }) => {
  const { videos, viewMode } = useLibraryStore()
  const favoriteVideos = videos.filter((v) => v.isFavorite)

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 select-none">
      <div className="flex items-center gap-2.5 pb-4 px-2 border-b border-white/[0.06] mb-2">
        <Heart className="w-5 h-5 text-rose-500 fill-current" />
        <div>
          <h1 className="text-xl font-bold text-white">Favorites</h1>
          <p className="text-xs text-sid-400 mt-0.5">
            {favoriteVideos.length} {favoriteVideos.length === 1 ? 'video' : 'videos'} bookmarked
          </p>
        </div>
      </div>

      <VideoGrid
        videos={favoriteVideos}
        viewMode={viewMode}
        emptyTitle="No favorite videos yet"
        emptyDescription="Click the heart icon on any video card to quickly access your favorite movies and shows here."
        onRelink={onRelink}
      />
    </div>
  )
}
