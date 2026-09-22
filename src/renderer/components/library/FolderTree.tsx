import React, { useState } from 'react'
import { Folder, Film, ChevronRight, ChevronDown, Play, ExternalLink } from 'lucide-react'
import { VideoItem } from '@shared/types'
import { playVideo } from '../../stores/usePlayerStore'
import { formatDuration, formatFileSize } from '../../utils/formatters'

interface FolderTreeProps {
  videos: VideoItem[]
}

export const FolderTree: React.FC<FolderTreeProps> = ({ videos }) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})

  // Group videos by folder
  const folderMap = new Map<string, VideoItem[]>()
  for (const v of videos) {
    const list = folderMap.get(v.folder) || []
    list.push(v)
    folderMap.set(v.folder, list)
  }

  const toggleFolder = (folder: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folder]: !prev[folder]
    }))
  }

  const folders = Array.from(folderMap.entries())

  if (folders.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-sid-500">
        <Folder className="w-12 h-12 mb-3 text-sid-600" />
        <p className="text-xs">No folders indexed yet. Scan a folder to see it grouped here.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {folders.map(([folderPath, vList]) => {
        const isExpanded = expandedFolders[folderPath] ?? true
        const totalSize = vList.reduce((acc, v) => acc + v.size, 0)

        return (
          <div
            key={folderPath}
            className="bg-sid-900/60 border border-white/[0.06] rounded-xl overflow-hidden"
          >
            {/* Folder Header */}
            <div
              onClick={() => toggleFolder(folderPath)}
              className="flex items-center justify-between p-3 bg-sid-850/60 hover:bg-sid-850 cursor-pointer select-none transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-sid-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-sid-400 shrink-0" />
                )}
                <Folder className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs font-semibold text-sid-200 truncate">{folderPath}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sid-800 text-sid-400">
                  {vList.length} items
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-sid-400 font-mono hidden sm:inline-block">
                  {formatFileSize(totalSize)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    playVideo(vList[0], vList, 0)
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white text-[11px] font-medium transition-all"
                  title="Play all videos in folder"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Play All</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    window.electronAPI?.dialogs.showItemInFolder(folderPath)
                  }}
                  className="p-1 rounded text-sid-400 hover:text-white"
                  title="Open folder in Explorer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Folder Children Video List */}
            {isExpanded && (
              <div className="divide-y divide-white/[0.04]">
                {vList.map((video, idx) => (
                  <div
                    key={video.id}
                    onClick={() => playVideo(video, vList, idx)}
                    className="flex items-center justify-between px-4 py-2 hover:bg-sid-850 cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Film className="w-3.5 h-3.5 text-sid-500 shrink-0" />
                      <span className="text-sid-300 hover:text-blue-400 truncate">{video.title}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sid-500 font-mono text-[11px] shrink-0">
                      <span>{formatDuration(video.duration)}</span>
                      <span>{formatFileSize(video.size)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
