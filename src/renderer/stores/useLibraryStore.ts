import { useState, useEffect } from 'react'
import { VideoItem, Playlist, WatchHistoryItem, ScanProgress } from '../../shared/types'
import { showToast } from './useToastStore'

export type NavTab = 'home' | 'videos' | 'folders' | 'playlists' | 'favorites' | 'history' | 'continue-watching' | 'settings'
export type SortOption = 'recent' | 'name' | 'duration' | 'size' | 'modified' | 'mostWatched'
export type FilterOption = 'all' | 'unwatched' | 'movies' | 'large' | 'favorites'

interface LibraryState {
  videos: VideoItem[]
  playlists: Playlist[]
  history: WatchHistoryItem[]
  activeTab: NavTab
  selectedPlaylistId: string | null
  searchQuery: string
  sortOption: SortOption
  filterOption: FilterOption
  viewMode: 'grid' | 'list'
  isScanning: boolean
  scanProgress: ScanProgress | null
  scanModalOpen: boolean
  pendingScanFolder: string | null
}

let libraryState: LibraryState = {
  videos: [],
  playlists: [],
  history: [],
  activeTab: 'home',
  selectedPlaylistId: null,
  searchQuery: '',
  sortOption: 'recent',
  filterOption: 'all',
  viewMode: 'grid',
  isScanning: false,
  scanProgress: null,
  scanModalOpen: false,
  pendingScanFolder: null
}

let listeners: Array<(state: LibraryState) => void> = []

function notify() {
  listeners.forEach((l) => l({ ...libraryState }))
}

export async function loadLibrary(): Promise<void> {
  if (!window.electronAPI) return
  try {
    const [videos, playlists, history] = await Promise.all([
      window.electronAPI.db.getVideos(),
      window.electronAPI.db.getPlaylists(),
      window.electronAPI.db.getHistory()
    ])
    libraryState.videos = videos || []
    libraryState.playlists = playlists || []
    libraryState.history = history || []
    notify()
  } catch (err) {
    console.error('Failed to load library:', err)
  }
}

export function setActiveTab(tab: NavTab, playlistId: string | null = null): void {
  libraryState.activeTab = tab
  libraryState.selectedPlaylistId = playlistId
  notify()
}

export function setSearchQuery(query: string): void {
  libraryState.searchQuery = query
  notify()
}

export function setSortOption(sort: SortOption): void {
  libraryState.sortOption = sort
  notify()
}

export function setFilterOption(filter: FilterOption): void {
  libraryState.filterOption = filter
  notify()
}

export function setViewMode(mode: 'grid' | 'list'): void {
  libraryState.viewMode = mode
  notify()
}

export function openScanModal(folderPath: string): void {
  libraryState.pendingScanFolder = folderPath
  libraryState.scanModalOpen = true
  notify()
}

export function closeScanModal(): void {
  libraryState.scanModalOpen = false
  libraryState.pendingScanFolder = null
  notify()
}

export async function startFolderScan(includeSubfolders: boolean): Promise<void> {
  const folder = libraryState.pendingScanFolder
  if (!folder || !window.electronAPI) return

  closeScanModal()
  libraryState.isScanning = true
  libraryState.scanProgress = { current: 0, total: 0, currentFile: folder, phase: 'counting' }
  notify()

  try {
    const results = await window.electronAPI.scanner.scanFolder(folder, includeSubfolders)
    showToast(`Scan complete: ${results.length} videos found`, 'success')
    await loadLibrary()
  } catch (err: any) {
    showToast(`Scan failed: ${err.message}`, 'error')
  } finally {
    libraryState.isScanning = false
    libraryState.scanProgress = null
    notify()
  }
}

export function cancelFolderScan(): void {
  if (window.electronAPI) {
    window.electronAPI.scanner.cancelScan()
    showToast('Folder scan cancelled', 'info')
  }
  libraryState.isScanning = false
  libraryState.scanProgress = null
  notify()
}

