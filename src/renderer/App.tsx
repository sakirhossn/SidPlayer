import React, { useState, useEffect } from 'react'
import { TitleBar } from './components/layout/TitleBar'
import { Sidebar } from './components/layout/Sidebar'
import { HomeView } from './components/views/HomeView'
import { LibraryView } from './components/views/LibraryView'
import { FolderTree } from './components/library/FolderTree'
import { PlaylistsView } from './components/views/PlaylistsView'
import { FavoritesView } from './components/views/FavoritesView'
import { HistoryView } from './components/views/HistoryView'
import { SettingsView } from './components/views/SettingsView'
import { VideoPlayer } from './components/player/VideoPlayer'
import { CommandPalette } from './components/common/CommandPalette'
import { DragDropOverlay } from './components/common/DragDropOverlay'
import { ToastContainer } from './components/common/ToastContainer'
import { ScanPromptModal } from './components/common/ScanPromptModal'
import { ScanProgressModal } from './components/common/ScanProgressModal'
import { AboutModal } from './components/common/AboutModal'
import { RelinkModal } from './components/common/RelinkModal'

import { useLibraryStore, loadLibrary, openScanModal } from './stores/useLibraryStore'
import { usePlayerStore, playVideo } from './stores/usePlayerStore'
import { initSettings } from './stores/useSettingsStore'
import { VideoItem } from '../shared/types'
import { showToast } from './stores/useToastStore'

export const App: React.FC = () => {
  const { activeTab, videos } = useLibraryStore()
  const { currentVideo } = usePlayerStore()

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [aboutModalOpen, setAboutModalOpen] = useState(false)
  const [relinkVideoCandidate, setRelinkVideoCandidate] = useState<VideoItem | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Initialization
  useEffect(() => {
    initSettings()
    loadLibrary()

    // Listen for external file opens (double-click in Windows Explorer)
    if (window.electronAPI) {
      const unbind = window.electronAPI.window.onOpenExternalFile(async (filePath) => {
        try {
          const item = await window.electronAPI.media.processSingleFile(filePath)
          if (item) {
            playVideo(item)
          }
        } catch (err) {
          console.error('Failed to open external file:', err)
        }
      })

      return () => {
        unbind?.()
      }
    }
  }, [])

  // Global Ctrl + K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Native Drag and Drop handling
  useEffect(() => {
    let dragCounter = 0

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      dragCounter++
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true)
      }
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      dragCounter--
      if (dragCounter <= 0) {
        setIsDragging(false)
        dragCounter = 0
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
    }

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      dragCounter = 0
      setIsDragging(false)

      const files = e.dataTransfer?.files
      if (!files || files.length === 0 || !window.electronAPI) return

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const filePath = (file as any).path

        if (!filePath) continue

        // Check if directory or file
        const ext = file.name.split('.').pop()?.toLowerCase() || ''
        const videoExtensions = ['mp4', 'mkv', 'webm', 'avi', 'mov', 'm4v', 'mpg', 'mpeg', 'wmv', 'flv', 'ts']

        if (videoExtensions.includes(ext)) {
          const item = await window.electronAPI.media.processSingleFile(filePath)
          if (item) {
            playVideo(item)
            break
          }
        } else {
          // Might be a directory
          openScanModal(filePath)
        }
      }
    }

    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)

    return () => {
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('drop', handleDrop)
    }
  }, [])

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

  return (
    <div className="w-screen h-screen flex flex-col bg-sid-950 text-sid-100 overflow-hidden select-none">
      {/* Custom Windows Frameless Titlebar */}
      <TitleBar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />

      {/* Main Body: Either Full Video Player OR Library App View */}
      {currentVideo ? (
        <div className="flex-1 w-full h-full overflow-hidden">
          <VideoPlayer />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Collapsible Sidebar */}
          <Sidebar onOpenAbout={() => setAboutModalOpen(true)} />

          {/* Primary View Router */}
          <main className="flex-1 flex flex-col overflow-hidden bg-sid-950">
            {activeTab === 'home' && (
              <HomeView onOpenFile={handleOpenFile} onOpenFolder={handleOpenFolder} />
            )}
            {activeTab === 'videos' && (
              <LibraryView
                onOpenFile={handleOpenFile}
                onOpenFolder={handleOpenFolder}
                onRelink={(v) => setRelinkVideoCandidate(v)}
              />
            )}
            {activeTab === 'folders' && <FolderTree videos={videos} />}
            {activeTab === 'playlists' && <PlaylistsView />}
            {activeTab === 'favorites' && (
              <FavoritesView onRelink={(v) => setRelinkVideoCandidate(v)} />
            )}
            {activeTab === 'history' && <HistoryView />}
            {activeTab === 'continue-watching' && (
              <LibraryView
                onOpenFile={handleOpenFile}
                onOpenFolder={handleOpenFolder}
                onRelink={(v) => setRelinkVideoCandidate(v)}
              />
            )}
            {activeTab === 'settings' && <SettingsView />}
          </main>
        </div>
      )}

      {/* Overlays & Modals */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenFile={handleOpenFile}
        onOpenFolder={handleOpenFolder}
      />

      <DragDropOverlay isDragging={isDragging} />
      <ScanPromptModal />
      <ScanProgressModal />
      <AboutModal isOpen={aboutModalOpen} onClose={() => setAboutModalOpen(false)} />
      <RelinkModal
        video={relinkVideoCandidate}
        onClose={() => setRelinkVideoCandidate(null)}
      />

      {/* Toast Notification HUD */}
      <ToastContainer />
    </div>
  )
}
