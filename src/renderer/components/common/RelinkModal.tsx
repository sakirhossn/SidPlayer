import React, { useState } from 'react'
import { FileQuestion, FolderOpen, X } from 'lucide-react'
import { VideoItem } from '@shared/types'
import { relinkMissingVideo } from '../../stores/useLibraryStore'

interface RelinkModalProps {
  video: VideoItem | null
  onClose: () => void
}

export const RelinkModal: React.FC<RelinkModalProps> = ({ video, onClose }) => {
  const [newPath, setNewPath] = useState('')

  if (!video) return null

  const handleBrowse = async () => {
    if (!window.electronAPI) return
    const paths = await window.electronAPI.dialogs.openFileDialog()
    if (paths && paths.length > 0) {
      setNewPath(paths[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPath.trim()) return
    await relinkMissingVideo(video.id, newPath.trim())
    onClose()
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-sid-900 border border-white/10 rounded-2xl shadow-2xl p-6 text-xs text-sid-300 animate-scale-in"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <FileQuestion className="w-5 h-5" />
            <span>Relink Missing Video</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-sid-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sid-400 mb-2">Original file path is no longer available:</p>
        <div className="p-2.5 rounded-lg bg-sid-950 font-mono text-[11px] text-sid-400 break-all border border-white/[0.04] mb-4">
          {video.path}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-sid-300 mb-1">
              Select new location of this file:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                placeholder="C:/Path/To/Video.mp4"
                className="flex-1 h-9 px-3 bg-sid-950 border border-white/[0.08] focus:border-blue-500 rounded-lg text-white font-mono text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleBrowse}
                className="h-9 px-3 rounded-lg bg-sid-800 hover:bg-sid-700 text-sid-200 border border-white/10 flex items-center gap-1.5 transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Browse</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-sid-800 hover:bg-sid-700 text-sid-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newPath.trim()}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium shadow-md shadow-blue-500/20"
            >
              Relink
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
