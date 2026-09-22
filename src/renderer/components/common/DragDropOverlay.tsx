import React from 'react'
import { Film, FolderPlus, UploadCloud } from 'lucide-react'

interface DragDropOverlayProps {
  isDragging: boolean
}

export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({ isDragging }) => {
  if (!isDragging) return null

  return (
    <div className="fixed inset-0 z-50 bg-sid-950/85 backdrop-blur-md flex flex-col items-center justify-center p-8 pointer-events-none animate-fade-in border-4 border-dashed border-blue-500/50 m-2 rounded-3xl">
      <div className="w-20 h-20 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/40 animate-bounce">
        <UploadCloud className="w-10 h-10" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Drop Media Files or Folders Here</h2>
      <p className="text-xs text-sid-300 max-w-md text-center leading-relaxed">
        Drop video files to play immediately, or drop folders to scan and index compatible videos into your SidPlayer library.
      </p>

      <div className="flex items-center gap-4 mt-8 text-xs text-sid-400">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sid-900 border border-white/10">
          <Film className="w-3.5 h-3.5 text-blue-400" />
          <span>MP4, MKV, WebM, AVI, MOV</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sid-900 border border-white/10">
          <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
          <span>Recursive Folder Scanning</span>
        </div>
      </div>
    </div>
  )
}
