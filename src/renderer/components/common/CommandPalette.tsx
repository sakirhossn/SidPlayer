import React, { useState, useEffect, useRef } from 'react'
import {
  Search,
  Play,
  FolderPlus,
  FilePlus,
  Maximize2,
  Volume2,
  Camera,
  Info,
  Settings,
  Home,
  Film,
  Heart,
  ListMusic,
  History,
  X
} from 'lucide-react'
import { useLibraryStore, setActiveTab } from '../../stores/useLibraryStore'
import {
  usePlayerStore,
  togglePlay,
  toggleFullscreen,
  toggleMute,
  captureScreenshot,
  toggleInfoModal,
  playVideo
} from '../../stores/usePlayerStore'
import { VideoItem } from '@shared/types'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onOpenFile: () => void
  onOpenFolder: () => void
}

interface CommandItem {
  id: string
  title: string
  category: 'Commands' | 'Navigation' | 'Videos'
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  shortcut?: string
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenFile,
  onOpenFolder
}) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { videos } = useLibraryStore()
  const { currentVideo } = usePlayerStore()

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Build commands list
  const baseCommands: CommandItem[] = [
    {
      id: 'cmd-open-file',
      title: 'Open Video File...',
      category: 'Commands',
      icon: FilePlus,
      action: () => {
        onClose()
        onOpenFile()
      }
    },
    {
      id: 'cmd-open-folder',
      title: 'Scan Local Folder...',
      category: 'Commands',
      icon: FolderPlus,
      action: () => {
        onClose()
        onOpenFolder()
      }
    },
    {
      id: 'cmd-play-pause',
      title: 'Play / Pause Video',
      category: 'Commands',
      icon: Play,
      shortcut: 'Space',
      action: () => {
        togglePlay()
        onClose()
      }
    },
    {
      id: 'cmd-fullscreen',
      title: 'Toggle Fullscreen',
      category: 'Commands',
      icon: Maximize2,
      shortcut: 'F',
      action: () => {
        toggleFullscreen()
        onClose()
      }
    },
    {
      id: 'cmd-mute',
      title: 'Toggle Mute',
      category: 'Commands',
      icon: Volume2,
      shortcut: 'M',
      action: () => {
        toggleMute()
        onClose()
      }
    },
    {
      id: 'cmd-screenshot',
      title: 'Capture High-Res Screenshot',
      category: 'Commands',
      icon: Camera,
      shortcut: 'Alt S',
      action: () => {
        captureScreenshot()
        onClose()
      }
    },
    {
      id: 'cmd-stats',
      title: 'Show Media Technical Statistics',
      category: 'Commands',
      icon: Info,
      shortcut: 'I',
      action: () => {
        toggleInfoModal()
        onClose()
      }
    },
    {
      id: 'nav-home',
      title: 'Go to Home Dashboard',
      category: 'Navigation',
      icon: Home,
      action: () => {
        setActiveTab('home')
        onClose()
      }
    },
    {
      id: 'nav-videos',
      title: 'Go to Video Library',
      category: 'Navigation',
      icon: Film,
      action: () => {
        setActiveTab('videos')
        onClose()
      }
    },
    {
      id: 'nav-playlists',
      title: 'Go to Playlists',
      category: 'Navigation',
      icon: ListMusic,
      action: () => {
        setActiveTab('playlists')
        onClose()
      }
    },
    {
      id: 'nav-favorites',
      title: 'Go to Favorites',
      category: 'Navigation',
      icon: Heart,
      action: () => {
        setActiveTab('favorites')
        onClose()
      }
    },
    {
      id: 'nav-history',
      title: 'Go to Watch History',
      category: 'Navigation',
      icon: History,
      action: () => {
        setActiveTab('history')
        onClose()
      }
    },
    {
      id: 'nav-settings',
      title: 'Open Settings',
      category: 'Navigation',
      icon: Settings,
      action: () => {
        setActiveTab('settings')
        onClose()
      }
    }
  ]

  // Add matching videos from library
  const videoCommands: CommandItem[] = videos.map((v) => ({
    id: `vid-${v.id}`,
    title: v.title,
    category: 'Videos',
    icon: Film,
    action: () => {
      playVideo(v)
      onClose()
    }
  }))

  const allItems = [...baseCommands, ...videoCommands]

  const filteredItems = query.trim()
    ? allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : allItems.slice(0, 15)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = filteredItems[selectedIndex]
      if (selected) {
        selected.action()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24 p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-sid-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-xs select-none animate-scale-in flex flex-col max-h-[70vh]"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/[0.08] gap-3">
          <Search className="w-4 h-4 text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search library videos..."
            className="w-full bg-transparent text-white placeholder-sid-500 text-sm focus:outline-none"
          />
          <kbd className="text-[10px] bg-sid-800 text-sid-400 px-1.5 py-0.5 rounded border border-white/[0.06]">
            Esc
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-white/[0.02]">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => {
              const Icon = item.icon
              const isSelected = idx === selectedIndex
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-600 text-white' : 'text-sid-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-white' : 'text-sid-400'
                      }`}
                    />
                    <span className="truncate font-medium">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-blue-700 text-blue-100' : 'bg-sid-800 text-sid-500'
                      }`}
                    >
                      {item.category}
                    </span>
                    {item.shortcut && (
                      <kbd
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-blue-700 text-white' : 'bg-sid-800 text-sid-400'
                        }`}
                      >
                        {item.shortcut}
                      </kbd>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="p-8 text-center text-sid-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-sid-600" />
              <p>No matching commands or videos found.</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-white/[0.06] bg-sid-950 flex items-center justify-between text-[11px] text-sid-500">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
          <span>SidPlayer Command Palette</span>
        </div>
      </div>
    </div>
  )
}