export async function removeVideoFromLibrary(id: string): Promise<void> {
  if (!window.electronAPI) return
  try {
    await window.electronAPI.db.removeVideo(id)
    libraryState.videos = libraryState.videos.filter((v) => v.id !== id)
    notify()
    showToast('Video removed from library (file untouched on disk)', 'info')
  } catch (err) {
    console.error('Failed to remove video:', err)
  }
}

export async function toggleFavoriteVideo(id: string): Promise<void> {
  if (!window.electronAPI) return
  try {
    const isFav = await window.electronAPI.db.toggleFavorite(id)
    const v = libraryState.videos.find((v) => v.id === id)
    if (v) {
      v.isFavorite = isFav
      notify()
      showToast(isFav ? 'Added to Favorites' : 'Removed from Favorites', 'success')
    }
  } catch (err) {
    console.error('Failed to toggle favorite:', err)
  }
}

export async function relinkMissingVideo(id: string, newPath: string): Promise<void> {
  if (!window.electronAPI) return
  try {
    const success = await window.electronAPI.db.relinkFile(id, newPath)
    if (success) {
      showToast('File relinked successfully', 'success')
      await loadLibrary()
    } else {
      showToast('Could not relink: file does not exist', 'error')
    }
  } catch (err) {
    showToast('Error relinking file', 'error')
  }
}

export async function createPlaylist(name: string, description?: string): Promise<Playlist | null> {
  if (!window.electronAPI) return null
  try {
    const pl = await window.electronAPI.db.createPlaylist(name, description)
    libraryState.playlists = [...libraryState.playlists, pl]
    notify()
    showToast(`Playlist "${name}" created`, 'success')
    return pl
  } catch (err) {
    console.error('Failed to create playlist:', err)
    return null
  }
}

export async function addVideoToPlaylist(playlistId: string, videoId: string): Promise<void> {
  if (!window.electronAPI) return
  const pl = libraryState.playlists.find((p) => p.id === playlistId)
  if (!pl) return
  if (pl.videoIds.includes(videoId)) {
    showToast('Video already in playlist', 'info')
    return
  }
  const updatedIds = [...pl.videoIds, videoId]
  const updated = await window.electronAPI.db.updatePlaylist(playlistId, { videoIds: updatedIds })
  if (updated) {
    pl.videoIds = updatedIds
    notify()
    showToast(`Added to playlist "${pl.name}"`, 'success')
  }
}

export async function removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<void> {
  if (!window.electronAPI) return
  const pl = libraryState.playlists.find((p) => p.id === playlistId)
  if (!pl) return
  const updatedIds = pl.videoIds.filter((id) => id !== videoId)
  const updated = await window.electronAPI.db.updatePlaylist(playlistId, { videoIds: updatedIds })
  if (updated) {
    pl.videoIds = updatedIds
    notify()
    showToast(`Removed from playlist "${pl.name}"`, 'info')
  }
}

export async function deletePlaylist(id: string): Promise<void> {
  if (!window.electronAPI) return
  try {
    await window.electronAPI.db.deletePlaylist(id)
    libraryState.playlists = libraryState.playlists.filter((p) => p.id !== id)
    if (libraryState.selectedPlaylistId === id) {
      libraryState.selectedPlaylistId = null
      libraryState.activeTab = 'playlists'
    }
    notify()
    showToast('Playlist deleted', 'info')
  } catch (err) {
    console.error('Failed to delete playlist:', err)
  }
}

export async function clearWatchHistory(): Promise<void> {
  if (!window.electronAPI) return
  try {
    await window.electronAPI.db.clearHistory()
    libraryState.history = []
    notify()
    showToast('Watch history cleared', 'info')
  } catch (err) {
    console.error('Failed to clear history:', err)
  }
}

export function useLibraryStore(): LibraryState {
  const [state, setState] = useState<LibraryState>(libraryState)

  useEffect(() => {
    listeners.push(setState)
    return () => {
      listeners = listeners.filter((l) => l !== setState)
    }
  }, [])

  return state
}
