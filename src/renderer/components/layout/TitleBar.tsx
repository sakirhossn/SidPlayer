import React, { useState, useEffect } from 'react'
import { Play, Minus, Square, X, Copy, Search, Film } from 'lucide-react'
import { usePlayerStore } from '../../stores/usePlayerStore'

interface TitleBarProps {
  onOpenCommandPalette: () => void
}

export const TitleBar: React.FC<TitleBarProps> = ({ onOpenCommandPalette }) => {
  const [isMaximized, setIsMaximized] = useState(false)
  const { currentVideo } = usePlayerStore()

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.window.isMaximized().then(setIsMaximized)
      const unbind = window.electronAPI.window.onMaximizeChange(setIsMaximized)
      return () => {
        unbind?.()
      }
    }
  }, [])

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.electronAPI?.window.minimize()
  }
  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.electronAPI?.window.maximize()
  }
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.electronAPI?.window.close()
  }

  return (
    <div className="h-10 bg-sid-950/90 border-b border-white/[0.06] flex items-center justify-between px-3 text-xs select-none app-drag-region z-50">
      {/* Brand & App Icon */}
      <div className="flex items-center gap-2 app-no-drag">
        <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
          <Play className="w-3 h-3 fill-current ml-0.5" />
        </div>
        <span className="font-semibold tracking-wide text-sid-200 text-sm">SidPlayer</span>
        <span className="text-[10px] text-blue-400/80 bg-blue-500/10 px-1.5 py-0.5 rounded font-mono font-medium">PRO</span>
      </div>

      {/* Center Title or Quick Search */}
      <div className="flex-1 flex items-center justify-center max-w-md mx-4 app-no-drag">
        {currentVideo ? (
          <div className="flex items-center gap-1.5 text-sid-300 font-medium truncate text-xs">
            <Film className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">{currentVideo.title}</span>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onOpenCommandPalette()
            }}
            className="w-full h-6 px-3 rounded-md bg-sid-900 border border-white/[0.08] hover:border-white/20 text-sid-400 hover:text-sid-200 flex items-center justify-between transition-colors app-no-drag group cursor-pointer text-xs"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3 h-3 text-sid-500 group-hover:text-blue-400 transition-colors" />
              <span>Search videos or press Ctrl+K...</span>
            </div>
            <kbd className="text-[10px] bg-sid-800 px-1.5 py-0.5 rounded text-sid-400 border border-white/[0.06]">
              Ctrl K
            </kbd>
          </button>
        )}
      </div>

      {/* Windows Native-style Window Controls */}
      <div className="flex items-center app-no-drag">
        <button
          onClick={handleMinimize}
          className="w-10 h-10 flex items-center justify-center text-sid-400 hover:text-white hover:bg-white/[0.08] transition-colors app-no-drag cursor-pointer"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5 pointer-events-none" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-10 h-10 flex items-center justify-center text-sid-400 hover:text-white hover:bg-white/[0.08] transition-colors app-no-drag cursor-pointer"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <Copy className="w-3 h-3 rotate-180 pointer-events-none" />
          ) : (
            <Square className="w-3 h-3 pointer-events-none" />
          )}
        </button>
        <button
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center text-sid-400 hover:text-white hover:bg-red-600 transition-colors app-no-drag cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4 pointer-events-none" />
        </button>
      </div>
    </div>
  )
}
