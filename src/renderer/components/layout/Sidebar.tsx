import React, { useState } from 'react'
import {
  Home,
  Film,
  Folder,
  ListMusic,
  Heart,
  History,
  Clock,
  Settings,
  Info,
  ChevronLeft,
  ChevronRight,
  FolderPlus,
  FilePlus
} from 'lucide-react'
import { useLibraryStore, setActiveTab, NavTab, openScanModal } from '../../stores/useLibraryStore'
import { playVideo } from '../../stores/usePlayerStore'
import { showToast } from '../../stores/useToastStore'

interface SidebarProps {
  onOpenAbout: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenAbout }) => {
  const [collapsed, setCollapsed] = useState(false)
  const { activeTab, videos, playlists, history } = useLibraryStore()

  const favoritesCount = videos.filter((v) => v.isFavorite).length
  const continueWatchingCount = videos.filter((v) => v.resumePosition > 10 && !v.completed).length

  const handleOpenFile = async () => {
    if (!window.electronAPI) return
    const paths = await window.electronAPI.dialogs.openFileDialog()
    if (paths && paths.length > 0) {
      const item = await window.electronAPI.media.processSingleFile(paths[0])
      if (item) {
        playVideo(item)
      }
    }
  }

  const handleOpenFolder = async () => {
    if (!window.electronAPI) return
    const folderPath = await window.electronAPI.dialogs.openFolderDialog()
    if (folderPath) {
      openScanModal(folderPath)
    }
  }

  const navItems: Array<{
    id: NavTab
    label: string
    icon: React.ComponentType<{ className?: string }>
    badge?: number
  }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'videos', label: 'Videos', icon: Film, badge: videos.length },
    { id: 'folders', label: 'Folders', icon: Folder },
    { id: 'playlists', label: 'Playlists', icon: ListMusic, badge: playlists.length },
    { id: 'favorites', label: 'Favorites', icon: Heart, badge: favoritesCount },
    { id: 'history', label: 'Recently Played', icon: History, badge: history.length },
    { id: 'continue-watching', label: 'Continue Watching', icon: Clock, badge: continueWatchingCount }
  ]

  return (
    <aside
      className={`h-full bg-sid-950 border-r border-white/[0.06] flex flex-col justify-between transition-all duration-300 select-none z-30 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Top Section */}
      <div className="flex flex-col p-2 gap-1 overflow-y-auto">
        {/* Quick Action Buttons */}
        <div className="flex flex-col gap-1.5 mb-3 px-1 pt-1">
          <button
            onClick={handleOpenFile}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-500/20 transition-all ${
              collapsed ? 'justify-center px-0' : ''
            }`}
            title="Open Video File"
          >
            <FilePlus className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">Open Video</span>}
          </button>

          <button
            onClick={handleOpenFolder}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg bg-sid-850 hover:bg-sid-800 text-sid-200 border border-white/[0.08] hover:border-white/20 font-medium text-xs transition-all ${
              collapsed ? 'justify-center px-0' : ''
            }`}
            title="Open Folder"
          >
            <FolderPlus className="w-4 h-4 shrink-0 text-blue-400" />
            {!collapsed && <span className="truncate">Open Folder</span>}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                    : 'text-sid-400 hover:text-sid-200 hover:bg-white/[0.04]'
                } ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-blue-400' : 'text-sid-400 group-hover:text-sid-200'
                  }`}
                />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between truncate">
                    <span className="truncate">{item.label}</span>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sid-800 text-sid-400 border border-white/[0.04]">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-500 rounded-r" />
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-2 border-t border-white/[0.06] flex flex-col gap-1">
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'settings'
              ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
              : 'text-sid-400 hover:text-sid-200 hover:bg-white/[0.04]'
          } ${collapsed ? 'justify-center px-0' : ''}`}
          title="Settings"
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="truncate">Settings</span>}
        </button>

        <button
          onClick={onOpenAbout}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-sid-400 hover:text-sid-200 hover:bg-white/[0.04] transition-all ${
            collapsed ? 'justify-center px-0' : ''
          }`}
          title="About SidPlayer"
        >
          <Info className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="truncate">About</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mt-1 flex items-center justify-center p-2 rounded-lg text-sid-500 hover:text-sid-300 hover:bg-white/[0.04] transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  )
}
