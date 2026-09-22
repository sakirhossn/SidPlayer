import React, { useMemo } from 'react'
import { useLibraryStore } from '../../stores/useLibraryStore'
import { FilterBar } from '../library/FilterBar'
import { VideoGrid } from '../library/VideoGrid'
import { VideoItem } from '@shared/types'

interface LibraryViewProps {
  onOpenFile: () => void
  onOpenFolder: () => void
  onRelink: (video: VideoItem) => void
}

export const LibraryView: React.FC<LibraryViewProps> = ({ onOpenFile, onOpenFolder, onRelink }) => {
  const { videos, searchQuery, sortOption, filterOption, viewMode } = useLibraryStore()

  const filteredVideos = useMemo(() => {
    let result = [...videos]

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.filename.toLowerCase().includes(q) ||
          v.format.toLowerCase().includes(q) ||
          v.folder.toLowerCase().includes(q)
      )
    }

    // 2. Filter Category
    if (filterOption === 'unwatched') {
      result = result.filter((v) => !v.completed && v.playCount === 0)
    } else if (filterOption === 'favorites') {
      result = result.filter((v) => v.isFavorite)
    } else if (filterOption === 'large') {
      result = result.filter((v) => v.size >= 1024 * 1024 * 1024) // >= 1GB
    }

    // 3. Sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case 'name':
          return a.title.localeCompare(b.title)
        case 'duration':
          return b.duration - a.duration
        case 'size':
          return b.size - a.size
        case 'modified':
          return b.dateModified - a.dateModified
        case 'mostWatched':
          return (b.playCount || 0) - (a.playCount || 0)
        case 'recent':
        default:
          return b.dateAdded - a.dateAdded
      }
    })

    return result
  }, [videos, searchQuery, sortOption, filterOption])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <FilterBar />
      <VideoGrid
        videos={filteredVideos}
        viewMode={viewMode}
        onOpenFile={onOpenFile}
        onOpenFolder={onOpenFolder}
        onRelink={onRelink}
      />
    </div>
  )
}
